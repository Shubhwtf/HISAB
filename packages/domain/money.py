"""
HISAB — Integer-Safe Financial Arithmetic & Formatting Utilities.

All financial calculations in HISAB are executed in minor currency units (paise).
Floating point arithmetic is strictly forbidden for financial calculations to prevent
IEEE 754 precision drift.
"""

from typing import Union
from pydantic import BaseModel, Field


def round_half_up(numerator: int, denominator: int) -> int:
    """
    Perform integer division with standard half-up rounding (symmetric round-half-up).
    
    Examples:
        round_half_up(250, 100) -> 3 (2.5 -> 3)
        round_half_up(249, 100) -> 2 (2.49 -> 2)
        round_half_up(36000, 10000) -> 4 (3.6 -> 4)
    """
    if denominator == 0:
        raise ZeroDivisionError("Denominator cannot be zero in financial rounding.")
    if numerator >= 0:
        return (numerator * 2 + denominator) // (denominator * 2)
    else:
        return -((-numerator * 2 + denominator) // (denominator * 2))


def format_inr(paise: int, show_symbol: bool = True) -> str:
    """
    Format integer paise into standard Indian comma-separated currency representation.
    
    Examples:
        format_inr(100000) -> "₹1,000.00"
        format_inr(10000000) -> "₹1,00,000.00"
        format_inr(-2360) -> "-₹23.60"
    """
    is_negative = paise < 0
    abs_paise = abs(paise)
    rupees = abs_paise // 100
    remainder_paise = abs_paise % 100
    
    rupee_str = str(rupees)
    if len(rupee_str) <= 3:
        formatted_rupees = rupee_str
    else:
        last_three = rupee_str[-3:]
        remaining = rupee_str[:-3]
        groups = []
        while remaining:
            groups.append(remaining[-2:])
            remaining = remaining[:-2]
        formatted_rupees = ",".join(reversed(groups)) + "," + last_three

    result = f"{formatted_rupees}.{remainder_paise:02d}"
    prefix = "₹" if show_symbol else ""
    return f"-{prefix}{result}" if is_negative else f"{prefix}{result}"


def parse_inr_to_paise(val: Union[str, int, float]) -> int:
    """
    Parses currency strings (e.g. '₹1,500.00', '1500.50', '1500') or numbers into integer paise.
    """
    if isinstance(val, int):
        return val
    if isinstance(val, float):
        return round_half_up(int(round(val * 100)), 1)
    
    clean = str(val).replace("₹", "").replace(",", "").strip()
    try:
        if "." in clean:
            return int(round(float(clean) * 100))
        return int(clean) * 100 if int(clean) < 100000 else int(clean)
    except Exception:
        return 0


def format_inr_compact(paise: int) -> str:
    """
    Format integer paise into compact Indian financial notations (Lakhs, Crores).
    
    Examples:
        format_inr_compact(384200000) -> "₹38.42L"
        format_inr_compact(17300000) -> "₹1.73L"
        format_inr_compact(1500000000) -> "₹15.00Cr"
        format_inr_compact(5000000) -> "₹50,000"
    """
    is_negative = paise < 0
    abs_paise = abs(paise)
    abs_rupees = abs_paise / 100.0

    if abs_rupees >= 10000000:
        cr = abs_rupees / 10000000.0
        val_str = f"₹{cr:.2f}Cr"
    elif abs_rupees >= 100000:
        lakh = abs_rupees / 100000.0
        val_str = f"₹{lakh:.2f}L"
    else:
        val_str = format_inr(abs_paise)

    return f"-{val_str}" if is_negative else val_str


class Money(BaseModel):
    """
    Typed minor-unit monetary representation.
    """
    paise: int = Field(default=0, description="Amount in integer paise (1 INR = 100 paise)")
    currency: str = Field(default="INR", description="ISO 4217 Currency Code")

    @property
    def formatted(self) -> str:
        return format_inr(self.paise)

    @property
    def compact(self) -> str:
        return format_inr_compact(self.paise)

    @property
    def in_rupees(self) -> float:
        return self.paise / 100.0

    @classmethod
    def from_rupees(cls, rupees: Union[int, float], currency: str = "INR") -> "Money":
        """
        Safely convert floating or integer rupees to integer paise.
        """
        paise = round(rupees * 100)
        return cls(paise=paise, currency=currency)

    def __add__(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError(f"Cannot add different currencies: {self.currency} and {other.currency}")
        return Money(paise=self.paise + other.paise, currency=self.currency)

    def __sub__(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError(f"Cannot subtract different currencies: {self.currency} and {other.currency}")
        return Money(paise=self.paise - other.paise, currency=self.currency)

    def __neg__(self) -> "Money":
        return Money(paise=-self.paise, currency=self.currency)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Money):
            return False
        return self.paise == other.paise and self.currency == other.currency

    def __lt__(self, other: "Money") -> bool:
        if self.currency != other.currency:
            raise ValueError("Cannot compare different currencies")
        return self.paise < other.paise

    def __le__(self, other: "Money") -> bool:
        if self.currency != other.currency:
            raise ValueError("Cannot compare different currencies")
        return self.paise <= other.paise

    def __gt__(self, other: "Money") -> bool:
        if self.currency != other.currency:
            raise ValueError("Cannot compare different currencies")
        return self.paise > other.paise

    def __ge__(self, other: "Money") -> bool:
        if self.currency != other.currency:
            raise ValueError("Cannot compare different currencies")
        return self.paise >= other.paise
