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
            "entity_data": data.get("payload", {}).get("payment", {}).get("entity", {}),
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
