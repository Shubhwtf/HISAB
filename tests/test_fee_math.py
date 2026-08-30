"""
Unit tests for Money arithmetic and Fee/GST calculations.
"""

import pytest
from packages.domain.money import round_half_up, format_inr, format_inr_compact, Money
from packages.domain.fees import FeeSchedule, calculate_fee_and_tax, DEFAULT_FEE_SCHEDULES


class TestRoundHalfUp:
    def test_basic_rounding(self):
        assert round_half_up(100, 10) == 10
        assert round_half_up(105, 10) == 11
        assert round_half_up(104, 10) == 10

    def test_half_up_boundary(self):
        assert round_half_up(250, 100) == 3
        assert round_half_up(249, 100) == 2
        assert round_half_up(36000, 10000) == 4

    def test_negative_rounding(self):
        assert round_half_up(-250, 100) == -3
        assert round_half_up(-249, 100) == -2

    def test_zero_division_raises_error(self):
        with pytest.raises(ZeroDivisionError):
            round_half_up(100, 0)


class TestINRFormatting:
    def test_format_inr_standard(self):
        assert format_inr(100000) == "₹1,000.00"
        assert format_inr(10000000) == "₹1,00,000.00"
        assert format_inr(384200000) == "₹38,42,000.00"
        assert format_inr(99) == "₹0.99"
        assert format_inr(0) == "₹0.00"
        assert format_inr(-2360) == "-₹23.60"

    def test_format_inr_compact(self):
        assert format_inr_compact(384200000) == "₹38.42L"
        assert format_inr_compact(17300000) == "₹1.73L"
        assert format_inr_compact(1500000000) == "₹1.50Cr"
        assert format_inr_compact(15000000000) == "₹15.00Cr"
        assert format_inr_compact(5000000) == "₹50,000.00"
        assert format_inr_compact(-17300000) == "-₹1.73L"


class TestMoneyClass:
    def test_money_creation_and_properties(self):
        m = Money(paise=100000)
        assert m.paise == 100000
        assert m.formatted == "₹1,000.00"
        assert m.in_rupees == 1000.0

    def test_money_from_rupees(self):
        m = Money.from_rupees(72000.50)
        assert m.paise == 7200050
        assert m.formatted == "₹72,000.50"

    def test_money_arithmetic(self):
        m1 = Money(paise=100000)
        m2 = Money(paise=25000)
        
        sum_m = m1 + m2
        assert sum_m.paise == 125000
        assert sum_m.formatted == "₹1,250.00"

        diff_m = m1 - m2
        assert diff_m.paise == 75000
        assert diff_m.formatted == "₹750.00"

        neg_m = -m1
        assert neg_m.paise == -100000
        assert neg_m.formatted == "-₹1,000.00"

    def test_money_comparisons(self):
        m1 = Money(paise=1000)
        m2 = Money(paise=2000)
        assert m1 < m2
        assert m1 <= m2
        assert m2 > m1
        assert m2 >= m1
        assert m1 == Money(paise=1000)


class TestFeeCalculations:
    def test_standard_card_fee_calculation(self):
        breakdown = calculate_fee_and_tax(100000, DEFAULT_FEE_SCHEDULES["card"])
        assert breakdown.gross_paise == 100000
        assert breakdown.fee_paise == 2000
        assert breakdown.tax_paise == 360
        assert breakdown.total_deductions_paise == 2360
        assert breakdown.net_paise == 97640
        assert breakdown.fee_formatted == "₹20.00"
        assert breakdown.tax_formatted == "₹3.60"
        assert breakdown.net_formatted == "₹976.40"

    def test_high_value_transaction(self):
        breakdown = calculate_fee_and_tax(7200000, DEFAULT_FEE_SCHEDULES["card"])
        assert breakdown.gross_paise == 7200000
        assert breakdown.fee_paise == 144000
        assert breakdown.tax_paise == 25920
        assert breakdown.total_deductions_paise == 169920
        assert breakdown.net_paise == 7030080

    def test_upi_zero_mdr(self):
        breakdown = calculate_fee_and_tax(500000, DEFAULT_FEE_SCHEDULES["upi"])
        assert breakdown.gross_paise == 500000
        assert breakdown.fee_paise == 0
        assert breakdown.tax_paise == 0
        assert breakdown.total_deductions_paise == 0
        assert breakdown.net_paise == 500000

    def test_custom_schedule_with_fixed_fee(self):
        schedule = FeeSchedule(
            name="Custom Gateway Tier",
            mdr_bps=150,
            fixed_fee_paise=300,
            gst_bps=1800
        )
        breakdown = calculate_fee_and_tax(200000, schedule)
        assert breakdown.gross_paise == 200000
        assert breakdown.fee_paise == 3300
        assert breakdown.tax_paise == 594
        assert breakdown.total_deductions_paise == 3894
        assert breakdown.net_paise == 196106

    def test_zero_or_negative_gross(self):
        breakdown = calculate_fee_and_tax(0)
        assert breakdown.fee_paise == 0
        assert breakdown.net_paise == 0

class TestMoneyEdgeCases:
    def test_currency_mismatch_addition(self):
        m1 = Money(paise=100, currency="INR")
        m2 = Money(paise=100, currency="USD")
        with pytest.raises(ValueError):
            _ = m1 + m2

    def test_currency_mismatch_subtraction(self):
        m1 = Money(paise=100, currency="INR")
        m2 = Money(paise=100, currency="USD")
        with pytest.raises(ValueError):
            _ = m1 - m2

    def test_currency_mismatch_comparison(self):
        m1 = Money(paise=100, currency="INR")
        m2 = Money(paise=100, currency="USD")
        with pytest.raises(ValueError):
            _ = m1 < m2
        with pytest.raises(ValueError):
            _ = m1 <= m2
        with pytest.raises(ValueError):
            _ = m1 > m2
        with pytest.raises(ValueError):
            _ = m1 >= m2

    def test_money_equality_with_non_money(self):
        m = Money(paise=100)
        assert m != "100"
        assert m != 100

    def test_money_compact_property(self):
        m = Money(paise=384200000)
        assert m.compact == "₹38.42L"

class TestFeeBreakdownFormatting:
    def test_fee_breakdown_properties(self):
        breakdown = calculate_fee_and_tax(100000)
        assert breakdown.gross_formatted == "₹1,000.00"
        assert breakdown.total_deductions_formatted == "₹23.60"
