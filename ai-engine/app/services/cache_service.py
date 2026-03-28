"""Audit Cache Service - Check and store audit results."""
import hashlib
import re
from typing import Optional
from sqlalchemy.orm import Session

from app.models.audit_cache import AuditCache

# Files excluded from code hash — changes to these should NOT invalidate cache
_NON_CODE_EXTENSIONS = frozenset({
    # Documentation
    '.md', '.txt', '.rst', '.adoc', '.textile',
    # Images
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff',
    # Documents / media
    '.pdf', '.doc', '.docx', '.pptx', '.xlsx', '.mp4', '.mp3', '.wav',
    # Lock files (dependency locks, not code)
    '.lock',
})

_NON_CODE_EXACT = frozenset({
    'license', 'licence', 'changelog', 'changes', 'authors', 'contributors',
    'code_of_conduct', 'contributing', 'security',
    '.gitignore', '.gitattributes', '.editorconfig', '.prettierrc',
    '.eslintrc', '.eslintignore', 'renovate.json', '.npmrc',
})

_NON_CODE_PREFIXES = ('.github/', 'docs/', '.vscode/', '.idea/')


def _is_code_file(path: str) -> bool:
    """Check if a file path represents source code (not docs/images/config)."""
    lower = path.lower()
    basename = lower.rsplit('/', 1)[-1]

    if basename in _NON_CODE_EXACT:
        return False

    dot_idx = basename.rfind('.')
    if dot_idx != -1 and basename[dot_idx:] in _NON_CODE_EXTENSIONS:
        return False

    for prefix in _NON_CODE_PREFIXES:
        if lower.startswith(prefix):
            return False

    return True


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
            result = {
                "status": "VERIFIED",
                "score": cache_entry.tds_score,
                "tier": cache_entry.complexity_tier,
                "report": cache_entry.audit_report,
                "stack": cache_entry.stack,
                "authorship": cache_entry.authorship,
                "cached": True,
            }
            # V2 fields (may be None for legacy cache entries)
            if cache_entry.forensics_data is not None:
                result["forensics_data"] = cache_entry.forensics_data
            if cache_entry.intent_signals is not None:
                result["intent_signals"] = cache_entry.intent_signals
            if cache_entry.discipline is not None:
                result["discipline"] = cache_entry.discipline
            result["scoring_version"] = getattr(cache_entry, 'scoring_version', 1) or 1
            return result

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
            # V2 fields
            existing.forensics_data = result.get("forensics_data")
            existing.intent_signals = result.get("intent_signals")
            existing.scoring_version = result.get("scoring_version", 1)
            existing.discipline = result.get("discipline")
        else:
            # Create new cache entry
            cache_entry = AuditCache(
                repo_url=repo_url,
                commit_sha=commit_sha,
                tds_score=result["score"],
                complexity_tier=result["tier"],
                audit_report=result["report"],
                stack=result["stack"],
                authorship=result["authorship"],
                # V2 fields
                forensics_data=result.get("forensics_data"),
                intent_signals=result.get("intent_signals"),
                scoring_version=result.get("scoring_version", 1),
                discipline=result.get("discipline"),
            )
            db.add(cache_entry)
        
        db.commit()


def get_repo_code_hash(ingestor, repo_url: str) -> Optional[str]:
    """
    Compute a deterministic hash of a repo's *source code* files only.

    Uses the GitHub Trees API to list every blob in the repo, filters out
    non-code files (docs, images, lock files, etc.), then hashes the sorted
    (path, blob-sha) pairs.  Result: README-only commits produce the same
    hash → cache hit → no unnecessary re-audit.

    Returns a 40-char hex digest (same length as a Git SHA for column compat).
    """
    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if not match:
        return None

    owner, repo_name = match.groups()
    full_name = f"{owner}/{repo_name}"

    try:
        repo = ingestor.get_repo(full_name)
        default_branch = repo.default_branch
        branch = repo.get_branch(default_branch)

        # Fetch full recursive tree (one API call)
        tree = repo.get_git_tree(branch.commit.sha, recursive=True)

        # Filter to code-only blobs and build a stable fingerprint
        hasher = hashlib.sha1()  # SHA-1 for 40-char compat with column
        code_entries = sorted(
            (e.path, e.sha)
            for e in tree.tree
            if e.type == "blob" and _is_code_file(e.path)
        )

        if not code_entries:
            # Fallback: if filter removed everything, hash the full tree
            return branch.commit.sha

        for path, blob_sha in code_entries:
            hasher.update(f"{path}\0{blob_sha}\n".encode())

        return hasher.hexdigest()
    except Exception as e:
        print(f"Error computing code hash: {e}")
        return None
