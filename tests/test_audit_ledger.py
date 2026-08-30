"""
Unit tests for Cryptographic Hash-Chained Audit Ledger.
"""

from datetime import datetime, timezone
import pytest
from sqlalchemy import select

from packages.domain.database import reset_db_sync, get_sync_db
from packages.domain.db_models import AuditEntryDB
from packages.domain.audit_ledger import (
    GENESIS_HASH,
    append_audit_entry,
    verify_audit_chain,
    compute_audit_hash,
)


@pytest.fixture(autouse=True)
def setup_db():
    reset_db_sync()
    yield


class TestAuditLedger:
    def test_append_and_verify_clean_chain(self):
        with get_sync_db() as db:
            e1 = append_audit_entry(
                db=db,
                case_id="case_101",
                event_type="INGESTION",
                action="INGEST_BATCH",
                policy_result="PROCEED",
                reason_code="SOURCE_VALID",
                payload={"records": 500},
                batch_id="batch_01",
                actor_type="SYSTEM",
            )
            assert e1.sequence == 1
            assert e1.previous_hash == GENESIS_HASH

            e2 = append_audit_entry(
                db=db,
                case_id="case_102",
                event_type="MATCHING",
                action="EXACT_MATCH",
                policy_result="AUTO_RESOLVE",
                reason_code="MATCHED_UTR",
                payload={"settlement_id": "setl_1"},
                batch_id="batch_01",
                actor_type="SYSTEM",
            )
            assert e2.sequence == 2
            assert e2.previous_hash == e1.current_hash

            e3 = append_audit_entry(
                db=db,
                case_id="case_103",
                event_type="CONTROL_CHECK",
                action="FLAG_DOUBLE_LOSS",
                policy_result="ESCALATE",
                reason_code="REFUND_PLUS_DISPUTE",
                payload={"exposure": 14400000},
                batch_id="batch_01",
                actor_type="AI_AGENT",
            )
            assert e3.sequence == 3
            assert e3.previous_hash == e2.current_hash

            all_entries = db.scalars(select(AuditEntryDB).order_by(AuditEntryDB.sequence.asc())).all()
            assert len(all_entries) == 3

            is_valid, err = verify_audit_chain(list(all_entries))
            assert is_valid is True
            assert err is None

    def test_tamper_detection_on_mutated_payload(self):
        with get_sync_db() as db:
            e1 = append_audit_entry(
                db=db,
                case_id="c1",
                event_type="MATCH",
                action="MATCH_PAYMENT",
                policy_result="AUTO_RESOLVE",
                reason_code="OK",
                payload={"amount": 1000},
            )
            e2 = append_audit_entry(
                db=db,
                case_id="c2",
                event_type="RESOLVE",
                action="CLOSE_CASE",
                policy_result="AUTO_RESOLVE",
                reason_code="OK",
                payload={"amount": 2000},
            )
            
            all_entries = list(db.scalars(select(AuditEntryDB).order_by(AuditEntryDB.sequence.asc())).all())
            
            # Intentionally tamper with entry 2 payload
            all_entries[1].payload = {"amount": 999999}  # Modified payload!

            is_valid, err = verify_audit_chain(all_entries)
            assert is_valid is False
            assert "Cryptographic payload tampering detected at sequence 2" in err

    def test_tamper_detection_on_mutated_action(self):
        with get_sync_db() as db:
            append_audit_entry(db=db, case_id="c1", event_type="E1", action="ACTION_1", policy_result="OK", reason_code="OK", payload={})
            append_audit_entry(db=db, case_id="c2", event_type="E2", action="ESCALATE", policy_result="WARN", reason_code="OK", payload={})

            all_entries = list(db.scalars(select(AuditEntryDB).order_by(AuditEntryDB.sequence.asc())).all())
            
            # Maliciously change ESCALATE to AUTO_RESOLVE
            all_entries[1].action = "AUTO_RESOLVE"

            is_valid, err = verify_audit_chain(all_entries)
            assert is_valid is False
            assert "tampering detected" in err

    def test_tamper_detection_on_broken_chain_hash(self):
        with get_sync_db() as db:
            append_audit_entry(db=db, case_id="c1", event_type="E1", action="A1", policy_result="OK", reason_code="OK", payload={})
            append_audit_entry(db=db, case_id="c2", event_type="E2", action="A2", policy_result="OK", reason_code="OK", payload={})

            all_entries = list(db.scalars(select(AuditEntryDB).order_by(AuditEntryDB.sequence.asc())).all())
            
            # Alter previous_hash
            all_entries[1].previous_hash = "f" * 64

            is_valid, err = verify_audit_chain(all_entries)
            assert is_valid is False
            assert "Hash link broken" in err
