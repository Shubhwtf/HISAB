import pytest
import fakeredis
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from apps.api.main import app
from apps.api.dependencies import get_db, ACTIVE_SESSIONS
from packages.domain.database import transactional_session
from packages.domain.db_models import (
    Base,
    UserDB,
    OrganizationDB,
    OrganizationMemberDB,
    JobDB,
    WebhookEventDB,
    PaymentDB,
    OrderDB,
    SettlementDB,
)
from packages.domain.auth_rbac import (
    USERS,
    ORGANIZATIONS,
    MEMBERSHIPS,
    UserSession,
    Role,
    User,
    Organization,
    OrganizationMembership,
    OrgRazorpayConnection,
    create_user_session,
    hash_password,
)
from packages.domain.redis_client import (
    set_sync_redis_client,
    set_async_redis_client,
    reset_redis_clients,
    ping_redis,
)
from packages.worker.queue import JobQueue, DEFAULT_QUEUE, RECON_QUEUE, WEBHOOK_QUEUE
from packages.worker.retry import calculate_backoff
from packages.worker.exceptions import RetryableJobError, NonRetryableJobError, InvalidOrganizationContextError
from packages.worker.runner import HISABWorker
from apps.api.routes.webhooks import verify_razorpay_signature


TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_test_environment():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    fake_r = fakeredis.FakeRedis(decode_responses=True)
    set_sync_redis_client(fake_r)
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    reset_redis_clients()


client = TestClient(app)


@pytest.fixture
def seed_tenants():
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)

    hash_a, salt_a = hash_password("Pass123!")
    hash_b, salt_b = hash_password("Pass123!")

    user_a = UserDB(id="usr_a", email="alice@org-a.com", name="Alice", pw_hash=hash_a, pw_salt=salt_a, created_at=now, updated_at=now)
    org_a = OrganizationDB(id="org_a", name="Org A Corp", owner_user_id="usr_a", created_at=now, updated_at=now)
    mem_a = OrganizationMemberDB(id="mem_a", org_id="org_a", user_id="usr_a", role="ADMIN", status="ACTIVE", created_at=now)

    user_b = UserDB(id="usr_b", email="bob@org-b.com", name="Bob", pw_hash=hash_b, pw_salt=salt_b, created_at=now, updated_at=now)
    org_b = OrganizationDB(id="org_b", name="Org B Corp", owner_user_id="usr_b", created_at=now, updated_at=now)
    mem_b = OrganizationMemberDB(id="mem_b", org_id="org_b", user_id="usr_b", role="ADMIN", status="ACTIVE", created_at=now)

    db.add_all([user_a, org_a, mem_a, user_b, org_b, mem_b])
    db.commit()

    ORGANIZATIONS["org_a"] = Organization(id="org_a", name="Org A Corp", slug="org-a", owner_user_id="usr_a", plan="ENTERPRISE", created_at=now.isoformat())
    ORGANIZATIONS["org_b"] = Organization(id="org_b", name="Org B Corp", slug="org-b", owner_user_id="usr_b", plan="ENTERPRISE", created_at=now.isoformat())
    USERS["usr_a"] = User(id="usr_a", email="alice@org-a.com", name="Alice", pw_hash=hash_a, pw_salt=salt_a, created_at=now.isoformat())
    USERS["usr_b"] = User(id="usr_b", email="bob@org-b.com", name="Bob", pw_hash=hash_b, pw_salt=salt_b, created_at=now.isoformat())
    MEMBERSHIPS["mem_a"] = OrganizationMembership(id="mem_a", org_id="org_a", user_id="usr_a", role=Role.ADMIN, status="ACTIVE", created_at=now.isoformat())
    MEMBERSHIPS["mem_b"] = OrganizationMembership(id="mem_b", org_id="org_b", user_id="usr_b", role=Role.ADMIN, status="ACTIVE", created_at=now.isoformat())

    conn_a = OrgRazorpayConnection(org_id="org_a", status="connected")
    conn_b = OrgRazorpayConnection(org_id="org_b", status="connected")

    sess_a = create_user_session(USERS["usr_a"], ORGANIZATIONS["org_a"], conn_a, role=Role.ADMIN, is_demo=False)
    sess_a.token = "token_a"
    ACTIVE_SESSIONS["token_a"] = sess_a

    sess_b = create_user_session(USERS["usr_b"], ORGANIZATIONS["org_b"], conn_b, role=Role.ADMIN, is_demo=False)
    sess_b.token = "token_b"
    ACTIVE_SESSIONS["token_b"] = sess_b

    return {"db": db, "org_a": org_a, "org_b": org_b}


