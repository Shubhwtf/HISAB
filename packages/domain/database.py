"""
HISAB — Database Engine & Session Management.

Provides async sessions for FastAPI backend and sync sessions for standalone scripts/Alembic.
Production configuration explicitly targets PostgreSQL with connection pooling, health pre-ping,
and strict multi-tenant isolation.
SQLite remains available for isolated in-memory unit tests.
"""

import os
from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator, Generator, Optional
from sqlalchemy import create_engine, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool, QueuePool, StaticPool
from packages.domain.db_models import Base


def normalize_async_db_url(url: str) -> str:
    """Normalizes DATABASE_URL to use async driver (asyncpg for postgres, aiosqlite for sqlite)."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql+psycopg://"):
        return url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("sqlite://") and not url.startswith("sqlite+"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url


def normalize_sync_db_url(url: str) -> str:
    """Normalizes SYNC_DATABASE_URL to use sync driver (psycopg or standard postgresql/sqlite)."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("sqlite+aiosqlite://"):
        return url.replace("sqlite+aiosqlite://", "sqlite://", 1)
    return url


def get_engine_args(url: str) -> dict:
    """Returns standard engine kwargs and connection pool configuration for a given DB URL."""
    is_pg = "postgres" in url or "postgresql" in url
    is_mem_sqlite = ":memory:" in url

    kwargs = {
        "echo": os.getenv("SQL_ECHO", "false").lower() == "true",
        "future": True,
    }
    if is_pg:
        kwargs.update({
            "poolclass": QueuePool,
            "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
            "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
            "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
            "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")),
            "pool_pre_ping": True,
        })
    elif is_mem_sqlite:
        kwargs["poolclass"] = StaticPool
    return kwargs


PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def make_absolute_sqlite_url(url: str) -> str:
    if "sqlite" in url and "///" in url and ":memory:" not in url:
        prefix, path = url.split("///", 1)
        if not os.path.isabs(path):
            abs_path = os.path.abspath(os.path.join(PROJECT_ROOT, path))
            return f"{prefix}///{abs_path}"
    return url


RAW_DATABASE_URL = make_absolute_sqlite_url(os.getenv("DATABASE_URL", "sqlite+aiosqlite:///data/generated/hisab.db"))
RAW_SYNC_DATABASE_URL = make_absolute_sqlite_url(os.getenv("SYNC_DATABASE_URL", RAW_DATABASE_URL))

DATABASE_URL = normalize_async_db_url(RAW_DATABASE_URL)
SYNC_DATABASE_URL = normalize_sync_db_url(RAW_SYNC_DATABASE_URL)

IS_POSTGRES = "postgres" in DATABASE_URL or "postgresql" in DATABASE_URL
IS_MEMORY_SQLITE = ":memory:" in DATABASE_URL

if "sqlite" in DATABASE_URL and "///" in DATABASE_URL and not IS_MEMORY_SQLITE:
    db_path = DATABASE_URL.split("///")[-1]
    if db_path:
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

async_engine_kwargs = {
    "echo": os.getenv("SQL_ECHO", "false").lower() == "true",
    "future": True,
}

if IS_POSTGRES:
    async_engine_kwargs.update({
        "poolclass": QueuePool,
        "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")),
        "pool_pre_ping": True,
    })
elif IS_MEMORY_SQLITE:
    async_engine_kwargs["poolclass"] = StaticPool

