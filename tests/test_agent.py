"""
Unit tests for AI Controller, Tools Interface, and Deterministic Fallback.
"""

from datetime import datetime, timezone, timedelta
import pytest
from sqlalchemy import select

from packages.domain.database import reset_db_sync, get_sync_db
from packages.domain.db_models import PaymentDB, OrderDB, SettlementDB, AuditEntryDB, RefundDB, DisputeDB
from packages.agent.tools import (
    list_source_records,
    get_record,
    search_candidates,
    calculate_expected_settlement,
    inspect_dispute_and_double_loss,
    match_payment_to_settlement,
    verify_evidence,
)
from packages.agent.fallback import resolve_with_deterministic_fallback
from packages.agent.controller import AIController, AmbiguityResolutionResponse


@pytest.fixture(autouse=True)
def setup_db():
    reset_db_sync()
    yield


class TestAgentTools:
    def test_list_and_get_records(self):
        with get_sync_db() as db:
            o = OrderDB(id="ord_test_1", customer_id="c1", amount_paise=100000)
            p = PaymentDB(id="pay_test_1", order_id="ord_test_1", customer_id="c1", amount_paise=100000)
            db.add_all([o, p])
            db.commit()

            orders = list_source_records(db, "order")
            assert len(orders) == 1
            assert orders[0]["id"] == "ord_test_1"

            fetched_p = get_record(db, "payment", "pay_test_1")
            assert fetched_p is not None
            assert fetched_p["id"] == "pay_test_1"

    def test_search_candidates_for_unmapped_payment(self):
        now = datetime.now(timezone.utc)
        with get_sync_db() as db:
            o1 = OrderDB(id="ord_cand_1", customer_id="c1", amount_paise=100000)
            s1 = SettlementDB(id="setl_cand_1", amount_paise=97640, settled_at=now)
            p1 = PaymentDB(id="pay_cand_1", order_id="ord_cand_1", customer_id="c1", amount_paise=100000, captured_at=now - timedelta(days=1), method="card")
            db.add_all([o1, s1, p1])
            db.commit()

            candidates = search_candidates(db, "pay_cand_1", "payment")
            assert len(candidates) >= 1
            assert candidates[0].candidate_id == "setl_cand_1"
            assert candidates[0].confidence_score >= 0.90

    def test_calculate_expected_settlement(self):
        res = calculate_expected_settlement(payment_amount_paise=100000, method="card")
        assert res["gross_amount_paise"] == 100000
        assert res["fee_paise"] == 2000
        assert res["tax_paise"] == 360
        assert res["net_paise"] == 97640

    def test_match_payment_to_settlement_and_audit(self):
        with get_sync_db() as db:
            o = OrderDB(id="ord_test_10", customer_id="c1", amount_paise=500000)
            s = SettlementDB(id="setl_test_10", amount_paise=500000)
            p = PaymentDB(id="pay_test_10", order_id="ord_test_10", customer_id="c1", amount_paise=500000, settlement_id=None)
            db.add_all([o, s, p])
            db.commit()

            exec_res = match_payment_to_settlement(db, "pay_test_10", "setl_test_10")
            assert exec_res.success is True

            # Verify payment was updated
            updated_p = db.get(PaymentDB, "pay_test_10")
            assert updated_p.settlement_id == "setl_test_10"

            # Verify audit entry was created
            audits = db.scalars(select(AuditEntryDB).where(AuditEntryDB.case_id == "pay_test_10")).all()
            assert len(audits) == 1
            assert audits[0].action == "MATCH_PAYMENT_TO_SETTLEMENT"

    def test_verify_evidence_dossier(self):
        now = datetime.now(timezone.utc)
        with get_sync_db() as db:
            o = OrderDB(id="ord_ev_1", customer_id="c1", amount_paise=100000, created_at=now)
            p = PaymentDB(id="pay_ev_1", order_id="ord_ev_1", customer_id="c1", amount_paise=100000, created_at=now)
            db.add_all([o, p])
            db.commit()

            dossier = verify_evidence(db, "pay_ev_1")
            assert dossier is not None
            assert dossier.payment_id == "pay_ev_1"
            assert len(dossier.evidence_graph.nodes) >= 2