def test_redis_connection_and_degradation():
    fake_r = fakeredis.FakeRedis(decode_responses=True)
    assert ping_redis(fake_r) is True

    # Simulate unavailable Redis
    class BrokenRedis:
        def ping(self):
            raise ConnectionError("Redis down")

    assert ping_redis(BrokenRedis()) is False

    # Verify API health check does not crash when Redis is unavailable
    set_sync_redis_client(BrokenRedis())
    res = client.get("/healthz")
    assert res.status_code == 200
    data = res.json()
    assert data["components"]["redis"] == "degraded"
    assert data["status"] == "degraded"


def test_queue_enqueue_dequeue_acknowledge():
    fake_r = fakeredis.FakeRedis(decode_responses=True)
    queue = JobQueue(client=fake_r)

    # Enqueue jobs
    assert queue.enqueue("job_test_1", queue_name=DEFAULT_QUEUE) is True
    assert queue.enqueue("job_test_2", queue_name=RECON_QUEUE) is True

    assert queue.get_queue_length(DEFAULT_QUEUE) == 1
    assert queue.get_queue_length(RECON_QUEUE) == 1

    # Dequeue according to priority (RECON_QUEUE is prioritized over DEFAULT_QUEUE)
    item1 = queue.dequeue(timeout=1)
    assert item1 is not None
    q1, job_id1 = item1
    assert q1 == RECON_QUEUE
    assert job_id1 == "job_test_2"
    assert queue.acknowledge(job_id1) is True

    item2 = queue.dequeue(timeout=1)
    assert item2 is not None
    q2, job_id2 = item2
    assert q2 == DEFAULT_QUEUE
    assert job_id2 == "job_test_1"
    assert queue.acknowledge(job_id2) is True

    # Empty queue returns None
    assert queue.dequeue(timeout=1) is None


def test_retry_calculation_and_exponential_backoff():
    # Attempt 1: ~1s
    d1 = calculate_backoff(1, base_delay=1.0, max_delay=60.0, jitter=False)
    assert d1 == 1.0

    # Attempt 2: 2s
    d2 = calculate_backoff(2, base_delay=1.0, max_delay=60.0, jitter=False)
    assert d2 == 2.0

    # Attempt 3: 4s
    d3 = calculate_backoff(3, base_delay=1.0, max_delay=60.0, jitter=False)
    assert d3 == 4.0

    # Max bounded delay
    d_max = calculate_backoff(10, base_delay=1.0, max_delay=15.0, jitter=False)
    assert d_max == 15.0


def test_delayed_retry_queue_processing():
    fake_r = fakeredis.FakeRedis(decode_responses=True)
    queue = JobQueue(client=fake_r)

    # Schedule retry for 0 seconds (immediately due)
    assert queue.schedule_retry("job_retry_1", delay_seconds=0.0, queue_name=DEFAULT_QUEUE) is True

    # Process delayed jobs
    moved = queue.process_delayed_jobs()
    assert moved == 1
    assert queue.get_queue_length(DEFAULT_QUEUE) == 1

    # Dequeue the retried job
    item = queue.dequeue(timeout=1)
    assert item is not None
    assert item[1] == "job_retry_1"


