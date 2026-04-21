"""Tests for the cache-aware V4 runner wrapper (run_v4_cached).

Covers the decision logic and wiring between ``run_v4_cached`` and the
cache services, using monkeypatching to avoid real GitHub/Gemini calls.
DB calls are faked through an in-memory cache store.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services import v4_shadow_runner
from app.services.v4_shadow_runner import run_v4_cached


# ─── In-memory cache store (stands in for the DB) ────────────────────────────

class _InMemoryStore:
    """Mimics V4CacheService + V4CodeCacheService against a single dict."""
    def __init__(self):
        self.tier1: dict[tuple[str, str], tuple[Any, Any]] = {}
        self.tier2: dict[tuple[str, str, str], dict] = {}


@pytest.fixture
def store():
    return _InMemoryStore()


@pytest.fixture
def patched_caches(store):
    """Patch V4CacheService and V4CodeCacheService to use the in-memory store."""
    with patch("app.services.v4_cache_service.V4CodeCacheService.get",
               side_effect=lambda db, repo_url, code_hash:
                   store.tier1.get((repo_url, code_hash))), \
         patch("app.services.v4_cache_service.V4CodeCacheService.put",
               side_effect=lambda db, repo_url, code_hash, tagger, mapr, **kw:
                   store.tier1.__setitem__((repo_url, code_hash), (tagger, mapr))), \
         patch("app.services.v4_cache_service.V4CacheService.get",
               side_effect=lambda db, repo_url, code_hash, user:
                   store.tier2.get((repo_url, code_hash, user))), \
         patch("app.services.v4_cache_service.V4CacheService.put",
               side_effect=lambda db, repo_url, code_hash, user, out, **kw:
                   store.tier2.__setitem__((repo_url, code_hash, user), out)):
        yield store


@pytest.fixture
def fake_session_factory():
    @contextmanager
    def factory():
        yield MagicMock()  # session is unused; services are patched
    return factory


# ─── Tier-2 hit: instant return, no run_v4 call ──────────────────────────────

@pytest.mark.asyncio
async def test_tier2_hit_returns_cached_without_running(
    patched_caches, fake_session_factory, monkeypatch,
):
    store = patched_caches
    repo_url = "https://github.com/owner/repo"
    user = "alice"
    code_hash = "a" * 40

    store.tier2[(repo_url, code_hash, user)] = {"repo_score": 87, "repo_tier": "TIER_2_LOGIC"}

    monkeypatch.setattr(v4_shadow_runner, "GithubIngestor", MagicMock())
    monkeypatch.setattr(
        "app.services.cache_service.get_repo_code_hash",
        MagicMock(return_value=code_hash),
    )
    fake_run_v4 = AsyncMock()
    monkeypatch.setattr(v4_shadow_runner, "run_v4", fake_run_v4)

    result = await run_v4_cached(repo_url, user, fake_session_factory)

    assert result["succeeded"] is True
    assert result["cache_reused"]["tier2"] is True
    assert result["v4_output"] == {"repo_score": 87, "repo_tier": "TIER_2_LOGIC"}
    fake_run_v4.assert_not_called()


# ─── Tier-2 miss + Tier-1 hit: run_v4 called with cached intermediates ───────

@pytest.mark.asyncio
async def test_tier1_hit_passes_cached_intermediates(
    patched_caches, fake_session_factory, monkeypatch,
):
    store = patched_caches
    repo_url = "https://github.com/owner/repo"
    user = "bob"  # different user than any cached tier-2 entry
    code_hash = "b" * 40

    fake_tagger = MagicMock(name="cached_tagger")
    fake_map = MagicMock(name="cached_map")
    store.tier1[(repo_url, code_hash)] = (fake_tagger, fake_map)

    monkeypatch.setattr(v4_shadow_runner, "GithubIngestor", MagicMock())
    monkeypatch.setattr(
        "app.services.cache_service.get_repo_code_hash",
        MagicMock(return_value=code_hash),
    )

    fake_run_v4 = AsyncMock(return_value={
        "succeeded": True,
        "v4_output": {"repo_score": 92},
        "cache_reused": {"tagger": True, "map": True},
        "_intermediates": {"tagger_result": None, "map_result": None},
    })
    monkeypatch.setattr(v4_shadow_runner, "run_v4", fake_run_v4)

    result = await run_v4_cached(repo_url, user, fake_session_factory)

    fake_run_v4.assert_awaited_once()
    kwargs = fake_run_v4.await_args.kwargs
    assert kwargs["cached_tagger_result"] is fake_tagger
    assert kwargs["cached_map_result"] is fake_map
    assert kwargs["return_intermediates"] is True
    assert result["cache_reused"]["tier2"] is False
    assert "_intermediates" not in result  # must be stripped


# ─── Miss on both tiers: fresh run + writes both caches ──────────────────────

@pytest.mark.asyncio
async def test_miss_writes_both_tiers_on_success(
    patched_caches, fake_session_factory, monkeypatch,
):
    store = patched_caches
    repo_url = "https://github.com/owner/repo"
    user = "carol"
    code_hash = "c" * 40

    monkeypatch.setattr(v4_shadow_runner, "GithubIngestor", MagicMock())
    monkeypatch.setattr(
        "app.services.cache_service.get_repo_code_hash",
        MagicMock(return_value=code_hash),
    )

    fresh_tagger = MagicMock(name="fresh_tagger")
    fresh_map = MagicMock(name="fresh_map")
    v4_output = {"repo_score": 76, "repo_tier": "TIER_2_LOGIC"}
    fake_run_v4 = AsyncMock(return_value={
        "succeeded": True,
        "v4_output": v4_output,
        "cache_reused": {"tagger": False, "map": False},
        "_intermediates": {"tagger_result": fresh_tagger, "map_result": fresh_map},
    })
    monkeypatch.setattr(v4_shadow_runner, "run_v4", fake_run_v4)

    result = await run_v4_cached(repo_url, user, fake_session_factory)

    # Both tiers got written
    assert store.tier1[(repo_url, code_hash)] == (fresh_tagger, fresh_map)
    assert store.tier2[(repo_url, code_hash, user)] == v4_output
    assert result["succeeded"] is True
    assert "_intermediates" not in result


# ─── Applicant isolation: user A's output doesn't serve user B ───────────────

@pytest.mark.asyncio
async def test_applicant_isolation(
    patched_caches, fake_session_factory, monkeypatch,
):
    """User A's cached V4Output must NOT be returned for user B."""
    store = patched_caches
    repo_url = "https://github.com/owner/repo"
    code_hash = "d" * 40

    # User A's (shared-cache bug if this leaks)
    store.tier2[(repo_url, code_hash, "alice")] = {"ownership_score": 95}

    monkeypatch.setattr(v4_shadow_runner, "GithubIngestor", MagicMock())
    monkeypatch.setattr(
        "app.services.cache_service.get_repo_code_hash",
        MagicMock(return_value=code_hash),
    )

    bob_output = {"ownership_score": 12}  # Bob has way less ownership
    fake_run_v4 = AsyncMock(return_value={
        "succeeded": True,
        "v4_output": bob_output,
        "cache_reused": {"tagger": False, "map": False},
        "_intermediates": {"tagger_result": None, "map_result": None},
    })
    monkeypatch.setattr(v4_shadow_runner, "run_v4", fake_run_v4)

    result = await run_v4_cached(repo_url, "bob", fake_session_factory)

    # Bob should get his own fresh result, not Alice's cached 95
    assert result["v4_output"]["ownership_score"] == 12
    fake_run_v4.assert_awaited_once()


# ─── Code hash unavailable: bypasses cache gracefully ────────────────────────

@pytest.mark.asyncio
async def test_code_hash_unavailable_bypasses_cache(
    patched_caches, fake_session_factory, monkeypatch,
):
    """When get_repo_code_hash returns None, cache layer is a no-op."""
    store = patched_caches
    monkeypatch.setattr(v4_shadow_runner, "GithubIngestor", MagicMock())
    monkeypatch.setattr(
        "app.services.cache_service.get_repo_code_hash",
        MagicMock(return_value=None),
    )

    fake_run_v4 = AsyncMock(return_value={
        "succeeded": True,
        "v4_output": {"repo_score": 50},
        "cache_reused": {"tagger": False, "map": False},
        "_intermediates": {"tagger_result": MagicMock(), "map_result": MagicMock()},
    })
    monkeypatch.setattr(v4_shadow_runner, "run_v4", fake_run_v4)

    result = await run_v4_cached("https://github.com/x/y", "alice", fake_session_factory)

    assert result["succeeded"] is True
    # No writes to either cache because code_hash is None
    assert store.tier1 == {}
    assert store.tier2 == {}
    fake_run_v4.assert_awaited_once()
