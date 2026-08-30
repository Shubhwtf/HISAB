"""
HISAB — High-Fidelity Razorpay Synthetic Data Generator.

Generates realistic merchant datasets for 'Nova Commerce Pvt Ltd' with 500+ connected
financial records, standard Razorpay fee schedules, realistic settlement batch compositions,
external bank statements, and hidden ground truth manifests.
"""

import csv
import io
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from packages.domain.fees import FeeSchedule, calculate_fee_and_tax, DEFAULT_FEE_SCHEDULES
from packages.domain.models import (
    Customer,
    Order,
    Payment,
    PaymentInstrument,
    Refund,
    Dispute,
    Settlement,
    SettlementLine,
    BankTransaction,
    TaxRecord,
)


class GroundTruthRecord(BaseModel):
    """
    Hidden evaluation ground truth for an entity. Kept isolated from the AI controller.
    """
    record_id: str
    entity_type: str
    is_anomaly: bool = False
    anomaly_type: Optional[str] = None
    expected_match_id: Optional[str] = None
    expected_resolution: str = "EXACT_MATCH"
    expected_financial_impact_paise: int = 0
    ground_truth_root_cause: str = "Clean transaction reconciled with zero variance"


class ScenarioDataset(BaseModel):
    """
    Complete merchant financial dataset across all platforms and hidden ground truth.
    """
    merchant_name: str = "Nova Commerce Pvt Ltd"
    seed: int
    total_record_count: int = 0
    customers: List[Customer] = Field(default_factory=list)
    orders: List[Order] = Field(default_factory=list)
    payments: List[Payment] = Field(default_factory=list)
    refunds: List[Refund] = Field(default_factory=list)
    disputes: List[Dispute] = Field(default_factory=list)
    settlements: List[Settlement] = Field(default_factory=list)
    settlement_lines: List[SettlementLine] = Field(default_factory=list)
    bank_transactions: List[BankTransaction] = Field(default_factory=list)
    tax_records: List[TaxRecord] = Field(default_factory=list)
    ground_truth: Dict[str, GroundTruthRecord] = Field(default_factory=dict)


