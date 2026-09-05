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


@router.get("/developer-kit")
def get_developer_integration_kit():
    """
    Returns copy-paste snippets and integration configuration so merchants can drop HISAB
    directly into their backend or Razorpay Webhook settings in under 5 minutes without OAuth.
    """
    webhook_url = "http://localhost:8000/api/webhooks/razorpay"
    secret = "hisab_webhook_secret_key_2026"

    curl_snippet = (
        f'curl -X POST "{webhook_url}" \\\n'
        '  -H "Content-Type: application/json" \\\n'
        '  -H "X-Razorpay-Signature: <HMAC_SHA256_HEX>" \\\n'
        '  -H "X-Org-Id: org_nova_2026" \\\n'
        '  -d \'{\n'
        '    "event": "payment.captured",\n'
        '    "payload": {\n'
        '      "payment": {\n'
        '        "entity": {\n'
        '          "id": "pay_live_test_001",\n'
        '          "amount": 7200000,\n'
        '          "currency": "INR",\n'
        '          "status": "captured",\n'
        '          "method": "card",\n'
        '          "bank": "HDFC"\n'
        '        }\n'
        '      }\n'
        '    }\n'
        '  }\''
    )

    node_snippet = (
        '// Node.js Express Middleware\n'
        'const crypto = require("crypto");\n'
        'const express = require("express");\n'
        'const app = express();\n\n'
        f'const HISAB_WEBHOOK_URL = "{webhook_url}";\n'
        f'const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "{secret}";\n\n'
        'app.post("/razorpay-webhook", express.raw({ type: "application/json" }), async (req, res) => {\n'
        '  const signature = req.headers["x-razorpay-signature"];\n'
        '  const expectedSig = crypto\n'
        '    .createHmac("sha256", WEBHOOK_SECRET)\n'
        '    .update(req.body)\n'
        '    .digest("hex");\n\n'
        '  if (signature !== expectedSig) {\n'
        '    return res.status(400).send("Invalid signature");\n'
        '  }\n\n'
        '  // Forward to HISAB Reconciliation Engine in background\n'
        '  fetch(HISAB_WEBHOOK_URL, {\n'
        '    method: "POST",\n'
        '    headers: {\n'
        '      "Content-Type": "application/json",\n'
        '      "X-Razorpay-Signature": signature,\n'
        '      "X-Org-Id": process.env.HISAB_ORG_ID || "org_nova_2026",\n'
        '    },\n'
        '    body: req.body,\n'
        '  }).catch(err => console.error("HISAB Forward error:", err));\n\n'
        '  res.status(200).json({ status: "received" });\n'
        '});'
    )

    python_snippet = (
        '# Python FastAPI / Flask Forwarder\n'
        'import hmac\n'
        'import hashlib\n'
        'import httpx\n'
        'from fastapi import FastAPI, Request, HTTPException\n\n'
        'app = FastAPI()\n'
        f'HISAB_WEBHOOK_URL = "{webhook_url}"\n'
        f'WEBHOOK_SECRET = "{secret}"\n\n'
        '@app.post("/api/razorpay/webhook")\n'
        'async def razorpay_webhook(request: Request):\n'
        '    body = await request.body()\n'
        '    signature = request.headers.get("X-Razorpay-Signature")\n'
        '    expected = hmac.new(WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()\n'
        '    if not hmac.compare_digest(expected, signature or ""):\n'
        '        raise HTTPException(status_code=400, detail="Invalid signature")\n\n'
        '    # Forward asynchronously to HISAB Engine\n'
        '    async with httpx.AsyncClient() as client:\n'
        '        await client.post(\n'
        '            HISAB_WEBHOOK_URL,\n'
        '            content=body,\n'
        '            headers={\n'
        '                "Content-Type": "application/json",\n'
        '                "X-Razorpay-Signature": signature,\n'
        '                "X-Org-Id": "org_nova_2026",\n'
        '            },\n'
        '        )\n'
        '    return {"status": "forwarded_to_hisab"}'
    )

    return {
        "webhook_url": webhook_url,
        "webhook_secret": secret,
        "supported_events": [
            "payment.captured",
            "payment.failed",
            "refund.processed",
            "dispute.created",
            "settlement.processed",
        ],
        "setup_steps": [
            "1. Open your Razorpay Dashboard > Account & Settings > Webhooks.",
            f"2. Click 'Add New Webhook' and set Webhook URL to: {webhook_url}",
            f"3. Set Secret to: {secret}",
            "4. Select events: payment.captured, refund.processed, dispute.created, settlement.processed.",
            "5. Save. HISAB will now autonomously reconcile your payments as they happen!",
        ],
        "snippets": {
            "curl": curl_snippet,
            "nodejs": node_snippet,
            "python": python_snippet,
        }
    }
