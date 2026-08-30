"""
HISAB — Global Omnibox Search Engine API.
Provides instant, multi-entity search across Payments, Orders, Exceptions,
Settlements, Audit Logs, and System Views.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func

from apps.api.dependencies import get_db
from packages.domain.db_models import (
    PaymentDB,
    OrderDB,
    CustomerDB,
    ExceptionDB,
    SettlementDB,
    AuditEntryDB,
)
from packages.domain.money import format_inr

router = APIRouter(prefix="/api/search", tags=["Global Search"])


class SearchResultItem(BaseModel):
    category: str
    id: str
    title: str
    subtitle: str
    badge: Optional[str] = None
    target_tab: str
    target_id: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    total_count: int
    results: List[SearchResultItem]


NAVIGATION_LINKS = [
    {"title": "Executive Dashboard", "subtitle": "High-level KPI metrics & revenue trajectory", "target_tab": "overview", "badge": "Overview"},
    {"title": "Settlement Batch Control Room", "subtitle": "Decomposition & bank line unbundling", "target_tab": "batch-control", "badge": "Batches"},
    {"title": "Exceptions & Approvals", "subtitle": "Maker-Checker inbox & policy exceptions", "target_tab": "exceptions", "badge": "Review"},
    {"title": "Financial Controls Matrix", "subtitle": "7 Continuous invariant assertions & tolerance", "target_tab": "controls", "badge": "Controls"},
    {"title": "Forensic Double-Loss Graph", "subtitle": "Investigate concurrent refund & chargeback vectors", "target_tab": "double-loss", "badge": "Forensics"},
    {"title": "Trace the Money (Evidence Graph)", "subtitle": "Inspect multi-touchpoint provenance DAG", "target_tab": "trace-money", "badge": "Audit"},
    {"title": "Settlement Control Tower", "subtitle": "Real-time bank clearance velocity & UTR matching", "target_tab": "settlement-tower", "badge": "Tower"},
    {"title": "Ask Hisab AI Assistant", "subtitle": "Zero-hallucination natural language queries", "target_tab": "ask-hisab", "badge": "AI"},
    {"title": "Daily Finance Brief", "subtitle": "Automated controller report with variance explanations", "target_tab": "accounting-brief", "badge": "Report"},
    {"title": "Snapshot Diff Engine", "subtitle": "What Changed comparative analysis between runs", "target_tab": "snapshots", "badge": "Snapshots"},
    {"title": "Policy Invariant Simulator", "subtitle": "Test fee schedule and threshold changes", "target_tab": "policy-simulator", "badge": "Simulator"},
    {"title": "Razorpay API & Webhook Rail", "subtitle": "Test Mode sync and webhook ingest", "target_tab": "razorpay-sync", "badge": "Integration"},
]


@router.get("", response_model=SearchResponse)
def search_global(
    q: str = Query(..., min_length=1, description="Search term for omnibox"),
    db: Session = Depends(get_db),
):
    query_str = q.strip()
    q_lower = query_str.lower()
    results: List[SearchResultItem] = []

    payments = db.scalars(
        select(PaymentDB)
        .where(
            or_(
                PaymentDB.id.ilike(f"%{query_str}%"),
                PaymentDB.order_id.ilike(f"%{query_str}%"),
                PaymentDB.method.ilike(f"%{query_str}%"),
                PaymentDB.settlement_id.ilike(f"%{query_str}%"),
            )
        )
        .limit(6)
    ).all()

    for p in payments:
        results.append(
            SearchResultItem(
                category="Payments",
                id=p.id,
                title=f"Payment {p.id}",
                subtitle=f"{format_inr(p.amount_paise)} • {p.method.upper()} • {p.status.upper()} (Order: {p.order_id})",
                badge=p.status.upper(),
                target_tab="trace-money",
                target_id=p.id,
            )
        )

    exceptions = db.scalars(
        select(ExceptionDB)
        .where(
            or_(
                ExceptionDB.id.ilike(f"%{query_str}%"),
                ExceptionDB.category.ilike(f"%{query_str}%"),
                ExceptionDB.severity.ilike(f"%{query_str}%"),
                ExceptionDB.root_cause.ilike(f"%{query_str}%"),
            )
        )
        .limit(5)
    ).all()

    for exc in exceptions:
        target_tab = "double-loss" if "DOUBLE_LOSS" in exc.category else "exceptions"
        results.append(
            SearchResultItem(
                category="Exceptions",
                id=exc.id,
                title=f"{exc.id}: {exc.category}",
                subtitle=f"Impact: {format_inr(exc.financial_impact_paise)} • Severity: {exc.severity}",
                badge=exc.severity,
                target_tab=target_tab,
                target_id=exc.id,
            )
        )

    settlements = db.scalars(
        select(SettlementDB)
        .where(
            or_(
                SettlementDB.id.ilike(f"%{query_str}%"),
                SettlementDB.utr.ilike(f"%{query_str}%"),
            )
        )
        .limit(4)
    ).all()

    for s in settlements:
        results.append(
            SearchResultItem(
                category="Settlements",
                id=s.id,
                title=f"Batch {s.id}",
                subtitle=f"Payout: {format_inr(s.amount_paise)} • UTR: {s.utr or 'Pending'}",
                badge=s.status.upper(),
                target_tab="settlement-tower",
                target_id=s.id,
            )
        )

    orders = db.scalars(
        select(OrderDB)
        .where(
            or_(
                OrderDB.id.ilike(f"%{query_str}%"),
                OrderDB.customer_id.ilike(f"%{query_str}%"),
            )
        )
        .limit(4)
    ).all()

    for ord_item in orders:
        results.append(
            SearchResultItem(
                category="Orders",
                id=ord_item.id,
                title=f"Order {ord_item.id}",
                subtitle=f"{format_inr(ord_item.amount_paise)} • Status: {ord_item.status}",
                badge=ord_item.status.upper(),
                target_tab="batch-control",
                target_id=ord_item.id,
            )
        )

    for nav in NAVIGATION_LINKS:
        if q_lower in nav["title"].lower() or q_lower in nav["subtitle"].lower() or q_lower in nav["badge"].lower():
            results.append(
                SearchResultItem(
                    category="Navigation",
                    id=nav["target_tab"],
                    title=nav["title"],
                    subtitle=nav["subtitle"],
                    badge=nav["badge"],
                    target_tab=nav["target_tab"],
                )
            )

    return SearchResponse(
        query=query_str,
        total_count=len(results),
        results=results[:15],
    )
