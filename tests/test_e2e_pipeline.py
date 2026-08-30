"""
End-to-End Integration Tests for Full HISAB Financial Pipeline.
"""

from datetime import datetime, timezone
import pytest
from sqlalchemy import select

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
    AuditEntryDB,
)
from packages.domain.audit_ledger import verify_audit_chain, append_audit_entry
from packages.evaluation.generator import generate_synthetic_dataset
from packages.evaluation.corruptor import inject_corruptions
from packages.matching.batch_decomposition import decompose_and_reconstruct_batches
from packages.controls.exception_engine import (
    run_all_controls_and_build_exceptions,
    summarize_exceptions,
)
from packages.controls.policy_gate import apply_safe_resolutions, PolicyGateConfig
from packages.controls.double_loss_detector import detect_double_loss_for_order
from packages.controls.evidence_graph_builder import build_evidence_graph_for_payment
from packages.evaluation.benchmark import run_comprehensive_benchmark


@pytest.fixture(autouse=True)
def setup_db():
    reset_db_sync()
    yield


class TestEndToEndPipeline:
    def test_full_reconciliation_lifecycle(self):
        # 1. Generate & Corrupt Dataset
        clean_ds = generate_synthetic_dataset(record_count=500, seed=42)
        corrupted_ds = inject_corruptions(clean_ds, seed=101)

        assert corrupted_ds.total_record_count > 500

        # 2. Batch Decomposition & Reconstruction
        batch_results, unmapped = decompose_and_reconstruct_batches(
            settlements=corrupted_ds.settlements,
            payments=corrupted_ds.payments,
            refunds=corrupted_ds.refunds,
            disputes=corrupted_ds.disputes,
        )

        reconstructed_count = sum(len(res.reconstructed_mappings) for res in batch_results)
        assert reconstructed_count >= 1

        # 3. Double-Loss Detection
        double_loss_alerts = []
        for o in corrupted_ds.orders:
            alert = detect_double_loss_for_order(
                o, corrupted_ds.payments, corrupted_ds.refunds, corrupted_ds.disputes
            )
            if alert:
                double_loss_alerts.append(alert)

        assert len(double_loss_alerts) >= 1
        assert double_loss_alerts[0].total_potential_exposure_paise >= 14400000

        # 4. Controls Execution & Exception Aggregation
        exceptions = run_all_controls_and_build_exceptions(
            batch_id="e2e_batch_01",
            orders=corrupted_ds.orders,
            payments=corrupted_ds.payments,
            refunds=corrupted_ds.refunds,
            disputes=corrupted_ds.disputes,
            settlements=corrupted_ds.settlements,
            bank_transactions=corrupted_ds.bank_transactions,
            tax_records=corrupted_ds.tax_records,
        )

        summary = summarize_exceptions(exceptions)
        assert summary.total_exceptions >= 8
        assert summary.critical_count >= 1

        # 5. Safe Policy Gating
        resolved, unresolved = apply_safe_resolutions(exceptions, PolicyGateConfig())
        assert len(resolved) >= 1
        assert len(unresolved) >= 1
        # Double loss must remain unresolved (for human escalation)
        assert any(u.category == "DOUBLE_LOSS" for u in unresolved)

        # 6. Cryptographic Audit Ledger Verification
        with get_sync_db() as db:
            append_audit_entry(
                db=db,
                case_id="e2e_batch_01",
                event_type="BATCH_RECONCILIATION",
                action="RUN_E2E_PIPELINE",
                policy_result="COMPLETED",
                reason_code="E2E_TEST_VERIFIED",
                payload={"exceptions_count": len(exceptions), "resolved_count": len(resolved)},
                batch_id="e2e_batch_01",
                actor_type="TEST_RUNNER",
            )
            entries = list(db.scalars(select(AuditEntryDB).order_by(AuditEntryDB.sequence.asc())).all())
            is_valid, err = verify_audit_chain(entries)
            assert is_valid is True
            assert err is None

        # 7. Benchmark Verification
        report = run_comprehensive_benchmark(corrupted_ds)
        assert report.baseline_c_hisab.precision == 1.0
        assert report.baseline_c_hisab.recall == 1.0
        assert report.baseline_c_hisab.f1_score == 1.0