def generate_synthetic_dataset(
    record_count: int = 500,
    seed: int = 42,
    base_date: Optional[datetime] = None,
) -> ScenarioDataset:
    """
    Generates a realistic, self-consistent, interconnected financial dataset for Nova Commerce Pvt Ltd.
    """
    random.seed(seed)
    start_time = base_date or datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc)

    customer_names = [
        ("Rahul Sharma", "rahul.s@example.com", "+919811001001"),
        ("Pooja Mehta", "pooja.m@example.com", "+919811001002"),
        ("Vikram Malhotra", "vikram.m@example.com", "+919811001003"),
        ("Ananya Iyer", "ananya.i@example.com", "+919811001004"),
        ("Rohan Gupta", "rohan.g@example.com", "+919811001005"),
        ("Sneha Patil", "sneha.p@example.com", "+919811001006"),
        ("Arjun Reddy", "arjun.r@example.com", "+919811001007"),
        ("Kavita Nair", "kavita.n@example.com", "+919811001008"),
        ("Aditya Roy", "aditya.r@example.com", "+919811001009"),
        ("Divya Deshmukh", "divya.d@example.com", "+919811001010"),
    ]

    customers: List[Customer] = []
    for i in range(40):
        c_name, c_email_tpl, c_phone = customer_names[i % len(customer_names)]
        suffix = f"_{i+1}" if i >= len(customer_names) else ""
        email = c_email_tpl.replace("@", f"{suffix}@")
        cust = Customer(
            id=f"cust_{1000 + i}",
            name=f"{c_name}{suffix}",
            email=email,
            contact=f"+91981100{1000 + i}",
            created_at=start_time - timedelta(days=30),
        )
        customers.append(cust)

    standard_amounts_paise = [
        50000,
        120000,
        250000,
        499900,
        750000,
        1200000,
        2500000,
        5000000,
        7200000,
    ]

    orders: List[Order] = []
    payments: List[Payment] = []
    ground_truth: Dict[str, GroundTruthRecord] = {}

    num_payments = max(200, int(record_count * 0.5))
    
    current_time = start_time
    for i in range(num_payments):
        cust = random.choice(customers)
        amount = random.choice(standard_amounts_paise)
        current_time += timedelta(minutes=random.randint(15, 60))

        order_id = f"order_{10000 + i}"
        order = Order(
            id=order_id,
            customer_id=cust.id,
            amount_paise=amount,
            amount_paid_paise=amount,
            receipt=f"rcpt_{10000 + i}",
            status="paid",
            created_at=current_time - timedelta(minutes=random.randint(2, 10)),
        )
        orders.append(order)

        method_roll = random.random()
        if method_roll < 0.60:
            method = "card"
            network = random.choice(["Visa", "Mastercard", "RuPay"])
            card_last4 = f"{random.randint(1000, 9999)}"
            inst = PaymentInstrument(
                type="card",
                network=network,
                masked_number=f"•••• {card_last4}",
                bank=random.choice(["HDFC", "ICIC", "SBIN", "UTIB"])
            )
            inst_ref = f"{network} •••• {card_last4}"
            fee_sched = DEFAULT_FEE_SCHEDULES["card"]
        elif method_roll < 0.85:
            method = "upi"
            vpa_prefix = cust.name.lower().replace(" ", "")[:8]
            inst = PaymentInstrument(
                type="upi",
                vpa_hash=f"{vpa_prefix}***@okhdfcbank",
                bank="HDFC"
            )
            inst_ref = f"UPI {vpa_prefix}***@okhdfcbank"
            fee_sched = DEFAULT_FEE_SCHEDULES["upi"]
        else:
            method = "netbanking"
            bank_code = random.choice(["HDFC", "ICIC", "SBIN", "KKBK"])
            inst = PaymentInstrument(type="netbanking", bank=bank_code)
            inst_ref = f"Netbanking {bank_code}"
            fee_sched = DEFAULT_FEE_SCHEDULES["netbanking"]

        breakdown = calculate_fee_and_tax(amount, fee_sched)

        pay_id = f"pay_{90000 + i}"
        payment = Payment(
            id=pay_id,
            order_id=order.id,
            customer_id=cust.id,
            amount_paise=amount,
            method=method,
            instrument_ref=inst_ref,
            instrument_details=inst,
            fee_paise=breakdown.fee_paise,
            tax_paise=breakdown.tax_paise,
            net_paise=breakdown.net_paise,
            status="captured",
            captured_at=current_time,
            created_at=current_time,
        )
        payments.append(payment)

        ground_truth[pay_id] = GroundTruthRecord(
            record_id=pay_id,
            entity_type="payment",
            is_anomaly=False,
            expected_match_id=None,
            expected_resolution="EXACT_MATCH",
            expected_financial_impact_paise=0,
            ground_truth_root_cause="Clean capture with expected MDR and GST deductions."
        )

    refunds: List[Refund] = []
    num_refunds = max(30, int(num_payments * 0.15))
    refunded_payments = random.sample(payments, num_refunds)

    for i, p in enumerate(refunded_payments):
        rfnd_time = p.created_at + timedelta(hours=random.randint(1, 48))
        rfnd_id = f"rfnd_{3000 + i}"
        
        if random.random() < 0.80:
            rfnd_amount = p.amount_paise
        else:
            rfnd_amount = (p.amount_paise // 2)

        rfnd = Refund(
            id=rfnd_id,
            payment_id=p.id,
            order_id=p.order_id,
            amount_paise=rfnd_amount,
            speed="normal",
            source_instrument_ref=p.instrument_ref,
            acquirer_arn=f"240228{random.randint(10000000000000000, 99999999999999999)}",
            status="processed",
            created_at=rfnd_time,
        )
        refunds.append(rfnd)

        p.status = "refunded" if rfnd_amount == p.amount_paise else "partially_refunded"

        ground_truth[rfnd_id] = GroundTruthRecord(
            record_id=rfnd_id,
            entity_type="refund",
            is_anomaly=False,
            expected_match_id=p.id,
            expected_resolution="AUTO_RESOLVE",
            expected_financial_impact_paise=0,
            ground_truth_root_cause="Legitimate source refund; transaction fee + GST non-reversed per policy."
        )

    disputes: List[Dispute] = []
    num_disputes = max(10, int(num_payments * 0.05))
    non_refunded_payments = [p for p in payments if p.status == "captured"]
    disputed_payments = random.sample(non_refunded_payments, min(num_disputes, len(non_refunded_payments)))

    for i, p in enumerate(disputed_payments):
        disp_time = p.created_at + timedelta(days=random.randint(2, 7))
        disp_id = f"disp_{5000 + i}"
        disp = Dispute(
            id=disp_id,
            payment_id=p.id,
            order_id=p.order_id,
            amount_paise=p.amount_paise,
            deduction_amount_paise=p.amount_paise,
            fee_paise=50000,
            status="open",
            reason_code=random.choice(["fraudulent", "goods_not_received", "duplicate_charge"]),
            respond_by=disp_time + timedelta(days=7),
            created_at=disp_time,
        )
        disputes.append(disp)

        ground_truth[disp_id] = GroundTruthRecord(
            record_id=disp_id,
            entity_type="dispute",
            is_anomaly=False,
            expected_match_id=p.id,
            expected_resolution="DISPUTE_CONTEST",
            expected_financial_impact_paise=disp.total_exposure_paise,
            ground_truth_root_cause="Open chargeback dispute with pending evidence response window."
        )

    settlements: List[Settlement] = []
    settlement_lines: List[SettlementLine] = []
    bank_transactions: List[BankTransaction] = []

    num_batches = 15
    batch_size = len(payments) // num_batches
    
    for b_idx in range(num_batches):
        setl_id = f"setl_{8800 + b_idx}"
        utr = f"UTR77821{1000 + b_idx}"
        
        batch_payments = payments[b_idx * batch_size : (b_idx + 1) * batch_size] if b_idx < num_batches - 1 else payments[b_idx * batch_size :]
        batch_payment_ids = {p.id for p in batch_payments}
        
        batch_refunds = [r for r in refunds if r.payment_id in batch_payment_ids]
        batch_disputes = [d for d in disputes if d.payment_id in batch_payment_ids]

        gross_paise = sum(p.amount_paise for p in batch_payments)
        fee_paise = sum(p.fee_paise for p in batch_payments)
        tax_paise = sum(p.tax_paise for p in batch_payments)
        refund_paise = sum(r.amount_paise for r in batch_refunds)
        dispute_paise = sum(d.deduction_amount_paise for d in batch_disputes)
        
        net_settlement_paise = gross_paise - fee_paise - tax_paise - refund_paise - dispute_paise
        
        setl_date = start_time + timedelta(days=b_idx + 2)

        lines: List[SettlementLine] = []
        for p in batch_payments:
            p.settlement_id = setl_id
            sline = SettlementLine(
                id=f"sline_{p.id}",
                settlement_id=setl_id,
                entity_type="payment",
                entity_id=p.id,
                gross_paise=p.amount_paise,
                fee_paise=p.fee_paise,
                tax_paise=p.tax_paise,
                net_paise=p.net_paise,
                created_at=setl_date,
            )
            lines.append(sline)
            settlement_lines.append(sline)
            ground_truth[p.id].expected_match_id = setl_id

        for r in batch_refunds:
            r.settlement_id = setl_id
            sline = SettlementLine(
                id=f"sline_{r.id}",
                settlement_id=setl_id,
                entity_type="refund",
                entity_id=r.id,
                gross_paise=-r.amount_paise,
                fee_paise=0,
                tax_paise=0,
                net_paise=-r.amount_paise,
                created_at=setl_date,
            )
            lines.append(sline)
            settlement_lines.append(sline)

        for d in batch_disputes:
            sline = SettlementLine(
                id=f"sline_{d.id}",
                settlement_id=setl_id,
                entity_type="dispute",
                entity_id=d.id,
                gross_paise=-d.deduction_amount_paise,
                fee_paise=0,
                tax_paise=0,
                net_paise=-d.deduction_amount_paise,
                created_at=setl_date,
            )
            lines.append(sline)
            settlement_lines.append(sline)

        settlement = Settlement(
            id=setl_id,
            utr=utr,
            gross_amount_paise=gross_paise,
            fee_amount_paise=fee_paise,
            tax_amount_paise=tax_paise,
            refund_amount_paise=refund_paise,
            dispute_amount_paise=dispute_paise,
            adjustment_amount_paise=0,
            amount_paise=net_settlement_paise,
            status="settled",
            settled_at=setl_date,
            created_at=setl_date,
            lines=lines,
        )
        settlements.append(settlement)

        ground_truth[setl_id] = GroundTruthRecord(
            record_id=setl_id,
            entity_type="settlement",
            is_anomaly=False,
            expected_match_id=utr,
            expected_resolution="EXACT_MATCH",
            expected_financial_impact_paise=0,
            ground_truth_root_cause=f"Settlement batch of {len(lines)} movements matching bank UTR credit."
        )

        bank_tx = BankTransaction(
            id=f"bnk_{7000 + b_idx}",
            bank_account_number_masked="•••• 9876",
            date=setl_date,
            value_date=setl_date,
            amount_paise=net_settlement_paise,
            direction="credit",
            reference=utr,
            description=f"CMS/RAZORPAY/{setl_id}/{utr}",
            matched_settlement_id=setl_id,
        )
        bank_transactions.append(bank_tx)

        ground_truth[bank_tx.id] = GroundTruthRecord(
            record_id=bank_tx.id,
            entity_type="bank_transaction",
            is_anomaly=False,
            expected_match_id=setl_id,
            expected_resolution="EXACT_MATCH",
            expected_financial_impact_paise=0,
            ground_truth_root_cause="Bank credit line matching settlement net amount and UTR reference."
        )

    tax_records: List[TaxRecord] = []
    total_turnover_paise = sum(p.amount_paise for p in payments)
    expected_tds_paise = (total_turnover_paise * 10) // 10000

    tax_rec = TaxRecord(
        id="tax_2026_q3_01",
        deductor_pan="AAACR1234A",
        deductor_name="Razorpay Software Pvt Ltd",
        section="194-O",
        financial_year="2026-27",
        quarter="Q2",
        gross_amount_credited_paise=total_turnover_paise,
        tds_deducted_paise=expected_tds_paise,
        tds_rate_bps=10,
        deposit_date=start_time + timedelta(days=20),
        challan_reference="CHAL_20260828001",
    )
    tax_records.append(tax_rec)

    ground_truth[tax_rec.id] = GroundTruthRecord(
        record_id=tax_rec.id,
        entity_type="tax_record",
        is_anomaly=False,
        expected_match_id="TOTAL_GROSS_TURNOVER",
        expected_resolution="EXACT_MATCH",
        expected_financial_impact_paise=0,
        ground_truth_root_cause="Form 26AS TDS deduction matching 0.1% of cumulative gross turnover."
    )

    total_records = (
        len(customers)
        + len(orders)
        + len(payments)
        + len(refunds)
        + len(disputes)
        + len(settlements)
        + len(settlement_lines)
        + len(bank_transactions)
        + len(tax_records)
    )

    return ScenarioDataset(
        merchant_name="Nova Commerce Pvt Ltd",
        seed=seed,
        total_record_count=total_records,
        customers=customers,
        orders=orders,
        payments=payments,
        refunds=refunds,
        disputes=disputes,
        settlements=settlements,
        settlement_lines=settlement_lines,
        bank_transactions=bank_transactions,
        tax_records=tax_records,
        ground_truth=ground_truth,
    )


def export_razorpay_recon_csv(dataset: ScenarioDataset) -> str:
    """
    Exports dataset in exact Razorpay Settlement Reconciliation CSV schema format.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    headers = [
        "entity_id",
        "type",
        "debit",
        "credit",
        "amount",
        "fee",
        "tax",
        "on_hold",
        "settled",
        "created_at",
        "settled_at",
        "settlement_id",
        "payment_id",
        "arn",
        "method",
        "description",
    ]
    writer.writerow(headers)

    for line in dataset.settlement_lines:
        debit = 0.0
        credit = 0.0
        payment_id = ""
        arn = ""
        method = "card"
        desc = f"Settlement line for {line.entity_id}"

        if line.entity_type == "payment":
            credit = line.gross_paise / 100.0
            payment_id = line.entity_id
        elif line.entity_type in ("refund", "dispute"):
            debit = abs(line.gross_paise) / 100.0
            if line.entity_type == "refund":
                rfnd = next((r for r in dataset.refunds if r.id == line.entity_id), None)
                if rfnd:
                    payment_id = rfnd.payment_id
                    arn = rfnd.acquirer_arn or ""

        row = [
            line.entity_id,
            line.entity_type,
            f"{debit:.2f}",
            f"{credit:.2f}",
            f"{(abs(line.gross_paise)/100.0):.2f}",
            f"{(line.fee_paise/100.0):.2f}",
            f"{(line.tax_paise/100.0):.2f}",
            "false",
            "true",
            line.created_at.isoformat(),
            line.created_at.isoformat(),
            line.settlement_id,
            payment_id,
            arn,
            method,
            desc,
        ]
        writer.writerow(row)

    return output.getvalue()
