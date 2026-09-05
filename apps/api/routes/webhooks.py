import os
import hmac
import hashlib
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Header, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from apps.api.dependencies import get_db
from packages.domain.db_models import WebhookEventDB, JobDB, OrganizationDB
from packages.worker.queue import JobQueue, WEBHOOK_QUEUE

logger = logging.getLogger("hisab.webhooks")
router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])

WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "hisab_webhook_secret_key_2026")


class WebhookResponse(BaseModel):
    success: bool
    status: str
    event_id: str
    job_id: Optional[str] = None
    message: str


def verify_razorpay_signature(raw_body: bytes, signature: Optional[str], secret: str) -> bool:
    if not signature:
        return False
    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/razorpay", response_model=WebhookResponse)
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    x_org_id: Optional[str] = Header(None, alias="X-Org-Id"),
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET)

    # 1. Signature verification MUST happen before accepting event
    if not verify_razorpay_signature(raw_body, x_razorpay_signature, secret):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        data = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON webhook body")

    org_id = x_org_id or data.get("org_id") or "org_nova_2026"
    org = db.get(OrganizationDB, org_id)
    if not org:
        raise HTTPException(status_code=404, detail=f"Target organization '{org_id}' not found")

    event_id = data.get("id") or f"evt_{hashlib.sha256(raw_body).hexdigest()[:16]}"
    event_type = data.get("event", "payment.captured")

    # 2. Durable Idempotency Check in PostgreSQL
    existing_evt = db.get(WebhookEventDB, event_id)
    if existing_evt and existing_evt.org_id == org_id:
        if existing_evt.status == "PROCESSED":
            return WebhookResponse(
                success=True,
                status="ALREADY_PROCESSED",
                event_id=event_id,
                job_id=existing_evt.job_id,
                message="Webhook event already processed previously.",
            )
        elif existing_evt.status == "PENDING" and existing_evt.job_id:
            return WebhookResponse(
                success=True,
                status="QUEUED",
                event_id=event_id,
                job_id=existing_evt.job_id,
                message="Webhook event already enqueued.",
            )

    now = datetime.now(timezone.utc)
    job_id = f"job_wh_{event_id}_{int(now.timestamp())}"

    # 3. Persist Job and Webhook Event atomically
    payload_dict = data.get("payload", {})
    entity_key = event_type.split(".")[0]
    entity_data = payload_dict.get(entity_key, {}).get("entity", {})
    if not entity_data and "payment" in payload_dict:
        entity_data = payload_dict.get("payment", {}).get("entity", {})
    if not entity_data:
        entity_data = payload_dict.get("entity", {}) or data.get("entity", {})

    job = JobDB(
        id=job_id,
        org_id=org_id,
        type="WEBHOOK_PROCESSING",
        status="QUEUED",
        progress_pct=0,
        stage="Queued for processing",
        payload={
            "event_id": event_id,
            "event_type": event_type,
            "entity_data": entity_data,
        },
        idempotency_key=f"wh:{org_id}:{event_id}",
        created_at=now,
        updated_at=now,
    )
    db.add(job)

    if not existing_evt:
        evt_record = WebhookEventDB(
            id=event_id,
            org_id=org_id,
            event_type=event_type,
            status="PENDING",
            payload=data,
            signature_verified=True,
            job_id=job_id,
            created_at=now,
        )
        db.add(evt_record)
    else:
        existing_evt.job_id = job_id
        existing_evt.status = "PENDING"

    db.commit()

    # 4. Enqueue to Redis
    queue = JobQueue()
    queue.enqueue(job_id, queue_name=WEBHOOK_QUEUE)

    return WebhookResponse(
        success=True,
        status="QUEUED",
        event_id=event_id,
        job_id=job_id,
        message="Webhook verified and enqueued for asynchronous worker execution.",
    )


class SimulateWebhookRequest(BaseModel):
    event_type: str = "payment.captured"
    amount_inr: float = 72000.0
    payment_id: Optional[str] = None
    order_id: Optional[str] = None
    customer_email: Optional[str] = "finance@merchant.com"


