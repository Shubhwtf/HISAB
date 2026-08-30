"""
HISAB — Exception Engine & Aggregator.

Executes all financial controls across a batch, deduplicates findings, classifies
severity by monetary exposure, and manages the complete lifecycle of financial exceptions.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Set
from pydantic import BaseModel, Field

from packages.domain.models import (
    Customer,
    Order,
    Payment,
    Refund,
    Dispute,
    Settlement,
    BankTransaction,
    TaxRecord,
    ExceptionRecord,
)
from packages.domain.money import format_inr, format_inr_compact
from packages.controls.financial_controls import (
    ControlResult,
    ControlStatus,
    ControlSeverity,
    run_ctl_01_settlement_bank,
    run_ctl_02_missing_txn,
    run_ctl_03_duplicate,
    run_ctl_04_fee_gst,
    run_ctl_05_refund,
    evaluate_financial_severity,
)
from packages.controls.double_loss_detector import run_ctl_06_double_loss
from packages.controls.evidence_graph_builder import run_ctl_07_dispute


class BatchExceptionSummary(BaseModel):
    total_exceptions: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    total_exposure_paise: int = 0
    unresolved_exposure_paise: int = 0
    categories_breakdown: Dict[str, int] = Field(default_factory=dict)

    @property
    def total_exposure_formatted(self) -> str:
        return format_inr(self.total_exposure_paise)

    @property
    def unresolved_exposure_formatted(self) -> str:
        return format_inr(self.unresolved_exposure_paise)


def run_all_controls_and_build_exceptions(
    batch_id: str,
    orders: List[Order],
    payments: List[Payment],
    refunds: List[Refund],
    disputes: List[Dispute],
    settlements: List[Settlement],
    bank_transactions: List[BankTransaction],
    tax_records: Optional[List[TaxRecord]] = None,
) -> List[ExceptionRecord]:
    """
    Executes Controls 01 through 07 across all batch records and generates standardized ExceptionRecord instances.
    """
    exceptions: List[ExceptionRecord] = []
    exc_counter = 1

    double_loss_results = run_ctl_06_double_loss(orders, payments, refunds, disputes)
    double_loss_payment_ids: Set[str] = set()

    for ctl in double_loss_results:
        for rec in ctl.affected_records:
            if rec.get("type") == "payment":
                double_loss_payment_ids.add(rec.get("id"))

        exceptions.append(ExceptionRecord(
            id=f"exc_{batch_id}_{exc_counter:04d}",
            batch_id=batch_id,
            category="DOUBLE_LOSS",
            severity="CRITICAL",
            financial_impact_paise=ctl.financial_impact_paise,
            confidence=ctl.confidence,
            root_cause=ctl.explanation,
            recommendation="ESCALATE",
            affected_records=ctl.affected_records,
            evidence=ctl.evidence,
            status="OPEN",
            created_at=datetime.now(timezone.utc),
        ))
        exc_counter += 1

    bank_by_setl = {b.matched_settlement_id: b for b in bank_transactions if b.matched_settlement_id}
    bank_by_utr = {b.reference.strip().upper(): b for b in bank_transactions if b.reference}

    for s in settlements:
        matched_b = bank_by_setl.get(s.id)
        if not matched_b and s.utr:
            matched_b = bank_by_utr.get(s.utr.strip().upper())

        res = run_ctl_01_settlement_bank(s, matched_b)
        if res.status != ControlStatus.PASS:
            if matched_b is None or (s.utr and matched_b.reference and s.utr.strip().upper() not in matched_b.reference.strip().upper()):
                cat = "BANK_CREDIT_UNMATCHED"
            else:
                cat = "AMOUNT_MISMATCH"

            exceptions.append(ExceptionRecord(
                id=f"exc_{batch_id}_{exc_counter:04d}",
                batch_id=batch_id,
                category=cat,
                severity=res.severity.value,
                financial_impact_paise=res.financial_impact_paise,
                confidence=res.confidence,
                root_cause=res.explanation,
                recommendation=res.recommended_action,
                affected_records=res.affected_records,
                evidence=res.evidence,
                status="OPEN",
                created_at=datetime.now(timezone.utc),
            ))
            exc_counter += 1

    for p in payments:
        if p.id in double_loss_payment_ids:
            continue
        res = run_ctl_02_missing_txn(p, is_settlement_mapped=bool(p.settlement_id))
        if res.status != ControlStatus.PASS:
            exceptions.append(ExceptionRecord(
                id=f"exc_{batch_id}_{exc_counter:04d}",
                batch_id=batch_id,
                category="MISSING_SETTLEMENT",
                severity=res.severity.value,
                financial_impact_paise=res.financial_impact_paise,
                confidence=res.confidence,
                root_cause=res.explanation,
                recommendation=res.recommended_action,
                affected_records=res.affected_records,
                evidence=res.evidence,
                status="OPEN",
                created_at=datetime.now(timezone.utc),
            ))
            exc_counter += 1

    dup_results = run_ctl_03_duplicate(payments, refunds)
    for res in dup_results:
        cat = "DUPLICATE_PAYMENT" if "Payment" in res.control_name or "Transaction" in res.control_name else "DUPLICATE_REFUND"
        exceptions.append(ExceptionRecord(
            id=f"exc_{batch_id}_{exc_counter:04d}",
            batch_id=batch_id,
            category=cat,
            severity=res.severity.value,
            financial_impact_paise=res.financial_impact_paise,
            confidence=res.confidence,
            root_cause=res.explanation,
            recommendation=res.recommended_action,
            affected_records=res.affected_records,
            evidence=res.evidence,
            status="OPEN",
            created_at=datetime.now(timezone.utc),
        ))
        exc_counter += 1

    for p in payments:
        if p.id in double_loss_payment_ids:
            continue
        res = run_ctl_04_fee_gst(p)
        if res.status != ControlStatus.PASS:
            exceptions.append(ExceptionRecord(
                id=f"exc_{batch_id}_{exc_counter:04d}",
                batch_id=batch_id,
                category="FEE_MISMATCH",
                severity=res.severity.value,
                financial_impact_paise=res.financial_impact_paise,
                confidence=res.confidence,
                root_cause=res.explanation,
                recommendation=res.recommended_action,
                affected_records=res.affected_records,
                evidence=res.evidence,
                status="OPEN",
                created_at=datetime.now(timezone.utc),
            ))
            exc_counter += 1

    payment_map = {p.id: p for p in payments}
    for r in refunds:
        p = payment_map.get(r.payment_id)
        res = run_ctl_05_refund(r, p)
        if res.status != ControlStatus.PASS:
            exceptions.append(ExceptionRecord(
                id=f"exc_{batch_id}_{exc_counter:04d}",
                batch_id=batch_id,
                category="REFUND_MISMATCH",
                severity=res.severity.value,
                financial_impact_paise=res.financial_impact_paise,
                confidence=res.confidence,
                root_cause=res.explanation,
                recommendation=res.recommended_action,
                affected_records=res.affected_records,
                evidence=res.evidence,
                status="OPEN",
                created_at=datetime.now(timezone.utc),
            ))
            exc_counter += 1

    for d in disputes:
        p = payment_map.get(d.payment_id)
        res = run_ctl_07_dispute(d, p)
        if res.status != ControlStatus.PASS:
            if d.payment_id in double_loss_payment_ids:
                continue
            exceptions.append(ExceptionRecord(
                id=f"exc_{batch_id}_{exc_counter:04d}",
                batch_id=batch_id,
                category="DISPUTE_EXPOSURE",
                severity=res.severity.value,
                financial_impact_paise=res.financial_impact_paise,
                confidence=res.confidence,
                root_cause=res.explanation,
                recommendation=res.recommended_action,
                affected_records=res.affected_records,
                evidence=res.evidence,
                status="OPEN",
                created_at=datetime.now(timezone.utc),
            ))
            exc_counter += 1

    if tax_records:
        for t in tax_records:
            if t.tds_rate_bps != 10:
                expected_tds = (t.gross_amount_credited_paise * 10) // 10000
                tax_variance = abs(t.tds_deducted_paise - expected_tds)
                exceptions.append(ExceptionRecord(
                    id=f"exc_{batch_id}_{exc_counter:04d}",
                    batch_id=batch_id,
                    category="TAX_RECONCILIATION",
                    severity="HIGH",
                    financial_impact_paise=tax_variance,
                    confidence=0.99,
                    root_cause=(
                        f"TDS deduction on Form 26AS applies rate of {t.tds_rate_bps/100:.1f}% "
                        f"({t.tds_formatted}) instead of statutory amended 0.1% rate ({format_inr(expected_tds)})."
                    ),
                    recommendation="HUMAN_REVIEW",
                    affected_records=[{"type": "tax_record", "id": t.id}],
                    evidence={
                        "tax_id": t.id,
                        "deductor": t.deductor_name,
                        "applied_rate_bps": t.tds_rate_bps,
                        "statutory_rate_bps": 10,
                    },
                    status="OPEN",
                    created_at=datetime.now(timezone.utc),
                ))
                exc_counter += 1

    return exceptions


def summarize_exceptions(exceptions: List[ExceptionRecord]) -> BatchExceptionSummary:
    """
    Computes aggregated metrics for an exception dataset.
    """
    summary = BatchExceptionSummary()
    summary.total_exceptions = len(exceptions)
    
    for exc in exceptions:
        if exc.severity == "CRITICAL":
            summary.critical_count += 1
        elif exc.severity == "HIGH":
            summary.high_count += 1
        elif exc.severity == "MEDIUM":
            summary.medium_count += 1
        elif exc.severity == "LOW":
            summary.low_count += 1

        summary.total_exposure_paise += exc.financial_impact_paise
        if exc.status in ("OPEN", "ESCALATED"):
            summary.unresolved_exposure_paise += exc.financial_impact_paise

        summary.categories_breakdown[exc.category] = (
            summary.categories_breakdown.get(exc.category, 0) + 1
        )

    return summary
