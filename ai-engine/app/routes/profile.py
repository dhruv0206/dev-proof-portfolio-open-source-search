"""Person profile API — Phase 4.5b.

Backend route ``GET /api/profile/{github_username}`` that chains:

    1. discover_user_repos(username)        — list of PersonRepoSummary
    2. audit_cache_v4 lookup per repo        — fill in repo_score/tier where cached
    3. compute_person_aggregation()          — weighted aggregate

Returns the JSON shape of :class:`PersonScore` so the frontend can drop
into ``/p/[username]/score`` instead of FIXTURE_PROFILES.

Repos without a cached audit return ``repo_score=null``; the formula
ignores them (they go into ``repo_count_skipped`` with reason
``audit_failed``). The frontend shows them in the "skipped" details so
users can see what's missing — and we can later add a "queue audit"
button per repo.
"""
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.audit_v4_cache import AuditV4Cache

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/{github_username}")
async def get_person_profile(
    github_username: str,
    refresh_discovery: bool = Query(
        default=False,
        description="Re-fetch repo list from GitHub. Defaults to false; "
                    "uses last-known repo list when available.",
    ),
    db: Session = Depends(get_db),
):
    """Compute and return a person's PersonScore.

    Phase 4.5b: chains discovery → cache lookup → aggregation. Repos
    without a cached audit get null repo_score and are skipped from the
    weighted average (with reason ``audit_failed``).
    """
    # Lazy imports — keep the route load light when these aren't needed
    from devproof_ranking_algo.person_score import compute_person_aggregation
    from devproof_ranking_algo.v4.person_discovery import discover_user_repos

    if not github_username or len(github_username) > 100:
        raise HTTPException(status_code=400, detail="invalid username")

    # 1. Discover the user's repos via GitHub API.
    discovery = discover_user_repos(github_username)
    if discovery.errors and not discovery.repos:
        # Total failure — usually 404 user not found
        raise HTTPException(status_code=404, detail={
            "error_code": "user_not_found",
            "title": "Person not found",
            "message": f"GitHub user '{github_username}' could not be discovered.",
            "errors": discovery.errors,
        })

    # 2. Fill in repo_score from audit cache where available.
    enriched = []
    for repo in discovery.repos:
        cached = (
            db.query(AuditV4Cache)
            .filter(
                AuditV4Cache.repo_url == repo.repo_url,
                AuditV4Cache.applicant_username == github_username,
            )
            .order_by(desc(AuditV4Cache.created_at))
            .first()
        )
        if cached and cached.v4_output:
            v4 = cached.v4_output
            enriched.append(repo.model_copy(update={
                "repo_score": v4.get("repo_score"),
                "repo_tier": v4.get("repo_tier"),
                "discipline": v4.get("discipline") or repo.discipline,
            }))
        else:
            # Leave repo_score=None — formula will skip with audit_failed
            enriched.append(repo)

    # 3. Aggregate.
    person = compute_person_aggregation(github_username, enriched)

    # 4. Augment with discovery metadata so the UI can show transparency
    payload = person.model_dump(mode="json")
    payload["_discovery_meta"] = {
        "skipped_during_discovery": [
            {"url": url, "reason": reason}
            for url, reason in discovery.skipped
        ],
        "discovery_errors": discovery.errors,
        "rate_limit_remaining": discovery.rate_limit_remaining,
        "audited_count": sum(1 for r in enriched if r.repo_score is not None),
        "unaudited_count": sum(1 for r in enriched if r.repo_score is None),
    }
    return payload
