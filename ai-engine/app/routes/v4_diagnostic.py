"""V4 Diagnostic endpoint — dev-only on-demand runner for the full V4 pipeline.

Runs Phase 1 (graph + importance + patterns + ownership) plus Phase 2/3
(tagger + map + reduce + optional verify) against a repo and returns a
structured JSON response for visual inspection via the dev UI. Does NOT
touch V3 or the existing /import pipeline.

Access is restricted to an allow-listed GitHub username (Dhruv). This is
intentionally simple (hardcoded allow list + user_id from request body) —
matching the pattern used by /api/projects/import.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.rate_limit import RateLimiter
from app.models.user import User
from app.services.v4_shadow_runner import run_v4

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects", tags=["v4-diagnostic"])

# ── Allow-list: only these GitHub usernames may call this endpoint ────────────
ALLOWED_DIAGNOSTIC_USERS: set[str] = {"dhruv0206"}

# ── Rate limiter: 10 requests / hour per IP (V4 is expensive) ─────────────────
diagnostic_limiter = RateLimiter(max_requests=10, window_seconds=3600)

# README filename candidates, in priority order (kept for test compatibility)
_README_CANDIDATES = (
    "README.md", "readme.md", "Readme.md", "README.MD",
    "README.rst", "readme.rst",
    "README", "readme",
    "README.txt", "readme.txt",
)


# ── Pydantic models ──────────────────────────────────────────────────────────


class V4DiagnosticRequest(BaseModel):
    """Request body for the V4 diagnostic endpoint."""

    repo_url: str = Field(min_length=10, max_length=500)
    github_username: Optional[str] = None
    user_id: str = Field(min_length=1, max_length=200)
    run_full_pipeline: bool = True
    enable_verify: bool = True


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


def _graph_stats(graph: Any) -> dict[str, Any]:
    """Extract the JSON-safe subset of a :class:`CodeGraph`.

    Kept here (mirroring the shadow runner helper) so the existing unit tests
    that import and exercise this function continue to work.
    """
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
    """Run the V4 pipeline on a repo and return a structured diagnostic.

    Stages: tarball → graph → importance → patterns → (optional) ownership
    → tagger → map → reduce → (optional) verify. Per-stage latencies and
    non-fatal errors are returned so the dev UI can surface them.

    Returns HTTP 403 for non-allow-listed users, 400 for invalid URLs, and
    200 with partial results + ``errors[]`` for per-stage failures. A fatal
    tarball fetch failure surfaces as 400.
    """
    # 0. Auth + rate limit
    _authorize(db, req.user_id)
    diagnostic_limiter.check(request)

    # 1. Validate repo URL up-front so we can return a clean 400.
    try:
        _parse_owner_repo(req.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    payload = await run_v4(
        req.repo_url,
        github_username=req.github_username,
        run_full_pipeline=req.run_full_pipeline,
        enable_verify=req.enable_verify,
    )

    # Tarball fetch is the only required stage — if it failed, shadow runner
    # stops early and populates ``errors`` with ``tarball_fetch: ...``. Surface
    # that as 400 so callers distinguish "no such repo" from per-stage issues.
    if not payload.get("graph_stats"):
        tarball_err = next(
            (e for e in payload.get("errors", []) if e.startswith("tarball_fetch")),
            None,
        )
        if tarball_err:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to fetch repo tarball: {tarball_err.split(': ', 1)[-1]}",
            )

    return {
        "repo_url": payload.get("repo_url", req.repo_url),
        "commit_sha": payload.get("commit_sha"),
        "pipeline_version": payload.get("pipeline_version"),
        "latency_ms": payload.get("latency_ms", {}),
        "graph_stats": payload.get("graph_stats") or {},
        "importance": payload.get("importance"),
        "patterns": payload.get("patterns", []),
        "ownership": payload.get("ownership"),
        "v4_output": payload.get("v4_output"),
        "errors": payload.get("errors", []),
    }
