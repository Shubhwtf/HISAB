"""
Unit tests for Exception Engine & Safe Policy Gate.
"""

import pytest

from packages.domain.models import ExceptionRecord
from packages.evaluation.generator import generate_synthetic_dataset
from packages.evaluation.corruptor import inject_corruptions
from packages.controls.exception_engine import (
    run_all_controls_and_build_exceptions,
    summarize_exceptions,
)
from packages.controls.policy_gate import (
    PolicyGateConfig,
    PolicyAction,
    evaluate_policy_for_exception,
    apply_safe_resolutions,
)


class TestExceptionEngine:
    def test_clean_dataset_has_minimal_exceptions(self):
        clean_ds = generate_synthetic_dataset(record_count=100, seed=42)
        exceptions = run_all_controls_and_build_exceptions(
            batch_id="batch_clean_1",
            orders=clean_ds.orders,
            payments=clean_ds.payments,
            refunds=clean_ds.refunds,
            disputes=[],
            settlements=clean_ds.settlements,
            bank_transactions=clean_ds.bank_transactions,
            tax_records=clean_ds.tax_records,
        )
        assert len(exceptions) == 0

    def test_corrupted_dataset_finds_all_anomalies(self):
        clean_ds = generate_synthetic_dataset(record_count=500, seed=42)
        corrupted_ds = inject_corruptions(clean_ds, seed=101)

        exceptions = run_all_controls_and_build_exceptions(
            batch_id="batch_benchmark_1",
            orders=corrupted_ds.orders,
            payments=corrupted_ds.payments,
            refunds=corrupted_ds.refunds,
            disputes=corrupted_ds.disputes,
            settlements=corrupted_ds.settlements,
            bank_transactions=corrupted_ds.bank_transactions,
            tax_records=corrupted_ds.tax_records,
        )

        categories = {exc.category for exc in exceptions}
        assert "DOUBLE_LOSS" in categories
        assert "MISSING_SETTLEMENT" in categories
        assert "BANK_CREDIT_UNMATCHED" in categories
        assert "FEE_MISMATCH" in categories

        summary = summarize_exceptions(exceptions)
        assert summary.total_exceptions >= 8
        assert summary.critical_count >= 1
        assert summary.total_exposure_paise > 10000000 # > ₹1 Lakh


class TestPolicyGate:
    def test_safe_auto_resolve_allowlisted_exception(self):
        safe_exc = ExceptionRecord(
            id="exc_safe_1",
            category="BANK_CREDIT_UNMATCHED",
            severity="LOW",
            financial_impact_paise=242920, # ₹2,429.20 <= ₹5,000
            confidence=0.96,
            root_cause="Altered bank reference matching exact amount and date",
            evidence={"score": "0.96", "matched_setl": "setl_1"}
        )
        decision = evaluate_policy_for_exception(safe_exc)
        assert decision.action == PolicyAction.AUTO_RESOLVE
        assert decision.is_safe is True
        assert decision.rule_code == "POLICY_SAFE_AUTO_RESOLVE"

    def test_strictly_forbidden_double_loss_escalation(self):
        dbl_exc = ExceptionRecord(
            id="exc_dbl_1",
            category="DOUBLE_LOSS",
            severity="CRITICAL",
            financial_impact_paise=14450000,
            confidence=0.98,
            root_cause="Potential double-loss",
            evidence={"timeline": []}
        )
        decision = evaluate_policy_for_exception(dbl_exc)
        assert decision.action == PolicyAction.ESCALATE
        assert decision.is_safe is False
        assert decision.rule_code == "POLICY_FORBIDDEN_CATEGORY"

    def test_high_exposure_blocks_auto_resolve(self):
        high_val_exc = ExceptionRecord(
            id="exc_high_1",
            category="MISSING_SETTLEMENT",
            severity="HIGH",
            financial_impact_paise=7200000, # ₹72,000 > ₹5,000 limit
            confidence=0.99,
            root_cause="High value unmapped payment",
            evidence={"amount": 7200000}
        )
        decision = evaluate_policy_for_exception(high_val_exc)
        assert decision.action in (PolicyAction.HUMAN_REVIEW, PolicyAction.ESCALATE)
        assert decision.is_safe is False
        assert decision.rule_code == "POLICY_EXPOSURE_EXCEEDS_THRESHOLD"

    def test_low_confidence_blocks_auto_resolve(self):
        low_conf_exc = ExceptionRecord(
            id="exc_low_1",
            category="MISSING_SETTLEMENT",
            severity="LOW",
            financial_impact_paise=100000, # ₹1,000
            confidence=0.82, # < 0.95
            root_cause="Uncertain match",
            evidence={"amount": 100000}
        )
        decision = evaluate_policy_for_exception(low_conf_exc)
        assert decision.action == PolicyAction.HUMAN_REVIEW
        assert decision.is_safe is False
        assert decision.rule_code == "POLICY_INSUFFICIENT_CONFIDENCE"

    def test_apply_safe_resolutions_split(self):
        safe_exc = ExceptionRecord(
            id="exc_s1",
            category="MISSING_SETTLEMENT",
            severity="LOW",
            financial_impact_paise=100000,
            confidence=0.98,
            root_cause="Clean reconstructed mapping",
            evidence={"k1": "v1", "k2": "v2"}
        )
        unsafe_exc = ExceptionRecord(
            id="exc_u1",
            category="DOUBLE_LOSS",
            severity="CRITICAL",
            financial_impact_paise=14400000,
            confidence=0.98,
            root_cause="Double loss",
            evidence={"k1": "v1"}
        )

        resolved, unresolved = apply_safe_resolutions([safe_exc, unsafe_exc])
        assert len(resolved) == 1
        assert resolved[0].id == "exc_s1"
        assert resolved[0].status == "RESOLVED"
        assert len(unresolved) == 1
        assert unresolved[0].id == "exc_u1"
        assert unresolved[0].status == "ESCALATED"
