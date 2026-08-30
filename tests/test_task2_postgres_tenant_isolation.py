"""
HISAB — Task 2 Test Suite: PostgreSQL, Alembic Migrations, and Multi-Tenant Isolation.
"""

import pytest
from datetime import datetime, timezone, date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, StaticPool

from apps.api.main import app
from apps.api.dependencies import get_db
from packages.domain.database import (
    normalize_async_db_url,
    normalize_sync_db_url,
    get_engine_args,
    transactional_session,
)
from packages.domain.db_models import (
    Base,
    UserDB,
    OrganizationDB,
    OrganizationMemberDB,
    OrgRazorpayConnectionDB,
    CustomerDB,
    PaymentDB,
    OrderDB,
    SettlementDB,
    ExceptionDB,
    AuditEntryDB,
    BankTransactionDB,
    RefundDB,
    DisputeDB,
    TaxRecordDB,
    BatchDB,
    AgentRunDB,
    SnapshotDB,
    ConversationDB,
)
from packages.domain.auth_rbac import (
    USERS,
    ORGANIZATIONS,
    ORGANIZATION_CONNECTIONS,
    MEMBERSHIPS,
    ACTIVE_SESSIONS,
    UserSession,
    Role,
    User,
    Organization,
    OrganizationMembership,
    OrgRazorpayConnection,
    hash_password,
    create_user_session,
)
from packages.domain.audit_ledger import append_audit_entry, verify_audit_chain


# Setup in-memory test database for multi-tenant isolation testing
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


@pytest.fixture
def seed_two_tenants():
    """Seeds two separate organizations with users, memberships, sessions, and sample records."""
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)

    hash_a, salt_a = hash_password("Pass123!")
    hash_b, salt_b = hash_password("Pass123!")

    # Setup Org A (Tenant 1)
    user_a = UserDB(id="usr_tenant_a", email="owner@tenanta.com", name="Alice", pw_hash=hash_a, pw_salt=salt_a, created_at=now, updated_at=now)
    org_a = OrganizationDB(id="org_tenant_a", name="Tenant A Org", owner_user_id="usr_tenant_a", created_at=now, updated_at=now)
    mem_a = OrganizationMemberDB(id="mem_a", org_id="org_tenant_a", user_id="usr_tenant_a", role="ADMIN", status="ACTIVE", created_at=now)

    # Setup Org B (Tenant 2)
    user_b = UserDB(id="usr_tenant_b", email="owner@tenantb.com", name="Bob", pw_hash=hash_b, pw_salt=salt_b, created_at=now, updated_at=now)
    org_b = OrganizationDB(id="org_tenant_b", name="Tenant B Org", owner_user_id="usr_tenant_b", created_at=now, updated_at=now)
    mem_b = OrganizationMemberDB(id="mem_b", org_id="org_tenant_b", user_id="usr_tenant_b", role="ADMIN", status="ACTIVE", created_at=now)

    db.add_all([user_a, org_a, mem_a, user_b, org_b, mem_b])
    db.flush()

    # Seed data for Org A
    settle_a = SettlementDB(id="setl_tenant_a_001", org_id="org_tenant_a", amount_paise=1000000, gross_amount_paise=1020000, fee_amount_paise=20000, tax_amount_paise=3600, currency="INR", status="settled", utr="UTR_TENANT_A_001", created_at=now)
    exc_a = ExceptionDB(id="exc_tenant_a_001", org_id="org_tenant_a", category="DOUBLE_LOSS", severity="CRITICAL", financial_impact_paise=500000, confidence=0.99, root_cause="Test cause A", recommendation="Test rec A", affected_records=[], evidence={}, status="OPEN", created_at=now)

    # Seed data for Org B
    settle_b = SettlementDB(id="setl_tenant_b_001", org_id="org_tenant_b", amount_paise=2000000, gross_amount_paise=2040000, fee_amount_paise=40000, tax_amount_paise=7200, currency="INR", status="settled", utr="UTR_TENANT_B_001", created_at=now)
    exc_b = ExceptionDB(id="exc_tenant_b_001", org_id="org_tenant_b", category="FEE_MISMATCH", severity="LOW", financial_impact_paise=10000, confidence=0.95, root_cause="Test cause B", recommendation="Test rec B", affected_records=[], evidence={}, status="OPEN", created_at=now)

    db.add_all([settle_a, exc_a, settle_b, exc_b])
    db.commit()

    # Register in in-memory auth structures
    ORGANIZATIONS["org_tenant_a"] = Organization(id="org_tenant_a", name="Tenant A Org", slug="tenant-a", owner_user_id="usr_tenant_a", plan="ENTERPRISE", created_at=now.isoformat())
    ORGANIZATIONS["org_tenant_b"] = Organization(id="org_tenant_b", name="Tenant B Org", slug="tenant-b", owner_user_id="usr_tenant_b", plan="ENTERPRISE", created_at=now.isoformat())
    USERS["usr_tenant_a"] = User(id="usr_tenant_a", email="owner@tenanta.com", name="Alice", pw_hash=hash_a, pw_salt=salt_a, created_at=now.isoformat())
    USERS["usr_tenant_b"] = User(id="usr_tenant_b", email="owner@tenantb.com", name="Bob", pw_hash=hash_b, pw_salt=salt_b, created_at=now.isoformat())
    MEMBERSHIPS["mem_a"] = OrganizationMembership(id="mem_a", org_id="org_tenant_a", user_id="usr_tenant_a", role=Role.ADMIN, status="ACTIVE", created_at=now.isoformat())
    MEMBERSHIPS["mem_b"] = OrganizationMembership(id="mem_b", org_id="org_tenant_b", user_id="usr_tenant_b", role=Role.ADMIN, status="ACTIVE", created_at=now.isoformat())

    conn_a = OrgRazorpayConnection(org_id="org_tenant_a", status="connected")
    conn_b = OrgRazorpayConnection(org_id="org_tenant_b", status="connected")

    sess_a = create_user_session(USERS["usr_tenant_a"], ORGANIZATIONS["org_tenant_a"], conn_a, role=Role.ADMIN, is_demo=False)
    sess_a.token = "sess_tenant_a"
    ACTIVE_SESSIONS["sess_tenant_a"] = sess_a

    sess_b = create_user_session(USERS["usr_tenant_b"], ORGANIZATIONS["org_tenant_b"], conn_b, role=Role.ADMIN, is_demo=False)
    sess_b.token = "sess_tenant_b"
    ACTIVE_SESSIONS["sess_tenant_b"] = sess_b
    return {"db": db, "org_a": org_a, "org_b": org_b}


