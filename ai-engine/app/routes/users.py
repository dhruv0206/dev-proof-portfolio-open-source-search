"""API routes for user data and dashboard stats."""
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.issues import TrackedIssue, VerifiedContribution, IssueStatus

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me/stats")
async def get_user_stats(
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    """
    Get aggregated dashboard stats for the current user.
    
    Returns:
        - verifiedPRs: Count of verified contributions
        - inProgress: Count of issues currently being worked on
        - prSubmitted: Count of issues with PR submitted (pending verification)
        - repositories: Unique repos the user has contributed to
        - recentActivity: Last 10 activity items
        - activeIssues: Currently active (non-verified) issues
    """
    user_id = x_user_id
    
    # Count verified PRs (from TrackedIssue with VERIFIED status)
    verified_count = db.query(func.count(TrackedIssue.id)).filter(
        TrackedIssue.user_id == user_id,
        TrackedIssue.status == IssueStatus.VERIFIED.value
    ).scalar() or 0
    
    # Count in-progress issues
    in_progress_count = db.query(func.count(TrackedIssue.id)).filter(
        TrackedIssue.user_id == user_id,
        TrackedIssue.status == IssueStatus.IN_PROGRESS.value
    ).scalar() or 0
    
    # Count PR submitted (pending verification)
    pr_submitted_count = db.query(func.count(TrackedIssue.id)).filter(
        TrackedIssue.user_id == user_id,
        TrackedIssue.status == IssueStatus.PR_SUBMITTED.value
    ).scalar() or 0
    
    # Count unique repositories from verified issues
    repo_count = db.query(func.count(func.distinct(
        TrackedIssue.repo_owner + '/' + TrackedIssue.repo_name
    ))).filter(
        TrackedIssue.user_id == user_id,
        TrackedIssue.status == IssueStatus.VERIFIED.value
    ).scalar() or 0
    
    # Get recent activity (combine tracked issues and verified contributions)
    # For simplicity, we'll build activity from tracked issues for now
    tracked_issues = db.query(TrackedIssue).filter(
        TrackedIssue.user_id == user_id
    ).order_by(TrackedIssue.started_at.desc()).limit(10).all()
    
    recent_activity = []
    for issue in tracked_issues:
        # Determine activity type based on status
        if issue.status == IssueStatus.VERIFIED.value:
            activity_type = "verified"
            timestamp = issue.verified_at or issue.started_at
        elif issue.status == IssueStatus.PR_SUBMITTED.value:
            activity_type = "submitted"
            timestamp = issue.started_at  # Could track pr_submitted_at if we add it
        else:
            activity_type = "started"
            timestamp = issue.started_at
        
        recent_activity.append({
            "id": str(issue.id),
            "type": activity_type,
            "issueTitle": issue.issue_title or f"#{issue.issue_number}",
            "repoName": f"{issue.repo_owner}/{issue.repo_name}",
            "timestamp": timestamp.isoformat() if timestamp else datetime.utcnow().isoformat()
        })
    
    # Get active issues (in_progress or pr_submitted)
    active_issues = db.query(TrackedIssue).filter(
        TrackedIssue.user_id == user_id,
        TrackedIssue.status.in_([IssueStatus.IN_PROGRESS.value, IssueStatus.PR_SUBMITTED.value])
    ).order_by(TrackedIssue.started_at.desc()).limit(5).all()
    
    active_issues_data = [
        {
            "id": str(issue.id),
            "title": issue.issue_title or f"Issue #{issue.issue_number}",
            "repoName": f"{issue.repo_owner}/{issue.repo_name}",
            "status": issue.status,
            "createdAt": issue.started_at.isoformat() if issue.started_at else None
        }
        for issue in active_issues
    ]
    
    return {
        "verifiedPRs": verified_count,
        "inProgress": in_progress_count,
        "prSubmitted": pr_submitted_count,
        "repositories": repo_count,
        "recentActivity": recent_activity,
        "activeIssues": active_issues_data
    }


@router.get("/me/projects")
async def get_my_projects(
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: Session = Depends(get_db)
):
    """Get verified projects for the current user."""
    user_id = x_user_id
    from app.models.project import Project, ProjectAudit, TechTag, TagCategory

    db_projects = db.query(Project).filter(
        Project.user_id == user_id,
        Project.is_verified == True
    ).order_by(Project.authorship_percent.desc()).all()

    verified_projects_data = []
    for proj in db_projects:
        stack = {"languages": [], "frameworks": [], "libs": []}
        for tag in proj.tags:
            if tag.category == TagCategory.LANGUAGE:
                stack["languages"].append(tag.name)
            elif tag.category == TagCategory.FRAMEWORK:
                stack["frameworks"].append(tag.name)
            elif tag.category == TagCategory.LIBRARY:
                stack["libs"].append(tag.name)

        verified_feats = []
        if proj.audit and proj.audit.audit_report:
            report_claims = proj.audit.audit_report.get("claims", [])
            for c in report_claims:
                status = c.get("status", "UNVERIFIED")
                display_status = "Unverified"
                if status == "VERIFIED": display_status = "VERIFIED"
                elif status == "WRAPPER": display_status = "Wrapper"
                
                verified_feats.append({
                    "feature": c.get("feature", "Unknown"),
                    "status": display_status,
                    "tier": c.get("tier", "Unknown"),
                    "feature_type": c.get("feature_type", "Unknown"),
                    "tier_reasoning": c.get("tier_reasoning", "No details available."),
                    "evidence_file": c.get("evidence_file") or c.get("evidence", {}).get("file")
                })

        # Recommendations Logic
        recommendations = []
        tier = "BASIC"
        score = 0
        
        if proj.audit:
            score = proj.audit.tds_score or 0
            tier = proj.audit.complexity_tier or "BASIC"
            
            # Generate Hints (Don't reveal exploit, just guide)
            has_deep_tech = any(f.get("tier") == "TIER_3_DEEP" for f in verified_feats)
            has_tests = any("test" in f.get("feature", "").lower() for f in verified_feats)
            
            if score < 30:
                recommendations.append("Consider implementing custom business logic rather than just UI.")
            if not has_deep_tech:
                recommendations.append("Project lacks 'Deep Tech' (e.g. WebSockets, Auth, custom Algorithms).")
            if not has_tests:
                recommendations.append("No testing framework detected. Unit tests boost trust significantly.")
            if score > 80:
                recommendations.append("Elite status achieved. Maintain this standard.")

        verified_projects_data.append({
            "name": proj.repo_name,
            "repoUrl": proj.repo_url,
            "authorship": proj.authorship_percent,
            "stack": stack,
            "verifiedFeatures": verified_feats,
            "score": score,
            "tier": tier,
            "recommendations": recommendations
        })
        
    return {"projects": verified_projects_data}


@router.get("/profile/{username}")
async def get_public_profile(
    username: str,
    db: Session = Depends(get_db)
):
    """
    Get public profile data by GitHub username.
    
    This is a PUBLIC endpoint - no authentication required.
    Returns only verified contributions and public stats.
    """
    from sqlalchemy import text
    
    # 1. Lookup user by GitHub username
    user_result = db.execute(
        text('SELECT id, name, image, "githubUsername" FROM "user" WHERE "githubUsername" = :username'),
        {"username": username}
    ).fetchone()
    
    if not user_result:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_id = user_result[0]
    user_name = user_result[1]
    user_avatar = user_result[2]
    github_username = user_result[3]
    
    # 2. Count verified PRs
    verified_count = db.query(func.count(TrackedIssue.id)).filter(
        TrackedIssue.user_id == user_id,
        TrackedIssue.status == IssueStatus.VERIFIED.value
    ).scalar() or 0
    
    # 3. Count unique repositories
    repo_count = db.query(func.count(func.distinct(
        TrackedIssue.repo_owner + '/' + TrackedIssue.repo_name
    ))).filter(
        TrackedIssue.user_id == user_id,
        TrackedIssue.status == IssueStatus.VERIFIED.value
    ).scalar() or 0
    
    # 4. Get all verified contributions with details
    verified_issues = db.query(TrackedIssue).filter(
        TrackedIssue.user_id == user_id,
        TrackedIssue.status == IssueStatus.VERIFIED.value
    ).order_by(TrackedIssue.verified_at.desc()).all()
    
    # 5. Calculate total lines of code (from VerifiedContribution if exists)
    total_lines_result = db.execute(
        text("""
            SELECT COALESCE(SUM(lines_added), 0), COALESCE(SUM(lines_removed), 0)
            FROM verified_contributions
            WHERE user_id = :user_id
        """),
        {"user_id": user_id}
    ).fetchone()
    
    total_lines_added = total_lines_result[0] if total_lines_result else 0
    total_lines_removed = total_lines_result[1] if total_lines_result else 0
    
    # 6. Get unique languages (from tracked issues - we might need to add this field later)
    # For now, return empty list - we can enhance this later
    languages = []
    
    # 7. Get Verified Projects
    from app.models.project import Project, ProjectAudit, TechTag, TagCategory # Lazy import to avoid circulars if any
    
    db_projects = db.query(Project).filter(
        Project.user_id == user_id,
        Project.is_verified == True
    ).order_by(Project.authorship_percent.desc()).limit(10).all()
    
    verified_projects_data = []
    for proj in db_projects:
        # Organize tags
        stack = {"languages": [], "frameworks": [], "libs": []}
        for tag in proj.tags:
            if tag.category == TagCategory.LANGUAGE:
                stack["languages"].append(tag.name)
            elif tag.category == TagCategory.FRAMEWORK:
                stack["frameworks"].append(tag.name)
            elif tag.category == TagCategory.LIBRARY:
                stack["libs"].append(tag.name)
        
        # Verify Audit Report extraction
        verified_feats = []
        if proj.audit and proj.audit.audit_report:
            report_claims = proj.audit.audit_report.get("claims", [])
            for c in report_claims:
                status = c.get("status", "UNVERIFIED")
                # Map to frontend expected string
                display_status = "Unverified"
                if status == "VERIFIED": display_status = "VERIFIED"
                elif status == "WRAPPER": display_status = "Wrapper"
                
                verified_feats.append({
                    "feature": c.get("feature", "Unknown"),
                    "status": display_status,
                    "evidence_file": c.get("evidence", {}).get("file")
                })

        # Recommendations Logic
        recommendations = []
        tier = "BASIC"
        score = 0
        
        if proj.audit:
            score = proj.audit.tds_score or 0
            tier = proj.audit.complexity_tier or "BASIC"

        verified_projects_data.append({
            "name": proj.repo_name,
            "repoUrl": proj.repo_url,
            "authorship": proj.authorship_percent,
            "stack": stack,
            "verifiedFeatures": verified_feats,
            "score": score,
            "tier": tier,
            "recommendations": recommendations # Public may not see recs, but keeping consistent schema
        })

    # Build contributions list
    contributions = []
    for issue in verified_issues:
        contributions.append({
            "id": str(issue.id),
            "title": issue.issue_title or f"PR #{issue.issue_number}",
            "repoOwner": issue.repo_owner,
            "repoName": issue.repo_name,
            "repoFullName": f"{issue.repo_owner}/{issue.repo_name}",
            "prUrl": issue.pr_url,
            "issueUrl": issue.issue_url,
            "mergedAt": issue.verified_at.isoformat() if issue.verified_at else None,
        })
    
    return {
        "profile": {
            "name": user_name,
            "username": github_username,
            "avatarUrl": user_avatar,
        },
        "stats": {
            "verifiedPRs": verified_count,
            "repositories": repo_count,
            "linesAdded": total_lines_added,
            "linesRemoved": total_lines_removed,
        },
        "languages": languages,
        "contributions": contributions,
        "verifiedProjects": verified_projects_data
    }