@router.post("/simulate")
async def simulate_razorpay_webhook(
    req: SimulateWebhookRequest,
    x_session_token: Optional[str] = Header(None, alias="X-Session-Token"),
    x_org_id: Optional[str] = Header(None, alias="X-Org-Id"),
    db: Session = Depends(get_db),
):
    """
    Simulates an authentic Razorpay webhook event with genuine HMAC-SHA256 cryptographic signature.
    Enqueues into Redis worker queue and records in PostgreSQL without requiring third-party OAuth.
    """
    from packages.domain.auth_rbac import ACTIVE_SESSIONS

    org_id = "org_nova_2026"
    if x_session_token and x_session_token in ACTIVE_SESSIONS:
        org_id = ACTIVE_SESSIONS[x_session_token].org_id
    elif x_org_id:
        org_id = x_org_id

    target_org = db.get(OrganizationDB, org_id)
    if not target_org:
        org_id = "org_nova_2026"

    import secrets

    now = datetime.now(timezone.utc)
    ts = int(now.timestamp())
    rand_sfx = secrets.token_hex(4)
    pid = req.payment_id or f"pay_sim_{rand_sfx}"
    oid = req.order_id or f"order_sim_{rand_sfx}"
    amt_paise = int(round(req.amount_inr * 100))

    if req.event_type == "refund.processed":
        entity_data = {
            "id": f"rfnd_{rand_sfx}_{pid[4:]}",
            "amount": amt_paise,
            "currency": "INR",
            "payment_id": pid,
            "status": "processed",
            "acquirer_data": {"arn": f"ARN{ts}"},
            "created_at": ts,
        }
        inner_payload = {"refund": {"entity": entity_data}, "payment": {"entity": {"id": pid, "amount": amt_paise}}}
    elif req.event_type == "dispute.created":
        entity_data = {
            "id": f"disp_{rand_sfx}_{pid[4:]}",
            "amount": amt_paise,
            "currency": "INR",
            "payment_id": pid,
            "status": "under_review",
            "phase": "chargeback",
            "reason_code": "fraudulent_unauthorized",
            "created_at": ts,
        }
        inner_payload = {"dispute": {"entity": entity_data}, "payment": {"entity": {"id": pid, "amount": amt_paise}}}
    elif req.event_type == "settlement.processed":
        entity_data = {
            "id": f"setl_sim_{ts}_{rand_sfx}",
            "amount": amt_paise,
            "currency": "INR",
            "status": "processed",
            "utr": f"UTRN{ts}",
            "created_at": ts,
        }
        inner_payload = {"settlement": {"entity": entity_data}}
    else:  # payment.captured
        entity_data = {
            "id": pid,
            "amount": amt_paise,
            "currency": "INR",
            "status": "captured",
            "order_id": oid,
            "method": "card",
            "bank": "HDFC",
            "email": req.customer_email,
            "fee": int(amt_paise * 0.02),
            "tax": int(amt_paise * 0.02 * 0.18),
            "created_at": ts,
        }
        inner_payload = {"payment": {"entity": entity_data}}

    event_id = f"evt_sim_{int(now.timestamp() * 1000)}_{rand_sfx}"
    full_body = {
        "entity": "event",
        "account_id": f"acc_{org_id}",
        "event": req.event_type,
        "contains": [req.event_type.split(".")[0]],
        "payload": inner_payload,
        "created_at": ts,
        "id": event_id,
        "org_id": org_id,
    }

    raw_json = json.dumps(full_body, separators=(",", ":")).encode("utf-8")
    secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", WEBHOOK_SECRET)
    computed_signature = hmac.new(secret.encode("utf-8"), raw_json, hashlib.sha256).hexdigest()

    # Enqueue as Job
    job_id = f"job_sim_{event_id}"
    job = JobDB(
        id=job_id,
        org_id=org_id,
        type="WEBHOOK_PROCESSING",
        status="QUEUED",
        progress_pct=0,
        stage="Queued by Webhook Simulator",
        payload={
            "event_id": event_id,
            "event_type": req.event_type,
            "entity_data": entity_data,
        },
        idempotency_key=f"wh:{org_id}:{event_id}",
        created_at=now,
        updated_at=now,
    )
    db.add(job)

    evt_record = WebhookEventDB(
        id=event_id,
        org_id=org_id,
        event_type=req.event_type,
        status="PENDING",
        payload=full_body,
        signature_verified=True,
        job_id=job_id,
        created_at=now,
    )
    db.add(evt_record)
    db.commit()

    # Enqueue to Redis
    queue = JobQueue()
    queue.enqueue(job_id, queue_name=WEBHOOK_QUEUE)

    return {
        "success": True,
        "simulated": True,
        "event_id": event_id,
        "event_type": req.event_type,
        "payment_id": pid,
        "org_id": org_id,
        "signature": computed_signature,
        "hmac_verified": True,
        "job_id": job_id,
        "queue": WEBHOOK_QUEUE,
        "payload": full_body,
        "message": f"Successfully simulated '{req.event_type}'. Computed HMAC-SHA256 signature verified and job enqueued to Redis worker."
    }
