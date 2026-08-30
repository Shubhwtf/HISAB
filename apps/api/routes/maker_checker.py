"""
HISAB — Maker-Checker Approval Workflow & Policy Gate Sign-off.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from apps.api.dependencies import get_db
from packages.domain.db_models import ExceptionDB
from packages.domain.audit_ledger import append_audit_entry
from packages.domain.money import format_inr

router = APIRouter(prefix="/api/approvals", tags=["Maker-Checker Workflow"])


class PrepareApprovalRequest(BaseModel):
    exception_id: str
    proposed_action: str
    justification: str
    analyst_name: str = "Priya Sharma (Analyst)"


class DecideApprovalRequest(BaseModel):
    decision: str
    manager_name: str = "Rajesh Gupta (Finance Manager)"
    comments: str = "Verified supporting invoice and acquiring bank statement reference."


APPROVAL_QUEUE: List[Dict[str, Any]] = [
    {
        "approval_id": "APPR-1001",
        "exception_id": "EX-10012",
        "category": "FEE_MISMATCH",
        "severity": "LOW",
        "financial_impact_formatted": "₹50.00",
        "proposed_action": "FEE_SCHEDULE_ADJUSTMENT",
        "justification": "International card surcharge deviation aligned with commercial contract amendment.",
        "prepared_by": "Priya Sharma (Analyst)",
        "prepared_at": "2026-08-28T22:15:00Z",
        "status": "PENDING_MANAGER_APPROVAL",
        "sla_remaining": "14 hours",
    },
    {
        "approval_id": "APPR-1002",
        "exception_id": "EX-10015",
        "category": "BANK_CLEARANCE",
        "severity": "LOW",
        "financial_impact_formatted": "₹112.40",
        "proposed_action": "MANUAL_CLEARANCE",
        "justification": "Banking rail IMPS switch fee recognized under banking charges account.",
        "prepared_by": "Priya Sharma (Analyst)",
        "prepared_at": "2026-08-28T21:40:00Z",
        "status": "PENDING_MANAGER_APPROVAL",
        "sla_remaining": "8 hours",
    },
]


from apps.api.dependencies import get_db, get_current_user
from packages.domain.auth_rbac import UserSession

@router.get("/queue")
def list_approval_queue(current_user: UserSession = Depends(get_current_user)):
    """
    Returns exceptions currently pending Maker-Checker dual authorization.
    """
    if not current_user.is_demo_session and not current_user.is_razorpay_connected and current_user.org_id != "org_nova_2026":
        return {"total": 0, "items": []}
    return {"total": len(APPROVAL_QUEUE), "items": APPROVAL_QUEUE}


@router.post("/prepare")
def prepare_exception_for_approval(req: PrepareApprovalRequest, db: Session = Depends(get_db)):
    """
    Step 1 (Maker): Financial analyst prepares resolution package with justification.
    """
    exc = db.get(ExceptionDB, req.exception_id)
    if not exc:
        raise HTTPException(status_code=404, detail="Exception not found.")

    if exc.category == "DOUBLE_LOSS":
        raise HTTPException(
            status_code=400,
            detail="POLICY INVARIANT: Double-loss cases cannot be auto-cleared in maker-checker. Representment escalation required."
        )

    appr_id = f"APPR-{len(APPROVAL_QUEUE) + 1001}"
    item = {
        "approval_id": appr_id,
        "exception_id": req.exception_id,
        "category": exc.category,
        "severity": exc.severity,
        "financial_impact_formatted": format_inr(exc.financial_impact_paise),
        "proposed_action": req.proposed_action,
        "justification": req.justification,
        "prepared_by": req.analyst_name,
        "prepared_at": datetime.now(timezone.utc).isoformat(),
        "status": "PENDING_MANAGER_APPROVAL",
        "sla_remaining": "24 hours",
    }
    APPROVAL_QUEUE.append(item)
    return {"success": True, "approval_id": appr_id, "status": "PENDING_MANAGER_APPROVAL"}


@router.post("/{approval_id}/decide")
def decide_approval(approval_id: str, req: DecideApprovalRequest, db: Session = Depends(get_db)):
    """
    Step 2 (Checker): Finance Manager approves/rejects and commits cryptographic audit entry.
    """
    item = next((a for a in APPROVAL_QUEUE if a["approval_id"] == approval_id), None)
    if not item:
        raise HTTPException(status_code=404, detail=f"Approval package '{approval_id}' not found.")

    item["status"] = "APPROVED" if req.decision == "APPROVED" else "REJECTED"
    item["decided_by"] = req.manager_name
    item["decided_at"] = datetime.now(timezone.utc).isoformat()
    item["manager_comments"] = req.comments

    if req.decision == "APPROVED":
        exc = db.get(ExceptionDB, item["exception_id"])
        if exc:
            exc.status = "RESOLVED"
            exc.resolution_method = f"MAKER_CHECKER ({req.manager_name})"
            db.commit()

            append_audit_entry(
                db=db,
                case_id=item["exception_id"],
                event_type="MAKER_CHECKER_APPROVAL",
                action="APPROVE_EXCEPTION_RESOLUTION",
                policy_result="RESOLVED",
                reason_code=item["proposed_action"],
                payload={
                    "approval_id": approval_id,
                    "prepared_by": item["prepared_by"],
                    "approved_by": req.manager_name,
                    "comments": req.comments
                },
                batch_id=exc.batch_id,
                actor_type="FINANCE_MANAGER",
            )

    return {"success": True, "approval_id": approval_id, "status": item["status"]}
