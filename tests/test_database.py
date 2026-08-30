"""
Unit tests for SQLAlchemy Database Engine & Operations.
"""

from datetime import datetime, timezone
import pytest
from sqlalchemy import select
from packages.domain.database import (
    init_db_sync,
    reset_db_sync,
    get_sync_db,
    init_db,
    reset_db,
    AsyncSessionLocal,
)
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
    ExceptionDB,
    AuditEntryDB,
)


@pytest.fixture(autouse=True)
def setup_test_db():
    reset_db_sync()
    yield


class TestDatabaseSync:
    def test_insert_and_query_hierarchy(self):
        with get_sync_db() as db:
            # 1. Insert Customer
            cust = CustomerDB(
                id="cust_test_1",
                name="Aakash Verma",
                email="aakash@test.com",
                contact="+919800000001"
            )
            db.add(cust)
            db.commit()

            # 2. Insert Order
            order = OrderDB(
                id="order_test_1",
                customer_id=cust.id,
                amount_paise=5000000,
                amount_paid_paise=5000000,
                status="paid"
            )
            db.add(order)
            db.commit()

            # 3. Insert Settlement
            settlement = SettlementDB(
                id="setl_test_1",
                utr="UTR99001122",
                gross_amount_paise=5000000,
                fee_amount_paise=100000,
                tax_amount_paise=18000,
                amount_paise=4882000,
                status="settled"
            )
            db.add(settlement)
            db.commit()

            # 4. Insert Payment
            payment = PaymentDB(
                id="pay_test_1",
                order_id=order.id,
                customer_id=cust.id,
                amount_paise=5000000,
                fee_paise=100000,
                tax_paise=18000,
                net_paise=4882000,
                settlement_id=settlement.id,
                status="captured"
            )
            db.add(payment)

            # 5. Insert Settlement Line
            line = SettlementLineDB(
                id="sline_test_1",
                settlement_id=settlement.id,
                entity_type="payment",
                entity_id=payment.id,
                gross_paise=5000000,
                fee_paise=100000,
                tax_paise=18000,
                net_paise=4882000
            )
            db.add(line)

            # 6. Insert Refund
            rfnd = RefundDB(
                id="rfnd_test_1",
                payment_id=payment.id,
                order_id=order.id,
                amount_paise=2000000,
                status="processed"
            )
            db.add(rfnd)

            # 7. Insert Dispute
            disp = DisputeDB(
                id="disp_test_1",
                payment_id=payment.id,
                order_id=order.id,
                amount_paise=3000000,
                status="open"
            )
            db.add(disp)

            # 8. Insert Bank Transaction
            bank = BankTransactionDB(
                id="bnk_test_1",
                date=datetime.now(timezone.utc),
                amount_paise=4882000,
                reference="UTR99001122",
                matched_settlement_id=settlement.id
            )
            db.add(bank)

            # 9. Insert Batch & Exception & Audit
            batch = BatchDB(
                id="batch_test_1",
                name="Settlement Batch 2026-08-28",
                total_records=1,
                matched_records=1,
                reconciled_value_paise=4882000
            )
            db.add(batch)

            exc = ExceptionDB(
                id="exc_test_1",
                batch_id=batch.id,
                category="DOUBLE_LOSS",
                severity="CRITICAL",
                financial_impact_paise=5000000,
                root_cause="Test potential double-loss"
            )
            db.add(exc)

            audit = AuditEntryDB(
                batch_id=batch.id,
                case_id="case_1",
                event_type="CONTROL_CHECK",
                action="FLAG_DOUBLE_LOSS",
                policy_result="ESCALATE",
                reason_code="REFUND_PLUS_DISPUTE",
                previous_hash="0"*64,
                current_hash="a"*64
            )
            db.add(audit)
            db.commit()

            # Query and verify
            res_cust = db.scalars(select(CustomerDB).where(CustomerDB.id == "cust_test_1")).first()
            assert res_cust is not None
            assert len(res_cust.orders) == 1
            assert len(res_cust.payments) == 1
            assert res_cust.payments[0].amount_paise == 5000000

            res_setl = db.scalars(select(SettlementDB).where(SettlementDB.id == "setl_test_1")).first()
            assert res_setl is not None
            assert len(res_setl.lines) == 1
            assert res_setl.lines[0].net_paise == 4882000


@pytest.mark.asyncio
class TestDatabaseAsync:
    async def test_async_operations(self):
        await init_db()
        async with AsyncSessionLocal() as session:
            cust = CustomerDB(
                id="cust_async_1",
                name="Pooja Mehta",
                email="pooja@test.com",
                contact="+919800000002"
            )
            session.add(cust)
            await session.commit()

            result = await session.scalars(select(CustomerDB).where(CustomerDB.id == "cust_async_1"))
            fetched = result.first()
            assert fetched is not None
            assert fetched.name == "Pooja Mehta"

@pytest.mark.asyncio
class TestDatabaseCoverage:
    async def test_async_reset_and_dependency(self):
        from packages.domain.database import reset_db, get_async_db, init_db_sync
        await reset_db()
        gen = get_async_db()
        session = await anext(gen)
        assert session is not None
        try:
            await anext(gen)
        except StopAsyncIteration:
            pass
        init_db_sync()
