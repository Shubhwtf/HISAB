"""
Unit tests for The Seven Financial Controls & Signature Features.
"""

from datetime import datetime, timedelta, timezone
import pytest

from packages.domain.models import Order, Payment, Refund, Dispute, Settlement, BankTransaction
from packages.controls.financial_controls import (
    ControlStatus,
    ControlSeverity,
    run_ctl_01_settlement_bank,
    run_ctl_02_missing_txn,
    run_ctl_03_duplicate,
    run_ctl_04_fee_gst,
    run_ctl_05_refund,
    evaluate_financial_severity,
)
from packages.controls.double_loss_detector import (
    DoubleLossClassification,
    detect_double_loss_for_order,
    run_ctl_06_double_loss,
)
from packages.controls.evidence_graph_builder import (
    run_ctl_07_dispute,
    build_evidence_graph_for_payment,
)


class TestFinancialControls:
    def test_ctl_01_settlement_bank_pass_and_failures(self):
        s = Settlement(id="setl_1", utr="UTR100", amount_paise=1000000)
        b_pass = BankTransaction(id="bnk_1", date=datetime.now(timezone.utc), amount_paise=1000000, reference="UTR100")
        b_fail = BankTransaction(id="bnk_2", date=datetime.now(timezone.utc), amount_paise=988760, reference="UTR100")

        res_pass = run_ctl_01_settlement_bank(s, b_pass)
        assert res_pass.status == ControlStatus.PASS
        assert res_pass.financial_impact_paise == 0

        res_missing = run_ctl_01_settlement_bank(s, None)
        assert res_missing.status == ControlStatus.FAIL
        assert res_missing.financial_impact_paise == 1000000
        assert res_missing.recommended_action == "ESCALATE"

        res_variance = run_ctl_01_settlement_bank(s, b_fail)
        assert res_variance.status == ControlStatus.FAIL
        assert res_variance.financial_impact_paise == 11240

    def test_ctl_02_missing_txn(self):
        p_clean = Payment(id="p1", order_id="o1", customer_id="c1", amount_paise=100000, settlement_id="setl_1")
        p_unmapped = Payment(id="p2", order_id="o2", customer_id="c2", amount_paise=100000, settlement_id=None)

        assert run_ctl_02_missing_txn(p_clean, is_settlement_mapped=True).status == ControlStatus.PASS
        res_fail = run_ctl_02_missing_txn(p_unmapped, is_settlement_mapped=False)
        assert res_fail.status == ControlStatus.FAIL
        assert res_fail.financial_impact_paise == 100000

    def test_ctl_03_duplicate_detection(self):
        p1 = Payment(id="p1", order_id="ord_dup", customer_id="c1", amount_paise=50000)
        p2 = Payment(id="p2", order_id="ord_dup", customer_id="c1", amount_paise=50000)

        r1 = Refund(id="r1", payment_id="p1", amount_paise=50000)
        r2 = Refund(id="r2", payment_id="p1", amount_paise=50000)

        results = run_ctl_03_duplicate([p1, p2], [r1, r2])
        assert len(results) == 2
        assert all(r.status == ControlStatus.FAIL for r in results)

    def test_ctl_04_fee_gst_consistency(self):
        p_clean = Payment(id="p1", order_id="o1", customer_id="c1", amount_paise=100000, fee_paise=2000, tax_paise=360, net_paise=97640, method="card")
        p_skew = Payment(id="p2", order_id="o2", customer_id="c2", amount_paise=100000, fee_paise=5000, tax_paise=900, net_paise=94100, method="card")

        assert run_ctl_04_fee_gst(p_clean).status == ControlStatus.PASS
        res_skew = run_ctl_04_fee_gst(p_skew)
        assert res_skew.status == ControlStatus.FAIL
        assert res_skew.financial_impact_paise > 0

    def test_ctl_05_refund_correctness(self):
        p = Payment(id="p1", order_id="o1", customer_id="c1", amount_paise=100000, instrument_ref="Visa •••• 4242", method="card")
        r_clean = Refund(id="r1", payment_id="p1", amount_paise=100000, source_instrument_ref="Visa •••• 4242")
        r_mismatch = Refund(id="r2", payment_id="p1", amount_paise=100000, source_instrument_ref="Mastercard •••• 9999")

        assert run_ctl_05_refund(r_clean, p).status == ControlStatus.PASS
        assert run_ctl_05_refund(r_mismatch, p).status == ControlStatus.FAIL


