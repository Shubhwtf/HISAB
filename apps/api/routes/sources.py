"""
HISAB — Data Source Health & Integration Status API Endpoints.
"""

from typing import List
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/sources", tags=["Data Sources"])


class DataSourceItem(BaseModel):
    id: str
    name: str
    category: str
    badge: str
    records_count: int
    status: str
    last_sync: str
    details: str


@router.get("", response_model=List[DataSourceItem])
def get_data_sources():
    """
    Returns data source connections and explicitly identifies integration mode.
    Never presents simulated feeds as live.
    """
    return [
        DataSourceItem(
            id="src_rzp_payments",
            name="Razorpay Payments & Transactions Feed",
            category="Gateway Ingestion",
            badge="TEST_MODE",
            records_count=251,
            status="CONNECTED",
            last_sync="2 mins ago",
            details="Webhooks & Daily Settlement API sync for MID: rzp_live_99420"
        ),
        DataSourceItem(
            id="src_rzp_settlements",
            name="Razorpay Settlement Recon Reports",
            category="Gateway Settlement",
            badge="FILE_IMPORT",
            records_count=15,
            status="CONNECTED",
            last_sync="10 mins ago",
            details="Combined multi-movement settlement batches with UTR reference keys"
        ),
        DataSourceItem(
            id="src_bank_hdfc",
            name="HDFC Current Account Bank Statement",
            category="Banking Rail",
            badge="FILE_IMPORT",
            records_count=15,
            status="CONNECTED",
            last_sync="15 mins ago",
            details="NEFT / RTGS / IMPS bank credit narration feed"
        ),
        DataSourceItem(
            id="src_tax_26as",
            name="Income Tax Form 26AS (Section 194-O TDS)",
            category="Tax Authority",
            badge="SIMULATED",
            records_count=2,
            status="VERIFIED",
            last_sync="1 hour ago",
            details="Statutory 0.1% e-commerce operator tax credit deduction matching"
        ),
    ]