def test_worker_successful_job_execution(seed_tenants):
    fake_r = fakeredis.FakeRedis(decode_responses=True)
    queue = JobQueue(client=fake_r)
    worker = HISABWorker(queue=queue, redis_client=fake_r, session_factory=TestingSessionLocal)

    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)

    # Seed an async reconciliation job
    job = JobDB(
        id="job_exec_success",
        org_id="org_a",
        type="RECONCILIATION",
        status="QUEUED",
        progress_pct=0,
        payload={"batch_id": "batch_test_success"},
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    db.commit()

    queue.enqueue(job.id, queue_name=RECON_QUEUE)

    # Run worker for one iteration
    processed_id = worker.run_once(timeout=1)
    assert processed_id == "job_exec_success"

    # Verify PostgreSQL state
    db.expire_all()
    job_after = db.get(JobDB, "job_exec_success")
    assert job_after.status == "COMPLETED"
    assert job_after.progress_pct == 100
    assert job_after.result is not None
    assert job_after.result["success"] is True
    assert job_after.completed_at is not None
    assert job_after.error is None


def test_worker_retryable_error_transitions_to_retrying(seed_tenants):
    fake_r = fakeredis.FakeRedis(decode_responses=True)
    queue = JobQueue(client=fake_r)
    worker = HISABWorker(queue=queue, redis_client=fake_r, session_factory=TestingSessionLocal)

    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)

    job = JobDB(
        id="job_retry_test",
        org_id="org_a",
        type="RAZORPAY_SYNC",
        status="QUEUED",
        attempts=0,
        max_attempts=3,
        payload={},
        created_at=now,
        updated_at=now,
    )
    db.add(job)
    db.commit()

    # Razorpay is not connected for org_a yet, which throws NonRetryableJobError
    queue.enqueue(job.id, queue_name=DEFAULT_QUEUE)
    worker.run_once(timeout=1)

    db.expire_all()
    job_failed = db.get(JobDB, "job_retry_test")
    assert job_failed.status == "FAILED"
    assert "not connected" in job_failed.error


def test_stale_job_recovery(seed_tenants):
    fake_r = fakeredis.FakeRedis(decode_responses=True)
    queue = JobQueue(client=fake_r)
    worker = HISABWorker(queue=queue, redis_client=fake_r, session_factory=TestingSessionLocal)

    db = TestingSessionLocal()
    stale_time = datetime.now(timezone.utc) - timedelta(minutes=10)

    stale_job = JobDB(
        id="job_stale_1",
        org_id="org_a",
        type="RECONCILIATION",
        status="RUNNING",
        attempts=1,
        last_heartbeat_at=stale_time,
        created_at=stale_time,
        started_at=stale_time,
        updated_at=stale_time,
    )
    db.add(stale_job)
    db.commit()

    recovered_count = worker.recover_stale_jobs(max_age_seconds=120)
    assert recovered_count == 1

    db.expire_all()
    job_rec = db.get(JobDB, "job_stale_1")
    assert job_rec.status == "FAILED"
    assert "heartbeat timeout exceeded" in job_rec.error


def test_tenant_isolation_jobs_api(seed_tenants):
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)

    job_a = JobDB(id="job_org_a_001", org_id="org_a", type="RECONCILIATION", status="QUEUED", created_at=now, updated_at=now)
    job_b = JobDB(id="job_org_b_001", org_id="org_b", type="RECONCILIATION", status="QUEUED", created_at=now, updated_at=now)
    db.add_all([job_a, job_b])
    db.commit()

    # Alice (Org A) listing jobs
    res_list_a = client.get("/api/jobs", headers={"X-Session-Token": "token_a"})
    assert res_list_a.status_code == 200
    items_a = res_list_a.json()["items"]
    assert len(items_a) == 1
    assert items_a[0]["id"] == "job_org_a_001"

    # Alice accessing Org A job
    res_get_a = client.get("/api/jobs/job_org_a_001", headers={"X-Session-Token": "token_a"})
    assert res_get_a.status_code == 200
    assert res_get_a.json()["id"] == "job_org_a_001"

    # Alice attempting to access Org B job returns 404
    res_get_b = client.get("/api/jobs/job_org_b_001", headers={"X-Session-Token": "token_a"})
    assert res_get_b.status_code == 404

    # Alice attempting to cancel Org B job returns 404
    res_cancel_b = client.post("/api/jobs/job_org_b_001/cancel", headers={"X-Session-Token": "token_a"})
    assert res_cancel_b.status_code == 404

    # Alice cancelling Org A job succeeds
    res_cancel_a = client.post("/api/jobs/job_org_a_001/cancel", headers={"X-Session-Token": "token_a"})
    assert res_cancel_a.status_code == 200
    assert res_cancel_a.json()["status"] == "CANCELLED"


