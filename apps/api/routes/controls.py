"""
HISAB — Controls & Exceptions API Endpoints.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from apps.api.dependencies import get_db, get_current_user, require_permission
from packages.domain.auth_rbac import Permission, UserSession
from packages.domain.models import Order, Payment, Refund, Dispute
from packages.domain.db_models import (
    OrderDB,
    PaymentDB,
    RefundDB,
    DisputeDB,
    ExceptionDB,
    AuditEntryDB,
)
from packages.domain.money import format_inr
from packages.domain.audit_ledger import append_audit_entry
from packages.controls.double_loss_detector import (
    detect_double_loss_for_order,
    DoubleLossAlert,
)

router = APIRouter(prefix="/api/controls", tags=["Controls & Exceptions"])


class ResolveExceptionRequest(BaseModel):
    justification: str
    actor_id: str = "FINANCE_OPERATOR"
    resolution_type: str = "MANUAL_CORRECTION"


class EscalateExceptionRequest(BaseModel):
    reason: str
    assigned_to: str = "HEAD_OF_FINANCE"
    actor_id: str = "FINANCE_OPERATOR"


from apps.api.dependencies import get_db, get_current_user
from packages.domain.auth_rbac import UserSession

@router.get("/summary")
def get_controls_summary(
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
):
    """
    Returns the status and health of the Seven Financial Controls (CTL_01 to CTL_07).
    """
    controls_meta = [
        {"id": "CTL_01_SETTLEMENT_BANK", "name": "Settlement-to-Bank Mismatch", "category": "BANK_CREDIT_UNMATCHED", "assertion": "Accuracy"},
        {"id": "CTL_02_MISSING_TXN", "name": "Missing Settlement Transaction", "category": "MISSING_SETTLEMENT", "assertion": "Completeness"},
        {"id": "CTL_03_DUPLICATE", "name": "Duplicate Transaction / Refund", "category": "DUPLICATE_PAYMENT", "assertion": "Occurrence"},
        {"id": "CTL_04_FEE_GST", "name": "Fee / GST Inconsistency", "category": "FEE_MISMATCH", "assertion": "Classification"},
        {"id": "CTL_05_REFUND", "name": "Refund Mismatch & Non-Reversal", "category": "REFUND_MISMATCH", "assertion": "Measurement"},
        {"id": "CTL_06_DOUBLE_LOSS", "name": "Potential Double-Loss Outflow Risk", "category": "DOUBLE_LOSS", "assertion": "Compounded Outflow (Signature #1)"},
        {"id": "CTL_07_DISPUTE", "name": "Dispute Exposure & Deadline Tracking", "category": "DISPUTE_EXPOSURE", "assertion": "Cut-off & Exposure (Signature #2)"},
    ]

    if not current_user.is_demo_session and not current_user.is_razorpay_connected and current_user.org_id != "org_nova_2026":
        return {
            "controls": [
                {
                    "control_id": ctl["id"],
                    "control_name": ctl["name"],
                    "financial_assertion": ctl["assertion"],
                    "status": "PASS",
                    "active_exceptions_count": 0,
                    "total_exposure_paise": 0,
                    "total_exposure_formatted": "₹0.00",
                }
                for ctl in controls_meta
            ]
        }

    results = []
    for ctl in controls_meta:
        exc_count = db.scalar(
            select(func.count(ExceptionDB.id)).where(
                ExceptionDB.org_id == current_user.org_id,
                ExceptionDB.category == ctl["category"],
                ExceptionDB.status.in_(["OPEN", "ESCALATED"]),
            )
        ) or 0

        exposure = db.scalar(
            select(func.sum(ExceptionDB.financial_impact_paise)).where(
                ExceptionDB.org_id == current_user.org_id,
                ExceptionDB.category == ctl["category"],
                ExceptionDB.status.in_(["OPEN", "ESCALATED"]),
            )
        ) or 0

        status = "PASS" if exc_count == 0 else ("FAIL" if ctl["id"] == "CTL_06_DOUBLE_LOSS" or exposure > 2500000 else "WARN")

        results.append({
            "control_id": ctl["id"],
            "control_name": ctl["name"],
            "financial_assertion": ctl["assertion"],
            "status": status,
            "active_exceptions_count": exc_count,
            "total_exposure_paise": exposure,
            "total_exposure_formatted": format_inr(exposure),
        })

    return {"controls": results}


@router.get("/double-loss")
def get_double_loss_alerts(
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
):
    """
    Returns active double-loss alerts with timeline forensic reconstruction.
    """
    if not current_user.is_demo_session and not current_user.is_razorpay_connected and current_user.org_id != "org_nova_2026":
        return {"alerts": []}
    orders = db.scalars(select(OrderDB).where(OrderDB.org_id == current_user.org_id)).all()
    payments = db.scalars(select(PaymentDB).where(PaymentDB.org_id == current_user.org_id)).all()
    refunds = db.scalars(select(RefundDB).where(RefundDB.org_id == current_user.org_id)).all()
    disputes = db.scalars(select(DisputeDB).where(DisputeDB.org_id == current_user.org_id)).all()

    o_models = [Order.model_validate(o.__dict__) for o in orders]
    p_models = [Payment.model_validate(p.__dict__) for p in payments]
    r_models = [Refund.model_validate(r.__dict__) for r in refunds]
    d_models = [Dispute.model_validate(d.__dict__) for d in disputes]

    alerts: List[Dict[str, Any]] = []
    for order in o_models:
        alert = detect_double_loss_for_order(order, p_models, r_models, d_models)
        if alert:
            alerts.append({
                "order_id": alert.order_id,
                "payment_id": alert.payment_id,
                "classification": alert.classification.value,
                "original_payment_formatted": alert.original_payment_formatted,
                "manual_refund_formatted": alert.manual_refund_formatted,
                "chargeback_exposure_formatted": alert.chargeback_exposure_formatted,
                "total_exposure_formatted": alert.total_exposure_formatted,
                "net_position_formatted": alert.net_position_formatted,
                "confidence": alert.confidence,
                "recommended_action": alert.recommended_action,
                "why_flagged": alert.why_flagged,
                "timeline": [t.model_dump() for t in alert.timeline],
            })

    return {"total_alerts": len(alerts), "alerts": alerts}


@router.get("/exceptions")
def list_exceptions(
    status: Optional[str] = Query(default=None, description="OPEN | RESOLVED | ESCALATED"),
    severity: Optional[str] = Query(default=None, description="CRITICAL | HIGH | MEDIUM | LOW"),
    category: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
):
    """
    Returns paginated exceptions scoped to the authenticated organization.
    """
    if not current_user.is_demo_session and not current_user.is_razorpay_connected and current_user.org_id != "org_nova_2026":
        return {
            "total": 0,
            "offset": offset,
            "limit": limit,
            "items": [],
        }

    stmt = select(ExceptionDB).where(ExceptionDB.org_id == current_user.org_id)
    if status:
        stmt = stmt.where(ExceptionDB.status == status.upper())
    if severity:
        stmt = stmt.where(ExceptionDB.severity == severity.upper())
    if category:
        stmt = stmt.where(ExceptionDB.category == category.upper())

    total_count = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    exceptions = db.scalars(stmt.order_by(ExceptionDB.created_at.desc()).offset(offset).limit(limit)).all()

    return {
        "total": total_count,
        "offset": offset,
        "limit": limit,
        "items": [
            {
                "id": exc.id,
                "batch_id": exc.batch_id,
                "category": exc.category,
                "severity": exc.severity,
                "financial_impact_paise": exc.financial_impact_paise,
                "financial_impact_formatted": format_inr(exc.financial_impact_paise),
                "confidence": exc.confidence,
                "root_cause": exc.root_cause,
                "recommendation": exc.recommendation,
                "status": exc.status,
                "resolution_method": exc.resolution_method,
                "affected_records": exc.affected_records,
                "evidence": exc.evidence,
                "created_at": exc.created_at.isoformat() if exc.created_at else None,
                "resolved_at": exc.resolved_at.isoformat() if exc.resolved_at else None,
            }
            for exc in exceptions
        ]
    }


@router.get("/exceptions/{exception_id}")
def get_exception_by_id(
    exception_id: str,
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
):
    """
    Returns single exception scoped to current organization.
    Returns 404 if not found or if belonging to another organization.
    """
    exc = db.scalar(
        select(ExceptionDB).where(
            ExceptionDB.id == exception_id,
            ExceptionDB.org_id == current_user.org_id,
        )
    )
    if not exc:
        raise HTTPException(status_code=404, detail="Exception record not found.")

    return {
        "id": exc.id,
        "batch_id": exc.batch_id,
        "category": exc.category,
        "severity": exc.severity,
        "financial_impact_paise": exc.financial_impact_paise,
        "financial_impact_formatted": format_inr(exc.financial_impact_paise),
        "confidence": exc.confidence,
        "root_cause": exc.root_cause,
        "recommendation": exc.recommendation,
        "status": exc.status,
        "resolution_method": exc.resolution_method,
        "affected_records": exc.affected_records,
        "evidence": exc.evidence,
        "created_at": exc.created_at.isoformat() if exc.created_at else None,
        "resolved_at": exc.resolved_at.isoformat() if exc.resolved_at else None,
    }


@router.post("/exceptions/{exception_id}/resolve")
def resolve_exception(
    exception_id: str,
    req: ResolveExceptionRequest,
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(require_permission(Permission.PREPARE_RESOLUTIONS)),
):
    """
    Resolves an exception with human operator justification and records to audit ledger.
    Strictly prevents cross-organization modification.
    """
    exc = db.scalar(
        select(ExceptionDB).where(
            ExceptionDB.id == exception_id,
            ExceptionDB.org_id == current_user.org_id,
        )
    )
    if not exc:
        raise HTTPException(status_code=404, detail="Exception record not found.")

    exc.status = "RESOLVED"
    exc.resolution_method = "HUMAN_OPERATOR"
    exc.resolved_at = datetime.now(timezone.utc)
    db.commit()

    append_audit_entry(
        db=db,
        case_id=exception_id,
        event_type="EXCEPTION_RESOLUTION",
        action="RESOLVE_EXCEPTION_MANUAL",
        policy_result="RESOLVED",
        reason_code=req.resolution_type,
        payload={
            "exception_id": exception_id,
            "justification": req.justification,
            "financial_impact_paise": exc.financial_impact_paise,
        },
        batch_id=exc.batch_id,
        actor_type=req.actor_id,
        org_id=current_user.org_id,
    )

    return {"success": True, "exception_id": exception_id, "status": "RESOLVED"}


@router.post("/exceptions/{exception_id}/escalate")
def escalate_exception(
    exception_id: str,
    req: EscalateExceptionRequest,
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(require_permission(Permission.PREPARE_RESOLUTIONS)),
):
    """
    Escalates an exception for senior management or legal review.
    Strictly prevents cross-organization modification.
    """
    exc = db.scalar(
        select(ExceptionDB).where(
            ExceptionDB.id == exception_id,
            ExceptionDB.org_id == current_user.org_id,
        )
    )
    if not exc:
        raise HTTPException(status_code=404, detail="Exception record not found.")

    exc.status = "ESCALATED"
    db.commit()

    append_audit_entry(
        db=db,
        case_id=exception_id,
        event_type="EXCEPTION_ESCALATION",
        action="ESCALATE_EXCEPTION",
        policy_result="ESCALATED",
        reason_code="MANUAL_ESCALATION",
        payload={
            "exception_id": exception_id,
            "reason": req.reason,
            "assigned_to": req.assigned_to,
        },
        batch_id=exc.batch_id,
        actor_type=req.actor_id,
        org_id=current_user.org_id,
    )

    return {"success": True, "exception_id": exception_id, "status": "ESCALATED"}
