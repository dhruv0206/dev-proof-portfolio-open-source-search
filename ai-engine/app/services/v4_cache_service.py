"""V4 Cache Service — two-tier cache for V4 pipeline outputs.

**Tier 1 (``audit_v4_code_cache``)** — applicant-agnostic
    Key: ``(repo_url, code_hash)``
    Stores: serialized ``TaggerResult`` + ``MapPhaseResult``
    Purpose: a different applicant auditing the same repo at the same
    commit can skip the expensive Flash tagger + Flash map stages.

**Tier 2 (``audit_v4_cache``)** — applicant-specific
    Key: ``(repo_url, code_hash, applicant_username)``
    Stores: full ``V4Output`` JSON
    Purpose: same applicant re-clicking audit = instant return.

This replaces the broken-by-design shared V3 cache pattern where user A's
forensics/ownership scores were served to user B.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from dataclasses import asdict
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.audit_v4_cache import AuditV4Cache
from app.models.audit_v4_code_cache import AuditV4CodeCache

log = logging.getLogger(__name__)

# Cache TTL — long enough that popular repos stay warm across users,
# short enough that stale outputs don't linger forever.
_DEFAULT_TTL_DAYS = 30


# ─── Serialization helpers ────────────────────────────────────────────────────
# TaggerResult and MapPhaseResult are nested dataclasses with str-enums.
# asdict() handles the recursion; str-enums serialize to their .value via
# JSON's default encoder. Deserialization manually rehydrates enums + tuples.

def _serialize_tagger_result(tagger_result: Any) -> dict[str, Any]:
    """Convert ``TaggerResult`` -> JSON-safe dict. Enums become their ``.value``."""
    return _to_json_safe(asdict(tagger_result))


def _serialize_map_result(map_result: Any) -> dict[str, Any]:
    """Convert ``MapPhaseResult`` -> JSON-safe dict."""
    return _to_json_safe(asdict(map_result))


def _to_json_safe(obj: Any) -> Any:
    """Recursively convert enums to their ``.value`` for JSON serialization.

    ``dataclasses.asdict`` preserves str-enum members as enum instances; the
    default JSON encoder handles them fine, but JSONB columns may coerce them
    to raw strings. Explicit conversion avoids ambiguity and keeps the stored
    payload self-describing.
    """
    from enum import Enum
    if isinstance(obj, Enum):
        return obj.value
    if isinstance(obj, dict):
        return {k: _to_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_json_safe(v) for v in obj]
    return obj


def _deserialize_tagger_result(data: dict[str, Any]) -> Any:
    """Rehydrate ``TaggerResult`` from its serialized dict form."""
    from devproof_ranking_algo.v4.types import FileKind, FileTag, TaggerResult

    tags = [
        FileTag(
            file_path=t["file_path"],
            content_hash=t["content_hash"],
            description=t["description"],
            kind=FileKind(t["kind"]),
            interesting_features=list(t.get("interesting_features") or []),
            cached=bool(t.get("cached", False)),
        )
        for t in (data.get("tags") or [])
    ]
    return TaggerResult(
        tags=tags,
        latency_ms=int(data.get("latency_ms", 0)),
        errors=list(data.get("errors") or []),
        cache_hits=int(data.get("cache_hits", 0)),
        cache_misses=int(data.get("cache_misses", 0)),
    )


def _deserialize_map_result(data: dict[str, Any]) -> Any:
    """Rehydrate ``MapPhaseResult`` from its serialized dict form."""
    from devproof_ranking_algo.v4.types import (
        AuthenticitySignal,
        ChunkAnalysis,
        ComplexitySignal,
        EvidenceSpan,
        IntegrationDepth,
        MapPhaseResult,
        StylisticConsistency,
    )

    chunks = []
    for c in (data.get("chunks") or []):
        cs = c["complexity_signal"]
        au = c["authenticity_signal"]
        chunks.append(ChunkAnalysis(
            chunk_id=c["chunk_id"],
            file=c["file"],
            start_line=int(c["start_line"]),
            end_line=int(c["end_line"]),
            complexity_signal=ComplexitySignal(
                novel_algorithm=bool(cs["novel_algorithm"]),
                integration_depth=IntegrationDepth(cs["integration_depth"]),
                boilerplate_pct=int(cs["boilerplate_pct"]),
            ),
            authenticity_signal=AuthenticitySignal(
                appears_ai_generated=bool(au["appears_ai_generated"]),
                stylistic_consistency=StylisticConsistency(au["stylistic_consistency"]),
            ),
            patterns=list(c.get("patterns") or []),
            evidence_spans=[
                EvidenceSpan(lines=tuple(e["lines"]), reason=e["reason"])
                for e in (c.get("evidence_spans") or [])
            ],
        ))
    return MapPhaseResult(
        chunks=chunks,
        latency_ms=int(data.get("latency_ms", 0)),
        errors=list(data.get("errors") or []),
        flash_call_count=int(data.get("flash_call_count", 0)),
        chunks_skipped=int(data.get("chunks_skipped", 0)),
    )


# ─── Tier 1: code-only cache ──────────────────────────────────────────────────

class V4CodeCacheService:
    """Tier-1 cache — applicant-agnostic LLM intermediates."""

    @staticmethod
    def get(
        db: Session, repo_url: str, code_hash: str,
    ) -> Optional[tuple[Any, Any]]:
        """Return ``(TaggerResult, MapPhaseResult)`` on hit, else ``None``."""
        entry = db.query(AuditV4CodeCache).filter(
            AuditV4CodeCache.repo_url == repo_url,
            AuditV4CodeCache.code_hash == code_hash,
        ).first()
        if entry is None:
            return None
        if entry.expires_at is not None and entry.expires_at < datetime.now(timezone.utc):
            return None
        try:
            tagger_result = _deserialize_tagger_result(entry.tagger_result)
            map_result = _deserialize_map_result(entry.map_result)
            return tagger_result, map_result
        except Exception as e:  # noqa: BLE001
            # Corrupt cache row — treat as miss, log for visibility
            log.warning("[v4-cache] tier1 deserialize failed for %s: %s", repo_url, e)
            return None

    @staticmethod
    def put(
        db: Session, repo_url: str, code_hash: str,
        tagger_result: Any, map_result: Any,
        *, pipeline_version: str = "v4.0",
        ttl_days: int = _DEFAULT_TTL_DAYS,
    ) -> None:
        """Upsert tier-1 cache row. Silent on errors; caching is never critical."""
        try:
            payload_tagger = _serialize_tagger_result(tagger_result)
            payload_map = _serialize_map_result(map_result)
        except Exception as e:  # noqa: BLE001
            log.warning("[v4-cache] tier1 serialize failed for %s: %s", repo_url, e)
            return

        expires_at = datetime.now(timezone.utc) + timedelta(days=ttl_days)
        existing = db.query(AuditV4CodeCache).filter(
            AuditV4CodeCache.repo_url == repo_url,
            AuditV4CodeCache.code_hash == code_hash,
        ).first()

        try:
            if existing is not None:
                existing.tagger_result = payload_tagger
                existing.map_result = payload_map
                existing.pipeline_version = pipeline_version
                existing.expires_at = expires_at
            else:
                db.add(AuditV4CodeCache(
                    repo_url=repo_url, code_hash=code_hash,
                    tagger_result=payload_tagger, map_result=payload_map,
                    pipeline_version=pipeline_version, expires_at=expires_at,
                ))
            db.commit()
        except Exception as e:  # noqa: BLE001
            log.warning("[v4-cache] tier1 write failed for %s: %s", repo_url, e)
            db.rollback()


# ─── Tier 2: per-applicant full output cache ──────────────────────────────────

class V4CacheService:
    """Tier-2 cache — applicant-specific full ``V4Output`` JSON."""

    @staticmethod
    def get(
        db: Session, repo_url: str, code_hash: str, applicant_username: str,
    ) -> Optional[dict[str, Any]]:
        """Return the cached V4Output dict on hit, else ``None``."""
        entry = db.query(AuditV4Cache).filter(
            AuditV4Cache.repo_url == repo_url,
            AuditV4Cache.code_hash == code_hash,
            AuditV4Cache.applicant_username == applicant_username,
        ).first()
        if entry is None:
            return None
        if entry.expires_at is not None and entry.expires_at < datetime.now(timezone.utc):
            return None
        return entry.v4_output

    @staticmethod
    def put(
        db: Session, repo_url: str, code_hash: str, applicant_username: str,
        v4_output: dict[str, Any],
        *, pipeline_version: str = "v4.0",
        ttl_days: int = _DEFAULT_TTL_DAYS,
    ) -> None:
        """Upsert tier-2 cache row. Silent on errors."""
        expires_at = datetime.now(timezone.utc) + timedelta(days=ttl_days)
        existing = db.query(AuditV4Cache).filter(
            AuditV4Cache.repo_url == repo_url,
            AuditV4Cache.code_hash == code_hash,
            AuditV4Cache.applicant_username == applicant_username,
        ).first()

        try:
            if existing is not None:
                existing.v4_output = v4_output
                existing.pipeline_version = pipeline_version
                existing.expires_at = expires_at
            else:
                db.add(AuditV4Cache(
                    repo_url=repo_url, code_hash=code_hash,
                    applicant_username=applicant_username,
                    v4_output=v4_output,
                    pipeline_version=pipeline_version, expires_at=expires_at,
                ))
            db.commit()
        except Exception as e:  # noqa: BLE001
            log.warning("[v4-cache] tier2 write failed for %s: %s", repo_url, e)
            db.rollback()


__all__ = [
    "V4CacheService",
    "V4CodeCacheService",
    "_serialize_tagger_result",
    "_serialize_map_result",
    "_deserialize_tagger_result",
    "_deserialize_map_result",
]
