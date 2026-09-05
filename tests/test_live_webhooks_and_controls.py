import os
import hmac
import hashlib
import fakeredis
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from apps.api.main import app
from apps.api.dependencies import get_db, ACTIVE_SESSIONS
from packages.domain.db_models import (
    Base,
    OrganizationDB,
    UserDB,
    CustomerDB,
    OrderDB,
    PaymentDB,
    RefundDB,
    DisputeDB,
    SettlementDB,
    ExceptionDB,
    WebhookEventDB,
)
from packages.domain.auth_rbac import (
    User,
    Organization,
    Role,
    create_user_session,
    hash_password,
    USERS,
    ORGANIZATIONS,
    MEMBERSHIPS,
    OrganizationMembership,
    OrgRazorpayConnection,
)
from packages.domain.redis_client import set_sync_redis_client
from packages.worker.queue import JobQueue, WEBHOOK_QUEUE
from packages.worker.runner import HISABWorker
from packages.domain.crypto_utils import (
    encrypt_credential,
    decrypt_credential,
    mask_key_id,
    hash_credential,
    verify_credential_hash,
)

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

    # Seed two distinct organizations
    db = TestingSessionLocal()
    org1 = OrganizationDB(id="org_alpha", name="Alpha Retails", owner_user_id="usr_alpha_1")
    org2 = OrganizationDB(id="org_beta", name="Beta Tech", owner_user_id="usr_beta_1")
    db.add_all([org1, org2])
    db.commit()

    u1 = User(id="usr_alpha_1", email="admin@alpha.com", name="Alpha Admin", pw_hash="x", pw_salt="y")
    u2 = User(id="usr_beta_1", email="admin@beta.com", name="Beta Admin", pw_hash="x", pw_salt="y")
    USERS["usr_alpha_1"] = u1
    USERS["usr_beta_1"] = u2
    ORGANIZATIONS["org_alpha"] = Organization(id="org_alpha", name="Alpha Retails", owner_user_id="usr_alpha_1")
    ORGANIZATIONS["org_beta"] = Organization(id="org_beta", name="Beta Tech", owner_user_id="usr_beta_1")
    MEMBERSHIPS["mem_a"] = OrganizationMembership(id="mem_a", user_id="usr_alpha_1", org_id="org_alpha", role=Role.ADMIN)
    MEMBERSHIPS["mem_b"] = OrganizationMembership(id="mem_b", user_id="usr_beta_1", org_id="org_beta", role=Role.ADMIN)

    s1 = create_user_session(u1, ORGANIZATIONS["org_alpha"], OrgRazorpayConnection(org_id="org_alpha"), role=Role.ADMIN)
    s2 = create_user_session(u2, ORGANIZATIONS["org_beta"], OrgRazorpayConnection(org_id="org_beta"), role=Role.ADMIN)
    ACTIVE_SESSIONS["token_alpha"] = s1
    ACTIVE_SESSIONS["token_beta"] = s2

    yield db
    db.close()
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def test_crypto_vault_aes_and_pbkdf2():
    secret = "sk_live_very_secret_key_12345678"
    enc = encrypt_credential(secret)
    assert enc != secret
    dec = decrypt_credential(enc)
    assert dec == secret

    # Masking test
    assert mask_key_id("rzp_test_1DP5mmOlF5G5ag") == "rzp_test_1••••"
    assert mask_key_id(None) == "Not Configured"

    # PBKDF2 hash verification
    pw = "super_secure_password"
    pw_hash, salt = hash_credential(pw)
    assert verify_credential_hash(pw, pw_hash, salt) is True
    assert verify_credential_hash("wrong_password", pw_hash, salt) is False


