from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_jobs_and_webhooks'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'jobs',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('created_by_user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('type', sa.String(length=64), nullable=False, index=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='QUEUED', index=True),
        sa.Column('progress_pct', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('stage', sa.String(length=128), nullable=True),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('result', sa.JSON(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_attempts', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('idempotency_key', sa.String(length=128), nullable=True, index=True),
        sa.Column('last_heartbeat_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_jobs_org_status', 'jobs', ['org_id', 'status'])
    op.create_index('idx_jobs_org_type', 'jobs', ['org_id', 'type'])
    op.create_index('idx_jobs_org_idempotency', 'jobs', ['org_id', 'idempotency_key'])
    op.create_index('idx_jobs_heartbeat', 'jobs', ['status', 'last_heartbeat_at'])

    op.create_table(
        'webhook_events',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('org_id', sa.String(length=64), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='PENDING', index=True),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('signature_verified', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('job_id', sa.String(length=64), nullable=True, index=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('org_id', 'id', name='uq_webhook_org_event')
    )
    op.create_index('idx_webhook_org_status', 'webhook_events', ['org_id', 'status'])


def downgrade() -> None:
    op.drop_index('idx_webhook_org_status', table_name='webhook_events')
    op.drop_table('webhook_events')
    op.drop_index('idx_jobs_heartbeat', table_name='jobs')
    op.drop_index('idx_jobs_org_idempotency', table_name='jobs')
    op.drop_index('idx_jobs_org_type', table_name='jobs')
    op.drop_index('idx_jobs_org_status', table_name='jobs')
    op.drop_table('jobs')
