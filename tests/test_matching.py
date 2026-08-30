"""
Unit tests for Matching Engine & Batch Decomposition.
"""

from datetime import datetime, timedelta, timezone
import pytest

from packages.domain.models import Order, Payment, Refund, Dispute, Settlement, BankTransaction
from packages.matching.exact_matcher import (
    match_payments_to_orders,
    match_refunds_to_payments,
    match_disputes_to_payments,
    match_settlements_to_bank_by_utr,
)
from packages.matching.constraint_matcher import (
    levenshtein_similarity,
    match_settlement_to_bank_fuzzy,
)
from packages.matching.batch_decomposition import (
    find_subset_sum_exact,
    decompose_and_reconstruct_batches,
)


class TestExactMatcher:
    def test_payment_order_matching(self):
        o1 = Order(id="ord_1", customer_id="c1", amount_paise=100000)
        p1 = Payment(id="pay_1", order_id="ord_1", customer_id="c1", amount_paise=100000)
        p2 = Payment(id="pay_2", order_id="ord_unmatched", customer_id="c1", amount_paise=200000)

        matches, unmatched = match_payments_to_orders([p1, p2], [o1])
        assert len(matches) == 1
        assert matches[0].source_id == "ord_1"
        assert matches[0].target_id == "pay_1"
        assert len(unmatched) == 1
        assert unmatched[0].id == "pay_2"

    def test_refund_payment_matching(self):
        p1 = Payment(id="pay_1", order_id="ord_1", customer_id="c1", amount_paise=100000, instrument_ref="Visa •••• 4242")
        r1 = Refund(id="rfnd_1", payment_id="pay_1", amount_paise=100000, source_instrument_ref="Visa •••• 4242")
        r2 = Refund(id="rfnd_2", payment_id="pay_orphan", amount_paise=50000)

        matches, unmatched = match_refunds_to_payments([r1, r2], [p1])
        assert len(matches) == 1
        assert matches[0].confidence == 1.0
        assert len(unmatched) == 1

    def test_dispute_payment_matching(self):
        p1 = Payment(id="pay_1", order_id="ord_1", customer_id="c1", amount_paise=100000)
        d1 = Dispute(id="disp_1", payment_id="pay_1", amount_paise=100000)

        matches, unmatched = match_disputes_to_payments([d1], [p1])
        assert len(matches) == 1
        assert matches[0].target_id == "disp_1"

    def test_settlement_bank_utr_matching(self):
        s1 = Settlement(id="setl_1", utr="UTR123456", amount_paise=4882000)
        b1 = BankTransaction(id="bnk_1", date=datetime.now(timezone.utc), amount_paise=4882000, direction="credit", reference="UTR123456")
        b2 = BankTransaction(id="bnk_2", date=datetime.now(timezone.utc), amount_paise=5000000, direction="credit", reference="UTR999999")

        matches, un_setl, un_bank = match_settlements_to_bank_by_utr([s1], [b1, b2])
        assert len(matches) == 1
        assert matches[0].source_id == "setl_1"
        assert matches[0].target_id == "bnk_1"
        assert len(un_setl) == 0
        assert len(un_bank) == 1


class TestConstraintAndFuzzyMatcher:
    def test_levenshtein_similarity(self):
        assert levenshtein_similarity("UTR123456", "UTR123456") == 1.0
        assert levenshtein_similarity("UTR123456", "UTR123456_MOD") >= 0.65
        assert levenshtein_similarity("", "abc") == 0.0

    def test_fuzzy_bank_matching_altered_utr(self):
        now = datetime.now(timezone.utc)
        s1 = Settlement(id="setl_10", utr="UTR778211000", amount_paise=242920, settled_at=now)
        # Bank has altered UTR with _MOD suffix but same amount and date
        b1 = BankTransaction(
            id="bnk_10",
            date=now + timedelta(hours=2),
            amount_paise=242920,
            direction="credit",
            reference="UTR778211000_MOD",
            description="CMS/RAZORPAY/SETTLEMENT/UTR778211000_MOD"
        )

        matches, un_setl, un_bank = match_settlement_to_bank_fuzzy([s1], [b1])
        assert len(matches) == 1
        assert matches[0].source_id == "setl_10"
        assert matches[0].target_id == "bnk_10"
        assert matches[0].confidence >= 0.90
        assert len(un_setl) == 0

    def test_narration_settlement_extraction(self):
        now = datetime.now(timezone.utc)
        s1 = Settlement(id="setl_8842", utr=None, amount_paise=1000000, settled_at=now)
        b1 = BankTransaction(
            id="bnk_20",
            date=now,
            amount_paise=1000000,
            direction="credit",
            reference="UNKNOWN_REF",
            description="CMS/RAZORPAY/SETL_8842/TRANSFER"
        )

        matches, un_setl, un_bank = match_settlement_to_bank_fuzzy([s1], [b1])
        assert len(matches) == 1
        assert matches[0].source_id == "setl_8842"
        assert matches[0].confidence >= 0.95


class TestBatchDecompositionAndReconstruction:
    def test_subset_sum_exact(self):
        p1 = Payment(id="p1", order_id="o1", customer_id="c1", amount_paise=100000) # ₹1000
        p2 = Payment(id="p2", order_id="o2", customer_id="c2", amount_paise=250000) # ₹2500
        p3 = Payment(id="p3", order_id="o3", customer_id="c3", amount_paise=500000) # ₹5000

        result = find_subset_sum_exact([p1, p2, p3], target_paise=350000)
        assert result is not None
        assert len(result) == 2
        assert {p.id for p in result} == {"p1", "p2"}

    def test_batch_reconstruction_for_unmapped_payment(self):
        now = datetime.now(timezone.utc)
        # Settlement with gross = ₹3,500 (350000 paise)
        s1 = Settlement(
            id="setl_recon_1",
            utr="UTR_RECON_1",
            gross_amount_paise=350000,
            fee_amount_paise=7000,
            tax_amount_paise=1260,
            amount_paise=341740,
            settled_at=now
        )
        
        # Payment 1 is already linked to s1 (gross ₹1,000)
        p1 = Payment(id="p1", order_id="o1", customer_id="c1", amount_paise=100000, settlement_id="setl_recon_1", captured_at=now - timedelta(days=1))
        # Payment 2 has lost its settlement_id (gross ₹2,500)
        p2 = Payment(id="p2", order_id="o2", customer_id="c2", amount_paise=250000, settlement_id=None, captured_at=now - timedelta(days=1))

        results, unmapped = decompose_and_reconstruct_batches(
            settlements=[s1],
            payments=[p1, p2],
            refunds=[],
            disputes=[]
        )

        assert len(results) == 1
        assert results[0].is_fully_reconciled is True
        assert len(results[0].reconstructed_mappings) == 1
        assert results[0].reconstructed_mappings[0].payment_id == "p2"
        assert len(unmapped) == 0
