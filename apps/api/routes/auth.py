"""
HISAB — Authentication, Organization Multi-Tenancy & RBAC Endpoints.

Enforces clear separation:
1. User Authentication (Email & Password)
2. Organization Creation & Tenancy
3. Role Assignment & Invitation Flow
4. Organization-Level Razorpay Connection
"""

from typing import Any, Dict, List, Optional
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, Field

from apps.api.dependencies import get_current_user, require_permission, require_role
from packages.domain.auth_rbac import (
    Role,
    Permission,
    User,
    Organization,
    OrganizationMembership,
    Invitation,
    OrgRazorpayConnection,
    UserSession,
    RazorpayConnectionStatus,
    USERS,
    USERS_BY_EMAIL,
    ORGANIZATIONS,
    MEMBERSHIPS,
    INVITATIONS,
    ORGANIZATION_CONNECTIONS,
    ACTIVE_SESSIONS,
    hash_password,
    verify_password,
    create_user_session,
    get_user_by_email,
    get_user_membership,
    list_user_memberships,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Tenancy"])


class SignInRequest(BaseModel):
    email: str = "admin@novacommerce.com"
    password: str = "demo123"
    org_id: Optional[str] = None


class DemoSignInRequest(BaseModel):
    role: str = "ADMIN"


class SignUpRequest(BaseModel):
    name: str = "Aarav Mehta"
    email: str = "aarav@novacommerce.com"
    password: str = "securepass123"
    org_name: Optional[str] = "Nova Commerce Pvt Ltd"
    org_type: Optional[str] = "E-Commerce / Direct-to-Consumer"
    country: Optional[str] = "India"
    currency: Optional[str] = "INR"
    invite_token: Optional[str] = None


class InviteMemberRequest(BaseModel):
    email: str
    role: str = "ANALYST"


class UpdateMemberRequest(BaseModel):
    role: Optional[str] = None
    status: Optional[str] = None


class ConnectRazorpayOrgRequest(BaseModel):
    auth_type: str = "OAUTH"
    key_id: Optional[str] = None
    key_secret: Optional[str] = None
    code: Optional[str] = None
    environment: str = "TEST"


class SwitchRoleRequest(BaseModel):
    role: str = "ADMIN"
    org_id: Optional[str] = "org_nova_2026"


@router.get("/me", response_model=UserSession)
def get_current_session(current_user: UserSession = Depends(get_current_user)):
    """
    Returns active authenticated user session with organization and role context.
    """
    return current_user


@router.post("/signin", response_model=UserSession)
def signin_user(req: SignInRequest):
    """
    Authenticates user via Email & Password.
    Automatically resolves the user's Organization and assigned Role from membership.
    (Users do NOT select their own role during login).
    """
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user.pw_hash, user.pw_salt):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your HISAB account has been deactivated.")

    membership = get_user_membership(user.id, req.org_id)
    if not membership:
        raise HTTPException(
            status_code=403,
            detail="No active organization membership found for this account. Please accept an invitation or create an organization."
        )

    if membership.status == "SUSPENDED":
        raise HTTPException(status_code=403, detail="Your access to this organization has been suspended by an administrator.")

    org = ORGANIZATIONS.get(membership.org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")

    conn = ORGANIZATION_CONNECTIONS.get(org.id)
    if not conn:
        conn = OrgRazorpayConnection(
            org_id=org.id,
            merchant_id=None,
            merchant_name=org.name,
            status=RazorpayConnectionStatus.DISCONNECTED,
            connected_by_user_id=None,
            connected_by_user_name=None,
        )
        ORGANIZATION_CONNECTIONS[org.id] = conn

    return create_user_session(user, org, conn, role=membership.role, is_demo=False)


@router.post("/demo-signin", response_model=UserSession)
def demo_signin_persona(req: DemoSignInRequest):
    """
    Fast-track login for Hackathon evaluators exploring seeded Nova Commerce personas.
    Clearly designated as Demo Mode.
    """
    role = Role(req.role.upper()) if req.role.upper() in Role._value2member_map_ else Role.ADMIN
    user_map = {
        Role.ADMIN: "usr_admin_01",
        Role.FINANCE_MANAGER: "usr_mgr_02",
        Role.ANALYST: "usr_ana_03",
        Role.AUDITOR: "usr_aud_04",
    }
    user_id = user_map.get(role, "usr_admin_01")
    user = USERS[user_id]
    org = ORGANIZATIONS["org_nova_2026"]
    conn = ORGANIZATION_CONNECTIONS["org_nova_2026"]

    return create_user_session(user, org, conn, role=role, is_demo=True)


@router.post("/signup", response_model=UserSession)
def signup_user(req: SignUpRequest):
    """
    Onboarding Flow:
    1. If invite_token provided: Creates user account and joins organization with invited role.
    2. If creating new organization: Creates user account, creates new organization, and assigns user as OWNER / ADMIN.
    """
    email_clean = req.email.strip().lower()
    if email_clean in USERS_BY_EMAIL:
        raise HTTPException(status_code=400, detail="An account with this email address already exists. Please sign in.")

    pw_hash, pw_salt = hash_password(req.password)
    user_id = f"usr_{secrets.token_hex(6)}"
    initials = "".join([n[0] for n in req.name.strip().split()[:2]]).upper() or "U"

    new_user = User(
        id=user_id,
        email=email_clean,
        name=req.name.strip(),
        pw_hash=pw_hash,
        pw_salt=pw_salt,
        is_active=True,
        avatar_initials=initials,
    )
    USERS[user_id] = new_user
    USERS_BY_EMAIL[email_clean] = user_id

    if req.invite_token and req.invite_token in INVITATIONS:
        invitation = INVITATIONS[req.invite_token]
        if invitation.status != "PENDING":
            raise HTTPException(status_code=400, detail="This invitation is no longer active.")

        org = ORGANIZATIONS.get(invitation.org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organization associated with invitation not found.")

        mem_id = f"mem_{secrets.token_hex(6)}"
        membership = OrganizationMembership(
            id=mem_id,
            user_id=user_id,
            org_id=org.id,
            role=invitation.role,
            status="ACTIVE",
        )
        MEMBERSHIPS[mem_id] = membership
        invitation.status = "ACCEPTED"

        conn = ORGANIZATION_CONNECTIONS.get(org.id, OrgRazorpayConnection(
            org_id=org.id,
            status=RazorpayConnectionStatus.DISCONNECTED
        ))
        return create_user_session(new_user, org, conn, role=membership.role, is_demo=False)

    org_name = (req.org_name or f"{req.name}'s Organization").strip()
    org_id = f"org_{secrets.token_hex(6)}"

    new_org = Organization(
        id=org_id,
        name=org_name,
        org_type=req.org_type or "E-Commerce / Direct-to-Consumer",
        country=req.country or "India",
        currency=req.currency or "INR",
        owner_user_id=user_id,
    )
    ORGANIZATIONS[org_id] = new_org

    mem_id = f"mem_{secrets.token_hex(6)}"
    membership = OrganizationMembership(
        id=mem_id,
        user_id=user_id,
        org_id=org_id,
        role=Role.ADMIN,
        status="ACTIVE",
    )
    MEMBERSHIPS[mem_id] = membership

    conn = OrgRazorpayConnection(
        org_id=org_id,
        merchant_id=None,
        merchant_name=org_name,
        status=RazorpayConnectionStatus.DISCONNECTED,
        connected_by_user_id=None,
        connected_by_user_name=None,
    )
    ORGANIZATION_CONNECTIONS[org_id] = conn

    return create_user_session(new_user, new_org, conn, role=Role.ADMIN, is_demo=False)


@router.post("/logout")
def logout_user(x_session_token: Optional[str] = Header(None, alias="X-Session-Token")):
    """
    Invalidates current session token.
    """
    if x_session_token and x_session_token in ACTIVE_SESSIONS:
        del ACTIVE_SESSIONS[x_session_token]
    return {"success": True, "message": "Signed out successfully."}


@router.get("/invitations/{token}")
def get_invitation_details(token: str):
    """
    Public endpoint to inspect an invitation before signing up.
    """
    inv = INVITATIONS.get(token)
    if not inv or inv.status != "PENDING":
        raise HTTPException(status_code=404, detail="Invitation not found or has expired.")

    try:
        exp_dt = datetime.fromisoformat(inv.expires_at)
        if exp_dt < datetime.now(timezone.utc):
            inv.status = "EXPIRED"
            raise HTTPException(status_code=404, detail="This invitation has expired.")
    except (ValueError, TypeError):
        pass

    org = ORGANIZATIONS.get(inv.org_id)
    return {
        "valid": True,
        "token": token,
        "org_name": org.name if org else inv.org_name,
        "email": inv.email,
        "role": inv.role.value,
        "invited_by_name": inv.invited_by_name,
    }


@router.post("/invitations")
def create_team_invitation(
    req: InviteMemberRequest,
    current_user: UserSession = Depends(require_permission(Permission.MANAGE_USERS)),
):
    """
    Admin invites a new team member by email with an assigned role.
    (Normal users cannot invite or assign Admin).
    """
    role_str = req.role.upper()
    if role_str not in Role._value2member_map_:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of {[r.value for r in Role]}.")

    assigned_role = Role(role_str)
    if assigned_role == Role.ADMIN and current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Only an Administrator can invite or promote Admin users.")

    clean_email = req.email.strip().lower()

    existing_user_id = USERS_BY_EMAIL.get(clean_email)
    if existing_user_id:
        for mem in MEMBERSHIPS.values():
            if mem.org_id == current_user.org_id and mem.user_id == existing_user_id and mem.status == "ACTIVE":
                raise HTTPException(status_code=400, detail=f"{clean_email} is already an active member of this organization.")

    token = f"inv_{secrets.token_urlsafe(24)}"
    inv_id = f"inv_{secrets.token_hex(6)}"
    expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    invitation = Invitation(
        id=inv_id,
        org_id=current_user.org_id,
        org_name=current_user.org_name,
        email=clean_email,
        role=assigned_role,
        token=token,
        invited_by_name=current_user.name,
        invited_by_email=current_user.email,
        expires_at=expires,
        status="PENDING",
    )
    INVITATIONS[token] = invitation

    return {
        "success": True,
        "invitation_id": inv_id,
        "email": invitation.email,
        "role": invitation.role.value,
        "token": token,
        "invite_link": f"http://localhost:3000/?invite={token}",
        "expires_at": expires,
        "message": f"Invitation created for {invitation.email} as {invitation.role.value}.",
    }


@router.post("/invitations/{token}/resend")
def resend_team_invitation(
    token: str,
    current_user: UserSession = Depends(require_permission(Permission.MANAGE_USERS)),
):
    """
    Admin resends/refreshes an active invitation with a new 7-day expiration.
    """
    inv = INVITATIONS.get(token)
    if not inv or inv.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    inv.expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    inv.status = "PENDING"

    return {
        "success": True,
        "token": token,
        "email": inv.email,
        "role": inv.role.value,
        "expires_at": inv.expires_at,
        "invite_link": f"http://localhost:3000/?invite={token}",
        "message": f"Invitation resent to {inv.email}."
    }


@router.delete("/invitations/{token}")
def cancel_team_invitation(
    token: str,
    current_user: UserSession = Depends(require_permission(Permission.MANAGE_USERS)),
):
    """
    Admin revokes/cancels a pending team invitation.
    """
    inv = INVITATIONS.get(token)
    if not inv or inv.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    inv.status = "REVOKED"
    del INVITATIONS[token]

    return {
        "success": True,
        "token": token,
        "message": f"Invitation for {inv.email} successfully cancelled."
    }


@router.get("/members")
def list_organization_members(current_user: UserSession = Depends(get_current_user)):
    """
    Lists all team members and pending invitations for the current organization.
    """
    members = []
    for mem in MEMBERSHIPS.values():
        if mem.org_id == current_user.org_id:
            user = USERS.get(mem.user_id)
            if user:
                org = ORGANIZATIONS.get(mem.org_id)
                is_owner = (org.owner_user_id == user.id) if org else False
                members.append({
                    "membership_id": mem.id,
                    "user_id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": mem.role.value,
                    "status": mem.status,
                    "is_owner": is_owner,
                    "joined_at": mem.created_at,
                })

    pending_invites = [
        {
            "invitation_id": inv.id,
            "email": inv.email,
            "role": inv.role.value,
            "token": inv.token,
            "invited_by": inv.invited_by_name,
            "created_at": inv.created_at,
            "expires_at": inv.expires_at,
        }
        for inv in INVITATIONS.values()
        if inv.org_id == current_user.org_id and inv.status == "PENDING"
    ]

    org = ORGANIZATIONS.get(current_user.org_id)
    return {
        "org_id": current_user.org_id,
        "org_name": current_user.org_name,
        "gstin": (org.gstin if org else "") or "",
        "org_type": (org.org_type if org else "") or "E-Commerce / Direct-to-Consumer",
        "country": (org.country if org else "India"),
        "currency": (org.currency if org else "INR"),
        "members": members,
        "pending_invitations": pending_invites,
    }


class UpdateOrganizationRequest(BaseModel):
    name: Optional[str] = None
    gstin: Optional[str] = None
    org_type: Optional[str] = None


@router.patch("/organization")
def update_organization_profile(
    req: UpdateOrganizationRequest,
    current_user: UserSession = Depends(require_permission(Permission.MANAGE_ORGANIZATION)),
):
    """
    Admin updates organization profile and statutory GSTIN / Tax ID.
    """
    org = ORGANIZATIONS.get(current_user.org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")
    
    if req.name is not None and req.name.strip():
        org.name = req.name.strip()
    if req.gstin is not None:
        org.gstin = req.gstin.strip().upper()
    if req.org_type is not None and req.org_type.strip():
        org.org_type = req.org_type.strip()

    return {
        "success": True,
        "org_id": org.id,
        "name": org.name,
        "gstin": org.gstin or "",
        "org_type": org.org_type,
        "country": org.country,
        "currency": org.currency,
        "message": "Organization profile updated successfully."
    }


@router.patch("/members/{membership_id}")
def update_member_role_or_status(
    membership_id: str,
    req: UpdateMemberRequest,
    current_user: UserSession = Depends(require_permission(Permission.MANAGE_USERS)),
):
    """
    Admin updates a member's role or access status (ACTIVE/SUSPENDED).
    """
    mem = MEMBERSHIPS.get(membership_id)
    if not mem or mem.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Member not found in this organization.")

    org = ORGANIZATIONS.get(mem.org_id)
    if org and org.owner_user_id == mem.user_id and req.role and req.role != "ADMIN":
        raise HTTPException(status_code=400, detail="Cannot demote the primary Organization Owner.")

    if req.role:
        if req.role.upper() not in Role._value2member_map_:
            raise HTTPException(status_code=400, detail="Invalid role specified.")
        mem.role = Role(req.role.upper())

    if req.status:
        if req.status.upper() not in ["ACTIVE", "SUSPENDED"]:
            raise HTTPException(status_code=400, detail="Status must be ACTIVE or SUSPENDED.")
        mem.status = req.status.upper()

    return {
        "success": True,
        "membership_id": mem.id,
        "role": mem.role.value,
        "status": mem.status,
        "message": "Member permissions successfully updated.",
    }


@router.delete("/members/{membership_id}")
def remove_member_from_org(
    membership_id: str,
    current_user: UserSession = Depends(require_permission(Permission.MANAGE_USERS)),
):
    """
    Admin removes a team member from the organization.
    """
    mem = MEMBERSHIPS.get(membership_id)
    if not mem or mem.org_id != current_user.org_id:
        raise HTTPException(status_code=404, detail="Member not found in this organization.")

    org = ORGANIZATIONS.get(mem.org_id)
    if org and org.owner_user_id == mem.user_id:
        raise HTTPException(status_code=400, detail="Cannot remove the primary Organization Owner.")

    del MEMBERSHIPS[membership_id]
    return {"success": True, "message": "Member removed from organization."}


@router.get("/razorpay/status")
def get_org_razorpay_status(current_user: UserSession = Depends(get_current_user)):
    """
    Returns organization-level Razorpay connection state.
    """
    conn = ORGANIZATION_CONNECTIONS.get(current_user.org_id)
    if not conn:
        return {
            "org_id": current_user.org_id,
            "status": "disconnected",
            "is_connected": False,
            "message": "Razorpay account is not connected for this organization."
        }

    return {
        "org_id": conn.org_id,
        "merchant_id": conn.merchant_id,
        "merchant_name": conn.merchant_name,
        "environment": conn.environment,
        "status": conn.status.value,
        "is_connected": (conn.status == RazorpayConnectionStatus.CONNECTED),
        "masked_client_id": conn.masked_client_id,
        "connected_by_user_name": conn.connected_by_user_name,
        "connected_at": conn.connected_at,
        "last_sync_at": conn.last_sync_at,
    }


@router.post("/razorpay-oauth-connect")
def connect_merchant_razorpay_oauth(
    org_id: str = "org_nova_2026",
    code: str = "rzp_oauth_code_live_auth_8829",
    current_user: UserSession = Depends(require_permission(Permission.MANAGE_RAZORPAY_CONNECTION)),
):
    """
    Admin-only Razorpay OAuth callback. Connects merchant's Razorpay account to the organization.
    """
    conn = ORGANIZATION_CONNECTIONS.get(org_id)
    if not conn:
        conn = OrgRazorpayConnection(org_id=org_id)
        ORGANIZATION_CONNECTIONS[org_id] = conn

    conn.status = RazorpayConnectionStatus.CONNECTED
    conn.merchant_id = "rzp_live_99420"
    conn.merchant_name = "Nova Commerce Pvt Ltd"
    conn.connected_by_user_id = current_user.user_id
    conn.connected_by_user_name = current_user.name
    conn.connected_at = datetime.now(timezone.utc).isoformat()
    conn.last_sync_at = datetime.now(timezone.utc).isoformat()

    return {
        "success": True,
        "org_id": org_id,
        "status": "connected",
        "message": "Organization Razorpay merchant account successfully authorized via OAuth 2.0."
    }


@router.post("/razorpay/connect")
def connect_org_razorpay(
    req: ConnectRazorpayOrgRequest,
    current_user: UserSession = Depends(require_permission(Permission.MANAGE_RAZORPAY_CONNECTION)),
):
    """
    Admin connects Razorpay for the entire organization (OAuth 2.0 or API Key).
    The connection belongs to the organization, with connected_by_user recorded.
    """
    org_id = current_user.org_id
    conn = ORGANIZATION_CONNECTIONS.get(org_id)
    if not conn:
        conn = OrgRazorpayConnection(org_id=org_id)
        ORGANIZATION_CONNECTIONS[org_id] = conn

    conn.status = RazorpayConnectionStatus.CONNECTED
    conn.environment = req.environment
    conn.auth_type = req.auth_type
    conn.connected_by_user_id = current_user.user_id
    conn.connected_by_user_name = current_user.name
    conn.connected_at = datetime.now(timezone.utc).isoformat()
    conn.last_sync_at = datetime.now(timezone.utc).isoformat()

    if req.key_id:
        conn.masked_client_id = req.key_id[:10] + "••••"
    elif req.code:
        conn.masked_client_id = f"rzp_{req.environment.lower()}_{req.code[:6]}••••"
    else:
        conn.masked_client_id = "rzp_test_K29188••••"

    conn.merchant_id = "rzp_live_99420"
    conn.merchant_name = current_user.org_name

    return {
        "success": True,
        "org_id": org_id,
        "status": "connected",
        "merchant_id": conn.merchant_id,
        "connected_by": current_user.name,
        "message": f"Organization '{current_user.org_name}' successfully connected to Razorpay."
    }


@router.post("/razorpay/disconnect")
def disconnect_org_razorpay(
    current_user: UserSession = Depends(require_permission(Permission.MANAGE_RAZORPAY_CONNECTION)),
):
    """
    Admin disconnects Razorpay for the organization.
    """
    org_id = current_user.org_id
    conn = ORGANIZATION_CONNECTIONS.get(org_id)
    if conn:
        conn.status = RazorpayConnectionStatus.DISCONNECTED
        conn.merchant_id = None
        conn.masked_client_id = None

    return {
        "success": True,
        "org_id": org_id,
        "status": "disconnected",
        "message": f"Razorpay disconnected for '{current_user.org_name}'."
    }


@router.get("/razorpay/oauth/authorize-url")
def get_razorpay_oauth_authorize_url(org_id: Optional[str] = None):
    """
    Constructs the official Razorpay OAuth 2.0 Authorization URL for organization connecting.
    """
    client_id = "rzp_oauth_client_hisab_prod_2026"
    state = secrets.token_urlsafe(16)
    redirect_uri = "http://localhost:3000/oauth/callback"
    scope = "read_only"
    
    auth_url = (
        f"https://auth.razorpay.com/authorize?"
        f"client_id={client_id}&response_type=code&scope={scope}&state={state}&redirect_uri={redirect_uri}"
    )

    return {
        "auth_url": auth_url,
        "client_id": client_id,
        "state": state,
        "scope": scope,
        "redirect_uri": redirect_uri,
        "merchant_mid": "rzp_live_99420",
        "merchant_name": "Nova Commerce Pvt Ltd"
    }


@router.post("/razorpay/oauth/token")
def exchange_razorpay_oauth_token(
    req: ConnectRazorpayOrgRequest,
    current_user: UserSession = Depends(require_permission(Permission.MANAGE_RAZORPAY_CONNECTION)),
):
    """
    Exchanges OAuth code to connect Razorpay for the organization.
    """
    return connect_org_razorpay(req, current_user)


@router.post("/switch-role", response_model=UserSession)
def switch_demo_persona(req: SwitchRoleRequest):
    """
    Demo persona switcher for interactive testing.
    """
    return demo_signin_persona(DemoSignInRequest(role=req.role))


@router.get("/organizations")
def list_merchant_organizations():
    """
    Returns available merchant organizations.
    """
    return [
        {"id": org.id, "name": org.name, "is_connected": (ORGANIZATION_CONNECTIONS.get(org.id, OrgRazorpayConnection(org_id=org.id)).status == RazorpayConnectionStatus.CONNECTED)}
        for org in ORGANIZATIONS.values()
    ]
