"""
HISAB — Canonical Financial Domain Models.

Strongly-typed Pydantic v2 domain schemas aligned with Razorpay production API standards,
RBI banking specifications, and Indian Income Tax Section 194-O statutory standards.
All monetary amounts are strictly held in integer paise.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field
from packages.domain.money import format_inr, format_inr_compact


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Customer(BaseModel):
    id: str = Field(description="Razorpay customer ID (cust_xxxx)")
    name: str = Field(description="Customer full name")
    email: str = Field(description="Customer email address")
    contact: str = Field(description="Customer phone number (E.164 / Indian mobile)")
    created_at: datetime = Field(default_factory=utc_now)


class Order(BaseModel):
    id: str = Field(description="Razorpay order ID (order_xxxx)")
    customer_id: str = Field(description="Foreign key to Customer")
    amount_paise: int = Field(ge=0, description="Order total in paise")
    amount_paid_paise: int = Field(default=0, ge=0, description="Total amount paid against order")
    currency: str = Field(default="INR", description="ISO currency code")
    receipt: Optional[str] = Field(default=None, description="Merchant internal order/receipt reference")
    status: Literal["created", "attempted", "paid"] = Field(default="created")
    created_at: datetime = Field(default_factory=utc_now)

    @property
    def amount_formatted(self) -> str:
        return format_inr(self.amount_paise)


class PaymentInstrument(BaseModel):
    """
    Masked representation of payment source instrument for refund and audit tracking.
    Never stores raw PAN or sensitive credentials.
    """
    type: Literal["card", "upi", "netbanking", "wallet"] = Field(description="Payment method type")
    network: Optional[str] = Field(default=None, description="Card network (Visa, Mastercard, RuPay)")
    masked_number: Optional[str] = Field(default=None, description="Masked card (e.g. •••• 4242)")
    vpa_hash: Optional[str] = Field(default=None, description="Tokenized/masked UPI handle (e.g. user***@okhdfcbank)")
    bank: Optional[str] = Field(default=None, description="Issuing bank code (e.g. HDFC, ICIC, SBIN)")


class Payment(BaseModel):
    id: str = Field(description="Razorpay payment ID (pay_xxxx)")
    order_id: str = Field(description="Foreign key to Order")
    customer_id: str = Field(description="Foreign key to Customer")
    amount_paise: int = Field(ge=0, description="Gross captured transaction amount in paise")
    currency: str = Field(default="INR", description="ISO currency code")
    status: Literal["captured", "failed", "refunded", "partially_refunded"] = Field(default="captured")
    method: Literal["card", "upi", "netbanking", "wallet"] = Field(default="card")
    instrument_ref: Optional[str] = Field(default=None, description="Masked instrument summary reference")
    instrument_details: Optional[PaymentInstrument] = Field(default=None)
    fee_paise: int = Field(default=0, ge=0, description="Razorpay MDR processing fee in paise")
    tax_paise: int = Field(default=0, ge=0, description="GST on processing fee in paise")
    net_paise: int = Field(default=0, description="Gross - fee - tax in paise")
    error_code: Optional[str] = Field(default=None)
    error_description: Optional[str] = Field(default=None)
    settlement_id: Optional[str] = Field(default=None, description="Assigned settlement batch ID")
    captured_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)

    @property
    def amount_formatted(self) -> str:
        return format_inr(self.amount_paise)

    @property
    def net_formatted(self) -> str:
        return format_inr(self.net_paise)


class Refund(BaseModel):
    id: str = Field(description="Razorpay refund ID (rfnd_xxxx)")
    payment_id: str = Field(description="Foreign key to parent Payment")
    order_id: Optional[str] = Field(default=None, description="Associated commercial Order ID")
    amount_paise: int = Field(ge=0, description="Amount returned to customer in paise")
    currency: str = Field(default="INR", description="ISO currency code")
    status: Literal["processed", "pending", "failed"] = Field(default="processed")
    speed: Literal["normal", "optimum", "instant"] = Field(default="normal")
    source_instrument_ref: Optional[str] = Field(default=None, description="Source instrument verifying source refund")
    acquirer_arn: Optional[str] = Field(default=None, description="Acquirer Reference Number for banking trace")
    settlement_id: Optional[str] = Field(default=None, description="Settlement batch deducting this refund")
    notes: Optional[Dict[str, str]] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)

    @property
    def amount_formatted(self) -> str:
        return format_inr(self.amount_paise)


class Dispute(BaseModel):
    id: str = Field(description="Razorpay dispute ID (disp_xxxx)")
    payment_id: str = Field(description="Foreign key to disputed Payment")
    order_id: Optional[str] = Field(default=None, description="Associated commercial Order ID")
    amount_paise: int = Field(ge=0, description="Disputed principal amount in paise")
    currency: str = Field(default="INR", description="ISO currency code")
    status: Literal["open", "under_review", "evidence_submitted", "won", "lost", "accepted"] = Field(default="open")
    reason_code: str = Field(default="goods_not_received", description="Dispute chargeback reason")
    deduction_amount_paise: int = Field(default=0, ge=0, description="Amount held from merchant settlements")
    fee_paise: int = Field(default=0, ge=0, description="Dispute administrative fee in paise")
    respond_by: Optional[datetime] = Field(default=None, description="Statutory merchant response deadline")
    evidence_submitted_at: Optional[datetime] = Field(default=None)
    resolved_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)

    @property
    def amount_formatted(self) -> str:
        return format_inr(self.amount_paise)

    @property
    def total_exposure_paise(self) -> int:
        """Total exposure includes disputed amount and dispute administrative fee."""
        return self.amount_paise + self.fee_paise

    @property
    def exposure_formatted(self) -> str:
        return format_inr(self.total_exposure_paise)


class SettlementLine(BaseModel):
    id: str = Field(description="Unique line item ID")
    settlement_id: str = Field(description="Foreign key to Settlement")
    entity_type: Literal["payment", "refund", "adjustment", "dispute"] = Field(description="Type of financial movement")
    entity_id: str = Field(description="ID of the underlying entity (pay_xxx, rfnd_xxx, disp_xxx)")
    gross_paise: int = Field(description="Gross amount contribution in paise")
    fee_paise: int = Field(default=0, description="MDR fee in paise")
    tax_paise: int = Field(default=0, description="GST on fee in paise")
    net_paise: int = Field(description="Net contribution to settlement in paise")
    created_at: datetime = Field(default_factory=utc_now)


class Settlement(BaseModel):
    id: str = Field(description="Razorpay settlement ID (setl_xxxx)")
    utr: Optional[str] = Field(default=None, description="Unique Transaction Reference for bank transfer")
    gross_amount_paise: int = Field(default=0, description="Sum of gross captured payments")
    fee_amount_paise: int = Field(default=0, description="Sum of MDR fees")
    tax_amount_paise: int = Field(default=0, description="Sum of GST on fees")
    refund_amount_paise: int = Field(default=0, description="Sum of customer refunds deducted")
    adjustment_amount_paise: int = Field(default=0, description="Net manual adjustments")
    dispute_amount_paise: int = Field(default=0, description="Dispute withholdings deducted")
    amount_paise: int = Field(description="Net payout transferred to merchant bank account in paise")
    currency: str = Field(default="INR", description="ISO currency code")
    status: Literal["created", "processed", "settled", "failed"] = Field(default="settled")
    settled_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)
    lines: List[SettlementLine] = Field(default_factory=list)

    @property
    def amount_formatted(self) -> str:
        return format_inr(self.amount_paise)

    @property
    def amount_compact(self) -> str:
        return format_inr_compact(self.amount_paise)

    def calculate_computed_net_paise(self) -> int:
        """
        Verify settlement invariant:
        Net = Gross - Fees - Taxes - Refunds + Adjustments - Disputes
        """
        return (
            self.gross_amount_paise
            - self.fee_amount_paise
            - self.tax_amount_paise
            - self.refund_amount_paise
            + self.adjustment_amount_paise
            - self.dispute_amount_paise
        )


class BankTransaction(BaseModel):
    id: str = Field(description="Bank transaction line ID (bnk_xxxx)")
    bank_account_number_masked: str = Field(default="•••• 9876", description="Masked merchant bank account")
    date: datetime = Field(description="Bank booking date")
    value_date: Optional[datetime] = Field(default=None, description="Value/clearance date")
    amount_paise: int = Field(ge=0, description="Transaction amount in paise")
    direction: Literal["credit", "debit"] = Field(default="credit")
    reference: Optional[str] = Field(default=None, description="UTR / Bank reference string")
    description: Optional[str] = Field(default=None, description="Bank statement narration")
    matched_settlement_id: Optional[str] = Field(default=None, description="Matched Razorpay Settlement ID")

    @property
    def amount_formatted(self) -> str:
        return format_inr(self.amount_paise)


class TaxRecord(BaseModel):
    id: str = Field(description="Form 26AS / AIS tax deduction line ID")
    deductor_pan: str = Field(default="AAACR1234A", description="Deductor PAN")
    deductor_name: str = Field(default="Razorpay Software Pvt Ltd", description="Deductor Legal Name")
    section: str = Field(default="194-O", description="Income Tax Act Section")
    financial_year: str = Field(default="2024-25", description="Tax assessment year")
    quarter: str = Field(default="Q3", description="Financial quarter")
    gross_amount_credited_paise: int = Field(ge=0, description="Gross turnover on which TDS was deducted")
    tds_deducted_paise: int = Field(ge=0, description="TDS amount deducted in paise")
    tds_rate_bps: int = Field(default=10, description="TDS rate in bps (10 bps = 0.1%)")
    deposit_date: Optional[datetime] = Field(default=None)
    challan_reference: Optional[str] = Field(default=None)

    @property
    def tds_formatted(self) -> str:
        return format_inr(self.tds_deducted_paise)


class ExceptionRecord(BaseModel):
    id: str = Field(description="Exception ID (exc_xxxx)")
    batch_id: Optional[str] = Field(default=None, description="Batch in which exception occurred")
    category: Literal[
        "MISSING_SETTLEMENT",
        "AMOUNT_MISMATCH",
        "FEE_MISMATCH",
        "REFUND_MISMATCH",
        "DUPLICATE_PAYMENT",
        "DUPLICATE_REFUND",
        "DOUBLE_LOSS",
        "DISPUTE_EXPOSURE",
        "BANK_CREDIT_UNMATCHED",
        "TAX_RECONCILIATION",
        "TIMING_ANOMALY",
        "UNKNOWN",
    ] = Field(description="Exception anomaly classification")
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"] = Field(default="HIGH")
    financial_impact_paise: int = Field(default=0, ge=0, description="Monetary exposure / discrepancy in paise")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Statistical confidence score")
    root_cause: str = Field(description="Explanatory root cause description")
    recommendation: Literal["AUTO_RESOLVE", "HUMAN_REVIEW", "ESCALATE", "DISPUTE_CONTEST"] = Field(default="HUMAN_REVIEW")
    affected_records: List[Dict[str, Any]] = Field(default_factory=list, description="IDs and metadata of affected rows")
    evidence: Dict[str, Any] = Field(default_factory=dict, description="Structured proof items")
    status: Literal["OPEN", "RESOLVED", "ESCALATED", "IGNORED"] = Field(default="OPEN")
    resolution_method: Optional[Literal["DETERMINISTIC_POLICY", "AI_AGENT", "HUMAN_OPERATOR", "FALLBACK"]] = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)
    resolved_at: Optional[datetime] = Field(default=None)

    @property
    def impact_formatted(self) -> str:
        return format_inr(self.financial_impact_paise)


class EvidenceEdge(BaseModel):
    source_id: str = Field(description="Source entity ID (e.g. order_10482)")
    target_id: str = Field(description="Target entity ID (e.g. pay_91231)")
    relationship: str = Field(description="Edge type e.g. PAYMENT_INCLUDED_IN_SETTLEMENT")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    proof_items: List[str] = Field(default_factory=list, description="Verified invariant checks")
    variance_paise: int = Field(default=0, description="Variance between source and target in paise")


class EvidenceGraph(BaseModel):
    nodes: List[Dict[str, Any]] = Field(default_factory=list, description="Entity vertices")
    edges: List[EvidenceEdge] = Field(default_factory=list, description="Relationship edges with proofs")
