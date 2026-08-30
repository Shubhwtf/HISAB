"""
HISAB — Database Engine & Session Management.

Provides async sessions for FastAPI backend and sync sessions for standalone scripts.
Supports SQLite (local file / in-memory) and PostgreSQL seamlessly.
"""

import os
from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker
from packages.domain.db_models import Base


# Determine DB URLs from environment or defaults
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///data/generated/hisab.db")
SYNC_DATABASE_URL = os.getenv("SYNC_DATABASE_URL", "sqlite:///data/generated/hisab.db")

# Ensure parent directory exists for SQLite file
if "sqlite" in DATABASE_URL and "///" in DATABASE_URL and ":memory:" not in DATABASE_URL:
    db_path = DATABASE_URL.split("///")[-1]
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

# Async engine for API server
async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# Sync engine for CLI & scripts
sync_engine = create_engine(
    SYNC_DATABASE_URL,
    echo=False,
    future=True,
)

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
    Base.metadata.create_all(bind=sync_engine)


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
