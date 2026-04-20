"""V4 Diagnostic endpoint — dev-only on-demand runner for V4 Phase 1 modules.

Runs graph_builder, importance, pattern_detectors, and ownership against a
repo and returns a structured JSON response for visual inspection via the
dev UI. Does NOT touch V3 or the existing /import pipeline.

Access is restricted to an allow-listed GitHub username (Dhruv). This is
intentionally simple (hardcoded allow list + user_id from request body) —
matching the pattern used by /api/projects/import.
"""

from __future__ import annotations

import logging
import re
import time
from dataclasses import asdict
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.rate_limit import RateLimiter
from app.models.user import User

from devproof_ranking_algo import (
    GithubIngestor,
    TarballFetcher,
    build_complexity_map,
)
from devproof_ranking_algo.v4.graph_builder import build_graph
from devproof_ranking_algo.v4.importance import compute as compute_importance
from devproof_ranking_algo.v4.ownership import compute as compute_ownership
from devproof_ranking_algo.v4.pattern_detectors import detect_all as detect_patterns

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects", tags=["v4-diagnostic"])

# ── Allow-list: only these GitHub usernames may call this endpoint ────────────
ALLOWED_DIAGNOSTIC_USERS: set[str] = {"dhruv0206"}

# ── Rate limiter: 10 requests / hour per IP (V4 is expensive) ─────────────────
diagnostic_limiter = RateLimiter(max_requests=10, window_seconds=3600)

# README filename candidates, in priority order
_README_CANDIDATES = (
    "README.md", "readme.md", "Readme.md", "README.MD",
    "README.rst", "readme.rst",
    "README", "readme",
    "README.txt", "readme.txt",
)

# How many top-ranked files to hand to the ownership module
_OWNERSHIP_TOP_N = 20


# ── Pydantic models ──────────────────────────────────────────────────────────


class V4DiagnosticRequest(BaseModel):
    """Request body for the V4 diagnostic endpoint."""

    repo_url: str = Field(min_length=10, max_length=500)
    github_username: Optional[str] = None
    user_id: str = Field(min_length=1, max_length=200)


# ── Helpers ──────────────────────────────────────────────────────────────────


def _parse_owner_repo(repo_url: str) -> tuple[str, str]:
    """Extract (owner, repo) from a GitHub URL. Raises ValueError on miss."""
    match = re.search(r"github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$", repo_url)
    if not match:
        raise ValueError("Invalid GitHub URL — expected github.com/<owner>/<repo>")
    return match.group(1), match.group(2)


def _find_readme(file_map: dict[str, str]) -> str:
    """Return README content (first match) or empty string."""
    for name in _README_CANDIDATES:
        if name in file_map:
            return file_map[name]
    # Fall back: case-insensitive match at repo root
    for path, content in file_map.items():
        if "/" not in path and path.lower().startswith("readme"):
            return content
    return ""


