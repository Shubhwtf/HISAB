"""0001_initial_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-08-31 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Identity & Access: Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='ANALYST'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1' if 'sqlite' in op.get_bind().dialect.name else 'true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 2. Multi-Tenant Organizations
    op.create_table(
        'organizations',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=128), nullable=False, unique=True, index=True),
        sa.Column('owner_user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('plan', sa.String(length=32), nullable=False, server_default='ENTERPRISE'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 3. Organization Memberships
    op.create_table(
        'organization_members',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='ANALYST'),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('org_id', 'user_id', name='uq_org_member'),
    )

    # 4. Invitations
    op.create_table(
        'invitations',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('email', sa.String(length=255), nullable=False, index=True),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('token', sa.String(length=128), nullable=False, unique=True, index=True),
        sa.Column('invited_by_user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 5. Razorpay Connections
    op.create_table(
        'org_razorpay_connections',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, unique=True, index=True),
        sa.Column('merchant_id', sa.String(length=64), nullable=True),
        sa.Column('public_key', sa.String(length=128), nullable=True),
        sa.Column('secret_key', sa.String(length=255), nullable=True),
        sa.Column('webhook_secret', sa.String(length=255), nullable=True),
        sa.Column('connected_by_user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='DISCONNECTED'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 6. Customers
    op.create_table(
        'customers',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('contact', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_customers_org_email', 'customers', ['org_id', 'email'])

    # 7. Orders
    op.create_table(
        'orders',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('customer_id', sa.String(length=64), sa.ForeignKey('customers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount_paise', sa.BigInteger(), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False, server_default='INR'),
        sa.Column('receipt', sa.String(length=128), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_orders_org_receipt', 'orders', ['org_id', 'receipt'])
    op.create_index('idx_orders_org_status', 'orders', ['org_id', 'status'])

    # 8. Settlements
    op.create_table(
        'settlements',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('amount_paise', sa.BigInteger(), nullable=False),
        sa.Column('gross_amount_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('fee_amount_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('tax_amount_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('currency', sa.String(length=8), nullable=False, server_default='INR'),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('utr', sa.String(length=128), nullable=True),
        sa.Column('settled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_settlements_org_utr', 'settlements', ['org_id', 'utr'])
    op.create_index('idx_settlements_org_status', 'settlements', ['org_id', 'status'])
    op.create_index('idx_settlements_org_created', 'settlements', ['org_id', 'created_at'])

    # 9. Settlement Lines
    op.create_table(
        'settlement_lines',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('settlement_id', sa.String(length=64), sa.ForeignKey('settlements.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('entity_type', sa.String(length=32), nullable=False),
        sa.Column('entity_id', sa.String(length=64), nullable=False),
        sa.Column('amount_paise', sa.BigInteger(), nullable=False),
        sa.Column('fee_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('tax_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('net_paise', sa.BigInteger(), nullable=False, server_default='0'),
    )

    # 10. Payments
    op.create_table(
        'payments',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('order_id', sa.String(length=64), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
        sa.Column('customer_id', sa.String(length=64), sa.ForeignKey('customers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('settlement_id', sa.String(length=64), sa.ForeignKey('settlements.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount_paise', sa.BigInteger(), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False, server_default='INR'),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('method', sa.String(length=32), nullable=False),
        sa.Column('fee_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('tax_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('net_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('error_code', sa.String(length=64), nullable=True),
        sa.Column('error_description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_payments_org_status', 'payments', ['org_id', 'status'])
    op.create_index('idx_payments_org_settlement', 'payments', ['org_id', 'settlement_id'])
    op.create_index('idx_payments_org_created', 'payments', ['org_id', 'created_at'])

    # 11. Refunds
    op.create_table(
        'refunds',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('payment_id', sa.String(length=64), sa.ForeignKey('payments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_id', sa.String(length=64), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
        sa.Column('settlement_id', sa.String(length=64), sa.ForeignKey('settlements.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount_paise', sa.BigInteger(), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False, server_default='INR'),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('speed', sa.String(length=32), nullable=False, server_default='NORMAL'),
        sa.Column('arn', sa.String(length=128), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_refunds_org_payment', 'refunds', ['org_id', 'payment_id'])
    op.create_index('idx_refunds_org_status', 'refunds', ['org_id', 'status'])

    # 12. Disputes
    op.create_table(
        'disputes',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('payment_id', sa.String(length=64), sa.ForeignKey('payments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_id', sa.String(length=64), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount_paise', sa.BigInteger(), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False, server_default='INR'),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('reason_code', sa.String(length=64), nullable=True),
        sa.Column('respond_by', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deduction_amount_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_disputes_org_status', 'disputes', ['org_id', 'status'])
    op.create_index('idx_disputes_org_payment', 'disputes', ['org_id', 'payment_id'])

    # 13. Bank Transactions
    op.create_table(
        'bank_transactions',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('reference', sa.String(length=128), nullable=True),
        sa.Column('amount_paise', sa.BigInteger(), nullable=False),
        sa.Column('type', sa.String(length=16), nullable=False),
        sa.Column('balance_paise', sa.BigInteger(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_bank_tx_org_ref', 'bank_transactions', ['org_id', 'reference'])
    op.create_index('idx_bank_tx_org_date', 'bank_transactions', ['org_id', 'date'])

    # 14. Tax Records
    op.create_table(
        'tax_records',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('financial_year', sa.String(length=16), nullable=False),
        sa.Column('quarter', sa.String(length=8), nullable=False),
        sa.Column('section', sa.String(length=32), nullable=False),
        sa.Column('tds_rate_bps', sa.Integer(), nullable=False),
        sa.Column('gross_amount_paise', sa.BigInteger(), nullable=False),
        sa.Column('tds_deducted_paise', sa.BigInteger(), nullable=False),
        sa.Column('challan_number', sa.String(length=64), nullable=True),
        sa.Column('certificate_26as_matched', sa.Boolean(), nullable=False, server_default=sa.text('0' if 'sqlite' in op.get_bind().dialect.name else 'false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_tax_org_quarter', 'tax_records', ['org_id', 'financial_year', 'quarter'])

    # 15. Batches
    op.create_table(
        'batches',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('total_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('matched_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('unmatched_records', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('exception_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_batches_org_status', 'batches', ['org_id', 'status'])
    op.create_index('idx_batches_org_created', 'batches', ['org_id', 'created_at'])

    # 16. Exceptions
    op.create_table(
        'exceptions',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('batch_id', sa.String(length=64), sa.ForeignKey('batches.id', ondelete='SET NULL'), nullable=True),
        sa.Column('category', sa.String(64), nullable=False),
        sa.Column('severity', sa.String(32), nullable=False),
        sa.Column('financial_impact_paise', sa.BigInteger(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('root_cause', sa.Text(), nullable=False),
        sa.Column('recommendation', sa.Text(), nullable=False),
        sa.Column('affected_records', sa.JSON(), nullable=False),
        sa.Column('evidence', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(32), nullable=False, server_default='OPEN'),
        sa.Column('resolution_method', sa.String(64), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_exceptions_org_status', 'exceptions', ['org_id', 'status'])
    op.create_index('idx_exceptions_org_batch', 'exceptions', ['org_id', 'batch_id'])
    op.create_index('idx_exceptions_org_severity', 'exceptions', ['org_id', 'severity'])

    # 17. Cryptographic Audit Entries
    op.create_table(
        'audit_entries',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.String(length=64), nullable=True),
        sa.Column('case_id', sa.String(length=64), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('action', sa.String(length=128), nullable=False),
        sa.Column('policy_result', sa.String(length=64), nullable=False),
        sa.Column('reason_code', sa.String(length=64), nullable=False),
        sa.Column('evidence_ids', sa.JSON(), nullable=False),
        sa.Column('actor_type', sa.String(length=64), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('previous_hash', sa.String(length=64), nullable=False),
        sa.Column('current_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_audit_org_batch', 'audit_entries', ['org_id', 'batch_id'])
    op.create_index('idx_audit_org_case', 'audit_entries', ['org_id', 'case_id'])
    op.create_index('idx_audit_org_created', 'audit_entries', ['org_id', 'created_at'])

    # 18. Agent Runs
    op.create_table(
        'agent_runs',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('batch_id', sa.String(length=64), nullable=True),
        sa.Column('agent_type', sa.String(length=64), nullable=False),
        sa.Column('trigger', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('tools_invoked', sa.JSON(), nullable=False),
        sa.Column('findings', sa.JSON(), nullable=False),
        sa.Column('confidence_scores', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_agent_runs_org_batch', 'agent_runs', ['org_id', 'batch_id'])

    # 19. Snapshots
    op.create_table(
        'snapshots',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('merchant_name', sa.String(length=255), nullable=True),
        sa.Column('merchant_id', sa.String(length=64), nullable=True),
        sa.Column('date_range', sa.String(length=64), nullable=False),
        sa.Column('currency', sa.String(length=8), nullable=False, server_default='INR'),
        sa.Column('matching_mode', sa.String(length=64), nullable=False),
        sa.Column('resolution_mode', sa.String(length=64), nullable=False),
        sa.Column('materiality_threshold_paise', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('sha256_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_snapshots_org_created', 'snapshots', ['org_id', 'created_at'])

    # 20. Conversations
    op.create_table(
        'conversations',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('mode', sa.String(length=32), nullable=False, server_default='docs'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('messages', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_conversations_org_user', 'conversations', ['org_id', 'user_id'])


def downgrade() -> None:
    op.drop_table('conversations')
    op.drop_table('snapshots')
    op.drop_table('agent_runs')
    op.drop_table('audit_entries')
    op.drop_table('exceptions')
    op.drop_table('batches')
    op.drop_table('tax_records')
    op.drop_table('bank_transactions')
    op.drop_table('disputes')
    op.drop_table('refunds')
    op.drop_table('payments')
    op.drop_table('settlement_lines')
    op.drop_table('settlements')
    op.drop_table('orders')
    op.drop_table('customers')
    op.drop_table('org_razorpay_connections')
    op.drop_table('invitations')
    op.drop_table('organization_members')
    op.drop_table('organizations')
    op.drop_table('users')
