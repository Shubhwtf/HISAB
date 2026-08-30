# HISAB — Database Migrations & Tenant Isolation Guide

## 1. Overview

HISAB uses **PostgreSQL** as its authoritative production database with **Alembic** for schema migrations and **SQLAlchemy 2.0** for object-relational mapping. Every financial record is strictly scoped to an `org_id` / `organization_id` ensuring tenant isolation.

---

## 2. Database Architecture & Drivers

| Environment | Database | Driver / Dialect | Connection Format |
|---|---|---|---|
| **Production (FastAPI Async)** | PostgreSQL 16+ | `asyncpg` | `postgresql+asyncpg://user:pass@host:5432/dbname` |
| **Production (Alembic / CLI Sync)** | PostgreSQL 16+ | `psycopg` (v3) | `postgresql+psycopg://user:pass@host:5432/dbname` |
| **Local Unit Tests** | SQLite (in-memory / file) | `aiosqlite` / `sqlite` | `sqlite+aiosqlite:///data/hisab.db` |

### Connection Pooling Parameters (Production)
```python
create_engine(
    url=SYNC_DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,          # Standard pool capacity
    max_overflow=20,       # Spike capacity for concurrent reconciliation
    pool_timeout=30,       # Wait up to 30s for an available connection
    pool_recycle=1800,     # Recycle every 30m to avoid stale connection drops
    pool_pre_ping=True,    # Test liveness before checkout
)
```

---

## 3. Migration Commands

### Running Migrations
To upgrade the database to the latest schema:
```bash
# Using Python virtual environment
.venv/bin/alembic upgrade head
```

### Creating a New Migration
When database models in `packages/domain/db_models.py` are modified:
```bash
.venv/bin/alembic revision --autogenerate -m "describe_changes"
```

### Checking Migration History & Current Version
```bash
.venv/bin/alembic history
.venv/bin/alembic current
```

### Downgrading
```bash
.venv/bin/alembic downgrade -1
```

---

## 4. Multi-Tenant Model Hierarchy

All business entities carry an indexed foreign key to `organizations.id` with `ondelete="CASCADE"`:

```mermaid
erDiagram
    USERS ||--o{ ORGANIZATION_MEMBERS : has
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : contains
    ORGANIZATIONS ||--|| ORG_RAZORPAY_CONNECTIONS : owns
    ORGANIZATIONS ||--o{ INVITATIONS : sends
    ORGANIZATIONS ||--o{ CUSTOMERS : scopes
    ORGANIZATIONS ||--o{ ORDERS : owns
    ORGANIZATIONS ||--o{ PAYMENTS : records
    ORGANIZATIONS ||--o{ REFUNDS : tracks
    ORGANIZATIONS ||--o{ DISPUTES : manages
    ORGANIZATIONS ||--o{ SETTLEMENTS : reconciles
    ORGANIZATIONS ||--o{ BANK_TRANSACTIONS : matches
    ORGANIZATIONS ||--o{ TAX_RECORDS : audits
    ORGANIZATIONS ||--o{ EXCEPTIONS : resolves
    ORGANIZATIONS ||--o{ AUDIT_ENTRIES : chains
```

### Organization-Scoped Composite Indexes
- `payments`: `(org_id, status)`, `(org_id, settlement_id)`, `(org_id, created_at)`
- `settlements`: `(org_id, utr)`, `(org_id, status)`, `(org_id, created_at)`
- `exceptions`: `(org_id, status)`, `(org_id, batch_id)`, `(org_id, severity)`
- `audit_entries`: `(org_id, batch_id)`, `(org_id, case_id)`, `(org_id, created_at)`
- `bank_transactions`: `(org_id, reference)`, `(org_id, date)`
- `disputes`: `(org_id, status)`, `(org_id, payment_id)`
- `refunds`: `(org_id, payment_id)`, `(org_id, status)`
- `tax_records`: `(org_id, financial_year, quarter)`