class TestAIControllerAndFallback:
    def test_ai_controller_resolves_candidate_cleanly(self):
        now = datetime.now(timezone.utc)
        with get_sync_db() as db:
            o = OrderDB(id="ord_ai_1", customer_id="c1", amount_paise=100000)
            s = SettlementDB(id="setl_ai_1", amount_paise=97640, settled_at=now)
            p = PaymentDB(id="pay_ai_1", order_id="ord_ai_1", customer_id="c1", amount_paise=100000, captured_at=now, method="card", settlement_id=None)
            db.add_all([o, s, p])
            db.commit()

            controller = AIController()
            decision = controller.resolve_ambiguity(db, "pay_ai_1")

            assert decision.selected_candidate == "setl_ai_1"
            assert decision.confidence >= 0.90
            assert decision.recommended_action == "AUTO_RESOLVE"
            assert decision.execution_tier == "TIER_4_AI"

            # Verify audit logging
            audits = db.scalars(select(AuditEntryDB).where(AuditEntryDB.case_id == "pay_ai_1")).all()
            assert len(audits) >= 1
            assert audits[0].event_type == "AI_RESOLUTION"

    def test_ai_controller_flags_double_loss(self):
        now = datetime.now(timezone.utc)
        with get_sync_db() as db:
            o = OrderDB(id="ord_dbl_ai", customer_id="c1", amount_paise=7200000, created_at=now)
            p = PaymentDB(id="pay_dbl_ai", order_id="ord_dbl_ai", customer_id="c1", amount_paise=7200000, created_at=now)
            r = RefundDB(id="rfnd_dbl_ai", payment_id="pay_dbl_ai", order_id="ord_dbl_ai", amount_paise=7200000, status="processed", created_at=now + timedelta(hours=2))
            d = DisputeDB(id="disp_dbl_ai", payment_id="pay_dbl_ai", order_id="ord_dbl_ai", amount_paise=7200000, fee_paise=50000, status="open", created_at=now + timedelta(hours=12))
            db.add_all([o, p, r, d])
            db.commit()

            controller = AIController()
            decision = controller.resolve_ambiguity(db, "pay_dbl_ai")

            assert decision.recommended_action == "ESCALATE"
            assert decision.needs_human_review is True
            assert "MANDATORY_ESCALATION" in decision.reason_codes

    def test_ai_controller_rejects_hallucination_and_falls_back(self):
        now = datetime.now(timezone.utc)
        with get_sync_db() as db:
            o = OrderDB(id="ord_hallucinate", customer_id="c1", amount_paise=100000)
            s = SettlementDB(id="setl_real_1", amount_paise=97640, settled_at=now)
            p = PaymentDB(id="pay_hallucinate", order_id="ord_hallucinate", customer_id="c1", amount_paise=100000, captured_at=now, method="card", settlement_id=None)
            db.add_all([o, s, p])
            db.commit()

            controller = AIController()
            # Monkey-patch _reason_over_candidates to simulate a hallucinated candidate ID
            controller._reason_over_candidates = lambda *args: AmbiguityResolutionResponse(
                selected_candidate="setl_HALLUCINATED_ID",
                confidence=0.99,
                reason_codes=["HALLUCINATED"],
                explanation="Fake ID",
                needs_human_review=False,
                recommended_action="AUTO_RESOLVE",
            )

            decision = controller.resolve_ambiguity(db, "pay_hallucinate")
            assert decision.is_fallback is True
            assert decision.selected_candidate == "setl_real_1" # Correct real candidate selected by fallback!
            assert "HALLUCINATION_REJECTED" in decision.reason_codes
