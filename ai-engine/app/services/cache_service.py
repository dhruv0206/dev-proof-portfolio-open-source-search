"""Audit Cache Service - Check and store audit results."""
import re
from typing import Optional
from sqlalchemy.orm import Session

from app.models.audit_cache import AuditCache


class AuditCacheService:
    """
    Service for caching audit results.
    
    Key insight: Same repo at same commit = same code = same score.
    This eliminates AI variance between runs.
    """
    
    @staticmethod
    def get_cached_audit(
        db: Session, 
        repo_url: str, 
        commit_sha: str
    ) -> Optional[dict]:
        """
        Get cached audit result if it exists.
        
        Returns None if not cached.
        """
        cache_entry = db.query(AuditCache).filter(
            AuditCache.repo_url == repo_url,
            AuditCache.commit_sha == commit_sha
        ).first()
        
        if cache_entry:
            return {
                "status": "VERIFIED",
                "score": cache_entry.tds_score,
                "tier": cache_entry.complexity_tier,
                "report": cache_entry.audit_report,
                "stack": cache_entry.stack,
                "authorship": cache_entry.authorship,
                "cached": True  # Flag to indicate this was from cache
            }
        
        return None
    
    @staticmethod
    def cache_audit_result(
        db: Session,
        repo_url: str,
        commit_sha: str,
        result: dict
    ) -> None:
        """
        Store audit result in cache.
        
        Only caches VERIFIED results, not rejections.
        """
        if result.get("status") != "VERIFIED":
            return  # Don't cache rejections
        
        # Check if already cached (upsert logic)
        existing = db.query(AuditCache).filter(
            AuditCache.repo_url == repo_url,
            AuditCache.commit_sha == commit_sha
        ).first()
        
        if existing:
            # Update existing cache entry
            existing.tds_score = result["score"]
            existing.complexity_tier = result["tier"]
            existing.audit_report = result["report"]
            existing.stack = result["stack"]
            existing.authorship = result["authorship"]
        else:
            # Create new cache entry
            cache_entry = AuditCache(
                repo_url=repo_url,
                commit_sha=commit_sha,
                tds_score=result["score"],
                complexity_tier=result["tier"],
                audit_report=result["report"],
                stack=result["stack"],
                authorship=result["authorship"]
            )
            db.add(cache_entry)
        
        db.commit()


def get_repo_head_sha(ingestor, repo_url: str) -> Optional[str]:
    """
    Get the current HEAD commit SHA for a repository.
    
    Uses the existing GithubIngestor to fetch repo info.
    """
    # Parse owner/repo from URL
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if not match:
        return None
    
    owner, repo_name = match.groups()
    full_name = f"{owner}/{repo_name}"
    
    try:
        repo = ingestor.get_repo(full_name)
        # Get the default branch's HEAD SHA
        default_branch = repo.default_branch
        branch = repo.get_branch(default_branch)
        return branch.commit.sha
    except Exception as e:
        print(f"Error getting commit SHA: {e}")
        return None
