"""
HISAB — Tier 1 Exact Deterministic Matcher.

Executes exact key and reference matching with 100% confidence.
Establishes baseline deterministic financial relationships.
"""

from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field

from packages.domain.models import Payment, Order, Refund, Dispute, Settlement, BankTransaction


class MatchResult(BaseModel):
    """
    Structured outcome of a matching attempt.
    """
    source_id: str
    target_id: str
    tier: str = Field(default="TIER_1_EXACT", description="TIER_1_EXACT | TIER_2_CONSTRAINT | TIER_3_FUZZY | TIER_4_AI")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    is_matched: bool = True
    match_type: str = Field(description="ORDER_PAYMENT | PAYMENT_REFUND | PAYMENT_DISPUTE | SETTLEMENT_BANK")
    proof_items: List[str] = Field(default_factory=list)
    metadata: Dict[str, str] = Field(default_factory=dict)


def match_payments_to_orders(
    payments: List[Payment],
    orders: List[Order],
) -> Tuple[List[MatchResult], List[Payment]]:
    """
    Matches payments to commercial orders using exact order_id.
    """
    order_map = {o.id: o for o in orders}
    matches: List[MatchResult] = []
    unmatched: List[Payment] = []

    for p in payments:
        if p.order_id and p.order_id in order_map:
            order = order_map[p.order_id]
            amount_matches = (p.amount_paise == order.amount_paise)
            matches.append(MatchResult(
                source_id=order.id,
                target_id=p.id,
                tier="TIER_1_EXACT",
                confidence=1.0 if amount_matches else 0.95,
                match_type="ORDER_PAYMENT",
                proof_items=[
                    f"Exact order_id match: {p.order_id}",
                    f"Amount alignment: Order {order.amount_formatted} vs Payment {p.amount_formatted}",
                ],
                metadata={"order_id": order.id, "payment_id": p.id}
            ))
        else:
            unmatched.append(p)

    return matches, unmatched


def match_refunds_to_payments(
    refunds: List[Refund],
    payments: List[Payment],
) -> Tuple[List[MatchResult], List[Refund]]:
    """
    Matches refunds to parent payments using exact payment_id.
    """
    payment_map = {p.id: p for p in payments}
    matches: List[MatchResult] = []
    unmatched: List[Refund] = []

    for r in refunds:
        if r.payment_id and r.payment_id in payment_map:
            payment = payment_map[r.payment_id]
            instrument_matches = (
                bool(r.source_instrument_ref and payment.instrument_ref)
                and (r.source_instrument_ref.strip() == payment.instrument_ref.strip())
            )
            proofs = [f"Exact payment_id link: {r.payment_id}"]
            if instrument_matches:
                proofs.append(f"Source instrument verified: {r.source_instrument_ref}")
            
            matches.append(MatchResult(
                source_id=payment.id,
                target_id=r.id,
                tier="TIER_1_EXACT",
                confidence=1.0 if (instrument_matches or not r.source_instrument_ref) else 0.90,
                match_type="PAYMENT_REFUND",
                proof_items=proofs,
                metadata={"payment_id": payment.id, "refund_id": r.id}
            ))
        else:
            unmatched.append(r)

    return matches, unmatched


def match_disputes_to_payments(
    disputes: List[Dispute],
    payments: List[Payment],
) -> Tuple[List[MatchResult], List[Dispute]]:
    """
    Matches disputes to parent payments using exact payment_id.
    """
    payment_map = {p.id: p for p in payments}
    matches: List[MatchResult] = []
    unmatched: List[Dispute] = []

    for d in disputes:
        if d.payment_id and d.payment_id in payment_map:
            payment = payment_map[d.payment_id]
            matches.append(MatchResult(
                source_id=payment.id,
                target_id=d.id,
                tier="TIER_1_EXACT",
                confidence=1.0,
                match_type="PAYMENT_DISPUTE",
                proof_items=[
                    f"Exact payment_id link: {d.payment_id}",
                    f"Disputed principal: {d.amount_formatted}",
                    f"Statutory respond_by: {d.respond_by.isoformat() if d.respond_by else 'N/A'}",
                ],
                metadata={"payment_id": payment.id, "dispute_id": d.id}
            ))
        else:
            unmatched.append(d)

    return matches, unmatched


def match_settlements_to_bank_by_utr(
    settlements: List[Settlement],
    bank_transactions: List[BankTransaction],
) -> Tuple[List[MatchResult], List[Settlement], List[BankTransaction]]:
    """
    Matches settlements to bank statement credits via exact UTR reference.
    """
    # Create UTR index for bank credits
    bank_utr_map: Dict[str, BankTransaction] = {}
    for b in bank_transactions:
        if b.direction == "credit" and b.reference:
            cleaned_ref = b.reference.strip().upper()
            bank_utr_map[cleaned_ref] = b

    matches: List[MatchResult] = []
    matched_settlement_ids = set()
    matched_bank_ids = set()

    for s in settlements:
        if not s.utr:
            continue
        cleaned_utr = s.utr.strip().upper()
        if cleaned_utr in bank_utr_map:
            bank_tx = bank_utr_map[cleaned_utr]
            amount_equal = (s.amount_paise == bank_tx.amount_paise)
            proofs = [
                f"Exact UTR match: {s.utr}",
                f"Settlement net: {s.amount_formatted} vs Bank credit: {bank_tx.amount_formatted}",
            ]
            if amount_equal:
                proofs.append("Zero variance between settlement batch and bank credit")
            else:
                proofs.append(f"Discrepancy of {s.amount_paise - bank_tx.amount_paise} paise detected")

            matches.append(MatchResult(
                source_id=s.id,
                target_id=bank_tx.id,
                tier="TIER_1_EXACT",
                confidence=1.0 if amount_equal else 0.85,
                match_type="SETTLEMENT_BANK",
                proof_items=proofs,
                metadata={"settlement_id": s.id, "bank_id": bank_tx.id, "utr": s.utr}
            ))
            matched_settlement_ids.add(s.id)
            matched_bank_ids.add(bank_tx.id)

    unmatched_settlements = [s for s in settlements if s.id not in matched_settlement_ids]
    unmatched_bank = [b for b in bank_transactions if b.id not in matched_bank_ids]

    return matches, unmatched_settlements, unmatched_bank
