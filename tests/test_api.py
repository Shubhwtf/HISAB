"""
Integration tests for HISAB FastAPI Backend Endpoints.
"""

from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient

from apps.api.main import app
from packages.domain.database import reset_db_sync, get_sync_db
from packages.domain.db_models import (
    CustomerDB,
    OrderDB,
    PaymentDB,
    RefundDB,
    DisputeDB,
    SettlementDB,
    BankTransactionDB,
    TaxRecordDB,
    ExceptionDB,
)


@pytest.fixture(autouse=True)
def seed_test_database():
    reset_db_sync()
    now = datetime.now(timezone.utc)
    with get_sync_db() as db:
        c = CustomerDB(id="cust_1", name="Aarav Sharma", email="aarav@example.com", contact="+919876543210")
        o1 = OrderDB(id="ord_101", customer_id="cust_1", amount_paise=100000, status="paid")
        p1 = PaymentDB(id="pay_101", order_id="ord_101", customer_id="cust_1", amount_paise=100000, fee_paise=2000, tax_paise=360, net_paise=97640, method="card", settlement_id="setl_101", captured_at=now)
        s1 = SettlementDB(id="setl_101", utr="UTR_API_101", gross_amount_paise=100000, fee_amount_paise=2000, tax_amount_paise=360, amount_paise=97640, status="settled", settled_at=now)
        b1 = BankTransactionDB(id="bnk_101", date=now, amount_paise=97640, reference="UTR_API_101", direction="credit")

        # Double loss test records
        o_dbl = OrderDB(id="ord_dbl", customer_id="cust_1", amount_paise=7200000, status="paid")
        p_dbl = PaymentDB(id="pay_dbl", order_id="ord_dbl", customer_id="cust_1", amount_paise=7200000, method="card", instrument_ref="Visa •••• 4242", captured_at=now)
        r_dbl = RefundDB(id="rfnd_dbl", payment_id="pay_dbl", order_id="ord_dbl", amount_paise=7200000, source_instrument_ref="Visa •••• 4242", status="processed", created_at=now + timedelta(hours=2))
        d_dbl = DisputeDB(id="disp_dbl", payment_id="pay_dbl", order_id="ord_dbl", amount_paise=7200000, fee_paise=50000, status="open", created_at=now + timedelta(hours=12))

        db.add_all([c, o1, p1, s1, b1, o_dbl, p_dbl, r_dbl, d_dbl])
        db.commit()
    yield


@pytest.fixture
def client():
    tc = TestClient(app)
    tc.headers.update({"X-Session-Token": "hisab_sess_demo_admin_2026", "X-Org-Id": "org_nova_2026"})
    return tc


class TestFastAPIEndpoints:
    def test_health_endpoints(self, client):
        res1 = client.get("/healthz")
        assert res1.status_code == 200
        assert res1.json()["status"] == "healthy"

        res2 = client.get("/api/health")
        assert res2.status_code == 200
        assert res2.json()["service"] == "HISAB Finance Controller"

    def test_reconciliation_summary(self, client):
        res = client.get("/api/reconcile/summary")
        assert res.status_code == 200
        data = res.json()
        assert data["total_payments_count"] == 2
        assert data["gross_turnover_paise"] == 7300000 # 1k + 72k
        assert "₹73,000.00" in data["gross_turnover_formatted"]

    def test_run_full_reconciliation_pipeline(self, client):
        res = client.post("/api/reconcile/run")
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["total_records_processed"] >= 3
        assert data["unresolved_exposure_paise"] >= 14400000

    def test_list_settlements(self, client):
        res = client.get("/api/reconcile/settlements")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1
        assert data["settlements"][0]["id"] == "setl_101"
        assert data["settlements"][0]["is_bank_matched"] is True

    def test_controls_summary_and_double_loss(self, client):
        res = client.get("/api/controls/summary")
        assert res.status_code == 200
        data = res.json()
        assert len(data["controls"]) == 7

        res_dbl = client.get("/api/controls/double-loss")
        assert res_dbl.status_code == 200
        dbl_data = res_dbl.json()
        assert dbl_data["total_alerts"] >= 1
        assert dbl_data["alerts"][0]["order_id"] == "ord_dbl"
        assert "₹1,44,500.00" in dbl_data["alerts"][0]["total_exposure_formatted"]

    def test_exceptions_lifecycle_resolve_and_escalate(self, client):
        # 1. Run recon to generate exceptions
        client.post("/api/reconcile/run")

        # 2. List exceptions
        res_list = client.get("/api/controls/exceptions")
        assert res_list.status_code == 200
        items = res_list.json()["items"]
        assert len(items) >= 1

        exc_id = items[0]["id"]

        # 3. Escalate exception
        res_esc = client.post(f"/api/controls/exceptions/{exc_id}/escalate", json={
            "reason": "High exposure requires CFO review",
            "assigned_to": "CFO",
            "actor_id": "OPERATOR_01"
        })
        assert res_esc.status_code == 200
        assert res_esc.json()["status"] == "ESCALATED"

        # 4. Resolve exception
        res_res = client.post(f"/api/controls/exceptions/{exc_id}/resolve", json={
            "justification": "Representment evidence submitted to acquiring bank",
            "actor_id": "FINANCE_LEAD",
            "resolution_type": "DISPUTE_SUBMISSION"
        })
        assert res_res.status_code == 200
        assert res_res.json()["status"] == "RESOLVED"

    def test_evidence_graph_endpoint(self, client):
        res = client.get("/api/evidence/pay_101")
        assert res.status_code == 200
        data = res.json()
        assert data["payment_id"] == "pay_101"
        assert data["decision"] == "MATCHED"
        assert len(data["evidence_graph"]["nodes"]) >= 3
        assert len(data["evidence_graph"]["edges"]) >= 2

    def test_audit_ledger_and_tamper_verification(self, client):
        # Trigger reconciliation to generate audit records
        client.post("/api/reconcile/run")

        res_entries = client.get("/api/audit/entries")
        assert res_entries.status_code == 200
        assert res_entries.json()["total"] >= 1

        res_verify = client.post("/api/audit/verify")
        assert res_verify.status_code == 200
        assert res_verify.json()["is_valid"] is True
        assert res_verify.json()["status"] == "VERIFIED_SECURE"

    def test_benchmark_endpoints(self, client):
        res_latest = client.get("/api/benchmark/latest")
        assert res_latest.status_code == 200
        data = res_latest.json()
        assert "baseline_c_hisab" in data

        res_run = client.post("/api/benchmark/run", json={"records_count": 100, "seed": 42})
        assert res_run.status_code == 200
        assert res_run.json()["baseline_c_hisab"]["precision"] == 1.0
