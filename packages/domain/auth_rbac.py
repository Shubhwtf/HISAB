"""
HISAB — Authentication, Multi-Tenancy & Role-Based Access Control (RBAC).

Enforces clear domain boundaries across:
1. HISAB Authentication ("Who are you?") -> User (Email, Password, Name)
2. Organization / Tenant ("Which business do you work for?") -> Organization
3. Membership & RBAC ("What is your role & permission in this org?") -> OrganizationMembership & Role
4. Razorpay Connection ("Which Razorpay merchant account is this org authorized for?") -> OrgRazorpayConnection
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple
from pydantic import BaseModel, Field


class Role(str, Enum):
    ADMIN = "ADMIN"
    FINANCE_MANAGER = "FINANCE_MANAGER"
    ANALYST = "ANALYST"
    AUDITOR = "AUDITOR"


class Permission(str, Enum):
    MANAGE_USERS = "manage_users"
    MANAGE_ORGANIZATION = "manage_organization"
    MANAGE_RAZORPAY_CONNECTION = "manage_razorpay_connection"
    MODIFY_SECURITY_SETTINGS = "modify_security_settings"
    MODIFY_CONTROL_POLICIES = "modify_control_policies"

    UPLOAD_FINANCIAL_DATA = "upload_financial_data"
    CREATE_SNAPSHOTS = "create_snapshots"
    RUN_RECONCILIATION = "run_reconciliation"
    INVESTIGATE_EXCEPTIONS = "investigate_exceptions"
    TRACE_MONEY = "trace_money"
    USE_ASK_HISAB = "use_ask_hisab"
    COMPARE_SNAPSHOTS = "compare_snapshots"

    PREPARE_RESOLUTIONS = "prepare_resolutions"
    APPROVE_RESOLUTIONS = "approve_resolutions"
    CLOSE_BATCHES = "close_batches"

    VIEW_FINANCIAL_DATA = "view_financial_data"
    VIEW_CONTROLS = "view_controls"
    VIEW_AUDIT_TRAIL = "view_audit_trail"
    VIEW_BENCHMARKS = "view_benchmarks"
    EXPORT_REPORTS = "export_reports"


ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.ADMIN: set(Permission),
    Role.FINANCE_MANAGER: {
        Permission.VIEW_FINANCIAL_DATA,
        Permission.UPLOAD_FINANCIAL_DATA,
        Permission.CREATE_SNAPSHOTS,
        Permission.RUN_RECONCILIATION,
        Permission.INVESTIGATE_EXCEPTIONS,
        Permission.TRACE_MONEY,
        Permission.USE_ASK_HISAB,
        Permission.COMPARE_SNAPSHOTS,
        Permission.APPROVE_RESOLUTIONS,
        Permission.CLOSE_BATCHES,
        Permission.VIEW_CONTROLS,
        Permission.VIEW_AUDIT_TRAIL,
        Permission.VIEW_BENCHMARKS,
        Permission.EXPORT_REPORTS,
    },
    Role.ANALYST: {
        Permission.VIEW_FINANCIAL_DATA,
        Permission.UPLOAD_FINANCIAL_DATA,
        Permission.CREATE_SNAPSHOTS,
        Permission.RUN_RECONCILIATION,
        Permission.INVESTIGATE_EXCEPTIONS,
        Permission.TRACE_MONEY,
        Permission.USE_ASK_HISAB,
        Permission.COMPARE_SNAPSHOTS,
        Permission.PREPARE_RESOLUTIONS,
        Permission.VIEW_CONTROLS,
        Permission.VIEW_AUDIT_TRAIL,
        Permission.VIEW_BENCHMARKS,
        Permission.EXPORT_REPORTS,
    },
    Role.AUDITOR: {
        Permission.VIEW_FINANCIAL_DATA,
        Permission.INVESTIGATE_EXCEPTIONS,
        Permission.TRACE_MONEY,
        Permission.USE_ASK_HISAB,
        Permission.COMPARE_SNAPSHOTS,
        Permission.VIEW_CONTROLS,
        Permission.VIEW_AUDIT_TRAIL,
        Permission.VIEW_BENCHMARKS,
        Permission.EXPORT_REPORTS,
    },
}


def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Generates PBKDF2 HMAC-SHA256 password hash with salt."""
    if not salt:
        salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return pw_hash, salt


def verify_password(password: str, pw_hash: str, salt: str) -> bool:
    """Verifies candidate password against stored salt and hash."""
    calc_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(calc_hash, pw_hash)