class TestDoubleLossForensics:
    def test_signature_double_loss_case(self):
        now = datetime.now(timezone.utc)
        order = Order(id="ord_10482", customer_id="c1", amount_paise=7200000, amount_paid_paise=7200000, created_at=now)
        payment = Payment(id="pay_91231", order_id="ord_10482", customer_id="c1", amount_paise=7200000, method="card", instrument_ref="Visa •••• 4242", created_at=now)
        refund = Refund(id="rfnd_3321", payment_id="pay_91231", order_id="ord_10482", amount_paise=7200000, source_instrument_ref="Visa •••• 4242", status="processed", created_at=now + timedelta(hours=2))
        dispute = Dispute(id="disp_5512", payment_id="pay_91231", order_id="ord_10482", amount_paise=7200000, deduction_amount_paise=7200000, fee_paise=50000, status="open", created_at=now + timedelta(hours=12))

        alert = detect_double_loss_for_order(order, [payment], [refund], [dispute])
        assert alert is not None
        assert alert.classification == DoubleLossClassification.REFUND_PLUS_CHARGEBACK_POTENTIAL_DOUBLE_LOSS
        assert alert.original_payment_paise == 7200000
        assert alert.manual_refund_paise == 7200000
        assert alert.chargeback_exposure_paise == 7250000
        assert alert.total_potential_exposure_paise == 14450000
        assert alert.recommended_action == "ESCALATE"
        assert len(alert.timeline) == 3

        ctl_results = run_ctl_06_double_loss([order], [payment], [refund], [dispute])
        assert len(ctl_results) == 1
        assert ctl_results[0].status == ControlStatus.FAIL
        assert ctl_results[0].severity == ControlSeverity.CRITICAL
        assert ctl_results[0].financial_impact_paise == 14450000


class TestEvidenceGraphAndDisputeControl:
    def test_ctl_07_dispute_approaching_deadline(self):
        now = datetime.now(timezone.utc)
        disp_urgent = Dispute(
            id="d_urg",
            payment_id="p1",
            amount_paise=500000,
            status="open",
            respond_by=now + timedelta(hours=24)
        )
        res = run_ctl_07_dispute(disp_urgent, current_time=now)
        assert res.status == ControlStatus.FAIL
        assert "URGENT" in res.evidence["proof_items"][-1]

    def test_ctl_07_dispute_resolved_pass(self):
        disp_won = Dispute(id="d_won", payment_id="p1", amount_paise=500000, status="won")
        res = run_ctl_07_dispute(disp_won)
        assert res.status == ControlStatus.PASS
        assert res.financial_impact_paise == 0

    def test_build_evidence_graph_prove_it_flow(self):
        now = datetime.now(timezone.utc)
        order = Order(id="ord_10482", customer_id="c1", amount_paise=100000, created_at=now)
        payment = Payment(id="pay_91231", order_id="ord_10482", customer_id="c1", amount_paise=100000, method="card", fee_paise=2000, tax_paise=360, net_paise=97640, created_at=now)
        settlement = Settlement(id="setl_8842", utr="UTR77821", amount_paise=97640, status="settled", settled_at=now + timedelta(days=2))
        bank = BankTransaction(id="bnk_1", date=now + timedelta(days=2), amount_paise=97640, reference="UTR77821")

        dossier = build_evidence_graph_for_payment(
            payment=payment,
            order=order,
            refunds=[],
            disputes=[],
            settlement=settlement,
            bank_transaction=bank
        )

        assert dossier.decision == "MATCHED"
        assert dossier.overall_confidence == 0.997
        assert dossier.reconciled_amount_paise == 100000
        assert dossier.unresolved_exposure_paise == 0
        assert len(dossier.evidence_graph.nodes) == 4
        assert len(dossier.evidence_graph.edges) == 3
        assert "✓ Zero unexplained banking rail leakage" in dossier.evidence_graph.edges[-1].proof_items

    def test_build_evidence_graph_with_refund_and_dispute(self):
        now = datetime.now(timezone.utc)
        order = Order(id="ord_10482", customer_id="c1", amount_paise=7200000, created_at=now)
        payment = Payment(id="pay_91231", order_id="ord_10482", customer_id="c1", amount_paise=7200000, method="card", instrument_ref="Visa •••• 4242", created_at=now)
        refund = Refund(id="rfnd_3321", payment_id="pay_91231", order_id="ord_10482", amount_paise=7200000, source_instrument_ref="Visa •••• 4242", status="processed", created_at=now + timedelta(hours=2))
        dispute = Dispute(id="disp_5512", payment_id="pay_91231", order_id="ord_10482", amount_paise=7200000, deduction_amount_paise=7200000, fee_paise=50000, status="open", created_at=now + timedelta(hours=12))

        dossier = build_evidence_graph_for_payment(
            payment=payment,
            order=order,
            refunds=[refund],
            disputes=[dispute],
        )

        assert dossier.decision == "POTENTIAL_DOUBLE_LOSS"
        assert dossier.unresolved_exposure_paise == 14450000
        assert len(dossier.evidence_graph.nodes) == 4
        assert len(dossier.evidence_graph.edges) == 3
