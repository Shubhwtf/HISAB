"""
HISAB — Parameterized Fee & Tax Engine.

Encodes Razorpay MDR and GST calculation rules with deterministic integer arithmetic.
MDR and GST rates are parameterized in basis points (1 bps = 0.01% = 0.0001).
Standard GST on payment processing fees in India is 18.0% (1800 bps).
"""

from typing import Dict, Optional
from pydantic import BaseModel, Field
from packages.domain.money import round_half_up, format_inr


class FeeSchedule(BaseModel):
    """
    Configurable fee schedule for payment processing.
    Rates are stored in basis points (e.g., 200 bps = 2.00%, 1800 bps = 18.00%).
    """
    name: str = Field(default="Standard Domestic Card", description="Name of fee tier")
    mdr_bps: int = Field(default=200, ge=0, description="Merchant Discount Rate in basis points (200 = 2.0%)")
    fixed_fee_paise: int = Field(default=0, ge=0, description="Fixed flat fee per transaction in paise")
    gst_bps: int = Field(default=1800, ge=0, description="GST rate levied on processing fee in basis points (1800 = 18%)")


class FeeBreakdown(BaseModel):
    """
    Detailed deterministic breakdown of transaction fee deductions.
    """
    gross_paise: int = Field(description="Gross captured amount in paise")
    fee_paise: int = Field(description="MDR processing fee in paise")
    tax_paise: int = Field(description="GST on processing fee in paise")
    total_deductions_paise: int = Field(description="Total deductions (fee + tax) in paise")
    net_paise: int = Field(description="Net expected merchant settlement credit in paise")
    schedule_name: str = Field(description="Applied fee schedule name")

    @property
    def gross_formatted(self) -> str:
        return format_inr(self.gross_paise)

    @property
    def fee_formatted(self) -> str:
        return format_inr(self.fee_paise)

    @property
    def tax_formatted(self) -> str:
        return format_inr(self.tax_paise)

    @property
    def total_deductions_formatted(self) -> str:
        return format_inr(self.total_deductions_paise)

    @property
    def net_formatted(self) -> str:
        return format_inr(self.net_paise)


# Standard default schedules
DEFAULT_FEE_SCHEDULES: Dict[str, FeeSchedule] = {
    "card": FeeSchedule(name="Standard Domestic Card", mdr_bps=200, fixed_fee_paise=0, gst_bps=1800),
    "upi": FeeSchedule(name="Standard UPI P2M", mdr_bps=0, fixed_fee_paise=0, gst_bps=1800),
    "netbanking": FeeSchedule(name="Domestic Netbanking", mdr_bps=180, fixed_fee_paise=0, gst_bps=1800),
    "international": FeeSchedule(name="International Card", mdr_bps=300, fixed_fee_paise=0, gst_bps=1800),
}


def calculate_fee_and_tax(
    gross_paise: int,
    fee_schedule: Optional[FeeSchedule] = None,
) -> FeeBreakdown:
    """
    Deterministically calculates MDR fee and GST on fee using integer rounding rules.
    
    Formula:
        fee_paise = round_half_up(gross_paise * mdr_bps, 10000) + fixed_fee_paise
        tax_paise = round_half_up(fee_paise * gst_bps, 10000)
        net_paise = gross_paise - fee_paise - tax_paise
    
    Example (₹1,000 transaction with 2% MDR + 18% GST):
        gross_paise = 100000
        fee_paise = round_half_up(100000 * 200, 10000) = 2000 paise (₹20.00)
        tax_paise = round_half_up(2000 * 1800, 10000) = 360 paise (₹3.60)
        net_paise = 100000 - 2000 - 360 = 97640 paise (₹976.40)
    """
    schedule = fee_schedule or DEFAULT_FEE_SCHEDULES["card"]
    
    if gross_paise <= 0:
        return FeeBreakdown(
            gross_paise=gross_paise,
            fee_paise=0,
            tax_paise=0,
            total_deductions_paise=0,
            net_paise=gross_paise,
            schedule_name=schedule.name,
        )

    # 1. Calculate MDR fee: (gross * bps) / 10000
    variable_fee_paise = round_half_up(gross_paise * schedule.mdr_bps, 10000)
    total_fee_paise = variable_fee_paise + schedule.fixed_fee_paise

    # 2. Calculate GST on processing fee: (fee * gst_bps) / 10000
    tax_paise = round_half_up(total_fee_paise * schedule.gst_bps, 10000)

    # 3. Calculate total deductions and net credit
    total_deductions_paise = total_fee_paise + tax_paise
    net_paise = gross_paise - total_deductions_paise

    return FeeBreakdown(
        gross_paise=gross_paise,
        fee_paise=total_fee_paise,
        tax_paise=tax_paise,
        total_deductions_paise=total_deductions_paise,
        net_paise=net_paise,
        schedule_name=schedule.name,
    )
