from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from functools import lru_cache
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel, Field
from app.database import SessionLocal, get_db
from app.models.project import Project, ProjectAudit, TechTag, TagCategory
from app.models.user import User
from app.models.audit_cache import AuditCache
from app.models.audit_v4_shadow import AuditV4Shadow
from app.services.cache_service import AuditCacheService, get_repo_code_hash
from app.services.v4_shadow_runner import run_v4
from app.middleware.rate_limit import scan_limiter, audit_limiter
from app.config import get_settings
from devproof_ranking_algo import AuditService
import asyncio
import logging
import re
import uuid

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/projects", tags=["projects"])

@lru_cache()
def get_audit_service() -> AuditService:
    return AuditService()

class ImportRequest(BaseModel):
    repo_url: str
    user_id: str # In real auth, get from Token
    project_type: str = "Fullstack"
    target_claims: list[str] = None
    # github_username: str | None = None # REMOVED: We fetch this from DB for security

@router.post("/scan")
async def scan_project(
    req: ImportRequest, 
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service)
):
    """
    Step 1: Pre-Scan.
    Returns: Stack info + Authorship stats.
    Does NOT run full audit.
    """
    try:
        # 0. Security: Get the real GitHub username
        user = db.query(User).filter(User.id == req.user_id).first()
        applicant_username = user.githubUsername if user else None
        
        # scan_repo is synchronous logic (GitHub API), but run in threadpool by FastAPI default if not async def
        # However, we made scan_repo synchronous in service.
        return await audit_service.scan_repo(req.repo_url, req.user_id, applicant_username)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/extract-features")
async def extract_features(
    req: ImportRequest,
    audit_service: AuditService = Depends(get_audit_service)
):
    """
    Step 1.5: Extract claims from README.
    Returns: { "features": ["Claim 1", "Claim 2"] }
    """
    try:
        features = await audit_service.extract_claims_from_readme(req.repo_url)
        return {"features": features}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def _run_v4_shadow_background(
    project_audit_id: str,
    repo_url: str,
    applicant_username: str | None,
) -> None:
    """Background task: run the full V4 pipeline, persist to audit_v4_shadow.

    Runs in a fresh DB session (the request's session is closed by the time
    the background task executes). All exceptions are swallowed so a shadow
    failure never affects the V3 response the user already received.

    ``run_v4`` is async; FastAPI's BackgroundTasks dispatches sync callables
    via a thread, so we drive it with ``asyncio.run`` inside that thread.

    Shadow mode keeps ``enable_verify=False`` — verify is tool-calling and
    expensive, and shadow is a firehose. The diagnostic endpoint turns it on.
    """
    if SessionLocal is None:
        log.warning("[v4-shadow-bg] no DB session available, skipping shadow write")
        return
    try:
        payload = asyncio.run(
            run_v4(
                repo_url,
                github_username=applicant_username,
                run_full_pipeline=True,
                enable_verify=False,
            )
        )
    except Exception as e:  # noqa: BLE001 — ultimate belt-and-braces
        log.error("[v4-shadow-bg] run_v4 raised (should never happen): %s", e)
        return

    session = SessionLocal()
    try:
        row = AuditV4Shadow(
            project_audit_id=uuid.UUID(project_audit_id) if project_audit_id else None,
            repo_url=repo_url,
            commit_sha=payload.get("commit_sha"),
            applicant_username=applicant_username,
            v4_output=payload,
            latency_ms=payload.get("latency_ms"),
            errors=payload.get("errors"),
            pipeline_version=payload.get("pipeline_version", "v4-phase3"),
            succeeded=1 if payload.get("succeeded") else 0,
        )
        session.add(row)
        session.commit()
        log.info(
            "[v4-shadow-bg] persisted shadow row for project_audit_id=%s succeeded=%s",
            project_audit_id, payload.get("succeeded"),
        )
    except Exception as e:  # noqa: BLE001
        log.error("[v4-shadow-bg] DB write failed: %s", e)
        session.rollback()
    finally:
        session.close()