# ==============================================================================
# 1. POSTGRESQL DRIVER & CONNECTION POOLING CONFIGURATION TESTS
# ==============================================================================

def test_postgresql_url_normalization():
    """Verify that database URLs are properly normalized to asyncpg and psycopg dialects."""
    assert normalize_async_db_url("postgres://user:pass@localhost:5432/hisab") == "postgresql+asyncpg://user:pass@localhost:5432/hisab"
    assert normalize_async_db_url("postgresql://user:pass@localhost:5432/hisab") == "postgresql+asyncpg://user:pass@localhost:5432/hisab"
    assert normalize_async_db_url("postgresql+psycopg://user:pass@localhost:5432/hisab") == "postgresql+asyncpg://user:pass@localhost:5432/hisab"
    assert normalize_async_db_url("sqlite:///test.db") == "sqlite+aiosqlite:///test.db"

    assert normalize_sync_db_url("postgres://user:pass@localhost:5432/hisab") == "postgresql+psycopg://user:pass@localhost:5432/hisab"
    assert normalize_sync_db_url("postgresql://user:pass@localhost:5432/hisab") == "postgresql+psycopg://user:pass@localhost:5432/hisab"
    assert normalize_sync_db_url("postgresql+asyncpg://user:pass@localhost:5432/hisab") == "postgresql+psycopg://user:pass@localhost:5432/hisab"
    assert normalize_sync_db_url("sqlite+aiosqlite:///test.db") == "sqlite:///test.db"


def test_postgresql_pool_configuration():
    """Verify that PostgreSQL engine arguments configure QueuePool with pre-ping and recycling."""
    pg_args = get_engine_args("postgresql+psycopg://user:pass@localhost:5432/hisab")
    assert pg_args["poolclass"] == QueuePool
    assert pg_args["pool_pre_ping"] is True
    assert pg_args["pool_size"] == 10
    assert pg_args["max_overflow"] == 20
    assert pg_args["pool_recycle"] == 1800


