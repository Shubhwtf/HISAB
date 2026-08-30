"""
Unit tests for Deterministic Financial Effect Engine & Variance Classifier.
"""

import pytest
from packages.domain.effects import (
    VarianceClassification,
    FinancialEffect,
    calculate_payment_effect,
    calculate_refund_effect,
    calculate_settlement_batch_effect,
)
from packages.domain.fees import DEFAULT_FEE_SCHEDULES
from packages.domain.models import Payment, Refund, Dispute, Settlement


class TestPaymentEffects:
    def test_payment_exact_match(self):
        payment = Payment(
            id="pay_001",
            order_id="ord_001",
            customer_id="cust_001",
            amount_paise=100000,
            method="card"
        )
        effect = calculate_payment_effect(payment)
        assert effect.classification == VarianceClassification.EXACT_MATCH
        assert effect.is_expected_variance is True
        assert effect.fee_paise == 2000
        assert effect.tax_paise == 360
        assert effect.expected_merchant_effect_paise == 97640
        assert effect.variance_paise == 0

    def test_payment_fee_mismatch(self):
        payment = Payment(
            id="pay_002",
            order_id="ord_002",
            customer_id="cust_002",
            amount_paise=100000,
            fee_paise=5000,
            tax_paise=900,
            net_paise=94100,
            method="card"
        )
        effect = calculate_payment_effect(payment, observed_net_paise=94100)
        assert effect.classification == VarianceClassification.FEE_CALCULATION_MISMATCH
        assert effect.is_expected_variance is False
        assert effect.variance_paise == (94100 - 97640)


class TestRefundEffects:
    @pytest.fixture
    def sample_payment(self):
        return Payment(
            id="pay_100",
            order_id="ord_100",
            customer_id="cust_100",
            amount_paise=100000,
            fee_paise=2000,
            tax_paise=360,
            net_paise=97640,
            method="card",
            instrument_ref="Visa •••• 4242"
        )

    def test_expected_full_refund_variance(self, sample_payment):
        refund = Refund(
            id="rfnd_100",
            payment_id="pay_100",
            amount_paise=100000,
            source_instrument_ref="Visa •••• 4242",
            status="processed"
        )
        effect = calculate_refund_effect(refund, sample_payment)
        assert effect.classification == VarianceClassification.EXPECTED_REFUND_VARIANCE
        assert effect.is_expected_variance is True
        assert effect.expected_merchant_effect_paise == -100000
        assert effect.observed_merchant_effect_paise == -100000
        assert effect.variance_paise == 0
        assert "per Razorpay standard non-reversal policy" in effect.explanation

    def test_expected_partial_refund_variance(self, sample_payment):
        refund = Refund(
            id="rfnd_101",
            payment_id="pay_100",
            amount_paise=40000,
            source_instrument_ref="Visa •••• 4242",
            status="processed"
        )
        effect = calculate_refund_effect(refund, sample_payment)
        assert effect.classification == VarianceClassification.EXPECTED_REFUND_VARIANCE
        assert effect.is_expected_variance is True
        assert effect.expected_merchant_effect_paise == -40000

    def test_orphan_refund_without_payment(self):
        refund = Refund(
            id="rfnd_orphan",
            payment_id="pay_non_existent",
            amount_paise=50000,
            status="processed"
        )
        effect = calculate_refund_effect(refund, payment=None)
        assert effect.classification == VarianceClassification.REFUND_WITHOUT_PAYMENT
        assert effect.is_expected_variance is False
        assert effect.variance_paise == -50000

    def test_refund_source_instrument_mismatch(self, sample_payment):
        refund = Refund(
            id="rfnd_mismatch",
            payment_id="pay_100",
            amount_paise=100000,
            source_instrument_ref="Mastercard •••• 9999",
            status="processed"
        )
        effect = calculate_refund_effect(refund, sample_payment)
        assert effect.classification == VarianceClassification.REFUND_SOURCE_MISMATCH
        assert effect.is_expected_variance is False

    def test_duplicate_full_refund(self, sample_payment):
        prior_refund = Refund(
            id="rfnd_prior",
            payment_id="pay_100",
            amount_paise=100000,
            source_instrument_ref="Visa •••• 4242"
        )
        second_refund = Refund(
            id="rfnd_dup",
            payment_id="pay_100",
            amount_paise=100000,
            source_instrument_ref="Visa •••• 4242"
        )
        effect = calculate_refund_effect(
            refund=second_refund,
            payment=sample_payment,
            prior_refunds_on_payment=[prior_refund]
        )
        assert effect.classification == VarianceClassification.DUPLICATE_REFUND
        assert effect.is_expected_variance is False
        assert effect.variance_paise == -100000

    def test_cumulative_over_refund_amount_mismatch(self, sample_payment):
        prior_refund = Refund(
            id="rfnd_p1",
            payment_id="pay_100",
            amount_paise=70000,
            source_instrument_ref="Visa •••• 4242"
        )
        second_refund = Refund(
            id="rfnd_p2",
            payment_id="pay_100",
            amount_paise=50000,
            source_instrument_ref="Visa •••• 4242"
        )
        effect = calculate_refund_effect(
            refund=second_refund,
            payment=sample_payment,
            prior_refunds_on_payment=[prior_refund]
        )
        assert effect.classification == VarianceClassification.REFUND_AMOUNT_MISMATCH
        assert effect.is_expected_variance is False
        assert effect.variance_paise == -20000

    def test_unexpected_refund_variance(self, sample_payment):
        refund = Refund(
            id="rfnd_unexp",
            payment_id="pay_100",
            amount_paise=50000,
            source_instrument_ref="Visa •••• 4242"
        )
        effect = calculate_refund_effect(
            refund=refund,
            payment=sample_payment,
            observed_debit_paise=-55000
        )
        assert effect.classification == VarianceClassification.UNEXPECTED_REFUND_VARIANCE
        assert effect.is_expected_variance is False
        assert effect.variance_paise == -5000


