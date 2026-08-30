"""
HISAB — Evidence Graph API Endpoints ("Prove It").
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from apps.api.dependencies import get_db
from packages.agent.tools import verify_evidence
from packages.controls.evidence_graph_builder import PaymentDossier

router = APIRouter(prefix="/api/evidence", tags=["Evidence Graph"])


@router.get("/{payment_id}")
def get_payment_evidence(payment_id: str, db: Session = Depends(get_db)):
    """
    Returns the complete 'Prove It' interactive evidence graph dossier for a payment.
    Links Order -> Payment -> Refund / Dispute -> Settlement -> Bank Credit.
    """
    dossier = verify_evidence(db, payment_id)
    if not dossier:
        raise HTTPException(
            status_code=404,
            detail=f"Payment record '{payment_id}' not found in database.",
        )

    return dossier.model_dump()
