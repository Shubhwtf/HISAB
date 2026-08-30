"""
HISAB — Controlled Financial Data Corruption Engine.

Injects reproducible, realistic financial discrepancies and anomalies into synthetic datasets.
Every injected anomaly updates the hidden ground truth manifest so that precision, recall,
false-positive rates, and financial exposure detection can be measured deterministically.
"""

import copy
import random
from datetime import timedelta
from typing import Dict, List, Optional

from packages.domain.models import Payment, Refund, Dispute, BankTransaction, TaxRecord, Settlement
from packages.evaluation.generator import ScenarioDataset, GroundTruthRecord


def inject_corruptions(dataset: ScenarioDataset, seed: int = 101) -> ScenarioDataset:
    """
    Applies a controlled set of domain-specific corruptions to a clean dataset.
    Returns a deep-copied mutated ScenarioDataset with updated ground truth.
    """
    random.seed(seed)
    ds = copy.deepcopy(dataset)
    ds.seed = seed

    signature_payment = next(
        (p for p in ds.payments if p.amount_paise == 7200000 and p.method == "card"),
        ds.payments[0]
    )

    double_loss_rfnd = next((r for r in ds.refunds if r.payment_id == signature_payment.id), None)
    if not double_loss_rfnd:
        double_loss_rfnd = Refund(
            id=f"rfnd_dbl_{signature_payment.id}",
            payment_id=signature_payment.id,
            order_id=signature_payment.order_id,
            amount_paise=signature_payment.amount_paise,
            source_instrument_ref=signature_payment.instrument_ref,
            status="processed",
            created_at=signature_payment.created_at + timedelta(hours=2),
        )
        ds.refunds.append(double_loss_rfnd)

    double_loss_disp = Dispute(
        id=f"disp_dbl_{signature_payment.id}",
        payment_id=signature_payment.id,
        order_id=signature_payment.order_id,
        amount_paise=signature_payment.amount_paise,
        deduction_amount_paise=signature_payment.amount_paise,
        fee_paise=50000,
        status="open",
        reason_code="fraudulent",
        respond_by=signature_payment.created_at + timedelta(days=7),
        created_at=signature_payment.created_at + timedelta(hours=12),
    )
    ds.disputes.append(double_loss_disp)

    total_exposure = signature_payment.amount_paise + double_loss_disp.total_exposure_paise

    ds.ground_truth[signature_payment.id] = GroundTruthRecord(
        record_id=signature_payment.id,
        entity_type="payment",
        is_anomaly=True,
        anomaly_type="DOUBLE_LOSS",
        expected_resolution="ESCALATE",
        expected_financial_impact_paise=total_exposure,
        ground_truth_root_cause=(
            f"Potential double-loss: Customer received manual refund of {signature_payment.amount_paise} paise "
            f"and filed a chargeback dispute of {double_loss_disp.amount_paise} paise on order {signature_payment.order_id}."
        )
    )
    ds.ground_truth[double_loss_disp.id] = GroundTruthRecord(
        record_id=double_loss_disp.id,
        entity_type="dispute",
        is_anomaly=True,
        anomaly_type="DOUBLE_LOSS",
        expected_resolution="ESCALATE",
        expected_financial_impact_paise=total_exposure,
        ground_truth_root_cause="Chargeback on already refunded transaction creates double outflow exposure."
    )

    unmapped_payments = [p for p in ds.payments if p.id != signature_payment.id][:5]
    for p in unmapped_payments:
        original_setl_id = p.settlement_id
        p.settlement_id = None
        ds.ground_truth[p.id] = GroundTruthRecord(
            record_id=p.id,
            entity_type="payment",
            is_anomaly=True,
            anomaly_type="MISSING_SETTLEMENT",
            expected_match_id=original_setl_id,
            expected_resolution="AUTO_RESOLVE",
            expected_financial_impact_paise=p.net_paise,
            ground_truth_root_cause=f"Payment {p.id} settlement mapping removed from primary feed."
        )

    if len(ds.bank_transactions) > 1:
        corrupted_bank = ds.bank_transactions[1]
        original_ref = corrupted_bank.reference
        corrupted_bank.reference = f"{original_ref}_MOD"
        corrupted_bank.description = f"CMS/RAZORPAY/CORRUPTED/{original_ref}_MOD"
        corrupted_bank.matched_settlement_id = None
        ds.ground_truth[corrupted_bank.id] = GroundTruthRecord(
            record_id=corrupted_bank.id,
            entity_type="bank_transaction",
            is_anomaly=True,
            anomaly_type="BANK_CREDIT_UNMATCHED",
            expected_match_id=original_ref,
            expected_resolution="AUTO_RESOLVE",
            expected_financial_impact_paise=corrupted_bank.amount_paise,
            ground_truth_root_cause=f"Bank statement UTR altered from {original_ref} to {corrupted_bank.reference}."
        )

    dup_target = ds.payments[10]
    dup_payment = copy.deepcopy(dup_target)
    dup_payment.id = f"{dup_target.id}_DUP"
    ds.payments.append(dup_payment)
    ds.ground_truth[dup_payment.id] = GroundTruthRecord(
        record_id=dup_payment.id,
        entity_type="payment",
        is_anomaly=True,
        anomaly_type="DUPLICATE_PAYMENT",
        expected_match_id=dup_target.id,
        expected_resolution="AUTO_RESOLVE",
        expected_financial_impact_paise=dup_payment.amount_paise,
        ground_truth_root_cause=f"Duplicate payment event received for order {dup_target.order_id}."
    )

    fee_target = ds.payments[15]
    original_fee = fee_target.fee_paise
    fee_target.fee_paise = original_fee + 5000
    fee_target.net_paise = fee_target.amount_paise - fee_target.fee_paise - fee_target.tax_paise
    ds.ground_truth[fee_target.id] = GroundTruthRecord(
        record_id=fee_target.id,
        entity_type="payment",
        is_anomaly=True,
        anomaly_type="FEE_MISMATCH",
        expected_resolution="HUMAN_REVIEW",
        expected_financial_impact_paise=5000,
        ground_truth_root_cause=f"Recorded fee ({fee_target.fee_paise} paise) deviates from configured schedule."
    )

    if len(ds.bank_transactions) > 3:
        shortfall_bank = ds.bank_transactions[3]
        shortfall_bank.amount_paise -= 11240
        ds.ground_truth[shortfall_bank.id] = GroundTruthRecord(
            record_id=shortfall_bank.id,
            entity_type="bank_transaction",
            is_anomaly=True,
            anomaly_type="AMOUNT_MISMATCH",
            expected_resolution="ESCALATE",
            expected_financial_impact_paise=11240,
            ground_truth_root_cause="External bank credit amount is ₹112.40 less than settled batch total."
        )

    if ds.tax_records:
        obsolete_tax = copy.deepcopy(ds.tax_records[0])
        obsolete_tax.id = "tax_2026_q3_obsolete"
        obsolete_tax.tds_rate_bps = 100
        obsolete_tax.tds_deducted_paise = (obsolete_tax.gross_amount_credited_paise * 100) // 10000
        ds.tax_records.append(obsolete_tax)
        ds.ground_truth[obsolete_tax.id] = GroundTruthRecord(
            record_id=obsolete_tax.id,
            entity_type="tax_record",
            is_anomaly=True,
            anomaly_type="TAX_RECONCILIATION",
            expected_resolution="HUMAN_REVIEW",
            expected_financial_impact_paise=obsolete_tax.tds_deducted_paise,
            ground_truth_root_cause="Tax record applies pre-amendment 1.0% rate instead of amended 0.1% rate."
        )

    ds.total_record_count = (
        len(ds.customers)
        + len(ds.orders)
        + len(ds.payments)
        + len(ds.refunds)
        + len(ds.disputes)
        + len(ds.settlements)
        + len(ds.settlement_lines)
        + len(ds.bank_transactions)
        + len(ds.tax_records)
    )

    return ds
