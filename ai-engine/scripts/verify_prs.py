"""
PR Verification Cron Script

Run this every 4 hours to verify pending PRs against GitHub API.
Checks if PR author matches user and if PR is merged.
"""
import os
import sys
import logging
import requests
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")  # Optional: for higher rate limits

if not DATABASE_URL:
    logger.error("DATABASE_URL not set")
    sys.exit(1)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


def parse_pr_url(pr_url: str) -> tuple[str, str, int] | None:
    """Parse GitHub PR URL into (owner, repo, pr_number)."""
    # Format: https://github.com/owner/repo/pull/123
    try:
        parts = pr_url.replace("https://github.com/", "").split("/")
        owner = parts[0]
        repo = parts[1]
        pr_number = int(parts[3])
        return owner, repo, pr_number
    except (IndexError, ValueError):
        return None


def fetch_pr_info(owner: str, repo: str, pr_number: int) -> dict | None:
    """Fetch PR details from GitHub API."""
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ContribFinder-Verification",
    }
    
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"GitHub API returned {response.status_code} for {url}")
            return None
    except Exception as e:
        logger.error(f"Failed to fetch PR info: {e}")
        return None


def check_author(pr_info: dict, github_username: str, github_id: str) -> bool:
    """Check if a PR was authored by the expected user (ID-first, username fallback)."""
    pr_user = pr_info.get("user", {})
    pr_author_id = str(pr_user.get("id", ""))
    pr_author_username = pr_user.get("login", "").lower()

    # Primary: GitHub ID (immutable)
    if github_id and pr_author_id and str(github_id) == pr_author_id:
        return True
    # Fallback: username (mutable)
    if github_username and pr_author_username and github_username.lower() == pr_author_username:
        return True
    return False


def verify_and_record(session, issue_id: str, pr_url: str, pr_info: dict):
    """Mark a tracked issue as verified and insert into verified_contributions."""
    merged_at = pr_info.get("merged_at")
    lines_added = pr_info.get("additions", 0)
    lines_deleted = pr_info.get("deletions", 0)

    session.execute(text("""
        UPDATE tracked_issues
        SET status = 'verified',
            pr_url = :pr_url,
            verified_at = :merged_at,
            check_count = check_count + 1
        WHERE id = :id
    """), {"id": issue_id, "pr_url": pr_url, "merged_at": merged_at})

    session.execute(text("""
        INSERT INTO verified_contributions
        (id, user_id, issue_url, pr_url, repo_owner, repo_name, merged_at, lines_added, lines_removed)
        SELECT gen_random_uuid(), user_id, issue_url, :pr_url, repo_owner, repo_name, :merged_at, :lines_added, :lines_removed
        FROM tracked_issues WHERE id = :id
        ON CONFLICT (user_id, pr_url) DO NOTHING
    """), {
        "id": issue_id,
        "pr_url": pr_url,
        "merged_at": merged_at,
        "lines_added": lines_added,
        "lines_removed": lines_deleted,
    })


