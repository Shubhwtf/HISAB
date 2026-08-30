"""
HISAB — Signature Feature: Forensic Double-Loss Risk Detector (CTL_06_DOUBLE_LOSS).

Detects compounded merchant money-outflow risks where a customer receives a manual refund
while concurrently filing an independent card/bank chargeback dispute for the same transaction.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from packages.domain.models import Payment, Refund, Dispute, Order
from packages.domain.money import format_inr, format_inr_compact
from packages.controls.financial_controls import (
    ControlResult,
    ControlStatus,
    ControlSeverity,
    evaluate_financial_severity,
)


class DoubleLossClassification(str, Enum):
    NORMAL_REFUND = "NORMAL_REFUND"
    DUPLICATE_REFUND = "DUPLICATE_REFUND"
    REFUND_PLUS_CHARGEBACK_POTENTIAL_DOUBLE_LOSS = "REFUND_PLUS_CHARGEBACK_POTENTIAL_DOUBLE_LOSS"
    CHARGEBACK_ONLY = "CHARGEBACK_ONLY"
    DISPUTE_PENDING = "DISPUTE_PENDING"
    DISPUTE_WON = "DISPUTE_WON"
    DISPUTE_LOST = "DISPUTE_LOST"
    AMBIGUOUS = "AMBIGUOUS"


class TimelineEvent(BaseModel):
    timestamp: str
    event_type: str
    description: str
    amount_paise: int

    @property
    def amount_formatted(self) -> str:
        return format_inr(self.amount_paise)


class DoubleLossAlert(BaseModel):
    """
    Forensic dossier for a detected double-loss case.
    """
    order_id: str
    payment_id: str
    classification: DoubleLossClassification
    original_payment_paise: int
    manual_refund_paise: int
    chargeback_exposure_paise: int
    total_potential_exposure_paise: int
    net_merchant_position_paise: int
    confidence: float = 0.98
    why_flagged: List[str]
    timeline: List[TimelineEvent]
    recommended_action: str = "ESCALATE"

    @property
    def original_payment_formatted(self) -> str:
        return format_inr(self.original_payment_paise)

    @property
    def manual_refund_formatted(self) -> str:
        return format_inr(self.manual_refund_paise)

    @property
    def chargeback_exposure_formatted(self) -> str:
        return format_inr(self.chargeback_exposure_paise)

    @property
    def total_exposure_formatted(self) -> str:
        return format_inr(self.total_potential_exposure_paise)

    @property
    def net_position_formatted(self) -> str:
        return format_inr(self.net_merchant_position_paise)


def detect_double_loss_for_order(
    order: Order,
    payments: List[Payment],
    refunds: List[Refund],
    disputes: List[Dispute],
) -> Optional[DoubleLossAlert]:
    """
    Performs forensic analysis on all financial flows linked to a commercial order.
    """
    order_payments = [p for p in payments if p.order_id == order.id]
    if not order_payments:
        return None

    order_payment_ids = {p.id for p in order_payments}
    order_refunds = [r for r in refunds if r.payment_id in order_payment_ids or r.order_id == order.id]
    order_disputes = [d for d in disputes if d.payment_id in order_payment_ids or d.order_id == order.id]

    total_captured = sum(p.amount_paise for p in order_payments if p.status in ("captured", "refunded", "partially_refunded"))
    total_refunded = sum(r.amount_paise for r in order_refunds if r.status == "processed")
    
    active_disputes = [d for d in order_disputes if d.status in ("open", "under_review", "evidence_submitted")]
    dispute_exposure = sum(d.total_exposure_paise for d in active_disputes)

    if total_refunded > 0 and len(active_disputes) > 0:
        total_outflow_exposure = total_refunded + dispute_exposure
        net_position = total_captured - total_outflow_exposure

        timeline: List[TimelineEvent] = []
        for p in sorted(order_payments, key=lambda x: x.created_at):
            timeline.append(TimelineEvent(
                timestamp=p.created_at.strftime("%Y-%m-%d %H:%M UTC"),
                event_type="PAYMENT_CAPTURED",
                description=f"Customer payment captured via {p.method} ({p.instrument_ref or 'Card'})",
                amount_paise=p.amount_paise,
            ))

        for r in sorted(order_refunds, key=lambda x: x.created_at):
            timeline.append(TimelineEvent(
                timestamp=r.created_at.strftime("%Y-%m-%d %H:%M UTC"),
                event_type="REFUND_PROCESSED",
                description=f"Manual customer refund processed ({r.id}) to source instrument",
                amount_paise=-r.amount_paise,
            ))

        for d in sorted(active_disputes, key=lambda x: x.created_at):
            timeline.append(TimelineEvent(
                timestamp=d.created_at.strftime("%Y-%m-%d %H:%M UTC"),
                event_type="DISPUTE_RAISED",
                description=f"Bank chargeback dispute raised ({d.id}) - Reason: '{d.reason_code}'",
                amount_paise=-d.total_exposure_paise,
            ))

        why_flagged = [
            f"Same commercial order ({order.id}) has both completed refund and active bank dispute.",
            f"Manual refund of {format_inr(total_refunded)} was already debited to customer.",
            f"Bank chargeback of {format_inr(dispute_exposure)} creates an additional independent outflow.",
            f"Total potential exposure {format_inr(total_outflow_exposure)} on a {format_inr(total_captured)} sale.",
            "Mandatory human review required: merchant must submit refund proof to contest chargeback before deadline."
        ]

        return DoubleLossAlert(
            order_id=order.id,
            payment_id=order_payments[0].id,
            classification=DoubleLossClassification.REFUND_PLUS_CHARGEBACK_POTENTIAL_DOUBLE_LOSS,
            original_payment_paise=total_captured,
            manual_refund_paise=total_refunded,
            chargeback_exposure_paise=dispute_exposure,
            total_potential_exposure_paise=total_outflow_exposure,
            net_merchant_position_paise=net_position,
            confidence=0.984,
            why_flagged=why_flagged,
            timeline=timeline,
            recommended_action="ESCALATE",
        )

    return None


def run_ctl_06_double_loss(
    orders: List[Order],
    payments: List[Payment],
    refunds: List[Refund],
    disputes: List[Dispute],
) -> List[ControlResult]:
    """
    Runs CTL_06 across all orders in a batch and produces forensic ControlResult objects.
    """
    results: List[ControlResult] = []

    for order in orders:
        alert = detect_double_loss_for_order(order, payments, refunds, disputes)
        if alert:
            severity = evaluate_financial_severity(
                alert.total_potential_exposure_paise,
                minimum_severity=ControlSeverity.HIGH
            )
            results.append(ControlResult(
                control_id="CTL_06_DOUBLE_LOSS",
                control_name="Potential Double-Loss Risk",
                status=ControlStatus.FAIL,
                severity=severity,
                financial_impact_paise=alert.total_potential_exposure_paise,
                confidence=alert.confidence,
                explanation=(
                    f"CRITICAL DOUBLE-LOSS RISK on Order {alert.order_id}: "
                    f"Manual refund ({alert.manual_refund_formatted}) + Chargeback dispute ({alert.chargeback_exposure_formatted}) "
                    f"= Total exposure of {alert.total_exposure_formatted} on a {alert.original_payment_formatted} sale."
                ),
                recommended_action="ESCALATE",
                evidence={
                    "order_id": alert.order_id,
                    "payment_id": alert.payment_id,
                    "original_payment": alert.original_payment_paise,
                    "manual_refund": alert.manual_refund_paise,
                    "chargeback_exposure": alert.chargeback_exposure_paise,
                    "total_potential_exposure": alert.total_potential_exposure_paise,
                    "why_flagged": alert.why_flagged,
                    "timeline": [t.model_dump() for t in alert.timeline],
                },
                affected_records=[
                    {"type": "order", "id": alert.order_id},
                    {"type": "payment", "id": alert.payment_id},
                ]
            ))

    return results
