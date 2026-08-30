"""
HISAB — Core Financial Controls Subsystem.

Implements Controls CTL_01 to CTL_05:
- CTL_01_SETTLEMENT_BANK (Settlement-to-Bank Accuracy)
- CTL_02_MISSING_TXN (Completeness / Missing Transactions)
- CTL_03_DUPLICATE (Duplicate Transactions & Refunds)
- CTL_04_FEE_GST (Fee & GST Classification)
- CTL_05_REFUND (Refund Correctness & Fee Non-Reversal Validation)
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from packages.domain.effects import calculate_payment_effect, calculate_refund_effect, VarianceClassification
from packages.domain.fees import FeeSchedule, DEFAULT_FEE_SCHEDULES
from packages.domain.models import Payment, Refund, Settlement, BankTransaction
from packages.domain.money import format_inr, format_inr_compact


class ControlStatus(str, Enum):
    PASS = "PASS"
    WARN = "WARN"
    FAIL = "FAIL"
    BLOCKED = "BLOCKED"


class ControlSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ControlResult(BaseModel):
    """
    Standardized execution output for every financial control.
    """
    control_id: str
    control_name: str
    status: ControlStatus
    severity: ControlSeverity
    financial_impact_paise: int = Field(default=0, ge=0)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    explanation: str
    recommended_action: str = Field(description="AUTO_RESOLVE | HUMAN_REVIEW | ESCALATE | DISPUTE_CONTEST")
    evidence: Dict[str, Any] = Field(default_factory=dict)
    affected_records: List[Dict[str, Any]] = Field(default_factory=list)

    @property
    def impact_formatted(self) -> str:
        return format_inr(self.financial_impact_paise)


def evaluate_financial_severity(
    exposure_paise: int,
    minimum_severity: Optional[ControlSeverity] = None,
) -> ControlSeverity:
    """
    Determines severity strictly by financial exposure in paise (Section 7.1).
    CRITICAL: >= ₹1,00,000 (10,000,000 paise)
    HIGH:     ₹25,000 – ₹99,999 (2,500,000 – 9,999,999 paise)
    MEDIUM:   ₹5,000 – ₹24,999 (500,000 – 2,499,999 paise)
    LOW:      < ₹5,000 (< 500,000 paise)
    """
    if exposure_paise >= 10000000:
        calculated = ControlSeverity.CRITICAL
    elif exposure_paise >= 2500000:
        calculated = ControlSeverity.HIGH
    elif exposure_paise >= 500000:
        calculated = ControlSeverity.MEDIUM
    else:
        calculated = ControlSeverity.LOW

    if minimum_severity:
        severity_rank = {
            ControlSeverity.LOW: 1,
            ControlSeverity.MEDIUM: 2,
            ControlSeverity.HIGH: 3,
            ControlSeverity.CRITICAL: 4,
        }
        if severity_rank[minimum_severity] > severity_rank[calculated]:
            return minimum_severity

    return calculated


def run_ctl_01_settlement_bank(
    settlement: Settlement,
    bank_transaction: Optional[BankTransaction] = None,
) -> ControlResult:
    """
    Enforces that the Razorpay settlement batch amount reconciles exactly to the bank statement credit.
    """
    if bank_transaction is None:
        return ControlResult(
            control_id="CTL_01_SETTLEMENT_BANK",
            control_name="Settlement-to-Bank Mismatch",
            status=ControlStatus.FAIL,
            severity=evaluate_financial_severity(settlement.amount_paise, ControlSeverity.HIGH),
            financial_impact_paise=settlement.amount_paise,
            confidence=0.99,
            explanation=f"Settlement {settlement.id} ({settlement.amount_formatted}) has no corresponding bank credit statement record.",
            recommended_action="ESCALATE",
            evidence={"settlement_id": settlement.id, "utr": settlement.utr, "settlement_amount": settlement.amount_paise},
            affected_records=[{"type": "settlement", "id": settlement.id}]
        )

    variance_paise = abs(settlement.amount_paise - bank_transaction.amount_paise)
    utr_match = bool(settlement.utr and bank_transaction.reference and settlement.utr.strip().upper() in bank_transaction.reference.strip().upper())

    if variance_paise == 0 and utr_match:
        return ControlResult(
            control_id="CTL_01_SETTLEMENT_BANK",
            control_name="Settlement-to-Bank Mismatch",
            status=ControlStatus.PASS,
            severity=ControlSeverity.LOW,
            financial_impact_paise=0,
            confidence=1.0,
            explanation=f"Settlement {settlement.id} net {settlement.amount_formatted} reconciled to Bank Credit {bank_transaction.id} via UTR {settlement.utr}.",
            recommended_action="AUTO_RESOLVE",
            evidence={"settlement_id": settlement.id, "bank_id": bank_transaction.id, "utr": settlement.utr},
            affected_records=[{"type": "settlement", "id": settlement.id}, {"type": "bank_transaction", "id": bank_transaction.id}]
        )

    status = ControlStatus.FAIL if variance_paise > 0 else ControlStatus.WARN
    severity = evaluate_financial_severity(variance_paise if variance_paise > 0 else settlement.amount_paise, ControlSeverity.HIGH)
    action = "ESCALATE" if variance_paise > 0 else "HUMAN_REVIEW"

    return ControlResult(
        control_id="CTL_01_SETTLEMENT_BANK",
        control_name="Settlement-to-Bank Mismatch",
        status=status,
        severity=severity,
        financial_impact_paise=variance_paise,
        confidence=0.95,
        explanation=f"Settlement variance of {format_inr(variance_paise)} between Settlement {settlement.id} ({settlement.amount_formatted}) and Bank Credit ({bank_transaction.amount_formatted}).",
        recommended_action=action,
        evidence={
            "settlement_id": settlement.id,
            "bank_id": bank_transaction.id,
            "settlement_amount": settlement.amount_paise,
            "bank_amount": bank_transaction.amount_paise,
            "variance": variance_paise,
            "utr_match": utr_match,
        },
        affected_records=[{"type": "settlement", "id": settlement.id}, {"type": "bank_transaction", "id": bank_transaction.id}]
    )


def run_ctl_02_missing_txn(
    payment: Payment,
    is_settlement_mapped: bool,
) -> ControlResult:
    """
    Checks if a captured payment is missing settlement mapping or missing in recon reports.
    """
    if is_settlement_mapped and payment.settlement_id:
        return ControlResult(
            control_id="CTL_02_MISSING_TXN",
            control_name="Missing Settlement Transaction",
            status=ControlStatus.PASS,
            severity=ControlSeverity.LOW,
            financial_impact_paise=0,
            confidence=1.0,
            explanation=f"Payment {payment.id} is mapped to settlement batch {payment.settlement_id}.",
            recommended_action="AUTO_RESOLVE",
            evidence={"payment_id": payment.id, "settlement_id": payment.settlement_id},
            affected_records=[{"type": "payment", "id": payment.id}]
        )

    severity = evaluate_financial_severity(payment.amount_paise, ControlSeverity.MEDIUM)
    return ControlResult(
        control_id="CTL_02_MISSING_TXN",
        control_name="Missing Settlement Transaction",
        status=ControlStatus.FAIL,
        severity=severity,
        financial_impact_paise=payment.net_paise or payment.amount_paise,
        confidence=0.96,
        explanation=f"Payment {payment.id} of {payment.amount_formatted} has not been included in any settlement batch.",
        recommended_action="AUTO_RESOLVE",
        evidence={"payment_id": payment.id, "amount": payment.amount_paise, "captured_at": payment.captured_at.isoformat() if payment.captured_at else None},
        affected_records=[{"type": "payment", "id": payment.id}]
    )


def run_ctl_03_duplicate(
    all_payments: List[Payment],
    all_refunds: List[Refund],
) -> List[ControlResult]:
    """
    Detects duplicate captured payments and duplicate refunds.
    """
    results: List[ControlResult] = []
    
    order_payment_map: Dict[str, List[Payment]] = {}
    for p in all_payments:
        if p.order_id:
            order_payment_map.setdefault(p.order_id, []).append(p)

    for order_id, payments in order_payment_map.items():
        if len(payments) > 1:
            first_p = payments[0]
            if all(p.amount_paise == first_p.amount_paise for p in payments):
                total_dup_amount = sum(p.amount_paise for p in payments[1:])
                results.append(ControlResult(
                    control_id="CTL_03_DUPLICATE",
                    control_name="Duplicate Transaction",
                    status=ControlStatus.FAIL,
                    severity=evaluate_financial_severity(total_dup_amount, ControlSeverity.HIGH),
                    financial_impact_paise=total_dup_amount,
                    confidence=0.98,
                    explanation=f"Multiple identical payment captures ({len(payments)}) detected for order {order_id}.",
                    recommended_action="HUMAN_REVIEW",
                    evidence={"order_id": order_id, "payment_ids": [p.id for p in payments], "amount": first_p.amount_paise},
                    affected_records=[{"type": "payment", "id": p.id} for p in payments]
                ))

    payment_refund_map: Dict[str, List[Refund]] = {}
    for r in all_refunds:
        payment_refund_map.setdefault(r.payment_id, []).append(r)

    for payment_id, rfnds in payment_refund_map.items():
        if len(rfnds) > 1:
            first_r = rfnds[0]
            if all(r.amount_paise == first_r.amount_paise for r in rfnds):
                dup_amount = sum(r.amount_paise for r in rfnds[1:])
                results.append(ControlResult(
                    control_id="CTL_03_DUPLICATE",
                    control_name="Duplicate Refund",
                    status=ControlStatus.FAIL,
                    severity=evaluate_financial_severity(dup_amount, ControlSeverity.HIGH),
                    financial_impact_paise=dup_amount,
                    confidence=0.98,
                    explanation=f"Multiple identical refunds ({len(rfnds)}) issued against payment {payment_id}.",
                    recommended_action="HUMAN_REVIEW",
                    evidence={"payment_id": payment_id, "refund_ids": [r.id for r in rfnds], "amount": first_r.amount_paise},
                    affected_records=[{"type": "refund", "id": r.id} for r in rfnds]
                ))

    return results


def run_ctl_04_fee_gst(
    payment: Payment,
    fee_schedule: Optional[FeeSchedule] = None,
) -> ControlResult:
    """
    Verifies that MDR fee and 18% GST deductions follow configured schedules exactly.
    """
    effect = calculate_payment_effect(payment, fee_schedule)
    
    if effect.classification == VarianceClassification.EXACT_MATCH:
        return ControlResult(
            control_id="CTL_04_FEE_GST",
            control_name="Fee / GST Inconsistency",
            status=ControlStatus.PASS,
            severity=ControlSeverity.LOW,
            financial_impact_paise=0,
            confidence=1.0,
            explanation=effect.explanation,
            recommended_action="AUTO_RESOLVE",
            evidence=effect.evidence,
            affected_records=[{"type": "payment", "id": payment.id}]
        )

    severity = evaluate_financial_severity(abs(effect.variance_paise), ControlSeverity.LOW)
    return ControlResult(
        control_id="CTL_04_FEE_GST",
        control_name="Fee / GST Inconsistency",
        status=ControlStatus.FAIL,
        severity=severity,
        financial_impact_paise=abs(effect.variance_paise),
        confidence=0.99,
        explanation=effect.explanation,
        recommended_action="HUMAN_REVIEW",
        evidence=effect.evidence,
        affected_records=[{"type": "payment", "id": payment.id}]
    )


def run_ctl_05_refund(
    refund: Refund,
    payment: Optional[Payment] = None,
    fee_schedule: Optional[FeeSchedule] = None,
) -> ControlResult:
    """
    Validates refund correctness, source instrument threading, and fee non-reversal rules.
    """
    effect = calculate_refund_effect(refund, payment, fee_schedule)

    if effect.is_expected_variance and effect.classification == VarianceClassification.EXPECTED_REFUND_VARIANCE:
        return ControlResult(
            control_id="CTL_05_REFUND",
            control_name="Refund Mismatch",
            status=ControlStatus.PASS,
            severity=ControlSeverity.LOW,
            financial_impact_paise=0,
            confidence=1.0,
            explanation=effect.explanation,
            recommended_action="AUTO_RESOLVE",
            evidence=effect.evidence,
            affected_records=[{"type": "refund", "id": refund.id}]
        )

    severity = evaluate_financial_severity(abs(effect.variance_paise) or refund.amount_paise, ControlSeverity.MEDIUM)
    return ControlResult(
        control_id="CTL_05_REFUND",
        control_name="Refund Mismatch",
        status=ControlStatus.FAIL,
        severity=severity,
        financial_impact_paise=abs(effect.variance_paise) or refund.amount_paise,
        confidence=0.97,
        explanation=effect.explanation,
        recommended_action="HUMAN_REVIEW",
        evidence=effect.evidence,
        affected_records=[{"type": "refund", "id": refund.id}]
    )