async_engine = create_async_engine(DATABASE_URL, **async_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

sync_engine_kwargs = {
    "echo": os.getenv("SQL_ECHO", "false").lower() == "true",
    "future": True,
}

if IS_POSTGRES:
    sync_engine_kwargs.update({
        "poolclass": QueuePool,
        "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
        "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
        "pool_recycle": int(os.getenv("DB_POOL_RECYCLE", "1800")),
        "pool_pre_ping": True,
    })
elif IS_MEMORY_SQLITE:
    sync_engine_kwargs["poolclass"] = StaticPool

sync_engine = create_engine(SYNC_DATABASE_URL, **sync_engine_kwargs)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    class_=Session,
    expire_on_commit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Initialize all database tables asynchronously."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def reset_db() -> None:
    """Drop and recreate all database tables asynchronously."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


def init_db_sync() -> None:
    """Initialize all database tables synchronously (for CLI/scripts)."""
    from datetime import datetime, timezone
    Base.metadata.create_all(bind=sync_engine)
    with get_sync_db() as db:
        from packages.domain.db_models import OrganizationDB, UserDB, OrganizationMemberDB, OrgRazorpayConnectionDB
        from packages.domain.auth_rbac import hash_password
        now = datetime.now(timezone.utc)
        demo_org = db.get(OrganizationDB, "org_nova_2026")
        if not demo_org:
            demo_org = OrganizationDB(
                id="org_nova_2026",
                name="Nova Commerce Pvt Ltd",
                owner_user_id="usr_admin_01",
                created_at=now,
                updated_at=now,
            )
            db.add(demo_org)
            db.commit()

        # Seed admin and shubh@test.com
        pw_hash, pw_salt = hash_password("demo123", "a1b2c3d4e5f60718293a4b5c6d7e8f90")
        users_to_seed = [
            ("usr_admin_01", "admin@novacommerce.com", "Shubham Verma", "ADMIN"),
            ("usr_shubh_admin", "shubh@test.com", "Shubham Verma", "ADMIN"),
            ("usr_mgr_02", "manager@novacommerce.com", "Rajesh Gupta", "FINANCE_MANAGER"),
            ("usr_ana_03", "analyst@novacommerce.com", "Priya Sharma", "ANALYST"),
            ("usr_aud_04", "auditor@deloitte.com", "Ananya Sen", "AUDITOR"),
        ]
        for uid, uemail, uname, urole in users_to_seed:
            existing_u = db.get(UserDB, uid) or db.query(UserDB).filter(UserDB.email == uemail).first()
            if not existing_u:
                u_rec = UserDB(
                    id=uid,
                    email=uemail,
                    name=uname,
                    pw_hash=pw_hash,
                    pw_salt=pw_salt,
                    is_active=True,
                    avatar_initials="".join([p[0] for p in uname.split()[:2]]),
                    created_at=now,
                    updated_at=now,
                )
                db.add(u_rec)
                db.commit()
            existing_mem = db.query(OrganizationMemberDB).filter(
                OrganizationMemberDB.org_id == "org_nova_2026",
                OrganizationMemberDB.user_id == uid,
            ).first()
            if not existing_mem:
                mem_rec = OrganizationMemberDB(
                    id=f"mem_{uid}",
                    org_id="org_nova_2026",
                    user_id=uid,
                    role=urole,
                    status="ACTIVE",
                    created_at=now,
                )
                db.add(mem_rec)
                db.commit()

        conn_db = db.get(OrgRazorpayConnectionDB, "conn_demo_nova")
        if not conn_db:
            db.add(OrgRazorpayConnectionDB(
                id="conn_demo_nova",
                org_id="org_nova_2026",
                merchant_name="Nova Commerce Pvt Ltd",
                status="connected",
            ))
            db.commit()


def reset_db_sync() -> None:
    """Drop and recreate all database tables synchronously."""
    Base.metadata.drop_all(bind=sync_engine)
    Base.metadata.create_all(bind=sync_engine)


async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for obtaining async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


@contextmanager
def get_sync_db() -> Generator[Session, None, None]:
    """Context manager for obtaining synchronous database session."""
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()


@contextmanager
def transactional_session(session: Optional[Session] = None) -> Generator[Session, None, None]:
    """
    Context manager providing atomic transaction execution.
    Automatically commits on success and rolls back on any uncaught exception.
    """
    own_session = session is None
    s = SyncSessionLocal() if own_session else session
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        if own_session:
            s.close()


@asynccontextmanager
async def async_transactional_session(session: Optional[AsyncSession] = None) -> AsyncGenerator[AsyncSession, None]:
    """
    Async context manager providing atomic transaction execution.
    Automatically commits on success and rolls back on any uncaught exception.
    """
    own_session = session is None
    s = AsyncSessionLocal() if own_session else session
    try:
        yield s
        await s.commit()
    except Exception:
        await s.rollback()
        raise
    finally:
        if own_session:
            await s.close()
