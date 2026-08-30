"""
HISAB — Synthetic Dataset Generation & Database Seeding CLI.

Usage:
    python scripts/seed_data.py --records 500 --corrupt --seed-db
    python scripts/seed_data.py --export-fixtures
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from packages.domain.database import init_db_sync, reset_db_sync, get_sync_db
from packages.domain.db_models import (
    CustomerDB,
    OrderDB,
    PaymentDB,
    RefundDB,
    DisputeDB,
    SettlementDB,
    SettlementLineDB,
    BankTransactionDB,
    TaxRecordDB,
    BatchDB,
)
from packages.domain.money import format_inr, format_inr_compact
from packages.evaluation.generator import generate_synthetic_dataset, export_razorpay_recon_csv
from packages.evaluation.corruptor import inject_corruptions


def seed_database_from_dataset(dataset, batch_name: str = "Batch #SETTLEMENT_2026_08_28"):
    """
    Populates SQLite/PostgreSQL database with synthetic records and registers initial batch.
    """
    reset_db_sync()
    with get_sync_db() as db:
        for c in dataset.customers:
            db.add(CustomerDB(
                id=c.id,
                name=c.name,
                email=c.email,
                contact=c.contact,
                created_at=c.created_at,
            ))

        for o in dataset.orders:
            db.add(OrderDB(
                id=o.id,
                customer_id=o.customer_id,
                amount_paise=o.amount_paise,
                amount_paid_paise=o.amount_paid_paise,
                currency=o.currency,
                receipt=o.receipt,
                status=o.status,
                created_at=o.created_at,
            ))

        for s in dataset.settlements:
            db.add(SettlementDB(
                id=s.id,
                utr=s.utr,
                gross_amount_paise=s.gross_amount_paise,
                fee_amount_paise=s.fee_amount_paise,
                tax_amount_paise=s.tax_amount_paise,
                refund_amount_paise=s.refund_amount_paise,
                adjustment_amount_paise=s.adjustment_amount_paise,
                dispute_amount_paise=s.dispute_amount_paise,
                amount_paise=s.amount_paise,
                currency=s.currency,
                status=s.status,
                settled_at=s.settled_at,
                created_at=s.created_at,
            ))

        for p in dataset.payments:
            db.add(PaymentDB(
                id=p.id,
                order_id=p.order_id,
                customer_id=p.customer_id,
                amount_paise=p.amount_paise,
                currency=p.currency,
                status=p.status,
                method=p.method,
                instrument_ref=p.instrument_ref,
                fee_paise=p.fee_paise,
                tax_paise=p.tax_paise,
                net_paise=p.net_paise,
                settlement_id=p.settlement_id,
                captured_at=p.captured_at,
                created_at=p.created_at,
            ))

        for sl in dataset.settlement_lines:
            db.add(SettlementLineDB(
                id=sl.id,
                settlement_id=sl.settlement_id,
                entity_type=sl.entity_type,
                entity_id=sl.entity_id,
                gross_paise=sl.gross_paise,
                fee_paise=sl.fee_paise,
                tax_paise=sl.tax_paise,
                net_paise=sl.net_paise,
                created_at=sl.created_at,
            ))

        for r in dataset.refunds:
            db.add(RefundDB(
                id=r.id,
                payment_id=r.payment_id,
                order_id=r.order_id,
                amount_paise=r.amount_paise,
                currency=r.currency,
                status=r.status,
                speed=r.speed,
                source_instrument_ref=r.source_instrument_ref,
                acquirer_arn=r.acquirer_arn,
                settlement_id=r.settlement_id,
                created_at=r.created_at,
            ))

        for d in dataset.disputes:
            db.add(DisputeDB(
                id=d.id,
                payment_id=d.payment_id,
                order_id=d.order_id,
                amount_paise=d.amount_paise,
                currency=d.currency,
                status=d.status,
                reason_code=d.reason_code,
                deduction_amount_paise=d.deduction_amount_paise,
                fee_paise=d.fee_paise,
                respond_by=d.respond_by,
                created_at=d.created_at,
            ))

        for b in dataset.bank_transactions:
            db.add(BankTransactionDB(
                id=b.id,
                bank_account_number_masked=b.bank_account_number_masked,
                date=b.date,
                value_date=b.value_date,
                amount_paise=b.amount_paise,
                direction=b.direction,
                reference=b.reference,
                description=b.description,
                matched_settlement_id=b.matched_settlement_id,
            ))

        for t in dataset.tax_records:
            db.add(TaxRecordDB(
                id=t.id,
                deductor_pan=t.deductor_pan,
                deductor_name=t.deductor_name,
                section=t.section,
                financial_year=t.financial_year,
                quarter=t.quarter,
                gross_amount_credited_paise=t.gross_amount_credited_paise,
                tds_deducted_paise=t.tds_deducted_paise,
                tds_rate_bps=t.tds_rate_bps,
                deposit_date=t.deposit_date,
                challan_reference=t.challan_reference,
            ))

        total_val = sum(p.amount_paise for p in dataset.payments)
        batch = BatchDB(
            id="batch_settlement_2026_08_28",
            name=batch_name,
            status="PENDING",
            total_records=dataset.total_record_count,
            matched_records=0,
            adjusted_records=0,
            ai_assisted_records=0,
            escalated_records=0,
            unresolved_records=0,
            total_value_paise=total_val,
            reconciled_value_paise=0,
            unresolved_value_paise=total_val,
        )
        db.add(batch)
        db.commit()


def main():
    parser = argparse.ArgumentParser(description="HISAB Synthetic Data Generator & Seeder")
    parser.add_argument("--records", type=int, default=500, help="Target total records (default: 500)")
    parser.add_argument("--corrupt", action="store_true", default=True, help="Inject controlled anomalies")
    parser.add_argument("--clean", action="store_true", help="Generate pure clean dataset without corruption")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for determinism")
    parser.add_argument("--export-fixtures", action="store_true", help="Export dataset fixtures to data/ directory")
    parser.add_argument("--seed-db", action="store_true", default=True, help="Seed data directly into database")
    args = parser.parse_args()

    clean_dataset = generate_synthetic_dataset(record_count=args.records, seed=args.seed)
    
    if args.clean:
        final_dataset = clean_dataset
        label = "CLEAN"
    else:
        final_dataset = inject_corruptions(clean_dataset, seed=args.seed)
        label = "CORRUPTED (BENCHMARK)"

    total_value = sum(p.amount_paise for p in final_dataset.payments)
    anomalies_count = sum(1 for gt in final_dataset.ground_truth.values() if gt.is_anomaly)

    print("=" * 70)
    print(f"  HISAB SYNTHETIC DATASET GENERATOR — {final_dataset.merchant_name}")
    print("=" * 70)
    print(f"Mode:             {label}")
    print(f"Total Records:    {final_dataset.total_record_count}")
    print(f"  • Customers:    {len(final_dataset.customers)}")
    print(f"  • Orders:       {len(final_dataset.orders)}")
    print(f"  • Payments:     {len(final_dataset.payments)}")
    print(f"  • Refunds:      {len(final_dataset.refunds)}")
    print(f"  • Disputes:     {len(final_dataset.disputes)}")
    print(f"  • Settlements:  {len(final_dataset.settlements)}")
    print(f"  • Bank Lines:   {len(final_dataset.bank_transactions)}")
    print(f"  • Tax Records:  {len(final_dataset.tax_records)}")
    print(f"Gross Turnover:   {format_inr(total_value)} ({format_inr_compact(total_value)})")
    print(f"Ground Truth:     {anomalies_count} intentional anomalies configured")
    print("-" * 70)

    if args.export_fixtures:
        os.makedirs("data/synthetic", exist_ok=True)
        os.makedirs("data/fixtures", exist_ok=True)
        
        recon_csv = export_razorpay_recon_csv(final_dataset)
        with open("data/synthetic/razorpay_settlement_recon.csv", "w") as f:
            f.write(recon_csv)
            
        print("✓ Exported data/synthetic/razorpay_settlement_recon.csv (Razorpay official schema)")

    if args.seed_db:
        seed_database_from_dataset(final_dataset)
        print("✓ Database successfully seeded with 500+ records in data/generated/hisab.db")
    print("=" * 70)


if __name__ == "__main__":
    main()
