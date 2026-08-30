"""
Unit tests for Canonical Domain Models.
"""

from datetime import datetime, timezone
import pytest
from pydantic import ValidationError
from packages.domain.models import (
    Customer,
    Order,
    PaymentInstrument,
    Payment,
    Refund,
    Dispute,
    Settlement,
    SettlementLine,
    BankTransaction,
    TaxRecord,
    ExceptionRecord,
    EvidenceEdge,
    EvidenceGraph,
)


class TestCanonicalModels:
    def test_customer_and_order_creation(self):
        cust = Customer(
            id="cust_101",
            name="Rahul Sharma",
            email="rahul@example.com",
            contact="+919876543210"
        )
        assert cust.id == "cust_101"

        order = Order(
            id="order_10482",
            customer_id=cust.id,
            amount_paise=7200000,
            amount_paid_paise=7200000,
            receipt="rcpt_10482",
            status="paid"
        )
        assert order.amount_formatted == "₹72,000.00"

    def test_payment_and_instrument_masking(self):
        inst = PaymentInstrument(
            type="card",
            network="Visa",
            masked_number="•••• 4242",
            bank="HDFC"
        )
        assert inst.masked_number == "•••• 4242"

        payment = Payment(
            id="pay_91231",
            order_id="order_10482",
            customer_id="cust_101",
            amount_paise=7200000,
            fee_paise=144000,
            tax_paise=25920,
            net_paise=7030080,
            method="card",
            instrument_ref="Visa •••• 4242",
            instrument_details=inst,
            status="captured"
        )
        assert payment.amount_formatted == "₹72,000.00"
        assert payment.net_formatted == "₹70,300.80"

    def test_refund_creation(self):
        rfnd = Refund(
            id="rfnd_3321",
            payment_id="pay_91231",
            order_id="order_10482",
            amount_paise=7200000,
            source_instrument_ref="Visa •••• 4242",
            status="processed"
        )
        assert rfnd.amount_formatted == "₹72,000.00"
        assert rfnd.source_instrument_ref == "Visa •••• 4242"

    def test_dispute_exposure_calculation(self):
        disp = Dispute(
            id="disp_5512",
            payment_id="pay_91231",
            order_id="order_10482",
            amount_paise=7200000,
            deduction_amount_paise=7200000,
            fee_paise=50000,
            status="open"
        )
        assert disp.amount_formatted == "₹72,000.00"
        assert disp.total_exposure_paise == 7250000
        assert disp.exposure_formatted == "₹72,500.00"

    def test_settlement_net_invariant(self):
        settlement = Settlement(
            id="setl_8842",
            utr="UTR778210992",
            gross_amount_paise=10000000,
            fee_amount_paise=200000,
            tax_amount_paise=36000,
            refund_amount_paise=1000000,
            adjustment_amount_paise=0,
            dispute_amount_paise=0,
            amount_paise=8764000,
            status="settled"
        )
        assert settlement.calculate_computed_net_paise() == 8764000
        assert settlement.amount_formatted == "₹87,640.00"
        assert settlement.amount_compact == "₹87,640.00"

    def test_bank_transaction_and_tax_record(self):
        bank_tx = BankTransaction(
            id="bnk_9001",
            date=datetime.now(timezone.utc),
            amount_paise=8764000,
            direction="credit",
            reference="UTR778210992",
            description="CMS/RAZORPAY/SETL8842/UTR778210992"
        )
        assert bank_tx.amount_formatted == "₹87,640.00"

        tax_rec = TaxRecord(
            id="tax_2024_01",
            gross_amount_credited_paise=10000000,
            tds_deducted_paise=10000,
            tds_rate_bps=10
        )
        assert tax_rec.tds_formatted == "₹100.00"

    def test_exception_record_and_evidence_graph(self):
        exc = ExceptionRecord(
            id="exc_1001",
            category="DOUBLE_LOSS",
            severity="CRITICAL",
            financial_impact_paise=14400000,
            confidence=0.98,
            root_cause="Independent refund and dispute events detected on same order",
            recommendation="ESCALATE"
        )
        assert exc.impact_formatted == "₹1,44,000.00"

        edge = EvidenceEdge(
            source_id="pay_91231",
            target_id="setl_8842",
            relationship="PAYMENT_INCLUDED_IN_SETTLEMENT",
            proof_items=["Payment ID in recon report", "Expected net matches line amount"]
        )
        graph = EvidenceGraph(nodes=[{"id": "pay_91231"}], edges=[edge])
        assert len(graph.edges) == 1

    def test_invalid_negative_constraints(self):
        with pytest.raises(ValidationError):
            Order(id="ord_1", customer_id="c_1", amount_paise=-100)
