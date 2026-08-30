#!/usr/bin/env python3
"""
HISAB Model Context Protocol (MCP) Server.

Exposes HISAB financial state, controls, forensic double-loss analysis,
and audit trails to LLMs (including Claude Code and Cursor) using strict, typed schemas.
Does NOT expose arbitrary SQL or bypass HISAB's safe policy gates.
"""

import sys
import json
from typing import Any, Dict, List, Optional
from mcp.server.fastmcp import FastMCP
from sqlalchemy import select, func

from packages.domain.database import get_sync_db
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
    AuditEntryDB,
)
from packages.domain.money import format_inr
from packages.domain.snapshot import SnapshotRepository, compare_snapshots
from packages.controls.double_loss_detector import detect_double_loss_for_order
from packages.controls.evidence_graph_builder import build_evidence_graph_for_payment
from packages.domain.models import Order, Payment, Refund, Dispute, Settlement, BankTransaction

# Initialize FastMCP
mcp = FastMCP(
    "hisab-finance-controller",
    instructions="HISAB Autonomous Finance Controller MCP Server. Exposes payment gateway reconciliation, double-loss forensics, and immutable audit ledgers."
)

snapshot_repo = SnapshotRepository()


# ==============================================================================
# MCP READ TOOLS (Strictly Grounded, Non-Mutating)
# ==============================================================================

@mcp.tool()
def get_batch_status(batch_id: str = "BATCH_AUG_2026") -> Dict[str, Any]:
    """
    Returns high-level status of a reconciliation batch including turnover, match rate, and unresolved exposure.
    """
    with get_sync_db() as db:
        total_payments = db.scalar(select(func.count(PaymentDB.id))) or 0
        gross_turnover = db.scalar(select(func.sum(PaymentDB.amount_paise))) or 0
        settled_count = db.scalar(select(func.count(PaymentDB.id)).where(PaymentDB.settlement_id.isnot(None))) or 0
        open_exc_count = db.scalar(select(func.count(ExceptionDB.id)).where(ExceptionDB.status.in_(["OPEN", "ESCALATED"]))) or 0
        unresolved_exposure = db.scalar(select(func.sum(ExceptionDB.financial_impact_paise)).where(ExceptionDB.status.in_(["OPEN", "ESCALATED"]))) or 0

        return {
            "batch_id": batch_id,
            "status": "REQUIRES_REVIEW" if open_exc_count > 0 else "RECONCILED",
            "gross_turnover_paise": gross_turnover,
            "gross_turnover_formatted": format_inr(gross_turnover),
            "total_payments_count": total_payments,
            "settled_payments_count": settled_count,
            "open_exceptions_count": open_exc_count,
            "unresolved_exposure_paise": unresolved_exposure,
            "unresolved_exposure_formatted": format_inr(unresolved_exposure),
            "evidence_ids": [f"batch_{batch_id}"]
        }