class User(BaseModel):
    id: str
    email: str
    name: str
    pw_hash: str
    pw_salt: str
    is_active: bool = True
    avatar_initials: str = "U"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Organization(BaseModel):
    id: str
    name: str
    org_type: Optional[str] = "E-Commerce / Direct-to-Consumer"
    country: str = "India"
    currency: str = "INR"
    gstin: Optional[str] = None
    owner_user_id: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class OrganizationMembership(BaseModel):
    id: str
    user_id: str
    org_id: str
    role: Role
    status: str = "ACTIVE"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Invitation(BaseModel):
    id: str
    org_id: str
    org_name: str
    email: str
    role: Role
    token: str
    invited_by_name: str
    invited_by_email: str
    expires_at: str
    status: str = "PENDING"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RazorpayConnectionStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    CONNECTION_ERROR = "connection_error"
    TOKEN_EXPIRED = "token_expired"
    REAUTHORIZATION_REQUIRED = "reauthorization_required"


class OrgRazorpayConnection(BaseModel):
    org_id: str
    merchant_id: Optional[str] = "rzp_live_99420"
    merchant_name: Optional[str] = "Nova Commerce Pvt Ltd"
    environment: str = "TEST"
    auth_type: str = "OAUTH"
    status: RazorpayConnectionStatus = RazorpayConnectionStatus.CONNECTED
    masked_client_id: Optional[str] = "rzp_test_K29188••••"
    encrypted_token: Optional[str] = "enc_aes256_99420_secret_demo"
    connected_by_user_id: Optional[str] = None
    connected_by_user_name: Optional[str] = None
    connected_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_connection_test: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_sync_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    sync_frequency: str = "Every 15 minutes"
    data_capabilities: List[str] = ["payments", "settlements", "refunds", "disputes"]


class UserSession(BaseModel):
    token: str
    user_id: str
    email: str
    name: str
    role: Role
    org_id: str
    org_name: str
    is_org_owner: bool = False
    is_razorpay_connected: bool
    connection_status: RazorpayConnectionStatus
    permissions: List[str]
    expires_at: str
    is_demo_session: bool = False


_SAMPLE_SALT = "a1b2c3d4e5f60718293a4b5c6d7e8f90"
_SAMPLE_HASH, _ = hash_password("demo123", _SAMPLE_SALT)

USERS: Dict[str, User] = {
    "usr_admin_01": User(
        id="usr_admin_01",
        email="admin@novacommerce.com",
        name="Finance Controller",
        avatar_initials="FC",
        pw_hash=_SAMPLE_HASH,
        pw_salt=_SAMPLE_SALT,
    ),
    "usr_shubh_admin": User(
        id="usr_shubh_admin",
        email="shubh@test.com",
        name="Shubh",
        avatar_initials="S",
        pw_hash=_SAMPLE_HASH,
        pw_salt=_SAMPLE_SALT,
    ),
    "usr_mgr_02": User(
        id="usr_mgr_02",
        email="manager@novacommerce.com",
        name="Rajesh Gupta",
        avatar_initials="RG",
        pw_hash=_SAMPLE_HASH,
        pw_salt=_SAMPLE_SALT,
    ),
    "usr_ana_03": User(
        id="usr_ana_03",
        email="analyst@novacommerce.com",
        name="Priya Sharma",
        avatar_initials="PS",
        pw_hash=_SAMPLE_HASH,
        pw_salt=_SAMPLE_SALT,
    ),
    "usr_aud_04": User(
        id="usr_aud_04",
        email="auditor@deloitte.com",
        name="Ananya Sen",
        avatar_initials="AS",
        pw_hash=_SAMPLE_HASH,
        pw_salt=_SAMPLE_SALT,
    ),
}

USERS_BY_EMAIL: Dict[str, str] = {u.email.lower(): u.id for u in USERS.values()}

ORGANIZATIONS: Dict[str, Organization] = {
    "org_nova_2026": Organization(
        id="org_nova_2026",
        name="Nova Commerce Pvt Ltd",
        org_type="E-Commerce / Direct-to-Consumer",
        country="India",
        currency="INR",
        gstin="27AABCN8890K1Z9",
        owner_user_id="usr_admin_01",
    ),
    "org_acme_retail": Organization(
        id="org_acme_retail",
        name="Acme Retail India Ltd",
        org_type="Enterprise Retail",
        country="India",
        currency="INR",
        gstin="29AABCA1234F1Z5",
        owner_user_id="usr_admin_01",
    ),
}

MEMBERSHIPS: Dict[str, OrganizationMembership] = {
    "mem_01": OrganizationMembership(
        id="mem_01",
        user_id="usr_admin_01",
        org_id="org_nova_2026",
        role=Role.ADMIN,
        status="ACTIVE",
    ),
    "mem_shubh_01": OrganizationMembership(
        id="mem_shubh_01",
        user_id="usr_shubh_admin",
        org_id="org_nova_2026",
        role=Role.ADMIN,
        status="ACTIVE",
    ),
    "mem_02": OrganizationMembership(
        id="mem_02",
        user_id="usr_mgr_02",
        org_id="org_nova_2026",
        role=Role.FINANCE_MANAGER,
        status="ACTIVE",
    ),
    "mem_03": OrganizationMembership(
        id="mem_03",
        user_id="usr_ana_03",
        org_id="org_nova_2026",
        role=Role.ANALYST,
        status="ACTIVE",
    ),
    "mem_04": OrganizationMembership(
        id="mem_04",
        user_id="usr_aud_04",
        org_id="org_nova_2026",
        role=Role.AUDITOR,
        status="ACTIVE",
    ),
}

