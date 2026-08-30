"""
HISAB — Evidence Graph API Endpoints ("Prove It").
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from apps.api.dependencies import get_db, get_current_user
from packages.domain.auth_rbac import UserSession
from packages.domain.db_models import PaymentDB
from packages.agent.tools import verify_evidence
from packages.controls.evidence_graph_builder import PaymentDossier
from sqlalchemy import select

router = APIRouter(prefix="/api/evidence", tags=["Evidence Graph"])


@router.get("/{payment_id}")
def get_payment_evidence(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
):
    """
    Returns the complete 'Prove It' interactive evidence graph dossier for a payment.
    Links Order -> Payment -> Refund / Dispute -> Settlement -> Bank Credit.
    Scoped strictly to the authenticated organization.
    """
    p_db = db.scalar(
        select(PaymentDB).where(
            PaymentDB.id == payment_id,
            PaymentDB.org_id == current_user.org_id,
        )
    )
    if not p_db:
        raise HTTPException(
            status_code=404,
            detail=f"Payment record '{payment_id}' not found.",
        )

    dossier = verify_evidence(db, payment_id)
    if not dossier:
        raise HTTPException(
            status_code=404,
            detail=f"Payment record '{payment_id}' not found.",
        )

    return dossier.model_dump()