class TestSettlementBatchEffects:
    def test_reconciled_settlement_batch(self):
        p1 = Payment(id="p1", order_id="o1", customer_id="c1", amount_paise=100000, method="card")
        p2 = Payment(id="p2", order_id="o2", customer_id="c2", amount_paise=200000, method="card")
        r1 = Refund(id="r1", payment_id="p1", amount_paise=50000)
        
        settlement = Settlement(
            id="setl_001",
            gross_amount_paise=300000,
            fee_amount_paise=6000,
            tax_amount_paise=1080,
            refund_amount_paise=50000,
            amount_paise=242920,
            status="settled"
        )

        batch_effect = calculate_settlement_batch_effect(
            settlement=settlement,
            payments=[p1, p2],
            refunds=[r1],
            disputes=[]
        )

        assert batch_effect.is_reconciled is True
        assert batch_effect.expected_net_settlement_paise == 242920
        assert batch_effect.observed_net_settlement_paise == 242920
        assert batch_effect.variance_paise == 0
        assert len(batch_effect.discrepancies) == 0

    def test_settlement_batch_with_dispute_and_variance(self):
        p1 = Payment(id="p1", order_id="o1", customer_id="c1", amount_paise=100000, method="card")
        d1 = Dispute(id="d1", payment_id="p1", amount_paise=100000, deduction_amount_paise=100000)

        settlement = Settlement(
            id="setl_002",
            amount_paise=0,
            status="settled"
        )

        batch_effect = calculate_settlement_batch_effect(
            settlement=settlement,
            payments=[p1],
            refunds=[],
            disputes=[d1]
        )

        assert batch_effect.is_reconciled is False
        assert batch_effect.expected_net_settlement_paise == -2360
        assert batch_effect.variance_paise == 2360
        assert len(batch_effect.discrepancies) > 0

class TestEffectFormattingAndDiscrepancies:
    def test_financial_effect_properties(self):
        payment = Payment(id="p1", order_id="o1", customer_id="c1", amount_paise=100000)
        effect = calculate_payment_effect(payment)
        assert effect.gross_formatted == "₹1,000.00"
        assert effect.expected_formatted == "₹976.40"
        assert effect.observed_formatted == "₹976.40"
        assert effect.variance_formatted == "₹0.00"

    def test_settlement_batch_properties_and_discrepancies(self):
        p1 = Payment(id="p1", order_id="o1", customer_id="c1", amount_paise=100000)
        r1 = Refund(id="r1", payment_id="p1", amount_paise=20000)
        
        settlement = Settlement(
            id="setl_disc",
            gross_amount_paise=90000,
            fee_amount_paise=1000,
            tax_amount_paise=180,
            refund_amount_paise=10000,
            amount_paise=78820
        )
        batch_effect = calculate_settlement_batch_effect(
            settlement=settlement,
            payments=[p1],
            refunds=[r1],
            disputes=[]
        )
        assert batch_effect.expected_net_formatted == "₹776.40"
        assert batch_effect.observed_net_formatted == "₹788.20"
        assert batch_effect.variance_formatted == "₹11.80"
        assert len(batch_effect.discrepancies) >= 3