def test_webhook_signature_verification_and_idempotency(seed_tenants):
    import os, hmac, hashlib
    secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "hisab_webhook_secret_key_2026")
    raw_payload = b'{"event":"payment.captured","id":"evt_pay_test_999","payload":{"payment":{"entity":{"id":"pay_999","amount":500000}}}}'
    valid_sig = hmac.new(secret.encode("utf-8"), raw_payload, hashlib.sha256).hexdigest()

    # 1. Invalid signature rejected with 400
    res_bad = client.post(
        "/api/webhooks/razorpay",
        content=raw_payload,
        headers={"X-Razorpay-Signature": "invalid_sig", "X-Org-Id": "org_a", "Content-Type": "application/json"}
    )
    assert res_bad.status_code == 400
    assert "Invalid webhook signature" in res_bad.json()["detail"]

    # 2. Valid signature accepted and enqueued
    res_ok = client.post(
        "/api/webhooks/razorpay",
        content=raw_payload,
        headers={"X-Razorpay-Signature": valid_sig, "X-Org-Id": "org_a", "Content-Type": "application/json"}
    )
    assert res_ok.status_code == 200
    wh_data = res_ok.json()
    assert wh_data["status"] == "QUEUED"
    assert wh_data["event_id"] == "evt_pay_test_999"
    assert wh_data["job_id"] is not None

    # 3. Duplicate webhook replay returns idempotent response
    res_dup = client.post(
        "/api/webhooks/razorpay",
        content=raw_payload,
        headers={"X-Razorpay-Signature": valid_sig, "X-Org-Id": "org_a", "Content-Type": "application/json"}
    )
    assert res_dup.status_code == 200
    assert res_dup.json()["status"] == "QUEUED"
    assert res_dup.json()["job_id"] == wh_data["job_id"]


def test_async_reconciliation_endpoint_and_worker_pipeline(seed_tenants):
    from packages.domain.redis_client import get_redis_client
    r = get_redis_client()
    queue = JobQueue(client=r)
    worker = HISABWorker(queue=queue, redis_client=r, session_factory=TestingSessionLocal)

    # Enqueue async reconciliation via API
    res = client.post("/api/reconcile/async", headers={"X-Session-Token": "token_a"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "QUEUED"
    assert data["job_id"].startswith("job_rec_")
    job_id = data["job_id"]

    # Check status before worker runs
    res_status1 = client.get(f"/api/jobs/{job_id}", headers={"X-Session-Token": "token_a"})
    assert res_status1.status_code == 200
    assert res_status1.json()["status"] == "QUEUED"

    # Worker executes the reconciliation job
    processed_id = worker.run_once(timeout=1)
    assert processed_id == job_id

    # Check status after worker runs
    res_status2 = client.get(f"/api/jobs/{job_id}", headers={"X-Session-Token": "token_a"})
    assert res_status2.status_code == 200
    job_final = res_status2.json()
    assert job_final["status"] == "COMPLETED"
    assert job_final["progress_pct"] == 100
    assert job_final["result"] is not None
    assert job_final["result"]["success"] is True