def test_webhook_simulator_and_worker_pipeline():
    from packages.domain.redis_client import get_redis_client
    r = get_redis_client()
    queue = JobQueue(client=r)
    worker = HISABWorker(queue=queue, redis_client=r, session_factory=TestingSessionLocal)

    res = client.post(
        "/api/webhooks/simulate",
        json={
            "event_type": "payment.captured",
            "amount_inr": 1500.0,
            "payment_id": "pay_test_abc_01",
        },
        headers={"X-Session-Token": "token_alpha"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["org_id"] == "org_alpha"
    assert data["hmac_verified"] is True
    assert data["payment_id"] == "pay_test_abc_01"

    # Worker executes the simulated webhook
    processed_id = worker.run_once(timeout=1)
    assert processed_id == data["job_id"]

    # Verify state in database
    db = TestingSessionLocal()
    pay_rec = db.get(PaymentDB, "pay_test_abc_01")
    assert pay_rec is not None
    assert pay_rec.org_id == "org_alpha"
    assert pay_rec.amount_paise == 150000
    assert pay_rec.status == "captured"

    evt_rec = db.get(WebhookEventDB, data["event_id"])
    assert evt_rec is not None
    assert evt_rec.status == "PROCESSED"
    db.close()


def test_webhook_double_loss_and_defense_pack():
    from packages.domain.redis_client import get_redis_client
    r = get_redis_client()
    queue = JobQueue(client=r)
    worker = HISABWorker(queue=queue, redis_client=r, session_factory=TestingSessionLocal)

    # 1. Simulate payment.captured
    client.post(
        "/api/webhooks/simulate",
        json={"event_type": "payment.captured", "amount_inr": 25000.0, "payment_id": "pay_dbl_99"},
        headers={"X-Session-Token": "token_alpha"},
    )
    worker.run_once(timeout=1)

    # 2. Simulate refund.processed
    client.post(
        "/api/webhooks/simulate",
        json={"event_type": "refund.processed", "amount_inr": 25000.0, "payment_id": "pay_dbl_99"},
        headers={"X-Session-Token": "token_alpha"},
    )
    worker.run_once(timeout=1)

    # 3. Simulate dispute.created on the refunded payment -> Triggers Double Loss
    client.post(
        "/api/webhooks/simulate",
        json={"event_type": "dispute.created", "amount_inr": 25000.0, "payment_id": "pay_dbl_99"},
        headers={"X-Session-Token": "token_alpha"},
    )
    worker.run_once(timeout=1)

    # Verify ExceptionDB was flagged with DOUBLE_LOSS_RISK
    db = TestingSessionLocal()
    exc = db.get(ExceptionDB, "exc_dbl_pay_dbl_99")
    assert exc is not None
    assert exc.category == "DOUBLE_LOSS_RISK"
    assert exc.severity == "CRITICAL"
    assert exc.financial_impact_paise == 2500000
    db.close()

    # 4. Generate Bank Defense Pack
    pack_res = client.get(
        "/api/controls/defense-pack/pay_dbl_99",
        headers={"X-Session-Token": "token_alpha"},
    )
    assert pack_res.status_code == 200
    pack = pack_res.json()
    assert pack["payment_id"] == "pay_dbl_99"
    assert pack["merchant"]["org_id"] == "org_alpha"
    assert len(pack["evidence_timeline"]) == 5
    assert pack["cryptographic_merkle_seal"]["tamper_proof"] is True
    assert len(pack["cryptographic_merkle_seal"]["proof_hash"]) == 64


def test_defense_pack_strict_tenant_isolation():
    # org_alpha creates a payment
    db = TestingSessionLocal()
    cust = CustomerDB(id="cust_alpha_1", org_id="org_alpha", name="Alpha Customer", email="c@alpha.com", contact="+919876543210")
    order = OrderDB(id="ord_alpha_1", org_id="org_alpha", customer_id="cust_alpha_1", amount_paise=50000)
    db.add_all([cust, order])
    pay = PaymentDB(
        id="pay_secret_alpha",
        org_id="org_alpha",
        order_id="ord_alpha_1",
        customer_id="cust_alpha_1",
        amount_paise=50000,
        fee_paise=1000,
        tax_paise=180,
        net_paise=48820,
        currency="INR",
        method="card",
        status="captured",
    )
    db.add(pay)
    db.commit()
    db.close()

    # org_beta user attempts to access org_alpha's payment defense pack -> 404 forbidden/isolated
    res = client.get(
        "/api/controls/defense-pack/pay_secret_alpha",
        headers={"X-Session-Token": "token_beta"},
    )
    assert res.status_code == 404
    assert res.json()["detail"] == "Payment record not found."


def test_accounting_export_balance():
    # Seed payments for org_alpha
    db = TestingSessionLocal()
    cust = CustomerDB(id="cust_export_1", org_id="org_alpha", name="Alpha Export Customer", email="exp@alpha.com", contact="+919876543210")
    order = OrderDB(id="ord_export_1", org_id="org_alpha", customer_id="cust_export_1", amount_paise=100000)
    db.add_all([cust, order])
    pay = PaymentDB(
        id="pay_export_01",
        org_id="org_alpha",
        order_id="ord_export_1",
        customer_id="cust_export_1",
        amount_paise=100000,  # ₹1,000.00
        fee_paise=2000,       # ₹20.00
        tax_paise=360,        # ₹3.60
        net_paise=97640,
        currency="INR",
        method="card",
        status="captured",
    )
    db.add(pay)
    db.commit()
    db.close()

    # 1. Tally XML Export
    tally_res = client.get(
        "/api/accounting/export-tally-xml",
        headers={"X-Session-Token": "token_alpha"},
    )
    assert tally_res.status_code == 200
    assert tally_res.headers["content-type"] == "application/xml"
    assert "<TALLYREQUEST>Import Data</TALLYREQUEST>" in tally_res.text
    assert "<SVCURRENTCOMPANY>Alpha Retails</SVCURRENTCOMPANY>" in tally_res.text

    # 2. Zoho Books CSV Export
    zoho_res = client.get(
        "/api/accounting/export-zoho-csv",
        headers={"X-Session-Token": "token_alpha"},
    )
    assert zoho_res.status_code == 200
    assert "text/csv" in zoho_res.headers["content-type"]
    lines = zoho_res.text.strip().split("\n")
    # Date,Journal Number,Reference Number,Notes,Account,Debit,Credit
    assert len(lines) == 7
    total_debit = 0.0
    total_credit = 0.0
    for line in lines[1:]:
        parts = line.split(",")
        total_debit += float(parts[5])
        total_credit += float(parts[6])
    assert round(total_debit, 2) == round(total_credit, 2)