INVITATIONS: Dict[str, Invitation] = {}

ORGANIZATION_CONNECTIONS: Dict[str, OrgRazorpayConnection] = {
    "org_nova_2026": OrgRazorpayConnection(
        org_id="org_nova_2026",
        merchant_id="rzp_live_99420",
        merchant_name="Nova Commerce Pvt Ltd",
        environment="TEST",
        status=RazorpayConnectionStatus.CONNECTED,
        connected_by_user_id="usr_admin_01",
        connected_by_user_name="Finance Controller",
    ),
    "org_acme_retail": OrgRazorpayConnection(
        org_id="org_acme_retail",
        merchant_id="rzp_test_acme_001",
        merchant_name="Acme Retail India Ltd",
        environment="TEST",
        status=RazorpayConnectionStatus.DISCONNECTED,
        connected_by_user_id=None,
        connected_by_user_name=None,
    ),
}

ACTIVE_SESSIONS: Dict[str, UserSession] = {}

SEEDED_USERS = {u.email: u for u in USERS.values()}
SEEDED_ORGANIZATIONS = ORGANIZATIONS


def get_user_by_email(email: str, db: Optional[Any] = None) -> Optional[User]:
    clean_email = email.strip().lower()
    if clean_email in ("admin", "admin@test.com", "admin@nova.com"):
        clean_email = "admin@novacommerce.com"
    elif clean_email in ("shubh", "shubh@test.com"):
        clean_email = "shubh@test.com"
    user_id = USERS_BY_EMAIL.get(clean_email)
    if user_id and user_id in USERS:
        return USERS[user_id]
    try:
        from packages.domain.database import SyncSessionLocal
        from packages.domain.db_models import UserDB
        def _check(s):
            return s.query(UserDB).filter(UserDB.email == clean_email).first()
        db_user = _check(db) if db is not None else None
        if db_user is None and db is None:
            with SyncSessionLocal() as s:
                db_user = _check(s)
        if db_user:
            user = User(
                id=db_user.id,
                email=db_user.email,
                name=db_user.name,
                pw_hash=db_user.pw_hash,
                pw_salt=db_user.pw_salt,
                is_active=db_user.is_active,
                avatar_initials=db_user.avatar_initials,
            )
            USERS[db_user.id] = user
            USERS_BY_EMAIL[clean_email] = db_user.id
            return user
    except Exception:
        pass
    return None


def get_organization(org_id: str, db: Optional[Any] = None) -> Optional[Organization]:
    if org_id in ORGANIZATIONS:
        return ORGANIZATIONS[org_id]
    try:
        from packages.domain.database import SyncSessionLocal
        from packages.domain.db_models import OrganizationDB
        def _check(s):
            return s.get(OrganizationDB, org_id)
        db_org = _check(db) if db is not None else None
        if db_org is None and db is None:
            with SyncSessionLocal() as s:
                db_org = _check(s)
        if db_org:
            org = Organization(
                id=db_org.id,
                name=db_org.name,
                org_type=db_org.org_type,
                country=db_org.country,
                currency=db_org.currency,
                gstin=db_org.gstin,
                owner_user_id=db_org.owner_user_id,
            )
            ORGANIZATIONS[org_id] = org
            return org
    except Exception:
        pass
    return None


def get_user_membership(user_id: str, org_id: Optional[str] = None, db: Optional[Any] = None) -> Optional[OrganizationMembership]:
    for mem in MEMBERSHIPS.values():
        if mem.user_id == user_id and mem.status == "ACTIVE":
            if org_id is None or mem.org_id == org_id:
                return mem
    try:
        from packages.domain.database import SyncSessionLocal
        from packages.domain.db_models import OrganizationMemberDB
        def _check(s):
            q = s.query(OrganizationMemberDB).filter(OrganizationMemberDB.user_id == user_id, OrganizationMemberDB.status == "ACTIVE")
            if org_id:
                q = q.filter(OrganizationMemberDB.org_id == org_id)
            return q.first()
        db_mem = _check(db) if db is not None else None
        if db_mem is None and db is None:
            with SyncSessionLocal() as s:
                db_mem = _check(s)
        if db_mem:
            role_enum = Role(db_mem.role) if db_mem.role in Role._value2member_map_ else Role.ADMIN
            mem = OrganizationMembership(
                id=db_mem.id,
                user_id=db_mem.user_id,
                org_id=db_mem.org_id,
                role=role_enum,
                status=db_mem.status,
            )
            MEMBERSHIPS[db_mem.id] = mem
            return mem
    except Exception:
        pass
    return None


