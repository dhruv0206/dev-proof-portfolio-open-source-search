"""Person profile API — Phase 4.5b + 4.4/4.6 plumbing.

Backend route ``GET /api/profile/{github_username}`` that chains:

    1. discover_user_repos(username)        — list of PersonRepoSummary
    2. audit_cache_v4 lookup per repo        — fill in repo_score/tier + skills
    3. compute_person_aggregation()          — weighted aggregate
    4. fetch_merged_prs(username)            — OSS contribution graph (4.4)
    5. aggregate + normalize skills          — canonical skill badges (4.6)

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
from collections import Counter
from dataclasses import asdict
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.audit_v4_cache import AuditV4Cache

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/profile", tags=["profile"])


def _aggregate_skills(cached_v4_outputs: list[dict]) -> list[dict]:
    """Aggregate skill_id strings across audited repos, normalize, and
    return [{skill_id, repo_count}] sorted by repo_count desc.

    Each repo contributes a *set* of skills (so a single repo doesn't
    inflate counts via repeated claims).
    """
    from devproof_ranking_algo.v4.skill_taxonomy import normalize_skills

    counter: Counter[str] = Counter()
    for v4 in cached_v4_outputs:
        if not v4:
            continue
        raw_skills: list[str] = []
        for claim in v4.get("claims", []) or []:
            for s in claim.get("skills_demonstrated", []) or []:
                if isinstance(s, dict):
                    sid = s.get("skill_id")
                else:
                    sid = getattr(s, "skill_id", None)
                if sid:
                    raw_skills.append(sid)
        for canon in set(normalize_skills(raw_skills)):
            counter[canon] += 1

    return [
        {"skill_id": sid, "repo_count": count}
        for sid, count in counter.most_common()
        if sid
    ]


def _fetch_oss_contributions(github_username: str) -> Optional[dict]:
    """Run the merged-PR scan and return an OssContributionSummary dict,
    or None if the scan fails entirely.
    """
    from devproof_ranking_algo.v4.contribution_graph import fetch_merged_prs

    try:
        graph = fetch_merged_prs(github_username)
    except Exception as e:  # noqa: BLE001
        log.warning("contribution_graph fetch failed for %s: %s", github_username, e)
        return None

    return {
        "contribution_score": graph.contribution_score,
        "total_merged_prs": graph.total_merged_prs,
        "unique_orgs": graph.unique_orgs,
        "total_recipient_stars": graph.total_recipient_stars,
        "top_contributions": [
            {
                "pr_url": c.pr_url,
                "pr_title": c.pr_title,
                "recipient_repo": f"{c.recipient_owner}/{c.recipient_repo}",
                "recipient_stars": c.recipient_stars,
                "age_years": round(c.age_years, 2),
            }
            for c in graph.top_contributions
        ],
        "errors": list(graph.errors),
    }


@router.get("/{github_username}")
async def get_person_profile(
    github_username: str,
    refresh_discovery: bool = Query(
        default=False,
        description="Re-fetch repo list from GitHub. Defaults to false; "
                    "uses last-known repo list when available.",
    ),
    include_contributions: bool = Query(
        default=True,
        description="Run the merged-PR scan (Phase 4.4). Adds ~5-15s to the call. "
                    "Disable if you only need the repo-aggregate score.",
    ),
    db: Session = Depends(get_db),
):
    """Compute and return a person's PersonScore.

    Phase 4.5b: chains discovery → cache lookup → aggregation. Repos
    without a cached audit get null repo_score and are skipped from the
    weighted average (with reason ``audit_failed``).
    Phase 4.4 plumbed: OSS contribution graph computed and attached as
    ``oss_contributions`` when ``include_contributions=true`` (default).
    Phase 4.6 plumbed: skill_id strings aggregated across cached audits,
    normalized to canonical IDs, returned as ``skills`` ranked by
    repo_count.
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
    cached_v4_outputs: list[dict] = []
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
            cached_v4_outputs.append(v4)
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
    payload = person.model_dump(mode="json")

    # 4. Plumb skills (Phase 4.6) from cached audit outputs
    payload["skills"] = _aggregate_skills(cached_v4_outputs)

    # 5. Plumb OSS contributions (Phase 4.4)
    if include_contributions:
        oss = _fetch_oss_contributions(github_username)
        if oss is not None:
            payload["oss_contributions"] = oss

    # 6. Augment with discovery metadata so the UI can show transparency
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
