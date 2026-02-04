from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from functools import lru_cache
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.project import Project, ProjectAudit, TechTag, TagCategory
from app.models.user import User
from devproof_ranking_algo import AuditService
import uuid

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

@router.post("/import")
async def import_project(
    req: ImportRequest, 
    db: Session = Depends(get_db),
    audit_service: AuditService = Depends(get_audit_service)
):
    # 0. Security: Get the real GitHub, username of the applicant
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user or not user.githubUsername:
         raise HTTPException(status_code=400, detail="User not found or GitHub not connected")
    
    applicant_username = user.githubUsername

    # 1. Run Audit (Sync for MVP, Async recommend for Prod)
    try:
        # ALWAYS pass the applicant's username.
        # This forces the Brain to verify if 'applicant_username' worked on 'repo_url'.
        # If I claim 'facebook/react', it will check 'dhruv0206' stats on 'react' -> 0% -> REJECT.
        result = await audit_service.run_audit(req.repo_url, req.user_id, req.project_type, req.target_claims, applicant_username)
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
        audit_report=result["report"]
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
    
    return {"status": "success", "project_id": str(project.id), "score": result["score"], "tier": result["tier"]}
