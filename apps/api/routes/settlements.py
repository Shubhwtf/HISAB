"""
HISAB — Settlement Control Tower & Cash-in-Transit Tracking API.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from apps.api.dependencies import get_db, get_current_user
from packages.domain.auth_rbac import UserSession
from packages.domain.db_models import SettlementDB, BankTransactionDB, PaymentDB
from packages.domain.money import format_inr

router = APIRouter(prefix="/api/settlements", tags=["Settlement Control Tower"])


@router.get("/tower")
def get_settlement_control_tower(
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
):
    """
    Returns settlement lifecycle control tower:
    Processed Payouts vs Bank Statement Credited vs Cash-in-Transit.
    """
    settlements = db.scalars(
        select(SettlementDB).where(SettlementDB.org_id == current_user.org_id)
    ).all()
    bank_txs = db.scalars(
        select(BankTransactionDB).where(BankTransactionDB.org_id == current_user.org_id)
    ).all()

    if len(settlements) == 0 and current_user.org_id != "org_nova_2026":
        return {
            "summary": {
                "gross_turnover_formatted": "₹0.00",
                "total_settled_payout_formatted": "₹0.00",
                "total_bank_credited_formatted": "₹0.00",
                "cash_in_transit_paise": 0,
                "cash_in_transit_formatted": "₹0.00",
                "unexplained_cash_paise": 0,
                "unexplained_cash_formatted": "₹0.00",
            },
            "settlements_count": 0,
            "timeline": []
        }

    total_gross = sum(s.gross_amount_paise for s in settlements)
    total_net_settled = sum(s.amount_paise for s in settlements)
    total_bank_credited = sum(b.amount_paise for b in bank_txs)

    cash_in_transit_paise = max(0, total_net_settled - total_bank_credited)

    timeline_items = []
    for s in settlements:
        matched_bank = next((b for b in bank_txs if b.reference == s.utr), None)
        status = "CREDITED_TO_BANK" if matched_bank else ("IN_TRANSIT" if s.status == "settled" else "PENDING_PROCESSING")

        timeline_items.append({
            "settlement_id": s.id,
            "utr": s.utr,
            "gross_formatted": format_inr(s.gross_amount_paise),
            "fee_formatted": format_inr(s.fee_amount_paise),
            "tax_formatted": format_inr(s.tax_amount_paise),
            "net_payout_formatted": format_inr(s.amount_paise),
            "status": status,
            "settled_at": s.settled_at.isoformat() if s.settled_at else None,
            "bank_cleared_at": matched_bank.date.isoformat() if matched_bank else None,
            "variance_paise": (s.amount_paise - matched_bank.amount_paise) if matched_bank else 0,
        })

    return {
        "summary": {
            "gross_turnover_formatted": format_inr(total_gross),
            "total_settled_payout_formatted": format_inr(total_net_settled),
            "total_bank_credited_formatted": format_inr(total_bank_credited),
            "cash_in_transit_paise": cash_in_transit_paise,
            "cash_in_transit_formatted": format_inr(cash_in_transit_paise),
            "unexplained_cash_paise": 0,
            "unexplained_cash_formatted": "₹0.00",
        },
        "settlements_count": len(settlements),
        "timeline": timeline_items
    }


@router.get("/{settlement_id}")
def get_settlement_by_id(
    settlement_id: str,
    db: Session = Depends(get_db),
    current_user: UserSession = Depends(get_current_user),
):
    """
    Returns details of a specific settlement scoped to current organization.
    Returns 404 if not found or if belonging to another organization.
    """
    from fastapi import HTTPException

    settlement = db.scalar(
        select(SettlementDB).where(
            SettlementDB.id == settlement_id,
            SettlementDB.org_id == current_user.org_id,
        )
    )
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found.")

    return {
        "id": settlement.id,
        "org_id": settlement.org_id,
        "utr": settlement.utr,
        "gross_paise": settlement.gross_amount_paise,
        "fee_paise": settlement.fee_amount_paise,
        "tax_paise": settlement.tax_amount_paise,
        "net_paise": settlement.amount_paise,
        "status": settlement.status,
        "settled_at": settlement.settled_at.isoformat() if settlement.settled_at else None,
    }