# ==============================================================================
# 2. MODEL AUDIT: ALL BUSINESS TABLES MUST HAVE ORG_ID AND INDEXES
# ==============================================================================

def test_all_business_tables_have_org_id():
    """Verify that every business entity model table contains an org_id column with foreign key."""
    expected_scoped_tables = [
        "customers",
        "orders",
        "payments",
        "refunds",
        "disputes",
        "settlements",
        "settlement_lines",
        "bank_transactions",
        "tax_records",
        "batches",
        "exceptions",
        "audit_entries",
        "agent_runs",
        "snapshots",
        "conversations",
        "organization_members",
        "invitations",
        "org_razorpay_connections",
    ]

    for table_name in expected_scoped_tables:
        table = Base.metadata.tables.get(table_name)
        assert table is not None, f"Table '{table_name}' must exist in Base.metadata"
        assert "org_id" in table.columns, f"Table '{table_name}' must have an 'org_id' column for tenant isolation"
        col = table.columns["org_id"]
        assert col.nullable is False, f"Table '{table_name}.org_id' must be NOT NULL"
        fk_targets = [fk.target_fullname for fk in col.foreign_keys]
        assert "organizations.id" in fk_targets, f"Table '{table_name}.org_id' must have Foreign Key to 'organizations.id'"


# ==============================================================================
# 3. MULTI-TENANT ISOLATION: CROSS-TENANT DATA ACCESS DENIAL
# ==============================================================================

def test_multi_tenant_read_isolation(seed_two_tenants):
    """Verify that Tenant A cannot read Tenant B's settlements, exceptions, or audit entries."""
    # Tenant A querying settlements
    res_a_settle = client.get("/api/settlements/tower", headers={"X-Session-Token": "sess_tenant_a"})
    assert res_a_settle.status_code == 200
    timeline_a = res_a_settle.json()["timeline"]
    assert len(timeline_a) == 1
    assert timeline_a[0]["settlement_id"] == "setl_tenant_a_001"

    # Tenant B querying settlements
    res_b_settle = client.get("/api/settlements/tower", headers={"X-Session-Token": "sess_tenant_b"})
    assert res_b_settle.status_code == 200
    timeline_b = res_b_settle.json()["timeline"]
    assert len(timeline_b) == 1
    assert timeline_b[0]["settlement_id"] == "setl_tenant_b_001"

    # Tenant A querying exceptions
    res_a_exc = client.get("/api/controls/exceptions", headers={"X-Session-Token": "sess_tenant_a"})
    assert res_a_exc.status_code == 200
    items_a = res_a_exc.json()["items"]
    assert len(items_a) == 1
    assert items_a[0]["id"] == "exc_tenant_a_001"

    # Tenant B querying exceptions
    res_b_exc = client.get("/api/controls/exceptions", headers={"X-Session-Token": "sess_tenant_b"})
    assert res_b_exc.status_code == 200
    items_b = res_b_exc.json()["items"]
    assert len(items_b) == 1
    assert items_b[0]["id"] == "exc_tenant_b_001"


# ==============================================================================
# 4. RESOURCE-LEVEL DIRECT ID ISOLATION (NO INFORMATION LEAKAGE)
# ==============================================================================

def test_cross_tenant_resource_id_isolation_returns_404(seed_two_tenants):
    """Verify that direct access to foreign tenant resources returns 404 without leaking existence."""
    # Tenant A attempting to access Tenant B's specific settlement by ID
    res_settle = client.get("/api/settlements/setl_tenant_b_001", headers={"X-Session-Token": "sess_tenant_a"})
    assert res_settle.status_code == 404
    assert "Settlement not found" in res_settle.json()["detail"]

    # Tenant A attempting to access Tenant B's exception by ID
    res_exc = client.get("/api/controls/exceptions/exc_tenant_b_001", headers={"X-Session-Token": "sess_tenant_a"})
    assert res_exc.status_code == 404
    assert "Exception record not found" in res_exc.json()["detail"]

    # Tenant A attempting to resolve Tenant B's exception (Write isolation)
    res_resolve = client.post(
        "/api/controls/exceptions/exc_tenant_b_001/resolve",
        headers={"X-Session-Token": "sess_tenant_a"},
        json={"justification": "Malicious resolve attempt", "actor_id": "HACKER", "resolution_type": "MANUAL"}
    )
    assert res_resolve.status_code == 404

    # Tenant A attempting to escalate Tenant B's exception (Write isolation)
    res_escalate = client.post(
        "/api/controls/exceptions/exc_tenant_b_001/escalate",
        headers={"X-Session-Token": "sess_tenant_a"},
        json={"reason": "Malicious escalate attempt", "assigned_to": "HACKER", "actor_id": "HACKER"}
    )
    assert res_escalate.status_code == 404


