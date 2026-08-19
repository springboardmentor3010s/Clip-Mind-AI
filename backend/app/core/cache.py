"""Thin, resilient Redis cache wrapper.

Caching is an optimization, not a dependency: every function here degrades to a
no-op (cache miss / silent skip) if Redis isn't reachable, so the app works
identically with or without it — locally without Docker, Redis simply isn't there.
"""
import json
import logging
from typing import Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

_client = None
_client_init_attempted = False


def _get_client():
    global _client, _client_init_attempted
    if _client_init_attempted:
        return _client
    _client_init_attempted = True
    try:
        import redis
        client = redis.Redis.from_url(settings.redis_url, decode_responses=True, socket_connect_timeout=0.5)
        client.ping()
        _client = client
    except Exception as e:
        logger.info(f"Redis cache unavailable, running without it: {e}")
        _client = None
    return _client


def cache_get(key: str) -> Optional[Any]:
    client = _get_client()
    if not client:
        return None
    try:
        raw = client.get(key)
        return json.loads(raw) if raw else None
    except Exception as e:
        logger.warning(f"Cache read failed for {key}: {e}")
        return None


def cache_set(key: str, value: Any, ttl_seconds: int) -> None:
    client = _get_client()
    if not client:
        return
    try:
        client.setex(key, ttl_seconds, json.dumps(value, default=str))
    except Exception as e:
        logger.warning(f"Cache write failed for {key}: {e}")


def cache_delete(*keys: str) -> None:
    client = _get_client()
    if not client or not keys:
        return
    try:
        client.delete(*keys)
    except Exception as e:
        logger.warning(f"Cache invalidation failed for {keys}: {e}")
