"""
Unit tests for Synthetic Data Generator, Corruption Engine, and Seeder.
"""

import pytest
from packages.evaluation.generator import generate_synthetic_dataset, export_razorpay_recon_csv
from packages.evaluation.corruptor import inject_corruptions


class TestDataGenerator:
    def test_clean_dataset_generation_and_determinism(self):
        ds1 = generate_synthetic_dataset(record_count=500, seed=42)
        ds2 = generate_synthetic_dataset(record_count=500, seed=42)

        assert ds1.total_record_count > 500
        assert len(ds1.customers) == 40
        assert len(ds1.payments) == len(ds2.payments)
        assert ds1.payments[0].id == ds2.payments[0].id
        assert ds1.payments[0].amount_paise == ds2.payments[0].amount_paise
        assert len(ds1.settlements) == 15
        assert len(ds1.bank_transactions) == 15

    def test_export_razorpay_recon_csv(self):
        ds = generate_synthetic_dataset(record_count=100, seed=42)
        csv_content = export_razorpay_recon_csv(ds)
        
        assert "entity_id,type,debit,credit,amount,fee,tax" in csv_content
        assert "setl_8800" in csv_content
        assert len(csv_content.splitlines()) > 50


class TestDataCorruption:
    def test_inject_corruptions_manifest(self):
        clean_ds = generate_synthetic_dataset(record_count=500, seed=42)
        corrupted_ds = inject_corruptions(clean_ds, seed=101)

        anomalies = [gt for gt in corrupted_ds.ground_truth.values() if gt.is_anomaly]
        assert len(anomalies) >= 8

        # 1. Verify Double-Loss anomaly injection
        double_loss_cases = [gt for gt in anomalies if gt.anomaly_type == "DOUBLE_LOSS"]
        assert len(double_loss_cases) >= 1
        assert double_loss_cases[0].expected_resolution == "ESCALATE"
        assert double_loss_cases[0].expected_financial_impact_paise >= 14400000

        # 2. Verify Missing Settlement Mapping injection
        missing_setl = [gt for gt in anomalies if gt.anomaly_type == "MISSING_SETTLEMENT"]
        assert len(missing_setl) == 5

        # 3. Verify Bank Credit Unmatched (Altered UTR) injection
        unmatched_bank = [gt for gt in anomalies if gt.anomaly_type == "BANK_CREDIT_UNMATCHED"]
        assert len(unmatched_bank) >= 1

        # 4. Verify Duplicate Payment injection
        dup_payments = [gt for gt in anomalies if gt.anomaly_type == "DUPLICATE_PAYMENT"]
        assert len(dup_payments) >= 1

        # 5. Verify Fee Mismatch injection
        fee_mismatches = [gt for gt in anomalies if gt.anomaly_type == "FEE_MISMATCH"]
        assert len(fee_mismatches) >= 1

        # 6. Verify Tax Reconciliation Mismatch injection
        tax_mismatches = [gt for gt in anomalies if gt.anomaly_type == "TAX_RECONCILIATION"]
        assert len(tax_mismatches) >= 1

    def test_double_loss_injection_when_no_prior_refund_exists(self):
        clean_ds = generate_synthetic_dataset(record_count=100, seed=99)
        # Clear all refunds to force creation of new refund in double-loss injector
        clean_ds.refunds = []
        corrupted_ds = inject_corruptions(clean_ds, seed=99)
        dbl_cases = [gt for gt in corrupted_ds.ground_truth.values() if gt.anomaly_type == "DOUBLE_LOSS"]
        assert len(dbl_cases) >= 1
