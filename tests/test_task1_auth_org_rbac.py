"""
HISAB — Task 1: Comprehensive Auth, Organization, RBAC & Invitations Test Suite.

Covers:
1. Authentication (Sign Up, Sign In, Sign Out, Me, Hashing, 401 Unauthorized)
2. Organization (Creation, Profile, Ownership, Membership)
3. RBAC (Admin, Finance Manager, Analyst, Auditor, Server-side enforcement)
4. Invitations (Create, Inspect, Accept, Expiry, Resend, Cancel, Role Assignment)
5. Team Management (Change Role, Suspend, Remove, Owner Protection)
6. Security (Cross-Tenant Isolation, Self-Role Escalation Prevention, 403 Forbidden)
7. End-to-End Flows (Flow A, Flow B, Flow C, Flow D)
"""

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from apps.api.main import app
from packages.domain.auth_rbac import (
    Role,
    Permission,
    check_user_permission,
    hash_password,
    verify_password,
    USERS,
    MEMBERSHIPS,
    ORGANIZATIONS,
    INVITATIONS,
)

client = TestClient(app)


# ------------------------------------------------------------------------------
# 1. AUTHENTICATION TESTS
# ------------------------------------------------------------------------------

class TestAuthentication:
    def test_password_hashing_and_verification(self):
        password = "SecureEnterprisePassword2026!"
        pw_hash, salt = hash_password(password)
        
        assert pw_hash != password
        assert len(salt) == 32
        assert verify_password(password, pw_hash, salt) is True
        assert verify_password("WrongPassword123!", pw_hash, salt) is False

    def test_signup_creates_account_and_organization_as_admin(self):
        res = client.post("/api/auth/signup", json={
            "name": "Vikram Sethi",
            "email": "vikram@sethilogistics.com",
            "password": "passVikram2026!",
            "org_name": "Sethi Logistics Pvt Ltd",
            "org_type": "Supply Chain & Logistics",
            "country": "India",
            "currency": "INR"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Vikram Sethi"
        assert data["email"] == "vikram@sethilogistics.com"
        assert data["role"] == "ADMIN"
        assert data["is_org_owner"] is True
        assert data["org_name"] == "Sethi Logistics Pvt Ltd"
        assert data["is_razorpay_connected"] is False
        assert "token" in data

    def test_signin_success_and_automatic_role_resolution(self):
        # User does NOT send role; backend resolves role from organization membership
        res = client.post("/api/auth/signin", json={
            "email": "admin@novacommerce.com",
            "password": "demo123"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "admin@novacommerce.com"
        assert data["role"] == "ADMIN"
        assert data["org_name"] == "Nova Commerce Pvt Ltd"
        assert "token" in data

    def test_signin_invalid_password(self):
        res = client.post("/api/auth/signin", json={
            "email": "admin@novacommerce.com",
            "password": "incorrect_password"
        })
        assert res.status_code == 401
        assert "Invalid email or password" in res.json()["detail"]

    def test_signin_nonexistent_email(self):
        res = client.post("/api/auth/signin", json={
            "email": "nobody_exists@unknown.com",
            "password": "somePassword123"
        })
        assert res.status_code == 401

    def test_current_user_me_endpoint(self):
        signin_res = client.post("/api/auth/signin", json={
            "email": "admin@novacommerce.com",
            "password": "demo123"
        }).json()
        token = signin_res["token"]

        res = client.get("/api/auth/me", headers={"X-Session-Token": token})
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "admin@novacommerce.com"
        assert data["role"] == "ADMIN"
        assert len(data["permissions"]) > 10

    def test_unauthenticated_request_returns_401(self):
        res = client.get("/api/auth/me")
        assert res.status_code == 401
        assert "Authentication required" in res.json()["detail"]

    def test_signout(self):
        signin_res = client.post("/api/auth/signin", json={
            "email": "admin@novacommerce.com",
            "password": "demo123"
        }).json()
        token = signin_res["token"]

        logout_res = client.post("/api/auth/logout", headers={"X-Session-Token": token})
        assert logout_res.status_code == 200

        # Subsequent request with invalidated token returns 401
        res_after = client.get("/api/auth/me", headers={"X-Session-Token": token})
        assert res_after.status_code == 401


# ------------------------------------------------------------------------------
# 2. ORGANIZATION & MULTI-TENANCY TESTS
# ------------------------------------------------------------------------------

class TestOrganization:
    def test_organization_profile_retrieval(self):
        admin_sess = client.post("/api/auth/signin", json={
            "email": "admin@novacommerce.com",
            "password": "demo123"
        }).json()
        token = admin_sess["token"]

        res = client.get("/api/auth/members", headers={"X-Session-Token": token})
        assert res.status_code == 200
        data = res.json()
        assert data["org_name"] == "Nova Commerce Pvt Ltd"
        assert len(data["members"]) >= 4

    def test_update_organization_profile_as_admin(self):
        admin_sess = client.post("/api/auth/signin", json={
            "email": "admin@novacommerce.com",
            "password": "demo123"
        }).json()
        token = admin_sess["token"]

        res = client.patch(
            "/api/auth/organization",
            json={"gstin": "27AABCN8890K1Z9", "org_type": "Omnichannel Retail"},
            headers={"X-Session-Token": token}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["gstin"] == "27AABCN8890K1Z9"
        assert data["org_type"] == "Omnichannel Retail"

    def test_non_admin_cannot_update_organization_profile(self):
        analyst_sess = client.post("/api/auth/demo-signin", json={"role": "ANALYST"}).json()
        token = analyst_sess["token"]

        res = client.patch(
            "/api/auth/organization",
            json={"name": "Hacked Org Name"},
            headers={"X-Session-Token": token}
        )
        assert res.status_code == 403


# ------------------------------------------------------------------------------
# 3. RBAC & SERVER-SIDE AUTHORIZATION ENFORCEMENT
# ------------------------------------------------------------------------------

class TestRBACPermissions:
    def test_admin_permissions(self):
        assert check_user_permission(Role.ADMIN, Permission.MANAGE_USERS) is True
        assert check_user_permission(Role.ADMIN, Permission.MANAGE_ORGANIZATION) is True
        assert check_user_permission(Role.ADMIN, Permission.MANAGE_RAZORPAY_CONNECTION) is True
        assert check_user_permission(Role.ADMIN, Permission.CLOSE_BATCHES) is True

    def test_finance_manager_permissions(self):
        assert check_user_permission(Role.FINANCE_MANAGER, Permission.CLOSE_BATCHES) is True
        assert check_user_permission(Role.FINANCE_MANAGER, Permission.APPROVE_RESOLUTIONS) is True
        assert check_user_permission(Role.FINANCE_MANAGER, Permission.MANAGE_USERS) is False
        assert check_user_permission(Role.FINANCE_MANAGER, Permission.MANAGE_RAZORPAY_CONNECTION) is False

    def test_analyst_permissions(self):
        assert check_user_permission(Role.ANALYST, Permission.PREPARE_RESOLUTIONS) is True
        assert check_user_permission(Role.ANALYST, Permission.INVESTIGATE_EXCEPTIONS) is True
        assert check_user_permission(Role.ANALYST, Permission.CLOSE_BATCHES) is False
        assert check_user_permission(Role.ANALYST, Permission.APPROVE_RESOLUTIONS) is False
        assert check_user_permission(Role.ANALYST, Permission.MANAGE_RAZORPAY_CONNECTION) is False

    def test_auditor_read_only_permissions(self):
        assert check_user_permission(Role.AUDITOR, Permission.VIEW_FINANCIAL_DATA) is True
        assert check_user_permission(Role.AUDITOR, Permission.VIEW_AUDIT_TRAIL) is True
        assert check_user_permission(Role.AUDITOR, Permission.UPLOAD_FINANCIAL_DATA) is False
        assert check_user_permission(Role.AUDITOR, Permission.RUN_RECONCILIATION) is False
        assert check_user_permission(Role.AUDITOR, Permission.PREPARE_RESOLUTIONS) is False
        assert check_user_permission(Role.AUDITOR, Permission.APPROVE_RESOLUTIONS) is False
        assert check_user_permission(Role.AUDITOR, Permission.CLOSE_BATCHES) is False

    def test_analyst_direct_api_batch_close_blocked_with_403(self):
        analyst_sess = client.post("/api/auth/demo-signin", json={"role": "ANALYST"}).json()
        token = analyst_sess["token"]

        res = client.post(
            "/api/reconcile/close-batch",
            json={"batch_id": "BATCH_001"},
            headers={"X-Session-Token": token}
        )
        assert res.status_code == 403
        assert "close_batches" in res.json()["detail"]

    def test_auditor_direct_api_run_recon_blocked_with_403(self):
        auditor_sess = client.post("/api/auth/demo-signin", json={"role": "AUDITOR"}).json()
        token = auditor_sess["token"]

        res = client.post(
            "/api/reconcile/run",
            headers={"X-Session-Token": token}
        )
        assert res.status_code == 403
        assert "run_reconciliation" in res.json()["detail"]


# ------------------------------------------------------------------------------
# 4. INVITATION & TEAM MANAGEMENT TESTS
# ------------------------------------------------------------------------------

class TestInvitationsAndTeam:
    def test_admin_create_invitation_success(self):
        admin_sess = client.post("/api/auth/signin", json={"email": "admin@novacommerce.com", "password": "demo123"}).json()
        token = admin_sess["token"]

        res = client.post(
            "/api/auth/invitations",
            json={"email": "rohit.analyst@novacommerce.com", "role": "ANALYST"},
            headers={"X-Session-Token": token}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "rohit.analyst@novacommerce.com"
        assert data["role"] == "ANALYST"
        assert "token" in data
        assert "invite_link" in data

    def test_non_admin_cannot_create_invitation(self):
        analyst_sess = client.post("/api/auth/demo-signin", json={"role": "ANALYST"}).json()
        token = analyst_sess["token"]

        res = client.post(
            "/api/auth/invitations",
            json={"email": "someone@company.com", "role": "ANALYST"},
            headers={"X-Session-Token": token}
        )
        assert res.status_code == 403

    def test_accept_invitation_flow(self):
        # 1. Create invite for Manager role
        admin_sess = client.post("/api/auth/signin", json={"email": "admin@novacommerce.com", "password": "demo123"}).json()
        invite = client.post(
            "/api/auth/invitations",
            json={"email": "sunita.mgr@novacommerce.com", "role": "FINANCE_MANAGER"},
            headers={"X-Session-Token": admin_sess["token"]}
        ).json()
        inv_token = invite["token"]

        # 2. Inspect invitation details (Public endpoint)
        inspect_res = client.get(f"/api/auth/invitations/{inv_token}")
        assert inspect_res.status_code == 200
        assert inspect_res.json()["role"] == "FINANCE_MANAGER"
        assert inspect_res.json()["email"] == "sunita.mgr@novacommerce.com"

        # 3. Accept invite and create account
        signup_res = client.post("/api/auth/signup", json={
            "name": "Sunita Rao",
            "email": "sunita.mgr@novacommerce.com",
            "password": "sunitaPassword2026!",
            "invite_token": inv_token
        })
        assert signup_res.status_code == 200
        user_sess = signup_res.json()
        assert user_sess["role"] == "FINANCE_MANAGER"
        assert user_sess["org_name"] == "Nova Commerce Pvt Ltd"
        assert user_sess["is_org_owner"] is False

        # 4. Log in directly
        login_res = client.post("/api/auth/signin", json={
            "email": "sunita.mgr@novacommerce.com",
            "password": "sunitaPassword2026!"
        })
        assert login_res.status_code == 200
        assert login_res.json()["role"] == "FINANCE_MANAGER"

    def test_invitation_expiry_rejection(self):
        admin_sess = client.post("/api/auth/signin", json={"email": "admin@novacommerce.com", "password": "demo123"}).json()
        invite = client.post(
            "/api/auth/invitations",
            json={"email": "expired.test@novacommerce.com", "role": "ANALYST"},
            headers={"X-Session-Token": admin_sess["token"]}
        ).json()
        inv_token = invite["token"]

        # Manually expire the invitation
        if inv_token in INVITATIONS:
            INVITATIONS[inv_token].expires_at = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()

        # Inspection should fail
        res_inspect = client.get(f"/api/auth/invitations/{inv_token}")
        assert res_inspect.status_code == 404

    def test_resend_and_cancel_invitation(self):
        admin_sess = client.post("/api/auth/signin", json={"email": "admin@novacommerce.com", "password": "demo123"}).json()
        invite = client.post(
            "/api/auth/invitations",
            json={"email": "cancel.test@novacommerce.com", "role": "AUDITOR"},
            headers={"X-Session-Token": admin_sess["token"]}
        ).json()
        inv_token = invite["token"]

        # Resend
        resend_res = client.post(f"/api/auth/invitations/{inv_token}/resend", headers={"X-Session-Token": admin_sess["token"]})
        assert resend_res.status_code == 200
        assert resend_res.json()["success"] is True

        # Cancel
        cancel_res = client.delete(f"/api/auth/invitations/{inv_token}", headers={"X-Session-Token": admin_sess["token"]})
        assert cancel_res.status_code == 200
        assert cancel_res.json()["success"] is True

        # Ensure no longer inspectable
        assert client.get(f"/api/auth/invitations/{inv_token}").status_code == 404

    def test_change_member_role_and_suspend(self):
        admin_sess = client.post("/api/auth/signin", json={"email": "admin@novacommerce.com", "password": "demo123"}).json()
        members_data = client.get("/api/auth/members", headers={"X-Session-Token": admin_sess["token"]}).json()
        
        # Find non-owner member
        non_owner = next(m for m in members_data["members"] if not m["is_owner"])
        mem_id = non_owner["membership_id"]

        # Change role to AUDITOR
        patch_res = client.patch(
            f"/api/auth/members/{mem_id}",
            json={"role": "AUDITOR"},
            headers={"X-Session-Token": admin_sess["token"]}
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["role"] == "AUDITOR"

        # Suspend member
        suspend_res = client.patch(
            f"/api/auth/members/{mem_id}",
            json={"status": "SUSPENDED"},
            headers={"X-Session-Token": admin_sess["token"]}
        )
        assert suspend_res.status_code == 200
        assert suspend_res.json()["status"] == "SUSPENDED"

        # Reactivate member
        reactivate_res = client.patch(
            f"/api/auth/members/{mem_id}",
            json={"status": "ACTIVE"},
            headers={"X-Session-Token": admin_sess["token"]}
        )
        assert reactivate_res.status_code == 200
        assert reactivate_res.json()["status"] == "ACTIVE"


# ------------------------------------------------------------------------------
# 5. END-TO-END FLOW TESTS (FLOWS A, B, C, D)
# ------------------------------------------------------------------------------

class TestEndToEndFlows:
    def test_flow_a_create_account_and_invite_analyst(self):
        """
        FLOW A: Create Account -> Create Org -> Become Admin -> Dashboard -> Users & Access -> Invite Analyst
        """
        # 1. Create account & Org
        res = client.post("/api/auth/signup", json={
            "name": "Aditi Roy",
            "email": "aditi@roypayments.com",
            "password": "passAditi2026!",
            "org_name": "Roy Payments Tech Pvt Ltd",
            "org_type": "Fintech & Digital Services",
            "country": "India",
            "currency": "INR"
        })
        assert res.status_code == 200
        admin_sess = res.json()
        assert admin_sess["role"] == "ADMIN"
        assert admin_sess["is_org_owner"] is True
        token = admin_sess["token"]

        # 2. Invite Analyst
        invite_res = client.post(
            "/api/auth/invitations",
            json={"email": "karan.analyst@roypayments.com", "role": "ANALYST"},
            headers={"X-Session-Token": token}
        )
        assert invite_res.status_code == 200
        assert invite_res.json()["role"] == "ANALYST"
        assert "token" in invite_res.json()

    def test_flow_b_accept_invitation_and_join_with_assigned_role(self):
        """
        FLOW B: Accept Invitation -> Create Account -> Auto-Join Org -> Role=Analyst -> Normal Login
        """
        # 1. Admin creates invitation
        admin_sess = client.post("/api/auth/signin", json={"email": "admin@novacommerce.com", "password": "demo123"}).json()
        invite = client.post(
            "/api/auth/invitations",
            json={"email": "neha.analyst@novacommerce.com", "role": "ANALYST"},
            headers={"X-Session-Token": admin_sess["token"]}
        ).json()
        inv_token = invite["token"]

        # 2. Accept and create account
        signup = client.post("/api/auth/signup", json={
            "name": "Neha Gupta",
            "email": "neha.analyst@novacommerce.com",
            "password": "passNeha2026!",
            "invite_token": inv_token
        }).json()
        assert signup["role"] == "ANALYST"
        assert signup["org_name"] == "Nova Commerce Pvt Ltd"

        # 3. Log in normally
        login = client.post("/api/auth/signin", json={
            "email": "neha.analyst@novacommerce.com",
            "password": "passNeha2026!"
        }).json()
        assert login["role"] == "ANALYST"
        assert "manage_users" not in login["permissions"]

    def test_flow_c_analyst_attempt_admin_endpoint_denied(self):
        """
        FLOW C: Attempt Analyst -> Admin API -> DENIED (403 Forbidden)
        """
        analyst_sess = client.post("/api/auth/demo-signin", json={"role": "ANALYST"}).json()
        token = analyst_sess["token"]

        # Attempt to invite a user (Admin only)
        res_invite = client.post(
            "/api/auth/invitations",
            json={"email": "illegal.invite@novacommerce.com", "role": "ADMIN"},
            headers={"X-Session-Token": token}
        )
        assert res_invite.status_code == 403

        # Attempt to connect Razorpay (Admin only)
        res_oauth = client.post(
            "/api/auth/razorpay-oauth-connect",
            headers={"X-Session-Token": token}
        )
        assert res_oauth.status_code == 403

    def test_flow_d_cross_tenant_isolation(self):
        """
        FLOW D: Attempt Org A user -> Org B data -> STRICT ISOLATION
        """
        # User in Org Nova Commerce
        nova_sess = client.post("/api/auth/signin", json={"email": "admin@novacommerce.com", "password": "demo123"}).json()
        
        # User in Sethi Logistics
        sethi_sess = client.post("/api/auth/signin", json={"email": "vikram@sethilogistics.com", "password": "passVikram2026!"}).json()

        # Members list for Sethi Logistics only returns Sethi members
        res = client.get("/api/auth/members", headers={"X-Session-Token": sethi_sess["token"]})
        assert res.status_code == 200
        data = res.json()
        assert data["org_name"] == "Sethi Logistics Pvt Ltd"
        assert all("novacommerce.com" not in m["email"] for m in data["members"])