# ==============================================================================
# 5. TENANT SPOOFING PREVENTION: X-Org-Id HEADER VERIFICATION
# ==============================================================================

def test_tenant_header_spoofing_rejected(seed_two_tenants):
    """Verify that passing an X-Org-Id header for an organization the user is not a member of returns 403."""
    # Alice (sess_tenant_a) attempting to spoof X-Org-Id to org_tenant_b
    res = client.get(
        "/api/settlements/tower",
        headers={
            "X-Session-Token": "sess_tenant_a",
            "X-Org-Id": "org_tenant_b",
        }
    )
    assert res.status_code == 403
    assert "User is not an active member" in res.json()["detail"]


# ==============================================================================
# 6. DATABASE TRANSACTIONS & ROLLBACK INTEGRITY
# ==============================================================================

def test_atomic_transactional_session_rollback():
    """Verify that transactional_session context manager rolls back modifications on exception."""
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)

    # Insert initial customer
    cust = CustomerDB(id="cust_tx_test", org_id="org_nova_2026", name="Initial Customer", email="tx@test.com", contact="+919800011122", created_at=now)
    db.add(cust)
    db.commit()

    # Attempt a transaction that raises an error midway
    with pytest.raises(RuntimeError):
        with transactional_session(db):
            c = db.get(CustomerDB, "cust_tx_test")
            c.name = "Modified Name Within Failing TX"
            raise RuntimeError("Forced simulation error during transaction")

    # Verify rollback: customer name must still be 'Initial Customer'
    db.expire_all()
    c_check = db.get(CustomerDB, "cust_tx_test")
    assert c_check.name == "Initial Customer"


# ==============================================================================
# 7. MULTI-TENANT CRYPTOGRAPHIC AUDIT CHAIN ISOLATION
# ==============================================================================

def test_independent_audit_chains_per_organization():
    """Verify that audit ledgers maintain independent, valid cryptographic hash chains per org."""
    db = TestingSessionLocal()

    # Create entries for Org A
    e1_a = append_audit_entry(
        db=db,
        case_id="case_a_001",
        event_type="BATCH_RECONCILIATION",
        action="RUN",
        policy_result="COMPLETED",
        reason_code="PERIODIC",
        payload={"notes": "Org A recon"},
        org_id="org_tenant_a",
    )
    e2_a = append_audit_entry(
        db=db,
        case_id="case_a_002",
        event_type="EXCEPTION_RESOLUTION",
        action="RESOLVE",
        policy_result="RESOLVED",
        reason_code="MANUAL",
        payload={"notes": "Org A resolve"},
        org_id="org_tenant_a",
    )

    # Create entries for Org B
    e1_b = append_audit_entry(
        db=db,
        case_id="case_b_001",
        event_type="BATCH_RECONCILIATION",
        action="RUN",
        policy_result="COMPLETED",
        reason_code="PERIODIC",
        payload={"notes": "Org B recon"},
        org_id="org_tenant_b",
    )

    # Org A should have sequence 1 and 2
    entries_a = db.scalars(select(AuditEntryDB).where(AuditEntryDB.org_id == "org_tenant_a").order_by(AuditEntryDB.sequence.asc())).all()
    assert len(entries_a) == 2
    assert entries_a[0].sequence == 1
    assert entries_a[1].sequence == 2
    is_valid_a, err_a = verify_audit_chain(list(entries_a))
    assert is_valid_a is True
    assert err_a is None

    # Org B should have its own sequence starting from 1
    entries_b = db.scalars(select(AuditEntryDB).where(AuditEntryDB.org_id == "org_tenant_b").order_by(AuditEntryDB.sequence.asc())).all()
    assert len(entries_b) == 1
    assert entries_b[0].sequence == 1
    is_valid_b, err_b = verify_audit_chain(list(entries_b))
    assert is_valid_b is True
    assert err_b is None
