"""
HISAB — FastAPI Dependency Injection with Auth, RBAC & Tenant Isolation.
"""

from typing import Generator, List, Optional
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from packages.domain.database import get_sync_db
from packages.domain.auth_rbac import (
    Role,
    Permission,
    UserSession,
    ACTIVE_SESSIONS,
    SEEDED_USERS,
    SEEDED_ORGANIZATIONS,
    ORGANIZATION_CONNECTIONS,
    create_user_session,
    check_user_permission,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a synchronous SQLAlchemy session.
    """
    with get_sync_db() as db:
        yield db


def get_current_user(
    x_session_token: Optional[str] = Header(None, alias="X-Session-Token"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_org_id: Optional[str] = Header(None, alias="X-Org-Id"),
) -> UserSession:
    """
    Validates authenticated user session and returns authoritative organization context.
    Raises 401 Unauthorized for unauthenticated requests.
    Enforces that tenant context (org_id) is derived strictly from validated membership.
    Never trusts client-provided X-Org-Id without verifying user membership.
    """
    from packages.domain.auth_rbac import (
        USERS, 
        ORGANIZATIONS, 
        ORGANIZATION_CONNECTIONS, 
        MEMBERSHIPS, 
        OrgRazorpayConnection, 
        RazorpayConnectionStatus,
        get_user_membership,
        get_organization,
        get_org_connection,
        list_user_memberships,
    )

    session = None
    if x_session_token:
        if x_session_token in ACTIVE_SESSIONS:
            session = ACTIVE_SESSIONS[x_session_token]
        else:
            # Try Redis cache for session rehydration across server restarts
            try:
                from packages.domain.redis_client import get_redis_client
                import json
                r = get_redis_client()
                cached = r.get(f"hisab:session:{x_session_token}")
                if cached:
                    data = json.loads(cached)
                    session = UserSession.model_validate(data)
                    ACTIVE_SESSIONS[x_session_token] = session
            except Exception:
                pass

    if session:
        conn = get_org_connection(session.org_id)
        session.is_razorpay_connected = (conn.status == RazorpayConnectionStatus.CONNECTED)
        session.connection_status = conn.status

        if x_org_id and x_org_id != session.org_id:
            membership = get_user_membership(session.user_id, x_org_id)
            if not membership or membership.status != "ACTIVE":
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied: User is not an active member of organization '{x_org_id}'."
                )
            org = get_organization(x_org_id)
            if not org:
                raise HTTPException(status_code=404, detail="Organization not found.")
            conn = get_org_connection(x_org_id)
            user = USERS.get(session.user_id)
            if not user:
                from packages.domain.auth_rbac import get_user_by_email
                user = get_user_by_email(session.email)
            if not user:
                raise HTTPException(status_code=404, detail="User not found.")
            return create_user_session(user, org, conn, role=membership.role, is_demo=False)
        return session

    if x_session_token and (x_session_token == "hisab_sess_demo_admin_2026" or x_session_token.startswith("hisab_sess_demo")):
        target_role = Role(x_user_role) if x_user_role and x_user_role in Role._value2member_map_ else Role.ADMIN
        user_map = {
            Role.ADMIN: "usr_admin_01",
            Role.FINANCE_MANAGER: "usr_mgr_02",
            Role.ANALYST: "usr_ana_03",
            Role.AUDITOR: "usr_aud_04",
        }
        user_id = user_map.get(target_role, "usr_admin_01")
        user = USERS.get(user_id, USERS["usr_admin_01"])
        org = ORGANIZATIONS["org_nova_2026"]
        conn = ORGANIZATION_CONNECTIONS.get("org_nova_2026", OrgRazorpayConnection(org_id="org_nova_2026"))
        sess = create_user_session(user, org, conn, role=target_role, is_demo=True)
        ACTIVE_SESSIONS[x_session_token] = sess
        return sess

    raise HTTPException(
        status_code=401,
        detail="Authentication required. Please sign in or explore demo mode."
    )


def require_permission(permission: Permission):
    """
    Enforces RBAC permission gate on endpoint.
    Raises 403 Forbidden if user role lacks permission.
    """
    def permission_checker(current_user: UserSession = Depends(get_current_user)):
        if not check_user_permission(current_user.role, permission):
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Role '{current_user.role.value}' does not possess required permission '{permission.value}'."
            )
        return current_user
    return permission_checker


def require_role(allowed_roles: List[Role]):
    """
    Restricts access to specified roles.
    Raises 403 Forbidden if user role is not in allowed_roles.
    """
    def role_checker(current_user: UserSession = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Action restricted to {[r.value for r in allowed_roles]}. Current role: '{current_user.role.value}'."
            )
        return current_user
    return role_checker
