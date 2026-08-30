"""
HISAB — SQLAlchemy 2.0 Multi-Tenant Database Models.

Authoritative relational schema for PostgreSQL (production) & SQLite (isolated test suites).
Enforces strict tenant isolation via indexed `org_id` foreign keys on all commercial,
reconciliation, audit, and conversational records.
All financial amounts are stored as Integer (Paise) to prevent floating-point rounding errors.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

JSONType = JSON


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


# ------------------------------------------------------------------------------
# 1. Core Auth, Organization & Multi-Tenancy Tables
# ------------------------------------------------------------------------------

class UserDB(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    pw_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    pw_salt: Mapped[str] = mapped_column(String(64), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_initials: Mapped[str] = mapped_column(String(8), default="U")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class OrganizationDB(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    org_type: Mapped[str] = mapped_column(String(128), default="E-Commerce / Direct-to-Consumer")
    country: Mapped[str] = mapped_column(String(64), default="India")
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    gstin: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    owner_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class OrganizationMemberDB(Base):
    __tablename__ = "organization_members"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(32), default="ANALYST", index=True)  # ADMIN | FINANCE_MANAGER | ANALYST | AUDITOR
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE")  # ACTIVE | SUSPENDED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        UniqueConstraint("org_id", "user_id", name="uq_org_member"),
    )


class InvitationDB(Base):
    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(32), default="ANALYST")
    invited_by_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="PENDING", index=True)  # PENDING | ACCEPTED | REVOKED | EXPIRED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class OrgRazorpayConnectionDB(Base):
    """
    Razorpay gateway connection strictly scoped to the Organization (not individual users).
    """
    __tablename__ = "org_razorpay_connections"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    merchant_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    merchant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    environment: Mapped[str] = mapped_column(String(16), default="TEST")
    status: Mapped[str] = mapped_column(String(32), default="disconnected")
    masked_client_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    encrypted_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    connected_by_user_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


# ------------------------------------------------------------------------------
# 2. Core Merchant Commercial Tables (Organization-Scoped)
# ------------------------------------------------------------------------------

class CustomerDB(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    contact: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    orders: Mapped[List["OrderDB"]] = relationship("OrderDB", back_populates="customer")
    payments: Mapped[List["PaymentDB"]] = relationship("PaymentDB", back_populates="customer")

    __table_args__ = (
        Index("idx_customers_org_email", "org_id", "email"),
    )


class OrderDB(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    amount_paid_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    receipt: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="created")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    customer: Mapped["CustomerDB"] = relationship("CustomerDB", back_populates="orders")
    payments: Mapped[List["PaymentDB"]] = relationship("PaymentDB", back_populates="order")

    __table_args__ = (
        Index("idx_orders_org_receipt", "org_id", "receipt"),
        Index("idx_orders_org_status", "org_id", "status"),
    )


class PaymentDB(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    order_id: Mapped[str] = mapped_column(String(64), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    status: Mapped[str] = mapped_column(String(32), default="captured", index=True)
    method: Mapped[str] = mapped_column(String(32), default="card")
    instrument_ref: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    fee_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    tax_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    net_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    error_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    error_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    settlement_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("settlements.id", ondelete="SET NULL"), nullable=True, index=True)
    captured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    order: Mapped["OrderDB"] = relationship("OrderDB", back_populates="payments")
    customer: Mapped["CustomerDB"] = relationship("CustomerDB", back_populates="payments")
    refunds: Mapped[List["RefundDB"]] = relationship("RefundDB", back_populates="payment")
    disputes: Mapped[List["DisputeDB"]] = relationship("DisputeDB", back_populates="payment")
    settlement: Mapped[Optional["SettlementDB"]] = relationship("SettlementDB", back_populates="payments")

    __table_args__ = (
        Index("idx_payments_org_status", "org_id", "status"),
        Index("idx_payments_org_settlement", "org_id", "settlement_id"),
        Index("idx_payments_org_created", "org_id", "created_at"),
    )


class RefundDB(Base):
    __tablename__ = "refunds"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    payment_id: Mapped[str] = mapped_column(String(64), ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    status: Mapped[str] = mapped_column(String(32), default="processed", index=True)
    speed: Mapped[str] = mapped_column(String(32), default="normal")
    source_instrument_ref: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    acquirer_arn: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    settlement_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("settlements.id", ondelete="SET NULL"), nullable=True, index=True)
    notes: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    payment: Mapped["PaymentDB"] = relationship("PaymentDB", back_populates="refunds")

    __table_args__ = (
        Index("idx_refunds_org_payment", "org_id", "payment_id"),
        Index("idx_refunds_org_status", "org_id", "status"),
    )


class DisputeDB(Base):
    __tablename__ = "disputes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    payment_id: Mapped[str] = mapped_column(String(64), ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    status: Mapped[str] = mapped_column(String(32), default="open", index=True)
    reason_code: Mapped[str] = mapped_column(String(64), default="goods_not_received")
    deduction_amount_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    fee_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    respond_by: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    evidence_submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    payment: Mapped["PaymentDB"] = relationship("PaymentDB", back_populates="disputes")

    __table_args__ = (
        Index("idx_disputes_org_status", "org_id", "status"),
        Index("idx_disputes_org_payment", "org_id", "payment_id"),
    )


# ------------------------------------------------------------------------------
# 3. Settlement & Settlement Line Tables
# ------------------------------------------------------------------------------

class SettlementDB(Base):
    __tablename__ = "settlements"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    utr: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    gross_amount_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    fee_amount_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    tax_amount_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    refund_amount_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    adjustment_amount_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    dispute_amount_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    status: Mapped[str] = mapped_column(String(32), default="settled", index=True)
    settled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    payments: Mapped[List["PaymentDB"]] = relationship("PaymentDB", back_populates="settlement")
    lines: Mapped[List["SettlementLineDB"]] = relationship("SettlementLineDB", back_populates="settlement")

    __table_args__ = (
        Index("idx_settlements_org_utr", "org_id", "utr"),
        Index("idx_settlements_org_status", "org_id", "status"),
        Index("idx_settlements_org_created", "org_id", "created_at"),
    )


class SettlementLineDB(Base):
    __tablename__ = "settlement_lines"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    settlement_id: Mapped[str] = mapped_column(String(64), ForeignKey("settlements.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(32), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    gross_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    fee_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    tax_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    net_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    settlement: Mapped["SettlementDB"] = relationship("SettlementDB", back_populates="lines")


# ------------------------------------------------------------------------------
# 4. External Bank & Tax Tables
# ------------------------------------------------------------------------------

class BankTransactionDB(Base):
    __tablename__ = "bank_transactions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    bank_account_number_masked: Mapped[str] = mapped_column(String(32), default="•••• 9876")
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    value_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    direction: Mapped[str] = mapped_column(String(16), default="credit")
    reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    matched_settlement_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    __table_args__ = (
        Index("idx_bank_tx_org_ref", "org_id", "reference"),
        Index("idx_bank_tx_org_date", "org_id", "date"),
    )


class TaxRecordDB(Base):
    __tablename__ = "tax_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    deductor_pan: Mapped[str] = mapped_column(String(16), default="AAACR1234A", index=True)
    deductor_name: Mapped[str] = mapped_column(String(255), default="Razorpay Software Pvt Ltd")
    section: Mapped[str] = mapped_column(String(32), default="194-O")
    financial_year: Mapped[str] = mapped_column(String(16), default="2024-25")
    quarter: Mapped[str] = mapped_column(String(8), default="Q3")
    gross_amount_credited_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    tds_deducted_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    tds_rate_bps: Mapped[int] = mapped_column(Integer, default=10)
    deposit_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    challan_reference: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    __table_args__ = (
        Index("idx_tax_org_quarter", "org_id", "financial_year", "quarter"),
    )


# ------------------------------------------------------------------------------
# 5. Batch, Exceptions, Controls & Cryptographic Audit Ledger Tables
# ------------------------------------------------------------------------------

class BatchDB(Base):
    __tablename__ = "batches"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="PENDING", index=True)
    total_records: Mapped[int] = mapped_column(Integer, default=0)
    matched_records: Mapped[int] = mapped_column(Integer, default=0)
    adjusted_records: Mapped[int] = mapped_column(Integer, default=0)
    ai_assisted_records: Mapped[int] = mapped_column(Integer, default=0)
    escalated_records: Mapped[int] = mapped_column(Integer, default=0)
    unresolved_records: Mapped[int] = mapped_column(Integer, default=0)
    total_value_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    reconciled_value_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    unresolved_value_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    match_rate_pct: Mapped[float] = mapped_column(Float, default=0.0)
    throughput_rps: Mapped[float] = mapped_column(Float, default=0.0)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    summary_report: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONType, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index("idx_batches_org_status", "org_id", "status"),
        Index("idx_batches_org_created", "org_id", "created_at"),
    )


class ExceptionDB(Base):
    __tablename__ = "exceptions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    batch_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("batches.id", ondelete="SET NULL"), nullable=True, index=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    financial_impact_paise: Mapped[int] = mapped_column(BigInteger, default=0)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    root_cause: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(String(32), default="HUMAN_REVIEW")
    affected_records: Mapped[List[Dict[str, Any]]] = mapped_column(JSONType, default=list)
    evidence: Mapped[Dict[str, Any]] = mapped_column(JSONType, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="OPEN", index=True)
    resolution_method: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_exceptions_org_status", "org_id", "status"),
        Index("idx_exceptions_org_batch", "org_id", "batch_id"),
        Index("idx_exceptions_org_severity", "org_id", "severity"),
    )


class AuditEntryDB(Base):
    """
    Immutable, cryptographic hash-chained audit ledger.
    Every material financial control decision records previous_hash and current_hash.
    Scoped strictly to the Organization.
    """
    __tablename__ = "audit_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sequence: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    batch_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    case_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    policy_result: Mapped[str] = mapped_column(String(64), nullable=False)
    reason_code: Mapped[str] = mapped_column(String(64), nullable=False)
    evidence_ids: Mapped[List[str]] = mapped_column(JSONType, default=list)
    actor_type: Mapped[str] = mapped_column(String(32), default="SYSTEM")
    payload: Mapped[Dict[str, Any]] = mapped_column(JSONType, default=dict)
    previous_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    current_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        UniqueConstraint("org_id", "sequence", name="uq_audit_org_sequence"),
        Index("idx_audit_org_batch", "org_id", "batch_id"),
        Index("idx_audit_org_case", "org_id", "case_id"),
        Index("idx_audit_org_created", "org_id", "created_at"),
    )


class AgentRunDB(Base):
    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    batch_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="RUNNING")
    tools_called: Mapped[int] = mapped_column(Integer, default=0)
    cases_evaluated: Mapped[int] = mapped_column(Integer, default=0)
    cases_resolved: Mapped[int] = mapped_column(Integer, default=0)
    cases_escalated: Mapped[int] = mapped_column(Integer, default=0)
    fallback_invoked: Mapped[bool] = mapped_column(Boolean, default=False)
    logs: Mapped[List[Dict[str, Any]]] = mapped_column(JSONType, default=list)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_agent_runs_org_batch", "org_id", "batch_id"),
    )


class SnapshotDB(Base):
    """
    Immutable sealed snapshots of reconciliation state.
    """
    __tablename__ = "snapshots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, default="org_nova_2026", index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    merchant_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    merchant_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    date_range: Mapped[str] = mapped_column(String(64), default="Current")
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    matching_mode: Mapped[str] = mapped_column(String(64), default="TIERED_1_TO_3")
    resolution_mode: Mapped[str] = mapped_column(String(64), default="SAFE_POLICY_GATED")
    materiality_threshold_paise: Mapped[int] = mapped_column(BigInteger, default=500000)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSONType, default=dict)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index("idx_snapshots_org_created", "org_id", "created_at"),
    )


class ConversationDB(Base):
    """
    Persisted Ask HISAB financial conversations scoped to Organization & User.
    """
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mode: Mapped[str] = mapped_column(String(32), default="financial")  # financial | docs
    title: Mapped[str] = mapped_column(String(255), default="Financial Inquiry")
    messages: Mapped[List[Dict[str, Any]]] = mapped_column(JSONType, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        Index("idx_conversations_org_user", "org_id", "user_id"),
    )

