import os
import logging
from typing import Optional
import redis
import redis.asyncio as aioredis

logger = logging.getLogger("hisab.redis")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_sync_pool: Optional[redis.ConnectionPool] = None
_sync_client: Optional[redis.Redis] = None

_async_pool: Optional[aioredis.ConnectionPool] = None
_async_client: Optional[aioredis.Redis] = None


def get_redis_pool(url: Optional[str] = None) -> redis.ConnectionPool:
    global _sync_pool
    if _sync_pool is None:
        target_url = url or os.getenv("REDIS_URL", REDIS_URL)
        _sync_pool = redis.ConnectionPool.from_url(
            target_url,
            max_connections=int(os.getenv("REDIS_MAX_CONNECTIONS", "20")),
            socket_timeout=float(os.getenv("REDIS_SOCKET_TIMEOUT", "3.0")),
            socket_connect_timeout=float(os.getenv("REDIS_CONNECT_TIMEOUT", "3.0")),
            retry_on_timeout=True,
            decode_responses=True,
        )
    return _sync_pool


def get_redis_client(url: Optional[str] = None) -> redis.Redis:
    global _sync_client
    if _sync_client is None:
        pool = get_redis_pool(url)
        _sync_client = redis.Redis(connection_pool=pool)
    return _sync_client


def get_async_redis_pool(url: Optional[str] = None) -> aioredis.ConnectionPool:
    global _async_pool
    if _async_pool is None:
        target_url = url or os.getenv("REDIS_URL", REDIS_URL)
        _async_pool = aioredis.ConnectionPool.from_url(
            target_url,
            max_connections=int(os.getenv("REDIS_MAX_CONNECTIONS", "20")),
            socket_timeout=float(os.getenv("REDIS_SOCKET_TIMEOUT", "3.0")),
            socket_connect_timeout=float(os.getenv("REDIS_CONNECT_TIMEOUT", "3.0")),
            retry_on_timeout=True,
            decode_responses=True,
        )
    return _async_pool


def get_async_redis_client(url: Optional[str] = None) -> aioredis.Redis:
    global _async_client
    if _async_client is None:
        pool = get_async_redis_pool(url)
        _async_client = aioredis.Redis(connection_pool=pool)
    return _async_client


def set_sync_redis_client(client: Optional[redis.Redis]) -> None:
    global _sync_client
    _sync_client = client


def set_async_redis_client(client: Optional[aioredis.Redis]) -> None:
    global _async_client
    _async_client = client


def reset_redis_clients() -> None:
    global _sync_client, _sync_pool, _async_client, _async_pool
    if _sync_client is not None:
        try:
            _sync_client.close()
        except Exception:
            pass
        _sync_client = None
    _sync_pool = None

    if _async_client is not None:
        _async_client = None
    _async_pool = None


def ping_redis(client: Optional[redis.Redis] = None) -> bool:
    try:
        r = client or get_redis_client()
        return bool(r.ping())
    except Exception as e:
        logger.debug(f"Redis sync ping check failed: {e}")
        return False


async def async_ping_redis(client: Optional[aioredis.Redis] = None) -> bool:
    try:
        r = client or get_async_redis_client()
        res = await r.ping()
        return bool(res)
    except Exception as e:
        logger.debug(f"Redis async ping check failed: {e}")
        return False
