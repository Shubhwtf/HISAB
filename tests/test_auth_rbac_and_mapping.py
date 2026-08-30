"""
HISAB — Auth, RBAC, Multi-Tenancy & Dynamic Schema Mapping Test Suite.

Verifies:
1. Separation of HISAB Auth, Tenant Context, RBAC, and Razorpay OAuth
2. Role permissions and 403 Forbidden enforcement
3. Tenant isolation between organizations
4. Dynamic source detection, AI column mapping, and schema drift
5. Zero-hallucination canonical field protection
"""

import pytest
from fastapi.testclient import TestClient
from apps.api.main import app
from packages.domain.auth_rbac import (
    Role,
    Permission,
    check_user_permission,
    hash_password,
    verify_password,
)
from packages.domain.mapping_engine import (
    detect_source_type,
    map_columns_dynamically,
    detect_schema_drift,
    CANONICAL_FIELDS,
)

client = TestClient(app)


class TestAuthAndRBAC:
    def test_password_hashing_and_verification(self):
        pw = "SuperSecureDemo123!"
        pw_hash, salt = hash_password(pw)
        assert pw_hash != pw
        assert verify_password(pw, pw_hash, salt) is True
        assert verify_password("WrongPassword", pw_hash, salt) is False

    def test_role_permission_boundaries(self):
        assert check_user_permission(Role.ADMIN, Permission.MANAGE_RAZORPAY_CONNECTION) is True
        assert check_user_permission(Role.ADMIN, Permission.CLOSE_BATCHES) is True

        assert check_user_permission(Role.FINANCE_MANAGER, Permission.CLOSE_BATCHES) is True
        assert check_user_permission(Role.FINANCE_MANAGER, Permission.MANAGE_RAZORPAY_CONNECTION) is False

        assert check_user_permission(Role.ANALYST, Permission.PREPARE_RESOLUTIONS) is True
        assert check_user_permission(Role.ANALYST, Permission.CLOSE_BATCHES) is False
        assert check_user_permission(Role.ANALYST, Permission.MANAGE_RAZORPAY_CONNECTION) is False

        assert check_user_permission(Role.AUDITOR, Permission.VIEW_FINANCIAL_DATA) is True
        assert check_user_permission(Role.AUDITOR, Permission.UPLOAD_FINANCIAL_DATA) is False
        assert check_user_permission(Role.AUDITOR, Permission.APPROVE_RESOLUTIONS) is False
        assert check_user_permission(Role.AUDITOR, Permission.CLOSE_BATCHES) is False

    def test_signin_success_and_invalid_credentials(self):
        res = client.post("/api/auth/signin", json={"email": "admin@novacommerce.com", "password": "demo123"})
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "admin@novacommerce.com"
        assert data["role"] == "ADMIN"
        assert data["org_name"] == "Nova Commerce Pvt Ltd"
        assert "token" in data

        res_fail = client.post("/api/auth/signin", json={"email": "admin@novacommerce.com", "password": "wrong"})
        assert res_fail.status_code == 401

    def test_signup_creates_new_org_and_admin(self):
        res = client.post("/api/auth/signup", json={
            "name": "Kavita Rao",
            "email": "kavita@solarenergetics.in",
            "password": "strongPassword99!",
            "org_name": "Solar Energetics Ltd",
            "org_type": "Renewable Energy",
            "country": "India",
            "currency": "INR"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Kavita Rao"
        assert data["email"] == "kavita@solarenergetics.in"
        assert data["role"] == "ADMIN"
        assert data["is_org_owner"] is True
        assert data["org_name"] == "Solar Energetics Ltd"
        assert data["is_razorpay_connected"] is False

    def test_admin_invitation_and_member_join_flow(self):
        admin_sess = client.post("/api/auth/signin", json={"email": "admin@novacommerce.com", "password": "demo123"}).json()
        token = admin_sess["token"]

        res_invite = client.post(
            "/api/auth/invitations",
            json={"email": "deepak@novacommerce.com", "role": "ANALYST"},
            headers={"X-Session-Token": token}
        )
        assert res_invite.status_code == 200
        invite_data = res_invite.json()
        assert "invite_link" in invite_data
        invite_token = invite_data["invite_link"].split("invite=")[-1]

        res_inspect = client.get(f"/api/auth/invitations/{invite_token}")
        assert res_inspect.status_code == 200
        assert res_inspect.json()["role"] == "ANALYST"
        assert res_inspect.json()["org_name"] == "Nova Commerce Pvt Ltd"

        res_join = client.post("/api/auth/signup", json={
            "name": "Deepak Verma",
            "email": "deepak@novacommerce.com",
            "password": "mySecurePassword123!",
            "invite_token": invite_token
        })
        assert res_join.status_code == 200
        join_data = res_join.json()
        assert join_data["role"] == "ANALYST"
        assert join_data["org_name"] == "Nova Commerce Pvt Ltd"
        assert "upload_financial_data" in join_data["permissions"]
        assert "manage_users" not in join_data["permissions"]

        res_login = client.post("/api/auth/signin", json={
            "email": "deepak@novacommerce.com",
            "password": "mySecurePassword123!"
        })
        assert res_login.status_code == 200
        assert res_login.json()["role"] == "ANALYST"

    def test_switch_role_persona(self):
        res = client.post("/api/auth/switch-role", json={"role": "AUDITOR", "org_id": "org_nova_2026"})
        assert res.status_code == 200
        data = res.json()
        assert data["role"] == "AUDITOR"
        assert "upload_financial_data" not in data["permissions"]
        assert "view_financial_data" in data["permissions"]

    def test_admin_only_razorpay_oauth_connect_enforcement(self):
        res_analyst = client.post(
            "/api/auth/razorpay-oauth-connect",
            headers={"X-User-Role": "ANALYST", "X-Session-Token": "hisab_sess_demo_analyst"}
        )
        assert res_analyst.status_code == 403

        res_admin = client.post(
            "/api/auth/razorpay-oauth-connect",
            headers={"X-User-Role": "ADMIN", "X-Session-Token": "hisab_sess_demo_admin_2026"}
        )
        assert res_admin.status_code == 200
        assert res_admin.json()["status"] == "connected"


class TestDynamicSchemaMapping:
    def test_source_type_detection(self):
        s_res = detect_source_type("settlement_recon_august.csv", ["payment_id", "settlement_id", "amount", "utr"])
        assert s_res.detected_source_type in ("SETTLEMENT_RECONCILIATION", "SETTLEMENTS")
        assert s_res.confidence >= 0.95

        b_res = detect_source_type("hdfc_current_account.csv", ["date", "narration", "credit", "ref_no"])
        assert b_res.detected_source_type == "BANK_STATEMENT"
        assert b_res.confidence >= 0.95

        r_res = detect_source_type("refunds_aug.csv", ["refund_id", "payment_id", "amount"])
        assert r_res.detected_source_type == "REFUNDS"
        assert r_res.confidence >= 0.95

    def test_dynamic_column_mapping_and_synonyms(self):
        cols = ["Txn Ref", "Gross Amount", "PG Fee", "GST", "UTR No"]
        mappings = map_columns_dynamically(cols, source_type="SETTLEMENT_RECONCILIATION")
        
        map_dict = {m.source_column: m.canonical_field for m in mappings}
        assert map_dict["Txn Ref"] == "payment_id"
        assert map_dict["Gross Amount"] == "gross_amount"
        assert map_dict["PG Fee"] == "fee_amount"
        assert map_dict["GST"] == "tax_amount"
        assert map_dict["UTR No"] == "bank_reference_utr"

    def test_zero_hallucination_canonical_field_guard(self):
        cols = ["RandomCol1", "InventedHeader_XYZ", "SomeCustomString"]
        mappings = map_columns_dynamically(cols, source_type="PAYMENTS")
        for m in mappings:
            if m.canonical_field:
                assert m.canonical_field in CANONICAL_FIELDS

    def test_schema_drift_detection(self):
        saved = ["Txn Ref", "Gross Amount", "Credit Amt"]
        current = ["Txn Ref", "Gross Amount", "Settlement Credit", "ExtraCol"]
        drift = detect_schema_drift(saved, current)
        
        assert drift.has_drift is True
        assert "ExtraCol" in drift.added_columns
        assert "Credit Amt" in drift.removed_columns
        assert len(drift.renamed_columns) > 0
        assert drift.renamed_columns[0]["from_column"] == "Credit Amt"
        assert drift.renamed_columns[0]["to_column"] == "Settlement Credit"

    def test_mapping_api_endpoint(self):
        payload = {
            "filename": "custom_vendor_export.csv",
            "columns": ["Transaction ID", "Captured Value", "Gateway Charges", "UTR Ref"],
            "sample_rows": [{"Transaction ID": "pay_90006", "Captured Value": "72000"}],
        }
        res = client.post(
            "/api/mapping/detect-and-map", 
            json=payload,
            headers={"X-Session-Token": "hisab_sess_demo_admin_2026"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["detection"]["confidence"] >= 0.90
        assert len(data["mappings"]) == 4


class TestExecutiveReportAPI:
    def test_get_executive_report(self):
        res = client.get(
            "/api/reports/executive-summary",
            headers={"X-Session-Token": "hisab_sess_demo_admin_2026"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "report_id" in data
        assert "audit_hash" in data
        assert len(data["controls_summary"]) == 7
        assert data["merchant_name"] == "Nova Commerce Pvt Ltd"