@router.post("/import")
async def import_project(
    req: ImportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service),
):
    # 0. Security: Get the real GitHub, username of the applicant
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user or not user.githubUsername:
         raise HTTPException(status_code=400, detail="User not found or GitHub not connected")
    
    applicant_username = user.githubUsername

    # 1. CHECK CACHE FIRST
    # Compute a hash of source-code files only (ignores README/docs/images)
    code_hash = get_repo_code_hash(audit_service.ingestor, req.repo_url)

    if code_hash:
        # Check if we have a cached result for this code state
        cached_result = AuditCacheService.get_cached_audit(db, req.repo_url, code_hash)
        cached_report = (cached_result.get("report") or {}) if cached_result else {}
        if cached_result and cached_report.get("score_breakdown"):
            # Use cached V2 result - skip expensive AI audit
            result = cached_result
        else:
            # No cache hit - run full audit
            try:
                result = await audit_service.run_audit(
                    req.repo_url, req.user_id, req.project_type,
                    req.target_claims, applicant_username
                )
                # Cache the result for future requests
                if result.get("status") == "VERIFIED":
                    AuditCacheService.cache_audit_result(db, req.repo_url, code_hash, result)
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
    else:
        # Couldn't compute code hash - run audit without caching
        try:
            result = await audit_service.run_audit(
                req.repo_url, req.user_id, req.project_type, 
                req.target_claims, applicant_username
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    if result["status"] == "REJECTED":
         raise HTTPException(status_code=400, detail=f"Project Rejected: {result['reason']}")

    # 2. Save Project
    # Extract Repo Name
    repo_name = req.repo_url.split("/")[-1]
    
    project = Project(
        user_id=req.user_id,
        repo_url=req.repo_url,
        repo_name=repo_name,
        is_verified=True,
        verification_status="VERIFIED",
        authorship_percent=result["authorship"]
    )
    db.add(project)
    db.commit() # Get ID
    db.refresh(project)
    
    # 3. Save Audit
    audit = ProjectAudit(
        project_id=project.id,
        tds_score=result["score"],
        complexity_tier=result["tier"],
        audit_report=result["report"],
        # V2 fields
        forensics_data=result.get("forensics_data"),
        intent_signals=result.get("intent_signals"),
        scoring_version=result.get("scoring_version", 1),
        discipline=result.get("discipline"),
    )
    db.add(audit)
    
    # 4. Save Tags
    # Stack Tags
    stack = result["stack"]
    for lang in stack["languages"]:
        db.add(TechTag(project_id=project.id, name=lang, category=TagCategory.LANGUAGE))
    for fw in stack["frameworks"]:
        db.add(TechTag(project_id=project.id, name=fw, category=TagCategory.FRAMEWORK))
    for lib in stack["libs"]:
        db.add(TechTag(project_id=project.id, name=lib, category=TagCategory.LIBRARY))
        
    # Domain Tags (From Features)
    claims = result["report"].get("claims", [])
    seen_domains = set()
    for c in claims:
        # Simple heuristic: Use feature name as Domain Tag for now
        # In Prod, we'd double-pass Gemini to normalize "Real-time Chat" -> "Real-Time"
        tag_name = c["feature"]
        if tag_name not in seen_domains:
            db.add(TechTag(project_id=project.id, name=tag_name, category=TagCategory.DOMAIN))
            seen_domains.add(tag_name)

    db.commit()
    db.refresh(audit)

    # ── V4 SHADOW RUN (feature-flagged) ──────────────────────────────────────
    # V3 already produced the user-visible result above. If the flag is on,
    # run V4 in a background task — non-blocking, writes to audit_v4_shadow.
    # Errors here NEVER affect the user response.
    try:
        if get_settings().enable_v4_shadow:
            background_tasks.add_task(
                _run_v4_shadow_background,
                str(audit.id),
                req.repo_url,
                applicant_username,
            )
            log.info("[v4-shadow] enqueued for project_audit_id=%s", audit.id)
    except Exception as e:  # noqa: BLE001 — never break V3
        log.error("[v4-shadow] failed to enqueue shadow task: %s", e)

    return {
        "status": "success",
        "project_id": str(project.id),
        "score": result["score"],
        "tier": result["tier"],
        "scoringVersion": result.get("scoring_version", 1),
        "discipline": result.get("discipline"),
        "scoreBreakdown": result.get("report", {}).get("score_breakdown", {}),
        "pipeline_version": result.get("pipeline_version", "v1"),
        "evidence_file_count": result.get("evidence_file_count"),
    }


# ──────────────────────────────────────────────
# PUBLIC ENDPOINTS (no auth, rate-limited)
# ──────────────────────────────────────────────

class PublicScanRequest(BaseModel):
    repo_url: str = Field(min_length=10, max_length=500)

class PublicAuditRequest(BaseModel):
    repo_url: str = Field(min_length=10, max_length=500)
    target_claims: list[str] | None = None


@router.post("/scan-public")
async def scan_public(
    req: PublicScanRequest,
    request: Request,
    audit_service: AuditService = Depends(get_audit_service),
):
    """Public pre-scan: stack detection, no auth required."""
    scan_limiter.check(request)
    try:
        result = await audit_service.scan_repo(req.repo_url, "public", None)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/audit-public")
async def audit_public(
    req: PublicAuditRequest,
    request: Request,
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service),
):
    """Public full audit: no DB project save, results cached."""
    audit_limiter.check(request)

    # Check cache first (only use V2 cache entries that have score_breakdown)
    code_hash = get_repo_code_hash(audit_service.ingestor, req.repo_url)
    if code_hash:
        cached = AuditCacheService.get_cached_audit(db, req.repo_url, code_hash)
        if cached:
            # Skip stale V1 cache entries that lack score_breakdown
            report = cached.get("report") or {}
            has_breakdown = bool(report.get("score_breakdown"))
            if has_breakdown:
                return _format_public_score(cached, req.repo_url, from_cache=True)

    # Run audit (no authorship gating for public)
    try:
        result = await audit_service.run_audit(
            req.repo_url, "public", "Fullstack", req.target_claims, None
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Cache if verified
    if code_hash and result.get("status") == "VERIFIED":
        AuditCacheService.cache_audit_result(db, req.repo_url, code_hash, result)

    if result["status"] == "REJECTED":
        return {
            "status": "REJECTED",
            "reason": result.get("reason", "Project did not meet minimum requirements"),
        }

    return _format_public_score(result, req.repo_url, from_cache=False)


@router.get("/score/{owner}/{repo}")
async def get_public_score(
    owner: str,
    repo: str,
    db: Session = Depends(get_db),
):
    """Lookup cached score for a repo. Powers /score/[owner]/[repo] page."""
    repo_url = f"https://github.com/{owner}/{repo}"

    entry = (
        db.query(AuditCache)
        .filter(AuditCache.repo_url == repo_url)
        .order_by(desc(AuditCache.created_at))
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="No score found for this repository")

    report = entry.audit_report or {}
    breakdown = report.get("score_breakdown", {})

    return {
        "owner": owner,
        "repo": repo,
        "repo_url": repo_url,
        "score": entry.tds_score,
        "tier": entry.complexity_tier,
        "discipline": entry.discipline,
        "scoring_version": entry.scoring_version or 1,
        "score_breakdown": breakdown,
        "breakdown_available": bool(breakdown),
        "claims": report.get("claims", []),
        "stack": entry.stack or {},
        "authorship": entry.authorship,
        "forensics_data": entry.forensics_data,
        "intent_signals": entry.intent_signals,
        "scored_at": entry.created_at.isoformat() if entry.created_at else None,
    }


@router.get("/recent-scores")
async def get_recent_scores(
    db: Session = Depends(get_db),
    limit: int = 6,
):
    """Latest scored repos from cache. Powers 'Recently Scored' landing section."""
    entries = (
        db.query(AuditCache)
        .order_by(desc(AuditCache.created_at))
        .limit(min(limit, 12))
        .all()
    )

    # Deduplicate by repo_url (keep most recent)
    seen = set()
    results = []
    for e in entries:
        if e.repo_url in seen:
            continue
        seen.add(e.repo_url)
        match = re.search(r"github\.com/([^/]+)/([^/]+)", e.repo_url)
        owner = match.group(1) if match else ""
        repo_name = match.group(2) if match else e.repo_url
        results.append({
            "owner": owner,
            "repo": repo_name,
            "repo_url": e.repo_url,
            "score": e.tds_score,
            "tier": e.complexity_tier,
            "discipline": e.discipline,
            "stack": e.stack or {},
            "scored_at": e.created_at.isoformat() if e.created_at else None,
        })

    return {"scores": results}


def _format_public_score(result: dict, repo_url: str, from_cache: bool) -> dict:
    """Format audit result for public response."""
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    owner = match.group(1) if match else ""
    repo = match.group(2) if match else repo_url

    return {
        "status": "VERIFIED",
        "owner": owner,
        "repo": repo,
        "repo_url": repo_url,
        "score": result["score"],
        "tier": result["tier"],
        "discipline": result.get("discipline"),
        "scoring_version": result.get("scoring_version", 1),
        "score_breakdown": result.get("report", {}).get("score_breakdown", {}),
        "claims": result.get("report", {}).get("claims", []),
        "stack": result.get("stack", {}),
        "authorship": result.get("authorship"),
        "forensics_data": result.get("forensics_data"),
        "intent_signals": result.get("intent_signals"),
        "cached": from_cache,
    }