@mcp.tool()
def list_exceptions(status: Optional[str] = None, severity: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Lists all detected financial exceptions with category, severity, and financial impact.
    """
    with get_sync_db() as db:
        stmt = select(ExceptionDB)
        if status:
            stmt = stmt.where(ExceptionDB.status == status.upper())
        if severity:
            stmt = stmt.where(ExceptionDB.severity == severity.upper())

        rows = db.scalars(stmt.limit(50)).all()
        return [
            {
                "id": r.id,
                "category": r.category,
                "severity": r.severity,
                "financial_impact_paise": r.financial_impact_paise,
                "financial_impact_formatted": format_inr(r.financial_impact_paise),
                "root_cause": r.root_cause,
                "status": r.status,
                "affected_records": r.affected_records,
                "evidence_ids": [rec["id"] for rec in (r.affected_records or [])]
            }
            for r in rows
        ]


@mcp.tool()
def get_exception_evidence(exception_id: str) -> Dict[str, Any]:
    """
    Retrieves the complete evidence dossier behind a specific exception.
    """
    with get_sync_db() as db:
        exc = db.get(ExceptionDB, exception_id)
        if not exc:
            return {"error": f"Exception {exception_id} not found."}

        return {
            "exception_id": exc.id,
            "category": exc.category,
            "severity": exc.severity,
            "financial_impact_formatted": format_inr(exc.financial_impact_paise),
            "root_cause": exc.root_cause,
            "recommendation": exc.recommendation,
            "evidence": exc.evidence,
            "status": exc.status,
            "evidence_ids": [rec["id"] for rec in (exc.affected_records or [])]
        }


@mcp.tool()
def find_potential_double_losses() -> List[Dict[str, Any]]:
    """
    Forensically detects concurrent manual refund and chargeback dispute events on the same order.
    """
    with get_sync_db() as db:
        orders = [Order.model_validate(o.__dict__) for o in db.scalars(select(OrderDB)).all()]
        payments = [Payment.model_validate(p.__dict__) for p in db.scalars(select(PaymentDB)).all()]
        refunds = [Refund.model_validate(r.__dict__) for r in db.scalars(select(RefundDB)).all()]
        disputes = [Dispute.model_validate(d.__dict__) for d in db.scalars(select(DisputeDB)).all()]

        alerts = []
        for order in orders:
            alert = detect_double_loss_for_order(order, payments, refunds, disputes)
            if alert:
                alerts.append({
                    "finding": "potential_double_loss",
                    "order_id": alert.order_id,
                    "payment_id": alert.payment_id,
                    "classification": alert.classification.value,
                    "original_payment_formatted": alert.original_payment_formatted,
                    "manual_refund_formatted": alert.manual_refund_formatted,
                    "chargeback_exposure_formatted": alert.chargeback_exposure_formatted,
                    "total_potential_exposure_paise": alert.total_potential_exposure_paise,
                    "total_exposure_formatted": alert.total_exposure_formatted,
                    "recommended_action": alert.recommended_action,
                    "evidence_ids": [alert.order_id, alert.payment_id]
                })

        return alerts


@mcp.tool()
def trace_payment(payment_id: str) -> Dict[str, Any]:
    """
    Traces a payment through the full lifecycle: Order -> Payment -> Refund/Dispute -> Settlement -> Bank Credit.
    """
    with get_sync_db() as db:
        p_row = db.get(PaymentDB, payment_id)
        if not p_row:
            return {"error": f"Payment '{payment_id}' not found."}

        payment = Payment.model_validate(p_row.__dict__)
        order = Order.model_validate(db.get(OrderDB, payment.order_id).__dict__) if db.get(OrderDB, payment.order_id) else None
        settlement = Settlement.model_validate(db.get(SettlementDB, payment.settlement_id).__dict__) if payment.settlement_id and db.get(SettlementDB, payment.settlement_id) else None
        bank_tx = None
        if settlement and settlement.utr:
            b_row = db.scalars(select(BankTransactionDB).where(BankTransactionDB.reference == settlement.utr)).first()
            if b_row:
                bank_tx = BankTransaction.model_validate(b_row.__dict__)

        dossier = build_evidence_graph_for_payment(payment, order, settlement, bank_tx)
        return dossier.model_dump()


@mcp.tool()
def compare_snapshots_tool(snapshot_id_a: str = "SNP-002", snapshot_id_b: str = "SNP-003") -> Dict[str, Any]:
    """
    'What Changed?' diff comparator between two immutable reconciliation snapshots.
    """
    s_a = snapshot_repo.get(snapshot_id_a)
    s_b = snapshot_repo.get(snapshot_id_b)
    if not s_a or not s_b:
        return {"error": "Invalid snapshot IDs"}
    return compare_snapshots(s_a, s_b).model_dump()


@mcp.tool()
def get_control_results(batch_id: str = "BATCH_AUG_2026") -> List[Dict[str, Any]]:
    """
    Returns evaluation status across all Seven Financial Controls (CTL_01 through CTL_07).
    """
    with get_sync_db() as db:
        controls_meta = [
            ("CTL_01_SETTLEMENT_BANK", "BANK_CREDIT_UNMATCHED", "Accuracy"),
            ("CTL_02_MISSING_TXN", "MISSING_SETTLEMENT", "Completeness"),
            ("CTL_03_DUPLICATE", "DUPLICATE_PAYMENT", "Occurrence"),
            ("CTL_04_FEE_GST", "FEE_MISMATCH", "Classification"),
            ("CTL_05_REFUND", "REFUND_MISMATCH", "Measurement"),
            ("CTL_06_DOUBLE_LOSS", "DOUBLE_LOSS", "Compounded Outflow"),
            ("CTL_07_DISPUTE", "DISPUTE_EXPOSURE", "Cut-off & Exposure"),
        ]

        results = []
        for ctl_id, cat, assertion in controls_meta:
            count = db.scalar(select(func.count(ExceptionDB.id)).where(ExceptionDB.category == cat, ExceptionDB.status.in_(["OPEN", "ESCALATED"]))) or 0
            exp = db.scalar(select(func.sum(ExceptionDB.financial_impact_paise)).where(ExceptionDB.category == cat, ExceptionDB.status.in_(["OPEN", "ESCALATED"]))) or 0
            status = "PASS" if count == 0 else ("FAIL" if ctl_id == "CTL_06_DOUBLE_LOSS" or exp > 2500000 else "WARN")

            results.append({
                "control_id": ctl_id,
                "assertion": assertion,
                "status": status,
                "active_exceptions_count": count,
                "exposure_formatted": format_inr(exp),
                "evidence_ids": [ctl_id]
            })

        return results


@mcp.tool()
def get_audit_trail(case_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Returns cryptographic SHA-256 hash-chained audit log entries.
    """
    with get_sync_db() as db:
        stmt = select(AuditEntryDB)
        if case_id:
            stmt = stmt.where(AuditEntryDB.case_id == case_id)

        entries = db.scalars(stmt.order_by(AuditEntryDB.sequence.desc()).limit(limit)).all()
        return [
            {
                "sequence": e.sequence,
                "case_id": e.case_id,
                "action": e.action,
                "policy_result": e.policy_result,
                "previous_hash": e.previous_hash,
                "current_hash": e.current_hash,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "evidence_ids": [f"audit_{e.sequence}"]
            }
            for e in entries
        ]


# ==============================================================================
# MCP CONTROLLED ACTION PROPOSALS (Requires Human Sign-off)
# ==============================================================================

@mcp.tool()
def prepare_resolution(exception_id: str, justification: str, resolution_type: str = "MANUAL_CLEARANCE") -> Dict[str, Any]:
    """
    Prepares a safe resolution proposal for human review. Does NOT unilaterally resolve without validation.
    """
    with get_sync_db() as db:
        exc = db.get(ExceptionDB, exception_id)
        if not exc:
            return {"error": f"Exception {exception_id} not found."}

        if exc.category == "DOUBLE_LOSS":
            return {
                "allowed": False,
                "reason": "POLICY_FORBIDDEN: Double-loss exceptions are strictly forbidden from automated resolution.",
                "proposal_status": "REJECTED_BY_POLICY"
            }

        return {
            "proposal_id": f"prop_res_{exception_id}",
            "exception_id": exception_id,
            "justification": justification,
            "financial_impact_formatted": format_inr(exc.financial_impact_paise),
            "status": "PENDING_HUMAN_APPROVAL",
            "message": "Resolution proposal prepared. Submit via HISAB Control Room to seal into audit ledger."
        }


@mcp.tool()
def prepare_batch_close(batch_id: str = "BATCH_AUG_2026") -> Dict[str, Any]:
    """
    Prepares a batch close proposal by evaluating all 7 controls and open exception tolerances.
    """
    with get_sync_db() as db:
        open_exc = db.scalars(select(ExceptionDB).where(ExceptionDB.status.in_(["OPEN", "ESCALATED"]))).all()
        unresolved_exp = sum(e.financial_impact_paise for e in open_exc)

        if open_exc:
            return {
                "can_close": False,
                "status": "CANNOT_CLOSE_BATCH",
                "blocking_reasons": [f"{len(open_exc)} material exceptions remain unresolved ({format_inr(unresolved_exp)})"],
                "required_action": "Resolve or escalate open exceptions via HISAB dashboard before closure."
            }

        return {
            "can_close": True,
            "status": "READY_FOR_CLOSURE",
            "batch_id": batch_id,
            "message": "All 7 controls passed with zero unresolved exposure. Ready for cryptographic seal."
        }


if __name__ == "__main__":
    mcp.run()