def list_user_memberships(user_id: str) -> List[OrganizationMembership]:
    return [m for m in MEMBERSHIPS.values() if m.user_id == user_id and m.status == "ACTIVE"]


def get_org_connection(org_id: str, db: Optional[Any] = None) -> OrgRazorpayConnection:
    """
    Returns organization Razorpay connection, prioritizing live DB state.
    """
    try:
        from packages.domain.database import SyncSessionLocal
        from packages.domain.db_models import OrgRazorpayConnectionDB

        def _check(s):
            return s.get(OrgRazorpayConnectionDB, f"conn_{org_id}") or s.query(OrgRazorpayConnectionDB).filter(OrgRazorpayConnectionDB.org_id == org_id).first()

        db_conn = _check(db) if db is not None else None
        if db_conn is None and db is None:
            with SyncSessionLocal() as s:
                db_conn = _check(s)

        if db_conn:
            is_conn = (db_conn.status == "connected")
            conn_user_name = None
            if db_conn.connected_by_user_id:
                if db_conn.connected_by_user_id in USERS:
                    conn_user_name = USERS[db_conn.connected_by_user_id].name
                else:
                    from packages.domain.db_models import UserDB
                    def _get_u(s):
                        return s.get(UserDB, db_conn.connected_by_user_id)
                    u_rec = _get_u(db) if db is not None else None
                    if u_rec is None and db is None:
                        with SyncSessionLocal() as s:
                            u_rec = _get_u(s)
                    if u_rec:
                        conn_user_name = u_rec.name

            conn = OrgRazorpayConnection(
                org_id=org_id,
                merchant_id=db_conn.merchant_id,
                merchant_name=db_conn.merchant_name,
                environment=db_conn.environment or "TEST",
                status=RazorpayConnectionStatus.CONNECTED if is_conn else RazorpayConnectionStatus.DISCONNECTED,
                masked_client_id=db_conn.masked_client_id,
                encrypted_token=db_conn.encrypted_token,
                connected_by_user_id=db_conn.connected_by_user_id,
                connected_by_user_name=conn_user_name,
                last_sync_at=db_conn.last_sync_at.isoformat() if db_conn.last_sync_at else None,
            )
            ORGANIZATION_CONNECTIONS[org_id] = conn
            return conn
    except Exception:
        pass

    conn = ORGANIZATION_CONNECTIONS.get(org_id)
    if conn is None:
        conn = OrgRazorpayConnection(org_id=org_id, status=RazorpayConnectionStatus.DISCONNECTED)
        ORGANIZATION_CONNECTIONS[org_id] = conn
    return conn


def sync_active_sessions_connection(org_id: str, is_connected: bool):
    """
    Synchronizes connection status across all active user sessions for the organization.
    """
    for sess in ACTIVE_SESSIONS.values():
        if sess.org_id == org_id:
            sess.is_razorpay_connected = is_connected
            sess.connection_status = RazorpayConnectionStatus.CONNECTED if is_connected else RazorpayConnectionStatus.DISCONNECTED


def create_user_session(
    user: User,
    org: Organization,
    conn: OrgRazorpayConnection,
    role: Optional[Role] = None,
    is_demo: bool = False,
) -> UserSession:
    """Generates authenticated session token valid for 24 hours."""
    token = f"hisab_sess_{secrets.token_urlsafe(32)}"
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    
    effective_role = role
    if effective_role is None:
        mem = get_user_membership(user.id, org.id)
        effective_role = mem.role if mem else Role.ANALYST

    permissions = [p.value for p in ROLE_PERMISSIONS.get(effective_role, set())]

    session = UserSession(
        token=token,
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=effective_role,
        org_id=org.id,
        org_name=org.name,
        is_org_owner=(org.owner_user_id == user.id),
        is_razorpay_connected=(conn.status == RazorpayConnectionStatus.CONNECTED),
        connection_status=conn.status,
        permissions=permissions,
        expires_at=expires_at,
        is_demo_session=is_demo,
    )
    ACTIVE_SESSIONS[token] = session
    if conn and org.id:
        ORGANIZATION_CONNECTIONS[org.id] = conn
    try:
        from packages.domain.redis_client import get_redis_client
        r = get_redis_client()
        r.set(f"hisab:session:{token}", session.model_dump_json(), ex=86400)
    except Exception:
        pass
    return session


def check_user_permission(role: Role, permission: Permission) -> bool:
    """Evaluates whether the specified role has the required permission."""
    return permission in ROLE_PERMISSIONS.get(role, set())
