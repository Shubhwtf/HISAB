"""
HISAB — Cryptographic Hash-Chained Audit Ledger (Section 27).

Provides a tamper-evident audit trail for every material financial action,
policy gate decision, AI controller tool invocation, and batch closure.
Each entry is cryptographically linked to its predecessor: H1 -> H2 -> H3 -> ...
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from packages.domain.db_models import AuditEntryDB


GENESIS_HASH = "0" * 64


def canonical_json_dumps(obj: Any) -> str:
    """
    Produces deterministic, sorted-key JSON strings for stable hashing.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)


def format_iso_timestamp(dt: Any) -> str:
    """
    Normalizes datetime objects to a canonical UTC string representation
    to guarantee identical hashing across SQLite and PostgreSQL backends.
    """
    if isinstance(dt, datetime):
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt.strftime("%Y-%m-%dT%H:%M:%S.%f")
    return str(dt)


def compute_audit_hash(
    previous_hash: str,
    sequence: int,
    batch_id: Optional[str],
    case_id: str,
    event_type: str,
    action: str,
    policy_result: str,
    reason_code: str,
    actor_type: str,
    payload: Dict[str, Any],
    created_at: Any,
) -> str:
    """
    Computes deterministic SHA-256 hash for an audit record.
    """
    serialized_payload = canonical_json_dumps(payload)
    canonical_time = format_iso_timestamp(created_at)
    hash_input = (
        f"{previous_hash}|{sequence}|{batch_id or ''}|{case_id}|"
        f"{event_type}|{action}|{policy_result}|{reason_code}|"
        f"{actor_type}|{serialized_payload}|{canonical_time}"
    )
    return hashlib.sha256(hash_input.encode("utf-8")).hexdigest()


class AuditEntryDTO(BaseModel):
    sequence: int
    batch_id: Optional[str]
    case_id: str
    event_type: str
    action: str
    policy_result: str
    reason_code: str
    evidence_ids: List[str] = Field(default_factory=list)
    actor_type: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    previous_hash: str
    current_hash: str
    created_at: datetime


def append_audit_entry(
    db: Session,
    case_id: str,
    event_type: str,
    action: str,
    policy_result: str,
    reason_code: str,
    payload: Dict[str, Any],
    evidence_ids: Optional[List[str]] = None,
    batch_id: Optional[str] = None,
    actor_type: str = "SYSTEM",
    created_at: Optional[datetime] = None,
    org_id: str = "org_nova_2026",
) -> AuditEntryDB:
    """
    Appends a new immutable audit record, chaining from the organization's latest record.
    """
    latest = db.scalars(
        select(AuditEntryDB)
        .where(AuditEntryDB.org_id == org_id)
        .order_by(AuditEntryDB.sequence.desc())
        .limit(1)
    ).first()

    if latest is None:
        sequence = 1
        previous_hash = GENESIS_HASH
    else:
        sequence = (latest.sequence or 0) + 1
        previous_hash = latest.current_hash

    entry_time = created_at or datetime.now(timezone.utc)

    current_hash = compute_audit_hash(
        previous_hash=previous_hash,
        sequence=sequence,
        batch_id=batch_id,
        case_id=case_id,
        event_type=event_type,
        action=action,
        policy_result=policy_result,
        reason_code=reason_code,
        actor_type=actor_type,
        payload=payload,
        created_at=entry_time,
    )

    entry = AuditEntryDB(
        sequence=sequence,
        org_id=org_id,
        batch_id=batch_id,
        case_id=case_id,
        event_type=event_type,
        action=action,
        policy_result=policy_result,
        reason_code=reason_code,
        evidence_ids=evidence_ids or [],
        actor_type=actor_type,
        payload=payload,
        previous_hash=previous_hash,
        current_hash=current_hash,
        created_at=entry_time,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def verify_audit_chain(entries: List[AuditEntryDB]) -> Tuple[bool, Optional[str]]:
    """
    Validates the cryptographic integrity of the entire audit chain.
    Returns (True, None) if completely valid, or (False, error_message) if tampered.
    """
    if not entries:
        return True, None

    sorted_entries = sorted(entries, key=lambda e: e.sequence)
    expected_previous_hash = GENESIS_HASH

    for i, entry in enumerate(sorted_entries):
        expected_sequence = i + 1
        if entry.sequence != expected_sequence:
            return (
                False,
                f"Broken sequence at index {i}: expected {expected_sequence}, found {entry.sequence}",
            )

        if entry.previous_hash != expected_previous_hash:
            return (
                False,
                f"Hash link broken at sequence {entry.sequence}: "
                f"entry.previous_hash '{entry.previous_hash}' != expected '{expected_previous_hash}'",
            )

        computed_hash = compute_audit_hash(
            previous_hash=entry.previous_hash,
            sequence=entry.sequence,
            batch_id=entry.batch_id,
            case_id=entry.case_id,
            event_type=entry.event_type,
            action=entry.action,
            policy_result=entry.policy_result,
            reason_code=entry.reason_code,
            actor_type=entry.actor_type,
            payload=entry.payload or {},
            created_at=entry.created_at,
        )

        if computed_hash != entry.current_hash:
            return (
                False,
                f"Cryptographic payload tampering detected at sequence {entry.sequence}: "
                f"computed hash '{computed_hash}' != stored hash '{entry.current_hash}'",
            )

        expected_previous_hash = entry.current_hash

    return True, None