def _authorize(db: Session, user_id: str) -> User:
    """Verify user exists and is on the diagnostic allow-list. Raises 403."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.githubUsername:
        raise HTTPException(status_code=403, detail="User not found or GitHub not connected")
    if user.githubUsername not in ALLOWED_DIAGNOSTIC_USERS:
        raise HTTPException(status_code=403, detail="Not authorized for diagnostic endpoint")
    return user


def _timeit() -> tuple[float, Any]:
    """Return (now_perf_counter, sentinel). Used as ``t0 = time.perf_counter()``."""
    return time.perf_counter(), None


def _ms_since(t0: float) -> int:
    """Milliseconds elapsed since ``t0`` (perf_counter), rounded."""
    return int((time.perf_counter() - t0) * 1000)


# ── Dataclass → JSON helpers ─────────────────────────────────────────────────


def _ranked_file_to_dict(rf: Any) -> dict[str, Any]:
    """Serialize a :class:`RankedFile` dataclass to a plain dict."""
    return asdict(rf)


def _pattern_to_dict(p: Any) -> dict[str, Any]:
    """Serialize a :class:`DetectedPattern` dataclass; enum → value."""
    d = asdict(p)
    # PatternKind is a str Enum; asdict preserves the enum instance on some
    # Python versions. Force a string for JSON safety.
    kind = d.get("kind")
    if hasattr(kind, "value"):
        d["kind"] = kind.value
    elif not isinstance(kind, str):
        d["kind"] = str(kind)
    return d


def _ownership_to_dict(o: Any) -> dict[str, Any]:
    """Serialize an :class:`OwnershipResult` (signals are a nested dataclass)."""
    return {
        "score": o.score,
        "signals": asdict(o.signals),
        "weights_used": dict(o.weights_used),
        "evidence": dict(o.evidence),
    }


def _graph_stats(graph: Any) -> dict[str, Any]:
    """Extract the JSON-safe subset of a :class:`CodeGraph`."""
    return {
        "files": len(graph.file_list),
        "symbols": len(graph.symbols),
        "reference_edges": graph.references.number_of_edges(),
        "import_edges": graph.imports.number_of_edges(),
        "coverage": graph.coverage_stats(),
    }


# ── Route ────────────────────────────────────────────────────────────────────


@router.post("/v4-diagnostic")
async def run_v4_diagnostic(
    req: V4DiagnosticRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Run V4 Phase 1 modules on a repo and return a structured diagnostic.

    Stages: tarball fetch → graph build → importance → patterns → (optional)
    ownership. Per-stage latencies and non-fatal errors are returned so the
    dev UI can surface them.

    Returns HTTP 403 for non-allow-listed users, 400 for unfetchable repos,
    and 200 with partial results + ``errors[]`` for per-stage failures.
    """
    # 0. Auth + rate limit
    _authorize(db, req.user_id)
    diagnostic_limiter.check(request)

    # 1. Parse owner/repo
    try:
        owner, repo_name = _parse_owner_repo(req.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    errors: list[str] = []
    latency_ms: dict[str, int] = {}
    t_total = time.perf_counter()

    # 2. Tarball fetch (required — abort on failure)
    ingestor: Optional[GithubIngestor] = None
    try:
        ingestor = GithubIngestor()
    except Exception as e:  # noqa: BLE001
        log.error("[v4-diag] GithubIngestor init failed: %s", e)
        raise HTTPException(status_code=500, detail=f"GitHub client init failed: {e}")

    t0 = time.perf_counter()
    file_map: dict[str, str] = {}
    commit_sha: Optional[str] = None
    try:
        fetcher = TarballFetcher(github_token=ingestor.token)
        with fetcher.fetch(owner, repo_name) as repo_files:
            file_map = dict(repo_files.file_map)
    except Exception as e:  # noqa: BLE001
        log.warning("[v4-diag] tarball fetch failed for %s/%s: %s", owner, repo_name, e)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch repo tarball: {e}",
        )
    latency_ms["tarball_fetch"] = _ms_since(t0)
    log.info("[v4-diag] tarball %s/%s -> %d files (%d ms)",
             owner, repo_name, len(file_map), latency_ms["tarball_fetch"])

    # Resolve HEAD commit SHA — best-effort, non-fatal.
    try:
        repo_obj = ingestor.get_repo(f"{owner}/{repo_name}")
        commit_sha = repo_obj.get_commits()[0].sha  # type: ignore[index]
    except Exception as e:  # noqa: BLE001
        log.warning("[v4-diag] could not resolve HEAD sha: %s", e)
        errors.append(f"commit_sha_resolve: {e}")
        repo_obj = None

    # 3. Complexity map (feeds importance). Non-fatal.
    t0 = time.perf_counter()
    complexity_map: list[dict] = []
    try:
        complexity_map = build_complexity_map(file_map)
    except Exception as e:  # noqa: BLE001
        log.warning("[v4-diag] complexity map failed: %s", e)
        errors.append(f"complexity_map: {e}")
    # (not a separately reported stage; roll into graph_build bucket)
    complexity_ms = _ms_since(t0)

    # 4. Graph build (required for importance & patterns).
    t0 = time.perf_counter()
    graph = None
    graph_stats: dict[str, Any] = {}
    try:
        graph = build_graph(file_map)
        graph_stats = _graph_stats(graph)
    except Exception as e:  # noqa: BLE001
        log.error("[v4-diag] graph build failed: %s", e)
        errors.append(f"graph_build: {e}")
    latency_ms["graph_build"] = _ms_since(t0) + complexity_ms
    log.info("[v4-diag] graph: %s (%d ms)", graph_stats, latency_ms["graph_build"])

    # 5. Importance ranking.
    t0 = time.perf_counter()
    importance_payload: Optional[dict[str, Any]] = None
    top_20_paths: list[str] = []
    readme_content = _find_readme(file_map)
    if graph is not None:
        try:
            imp_result = compute_importance(
                graph, file_map, readme_content, complexity_map
            )
            top_20 = imp_result.ranked[:20]
            top_20_paths = [r.file for r in top_20]
            importance_payload = {
                "top_20": [_ranked_file_to_dict(rf) for rf in top_20],
                "core_set_size": len(imp_result.core_set),
                "periphery_size": len(imp_result.periphery),
                "guaranteed_inclusions": list(imp_result.guaranteed_inclusions),
                "weights_used": dict(imp_result.weights_used),
            }
        except Exception as e:  # noqa: BLE001
            log.warning("[v4-diag] importance failed: %s", e)
            errors.append(f"importance: {e}")
    latency_ms["importance"] = _ms_since(t0)
    log.info("[v4-diag] importance done (%d ms)", latency_ms["importance"])

    # 6. Pattern detection.
    t0 = time.perf_counter()
    patterns_payload: list[dict[str, Any]] = []
    if graph is not None:
        try:
            detected = detect_patterns(graph, file_map)
            patterns_payload = [_pattern_to_dict(p) for p in detected]
        except Exception as e:  # noqa: BLE001
            log.warning("[v4-diag] pattern detection failed: %s", e)
            errors.append(f"patterns: {e}")
    latency_ms["patterns"] = _ms_since(t0)
    log.info("[v4-diag] patterns: %d detected (%d ms)",
             len(patterns_payload), latency_ms["patterns"])

    # 7. Ownership (optional).
    ownership_payload: Optional[dict[str, Any]] = None
    if req.github_username:
        t0 = time.perf_counter()
        if repo_obj is None:
            errors.append("ownership: repo object unavailable (HEAD resolve failed)")
        else:
            try:
                own_result = compute_ownership(
                    repo_obj,
                    req.github_username,
                    importance_ranked_files=top_20_paths[:_OWNERSHIP_TOP_N] or None,
                )
                ownership_payload = _ownership_to_dict(own_result)
            except Exception as e:  # noqa: BLE001
                log.warning("[v4-diag] ownership failed: %s", e)
                errors.append(f"ownership: {e}")
        latency_ms["ownership"] = _ms_since(t0)
        log.info("[v4-diag] ownership done (%d ms)", latency_ms["ownership"])

    latency_ms["total"] = int((time.perf_counter() - t_total) * 1000)
    log.info("[v4-diag] TOTAL %d ms for %s/%s", latency_ms["total"], owner, repo_name)

    return {
        "repo_url": req.repo_url,
        "commit_sha": commit_sha,
        "pipeline_version": "v4-phase1",
        "latency_ms": latency_ms,
        "graph_stats": graph_stats,
        "importance": importance_payload,
        "patterns": patterns_payload,
        "ownership": ownership_payload,
        "errors": errors,
    }
