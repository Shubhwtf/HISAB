"""
HISAB — Deterministic Financial Effect Engine & Variance Classifier.

This module is the SINGLE SOURCE OF TRUTH for merchant-side economics.
Matching algorithms, financial controls, and AI agents MUST query this engine
and NEVER recompute financial variance independently.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from packages.domain.fees import FeeBreakdown, FeeSchedule, calculate_fee_and_tax, DEFAULT_FEE_SCHEDULES
from packages.domain.models import Payment, Refund, Dispute, Settlement
from packages.domain.money import format_inr, format_inr_compact


class VarianceClassification(str, Enum):
    """
    Exhaustive deterministic classification of economic variance.
    """
    EXACT_MATCH = "EXACT_MATCH"
    EXPECTED_REFUND_VARIANCE = "EXPECTED_REFUND_VARIANCE"
    UNEXPECTED_REFUND_VARIANCE = "UNEXPECTED_REFUND_VARIANCE"
    REFUND_AMOUNT_MISMATCH = "REFUND_AMOUNT_MISMATCH"
    REFUND_SOURCE_MISMATCH = "REFUND_SOURCE_MISMATCH"
    REFUND_WITHOUT_PAYMENT = "REFUND_WITHOUT_PAYMENT"
    DUPLICATE_REFUND = "DUPLICATE_REFUND"
    FEE_CALCULATION_MISMATCH = "FEE_CALCULATION_MISMATCH"
    SETTLEMENT_BATCH_MISMATCH = "SETTLEMENT_BATCH_MISMATCH"
    DOUBLE_LOSS_EXPOSURE = "DOUBLE_LOSS_EXPOSURE"


class FinancialEffect(BaseModel):
    """
    Detailed economic impact calculation for a financial movement.
    All monetary amounts are strictly held in integer paise.
    """
    entity_id: str = Field(description="ID of payment, refund, or settlement line")
    entity_type: str = Field(description="payment | refund | dispute | settlement")
    gross_paise: int = Field(default=0, description="Gross captured or movement amount")
    fee_paise: int = Field(default=0, description="MDR fee in paise")
    tax_paise: int = Field(default=0, description="GST on fee in paise")
    refund_paise: int = Field(default=0, description="Customer refund deduction in paise")
    dispute_paise: int = Field(default=0, description="Dispute withholding deduction in paise")
    expected_merchant_effect_paise: int = Field(description="Expected net merchant cash impact in paise")
    observed_merchant_effect_paise: int = Field(description="Observed net merchant cash impact in paise")
    variance_paise: int = Field(description="observed - expected difference in paise")
    classification: VarianceClassification = Field(description="Deterministic variance category")
    is_expected_variance: bool = Field(default=False, description="True if variance is an expected domain rule (e.g. non-reversed fee)")
    explanation: str = Field(description="Human-readable financial explanation")
    evidence: Dict[str, Any] = Field(default_factory=dict, description="Structured proof details")

    @property
    def gross_formatted(self) -> str:
        return format_inr(self.gross_paise)

    @property
    def expected_formatted(self) -> str:
        return format_inr(self.expected_merchant_effect_paise)

    @property
    def observed_formatted(self) -> str:
        return format_inr(self.observed_merchant_effect_paise)

    @property
    def variance_formatted(self) -> str:
        return format_inr(self.variance_paise)


class SettlementBatchEffect(BaseModel):
    """
    Deterministic reconciliation of a complete Razorpay Settlement Batch.
    """
    settlement_id: str
    expected_gross_paise: int
    expected_fee_paise: int
    expected_tax_paise: int
    expected_refund_paise: int
    expected_adjustment_paise: int
    expected_dispute_paise: int
    expected_net_settlement_paise: int
    observed_net_settlement_paise: int
    variance_paise: int
    is_reconciled: bool
    line_count: int
    discrepancies: List[str] = Field(default_factory=list)

    @property
    def expected_net_formatted(self) -> str:
        return format_inr(self.expected_net_settlement_paise)

    @property
    def observed_net_formatted(self) -> str:
        return format_inr(self.observed_net_settlement_paise)

    @property
    def variance_formatted(self) -> str:
        return format_inr(self.variance_paise)


def calculate_payment_effect(
    payment: Payment,
    fee_schedule: Optional[FeeSchedule] = None,
    observed_net_paise: Optional[int] = None,
) -> FinancialEffect:
    """
    Calculates expected net settlement effect for a payment capture.
    """
    schedule = fee_schedule or DEFAULT_FEE_SCHEDULES.get(payment.method, DEFAULT_FEE_SCHEDULES["card"])
    expected_breakdown = calculate_fee_and_tax(payment.amount_paise, schedule)
    
    observed_net = observed_net_paise if observed_net_paise is not None else payment.net_paise
    if observed_net == 0 and payment.fee_paise == 0:
        observed_net = payment.amount_paise - payment.fee_paise - payment.tax_paise
        if observed_net == payment.amount_paise and schedule.mdr_bps > 0:
            observed_net = expected_breakdown.net_paise

    variance_paise = observed_net - expected_breakdown.net_paise
    
    if variance_paise == 0:
        classification = VarianceClassification.EXACT_MATCH
        is_expected = True
        explanation = (
            f"Gross {format_inr(payment.amount_paise)} minus {schedule.name} fee "
            f"({format_inr(expected_breakdown.fee_paise)}) and GST ({format_inr(expected_breakdown.tax_paise)}) "
            f"equals expected net {format_inr(expected_breakdown.net_paise)}."
        )
    else:
        classification = VarianceClassification.FEE_CALCULATION_MISMATCH
        is_expected = False
        explanation = (
            f"Fee/GST calculation variance of {format_inr(variance_paise)}: "
            f"Observed net {format_inr(observed_net)} vs expected {format_inr(expected_breakdown.net_paise)}."
        )

    return FinancialEffect(
        entity_id=payment.id,
        entity_type="payment",
        gross_paise=payment.amount_paise,
        fee_paise=expected_breakdown.fee_paise,
        tax_paise=expected_breakdown.tax_paise,
        refund_paise=0,
        dispute_paise=0,
        expected_merchant_effect_paise=expected_breakdown.net_paise,
        observed_merchant_effect_paise=observed_net,
        variance_paise=variance_paise,
        classification=classification,
        is_expected_variance=is_expected,
        explanation=explanation,
        evidence={
            "fee_schedule": schedule.name,
            "mdr_bps": schedule.mdr_bps,
            "gst_bps": schedule.gst_bps,
            "expected_fee": expected_breakdown.fee_paise,
            "expected_tax": expected_breakdown.tax_paise,
        }
    )


def calculate_refund_effect(
    refund: Refund,
    payment: Optional[Payment] = None,
    fee_schedule: Optional[FeeSchedule] = None,
    observed_debit_paise: Optional[int] = None,
    prior_refunds_on_payment: Optional[List[Refund]] = None,
) -> FinancialEffect:
    """
    Computes refund economic effect and strictly classifies variance into one of the 6 canonical classes:
    - EXPECTED_REFUND_VARIANCE
    - UNEXPECTED_REFUND_VARIANCE
    - REFUND_AMOUNT_MISMATCH
    - REFUND_SOURCE_MISMATCH
    - REFUND_WITHOUT_PAYMENT
    - DUPLICATE_REFUND
    """
    if payment is None:
        return FinancialEffect(
            entity_id=refund.id,
            entity_type="refund",
            gross_paise=0,
            fee_paise=0,
            tax_paise=0,
            refund_paise=refund.amount_paise,
            expected_merchant_effect_paise=0,
            observed_merchant_effect_paise=-refund.amount_paise,
            variance_paise=-refund.amount_paise,
            classification=VarianceClassification.REFUND_WITHOUT_PAYMENT,
            is_expected_variance=False,
            explanation=f"Refund {refund.id} of {format_inr(refund.amount_paise)} does not link to any valid captured payment.",
            evidence={"refund_id": refund.id, "payment_id": refund.payment_id}
        )

    if refund.source_instrument_ref and payment.instrument_ref:
        if refund.source_instrument_ref.strip() != payment.instrument_ref.strip():
            return FinancialEffect(
                entity_id=refund.id,
                entity_type="refund",
                gross_paise=payment.amount_paise,
                fee_paise=payment.fee_paise,
                tax_paise=payment.tax_paise,
                refund_paise=refund.amount_paise,
                expected_merchant_effect_paise=-refund.amount_paise,
                observed_merchant_effect_paise=-refund.amount_paise,
                variance_paise=0,
                classification=VarianceClassification.REFUND_SOURCE_MISMATCH,
                is_expected_variance=False,
                explanation=(
                    f"Refund instrument reference ({refund.source_instrument_ref}) differs from "
                    f"original payment instrument reference ({payment.instrument_ref})."
                ),
                evidence={
                    "payment_instrument": payment.instrument_ref,
                    "refund_instrument": refund.source_instrument_ref,
                }
            )

    prior_refund_total = sum(r.amount_paise for r in (prior_refunds_on_payment or []) if r.id != refund.id)
    cumulative_refund_paise = prior_refund_total + refund.amount_paise

    if cumulative_refund_paise > payment.amount_paise:
        over_refund_paise = cumulative_refund_paise - payment.amount_paise
        classification = (
            VarianceClassification.DUPLICATE_REFUND
            if (prior_refund_total == payment.amount_paise and refund.amount_paise == payment.amount_paise)
            else VarianceClassification.REFUND_AMOUNT_MISMATCH
        )
        return FinancialEffect(
            entity_id=refund.id,
            entity_type="refund",
            gross_paise=payment.amount_paise,
            fee_paise=payment.fee_paise,
            tax_paise=payment.tax_paise,
            refund_paise=refund.amount_paise,
            expected_merchant_effect_paise=-payment.amount_paise,
            observed_merchant_effect_paise=-cumulative_refund_paise,
            variance_paise=-over_refund_paise,
            classification=classification,
            is_expected_variance=False,
            explanation=(
                f"Cumulative refunds ({format_inr(cumulative_refund_paise)}) exceed original payment amount "
                f"({format_inr(payment.amount_paise)}) by {format_inr(over_refund_paise)}."
            ),
            evidence={
                "payment_amount": payment.amount_paise,
                "prior_refund_total": prior_refund_total,
                "current_refund": refund.amount_paise,
                "cumulative_refund": cumulative_refund_paise,
                "excess": over_refund_paise,
            }
        )

    schedule = fee_schedule or DEFAULT_FEE_SCHEDULES.get(payment.method, DEFAULT_FEE_SCHEDULES["card"])
    fee_breakdown = calculate_fee_and_tax(payment.amount_paise, schedule)
    
    retained_fee_and_tax_paise = fee_breakdown.total_deductions_paise
    
    observed_debit = observed_debit_paise if observed_debit_paise is not None else -refund.amount_paise
    expected_debit = -refund.amount_paise
    
    variance_from_expected_debit = observed_debit - expected_debit

    if variance_from_expected_debit == 0:
        return FinancialEffect(
            entity_id=refund.id,
            entity_type="refund",
            gross_paise=payment.amount_paise,
            fee_paise=fee_breakdown.fee_paise,
            tax_paise=fee_breakdown.tax_paise,
            refund_paise=refund.amount_paise,
            expected_merchant_effect_paise=expected_debit,
            observed_merchant_effect_paise=observed_debit,
            variance_paise=0,
            classification=VarianceClassification.EXPECTED_REFUND_VARIANCE,
            is_expected_variance=True,
            explanation=(
                f"Customer refunded {format_inr(refund.amount_paise)}. Transaction fee ({format_inr(fee_breakdown.fee_paise)}) "
                f"and GST ({format_inr(fee_breakdown.tax_paise)}) retained per Razorpay standard non-reversal policy."
            ),
            evidence={
                "payment_id": payment.id,
                "refund_id": refund.id,
                "refund_amount": refund.amount_paise,
                "retained_fee": fee_breakdown.fee_paise,
                "retained_tax": fee_breakdown.tax_paise,
                "is_full_refund": (refund.amount_paise == payment.amount_paise),
            }
        )
    else:
        return FinancialEffect(
            entity_id=refund.id,
            entity_type="refund",
            gross_paise=payment.amount_paise,
            fee_paise=fee_breakdown.fee_paise,
            tax_paise=fee_breakdown.tax_paise,
            refund_paise=refund.amount_paise,
            expected_merchant_effect_paise=expected_debit,
            observed_merchant_effect_paise=observed_debit,
            variance_paise=variance_from_expected_debit,
            classification=VarianceClassification.UNEXPECTED_REFUND_VARIANCE,
            is_expected_variance=False,
            explanation=(
                f"Unexpected refund debit variance of {format_inr(variance_from_expected_debit)}: "
                f"Observed settlement debit {format_inr(observed_debit)} vs expected {format_inr(expected_debit)}."
            ),
            evidence={
                "payment_id": payment.id,
                "refund_id": refund.id,
                "expected_debit": expected_debit,
                "observed_debit": observed_debit,
            }
        )


def calculate_settlement_batch_effect(
    settlement: Settlement,
    payments: List[Payment],
    refunds: List[Refund],
    disputes: List[Dispute],
    adjustments_paise: int = 0,
    fee_schedule: Optional[FeeSchedule] = None,
) -> SettlementBatchEffect:
    """
    Computes the total composition of a settlement batch:
    Expected Net = Gross Captured - Total Fees - Total Taxes - Total Refunds + Adjustments - Total Disputes
    """
    total_gross = 0
    total_fees = 0
    total_taxes = 0

    for payment in payments:
        schedule = fee_schedule or DEFAULT_FEE_SCHEDULES.get(payment.method, DEFAULT_FEE_SCHEDULES["card"])
        breakdown = calculate_fee_and_tax(payment.amount_paise, schedule)
        total_gross += payment.amount_paise
        total_fees += breakdown.fee_paise
        total_taxes += breakdown.tax_paise

    total_refunds = sum(r.amount_paise for r in refunds)
    total_disputes = sum(d.deduction_amount_paise for d in disputes)

    expected_net = total_gross - total_fees - total_taxes - total_refunds + adjustments_paise - total_disputes
    observed_net = settlement.amount_paise
    variance = observed_net - expected_net

    discrepancies = []
    if total_gross != settlement.gross_amount_paise and settlement.gross_amount_paise > 0:
        discrepancies.append(f"Gross captured mismatch: calculated {format_inr(total_gross)} vs settlement {format_inr(settlement.gross_amount_paise)}")
    if total_fees != settlement.fee_amount_paise and settlement.fee_amount_paise > 0:
        discrepancies.append(f"Fee deduction mismatch: calculated {format_inr(total_fees)} vs settlement {format_inr(settlement.fee_amount_paise)}")
    if total_refunds != settlement.refund_amount_paise and settlement.refund_amount_paise > 0:
        discrepancies.append(f"Refund deduction mismatch: calculated {format_inr(total_refunds)} vs settlement {format_inr(settlement.refund_amount_paise)}")
    if variance != 0:
        discrepancies.append(f"Net settlement variance of {format_inr(variance)}")

    return SettlementBatchEffect(
        settlement_id=settlement.id,
        expected_gross_paise=total_gross,
        expected_fee_paise=total_fees,
        expected_tax_paise=total_taxes,
        expected_refund_paise=total_refunds,
        expected_adjustment_paise=adjustments_paise,
        expected_dispute_paise=total_disputes,
        expected_net_settlement_paise=expected_net,
        observed_net_settlement_paise=observed_net,
        variance_paise=variance,
        is_reconciled=(variance == 0),
        line_count=len(payments) + len(refunds) + len(disputes),
        discrepancies=discrepancies,
    )