def fetch_linked_prs(owner: str, repo: str, issue_number: int) -> list[int]:
    """Find PR numbers linked to an issue via GitHub Timeline API.

    Catches PRs that reference the issue (e.g. 'fixes #123' in PR body)
    or are manually linked via GitHub's sidebar.
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}/timeline"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "ContribFinder-Verification",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    try:
        response = requests.get(url, headers=headers, timeout=10, params={"per_page": 100})
        if response.status_code != 200:
            logger.warning(f"Timeline API returned {response.status_code} for {owner}/{repo}#{issue_number}")
            return []

        pr_numbers = set()
        for event in response.json():
            # cross-referenced: PR body mentions this issue ("fixes #N", "closes #N")
            if event.get("event") == "cross-referenced":
                source = event.get("source", {}).get("issue", {})
                if source.get("pull_request"):
                    pr_numbers.add(source["number"])
            # connected: PR manually linked to issue via GitHub sidebar
            elif event.get("event") == "connected":
                # connected events don't include PR number directly in REST API,
                # but if a close event follows with a commit_url, we'll catch it below
                pass
            # closed: issue was closed by a PR merge
            elif event.get("event") == "closed" and event.get("commit_id"):
                # Issue closed by a commit — likely a merged PR, but we need the PR number.
                # We can't get it directly from here, so skip (cross-referenced covers this).
                pass

        return list(pr_numbers)
    except Exception as e:
        logger.error(f"Failed to fetch timeline for {owner}/{repo}#{issue_number}: {e}")
        return []


def verify_pending_prs():
    """Pass 1: Verify tracked issues that already have a PR URL (status: pr_submitted)."""
    session = Session()

    try:
        query = text("""
            SELECT
                ti.id,
                ti.user_id,
                ti.pr_url,
                ti.issue_number,
                ti.repo_owner,
                ti.repo_name,
                ti.check_count,
                u."githubUsername",
                u."githubId"
            FROM tracked_issues ti
            JOIN "user" u ON ti.user_id = u.id
            WHERE ti.status = 'pr_submitted'
              AND ti.pr_url IS NOT NULL
        """)

        pending = session.execute(query).fetchall()
        logger.info(f"[Pass 1] Found {len(pending)} pending PRs to verify")

        verified_count = 0
        failed_count = 0

        for row in pending:
            issue_id = row.id
            pr_url = row.pr_url
            github_username = row.githubUsername
            github_id = row.githubId

            logger.info(f"Verifying PR: {pr_url} for user: {github_username}")

            parsed = parse_pr_url(pr_url)
            if not parsed:
                logger.warning(f"Invalid PR URL format: {pr_url}")
                continue

            owner, repo, pr_number = parsed

            pr_info = fetch_pr_info(owner, repo, pr_number)
            if not pr_info:
                session.execute(text("""
                    UPDATE tracked_issues SET check_count = check_count + 1 WHERE id = :id
                """), {"id": issue_id})
                continue

            if not check_author(pr_info, github_username, github_id):
                pr_author = pr_info.get("user", {}).get("login", "unknown")
                logger.warning(f"Author mismatch: PR by '{pr_author}', expected '{github_username}'")
                session.execute(text("""
                    UPDATE tracked_issues SET status = 'abandoned', check_count = check_count + 1 WHERE id = :id
                """), {"id": issue_id})
                failed_count += 1
                continue

            if pr_info.get("merged"):
                logger.info(f"PR verified! Merged at {pr_info.get('merged_at')}")
                verify_and_record(session, issue_id, pr_url, pr_info)
                verified_count += 1
            else:
                logger.info(f"PR not merged yet, will check again later")
                session.execute(text("""
                    UPDATE tracked_issues SET check_count = check_count + 1 WHERE id = :id
                """), {"id": issue_id})

        session.commit()
        logger.info(f"[Pass 1] Complete: {verified_count} verified, {failed_count} failed")

    except Exception as e:
        logger.error(f"[Pass 1] Failed: {e}")
        session.rollback()
        raise
    finally:
        session.close()


def auto_discover_prs():
    """Pass 2: For in_progress issues, check GitHub for linked/merged PRs by the user."""
    session = Session()

    try:
        query = text("""
            SELECT
                ti.id,
                ti.user_id,
                ti.issue_url,
                ti.issue_number,
                ti.repo_owner,
                ti.repo_name,
                ti.check_count,
                u."githubUsername",
                u."githubId"
            FROM tracked_issues ti
            JOIN "user" u ON ti.user_id = u.id
            WHERE ti.status = 'in_progress'
        """)

        in_progress = session.execute(query).fetchall()
        logger.info(f"[Pass 2] Found {len(in_progress)} in-progress issues to scan for linked PRs")

        discovered = 0

        for row in in_progress:
            issue_id = row.id
            owner = row.repo_owner
            repo = row.repo_name
            issue_number = row.issue_number
            github_username = row.githubUsername
            github_id = row.githubId

            # Find PRs linked to this issue
            linked_pr_numbers = fetch_linked_prs(owner, repo, issue_number)
            if not linked_pr_numbers:
                session.execute(text("""
                    UPDATE tracked_issues SET check_count = check_count + 1 WHERE id = :id
                """), {"id": issue_id})
                continue

            logger.info(f"Found {len(linked_pr_numbers)} linked PR(s) for {owner}/{repo}#{issue_number}")

            # Check each linked PR — first merged one authored by user wins
            for pr_number in linked_pr_numbers:
                pr_info = fetch_pr_info(owner, repo, pr_number)
                if not pr_info:
                    continue

                if not check_author(pr_info, github_username, github_id):
                    continue

                if pr_info.get("merged"):
                    pr_url = f"https://github.com/{owner}/{repo}/pull/{pr_number}"
                    logger.info(f"Auto-discovered merged PR: {pr_url} for {owner}/{repo}#{issue_number}")
                    verify_and_record(session, issue_id, pr_url, pr_info)
                    discovered += 1
                    break  # One verified PR per issue is enough

            else:
                # No merged PR found for this user — just bump check count
                session.execute(text("""
                    UPDATE tracked_issues SET check_count = check_count + 1 WHERE id = :id
                """), {"id": issue_id})

        session.commit()
        logger.info(f"[Pass 2] Complete: {discovered} auto-discovered and verified")

    except Exception as e:
        logger.error(f"[Pass 2] Failed: {e}")
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    logger.info("Starting PR verification...")
    verify_pending_prs()      # Pass 1: pr_submitted issues with known PR URLs
    auto_discover_prs()       # Pass 2: in_progress issues — find linked PRs automatically
    logger.info("Done!")
