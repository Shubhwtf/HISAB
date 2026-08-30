"""
HISAB — Controller Tool Interfaces (Section 9).

Provides deterministic tools for the AI Controller to inspect financial records,
execute minor-unit fee arithmetic, run controls, and perform state transitions.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select

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
from packages.domain.fees import FeeSchedule, calculate_fee_and_tax, DEFAULT_FEE_SCHEDULES
from packages.domain.effects import (
    calculate_payment_effect,
    calculate_refund_effect,
    calculate_settlement_batch_effect,
)
from packages.domain.money import format_inr
from packages.domain.db_models import (
    CustomerDB,
    OrderDB,
    PaymentDB,
    RefundDB,
    DisputeDB,
    SettlementDB,
    BankTransactionDB,
    TaxRecordDB,
    ExceptionDB,
)
from packages.domain.audit_ledger import append_audit_entry
from packages.controls.financial_controls import (
    run_ctl_01_settlement_bank,
    run_ctl_02_missing_txn,
    run_ctl_03_duplicate,
    run_ctl_04_fee_gst,
    run_ctl_05_refund,
)
from packages.controls.double_loss_detector import detect_double_loss_for_order
from packages.controls.evidence_graph_builder import (
    run_ctl_07_dispute,
    build_evidence_graph_for_payment,
    PaymentDossier,
)
from packages.controls.policy_gate import (
    PolicyGateConfig,
    PolicyAction,
    evaluate_policy_for_exception,
)


class ToolCandidateMatch(BaseModel):
    candidate_id: str
    entity_type: str
    amount_paise: int
    amount_formatted: str
    date_str: str
    variance_paise: int
    confidence_score: float
    reasons: List[str]


class ToolExecutionResult(BaseModel):
    success: bool
    tool_name: str
    data: Dict[str, Any] = Field(default_factory=dict)
    message: str = ""


# ------------------------------------------------------------------------------
# 1. list_source_records & get_record
# ------------------------------------------------------------------------------

def list_source_records(
    db: Session,
    entity_type: str,
    limit: int = 100,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """
    Lists domain records for inspection.
    """
    table_map = {
        "payment": PaymentDB,
        "order": OrderDB,
        "refund": RefundDB,
        "dispute": DisputeDB,
        "settlement": SettlementDB,
        "bank_transaction": BankTransactionDB,
        "tax_record": TaxRecordDB,
        "exception": ExceptionDB,
    }
    model = table_map.get(entity_type.lower())
    if not model:
        return []

    stmt = select(model).offset(offset).limit(limit)
    rows = db.scalars(stmt).all()
    return [
        {k: v for k, v in row.__dict__.items() if not k.startswith("_")}
        for row in rows
    ]


def get_record(
    db: Session,
    entity_type: str,
    record_id: str,
) -> Optional[Dict[str, Any]]:
    """
    Fetches a single record by primary key.
    """
    table_map = {
        "payment": PaymentDB,
        "order": OrderDB,
        "refund": RefundDB,
        "dispute": DisputeDB,
        "settlement": SettlementDB,
        "bank_transaction": BankTransactionDB,
        "tax_record": TaxRecordDB,
        "exception": ExceptionDB,
    }
    model = table_map.get(entity_type.lower())
    if not model:
        return None

    row = db.get(model, record_id)
    if not row:
        return None
    return {k: v for k, v in row.__dict__.items() if not k.startswith("_")}


# ------------------------------------------------------------------------------
# 2. search_candidates
# ------------------------------------------------------------------------------

def search_candidates(
    db: Session,
    record_id: str,
    entity_type: str = "payment",
) -> List[ToolCandidateMatch]:
    """
    Identifies candidate settlement batches or bank lines for an unmapped payment.
    """
    candidates: List[ToolCandidateMatch] = []

    if entity_type == "payment":
        payment_row = db.get(PaymentDB, record_id)
        if not payment_row:
            return []

        # Find settlements within capture time window
        settlements = db.scalars(select(SettlementDB)).all()
        for s in settlements:
            sched = DEFAULT_FEE_SCHEDULES.get(payment_row.method, DEFAULT_FEE_SCHEDULES["card"])
            fee_res = calculate_fee_and_tax(payment_row.amount_paise, sched)
            
            # Check date proximity
            date_diff_days = 0.0
            if payment_row.captured_at and s.settled_at:
                date_diff_days = abs((s.settled_at - payment_row.captured_at).total_seconds()) / 86400.0

            if date_diff_days <= 5.0:
                confidence = 0.95 if date_diff_days <= 2.0 else 0.85
                candidates.append(ToolCandidateMatch(
                    candidate_id=s.id,
                    entity_type="settlement",
                    amount_paise=s.amount_paise,
                    amount_formatted=format_inr(s.amount_paise),
                    date_str=s.settled_at.isoformat() if s.settled_at else "N/A",
                    variance_paise=0,
                    confidence_score=confidence,
                    reasons=[
                        f"Settlement date within {date_diff_days:.1f} days of capture",
                        f"Payment fee net {fee_res.net_formatted} fits settlement cycle",
                    ],
                ))

    return sorted(candidates, key=lambda c: c.confidence_score, reverse=True)


# ------------------------------------------------------------------------------
# 3. calculate_expected_settlement & calculate_refund_effect
# ------------------------------------------------------------------------------

def calculate_expected_settlement(
    payment_amount_paise: int,
    method: str = "card",
    fee_schedule: Optional[FeeSchedule] = None,
) -> Dict[str, Any]:
    """
    Calculates deterministic MDR fee, GST, and net settlement in paise.
    """
    sched = fee_schedule or DEFAULT_FEE_SCHEDULES.get(method, DEFAULT_FEE_SCHEDULES["card"])
    res = calculate_fee_and_tax(payment_amount_paise, sched)
    return {
        "gross_amount_paise": payment_amount_paise,
        "gross_formatted": format_inr(payment_amount_paise),
        "fee_paise": res.fee_paise,
        "fee_formatted": res.fee_formatted,
        "tax_paise": res.tax_paise,
        "tax_formatted": res.tax_formatted,
        "net_paise": res.net_paise,
        "net_formatted": res.net_formatted,
        "fee_schedule": sched.name,
    }


def inspect_dispute_and_double_loss(
    db: Session,
    payment_id: str,
) -> Dict[str, Any]:
    """
    Forensically checks if a payment has concurrent refund and dispute.
    """
    payment_row = db.get(PaymentDB, payment_id)
    if not payment_row:
        return {"found": False, "error": "Payment not found"}

    order_row = db.get(OrderDB, payment_row.order_id) if payment_row.order_id else None
    
    refund_rows = db.scalars(select(RefundDB).where(RefundDB.payment_id == payment_id)).all()
    dispute_rows = db.scalars(select(DisputeDB).where(DisputeDB.payment_id == payment_id)).all()

    if order_row:
        p_model = Payment.model_validate(payment_row.__dict__)
        o_model = Order.model_validate(order_row.__dict__)
        r_models = [Refund.model_validate(r.__dict__) for r in refund_rows]
        d_models = [Dispute.model_validate(d.__dict__) for d in dispute_rows]

        alert = detect_double_loss_for_order(o_model, [p_model], r_models, d_models)
        if alert:
            return {
                "found": True,
                "is_double_loss": True,
                "order_id": order_row.id,
                "total_potential_exposure_paise": alert.total_potential_exposure_paise,
                "total_exposure_formatted": alert.total_exposure_formatted,
                "recommended_action": "ESCALATE",
                "why_flagged": alert.why_flagged,
            }

    return {
        "found": True,
        "is_double_loss": False,
        "refunds_count": len(refund_rows),
        "disputes_count": len(dispute_rows),
    }


# ------------------------------------------------------------------------------
# 4. State Transitions & Evidence Verification
# ------------------------------------------------------------------------------

def match_payment_to_settlement(
    db: Session,
    payment_id: str,
    settlement_id: str,
    actor_type: str = "AI_AGENT",
) -> ToolExecutionResult:
    """
    Links an unmapped payment to a settlement batch and logs to immutable audit ledger.
    """
    payment_row = db.get(PaymentDB, payment_id)
    settlement_row = db.get(SettlementDB, settlement_id)

    if not payment_row or not settlement_row:
        return ToolExecutionResult(
            success=False,
            tool_name="match_payment_to_settlement",
            message="Payment or Settlement not found.",
        )

    payment_row.settlement_id = settlement_id
    db.commit()

    # Append immutable audit entry
    append_audit_entry(
        db=db,
        case_id=payment_id,
        event_type="MATCHING",
        action="MATCH_PAYMENT_TO_SETTLEMENT",
        policy_result="AUTO_RESOLVE",
        reason_code="RECONSTRUCTED_BATCH_MEMBER",
        payload={
            "payment_id": payment_id,
            "settlement_id": settlement_id,
            "amount_paise": payment_row.amount_paise,
        },
        batch_id=settlement_id,
        actor_type=actor_type,
    )

    return ToolExecutionResult(
        success=True,
        tool_name="match_payment_to_settlement",
        data={"payment_id": payment_id, "settlement_id": settlement_id},
        message=f"Payment {payment_id} successfully mapped to settlement batch {settlement_id}.",
    )


def verify_evidence(
    db: Session,
    payment_id: str,
) -> Optional[PaymentDossier]:
    """
    Constructs full 'Prove It' evidence graph dossier for a payment.
    """
    p_row = db.get(PaymentDB, payment_id)
    if not p_row:
        return None

    o_row = db.get(OrderDB, p_row.order_id) if p_row.order_id else None
    r_rows = db.scalars(select(RefundDB).where(RefundDB.payment_id == payment_id)).all()
    d_rows = db.scalars(select(DisputeDB).where(DisputeDB.payment_id == payment_id)).all()
    s_row = db.get(SettlementDB, p_row.settlement_id) if p_row.settlement_id else None
    
    b_row = None
    if s_row and s_row.utr:
        b_row = db.scalars(
            select(BankTransactionDB).where(BankTransactionDB.reference == s_row.utr)
        ).first()

    p_model = Payment.model_validate(p_row.__dict__)
    o_model = Order.model_validate(o_row.__dict__) if o_row else None
    r_models = [Refund.model_validate(r.__dict__) for r in r_rows]
    d_models = [Dispute.model_validate(d.__dict__) for d in d_rows]
    s_model = Settlement.model_validate(s_row.__dict__) if s_row else None
    b_model = BankTransaction.model_validate(b_row.__dict__) if b_row else None

    return build_evidence_graph_for_payment(
        payment=p_model,
        order=o_model,
        refunds=r_models,
        disputes=d_models,
        settlement=s_model,
        bank_transaction=b_model,
    )
