"""Cleanup script to remove closed and stale issues from Pinecone.

This script:
1. Queries GitHub for recently closed issues (last 24 hours)
2. Deletes those issues from Pinecone if they exist
3. Deletes stale issues from Pinecone (not updated in X days)

Usage:
    python -m scripts.cleanup_pinecone --closed-hours 24 --stale-days 20
"""

import argparse
import logging
import sys
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
load_dotenv()

from app.services.graphql_fetcher import GraphQLFetcher
from app.services.pinecone_client import PineconeClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def delete_closed_issues(pinecone: PineconeClient, closed_issues: list[dict]) -> int:
    """Delete closed issues from Pinecone."""
    if not closed_issues:
        logger.info("No closed issues to delete")
        return 0
    
    ids_to_delete = [issue["id"] for issue in closed_issues]
    deleted_count = 0
    
    # Delete in batches of 100
    batch_size = 100
    for i in range(0, len(ids_to_delete), batch_size):
        batch = ids_to_delete[i:i + batch_size]
        try:
            pinecone.index.delete(ids=batch)
            deleted_count += len(batch)
            logger.info(f"Deleted batch of {len(batch)} closed issues (total: {deleted_count})")
        except Exception as e:
            logger.error(f"Error deleting batch: {e}")
    
    return deleted_count


def delete_stale_issues(pinecone: PineconeClient, stale_days: int) -> int:
    """Delete issues that haven't been updated in X days."""
    cutoff_ts = int((datetime.now(timezone.utc) - timedelta(days=stale_days)).timestamp())
    
    logger.info(f"Finding issues not updated since {datetime.fromtimestamp(cutoff_ts, tz=timezone.utc)}")
    
    # Query Pinecone for stale issues using metadata filter
    # We need to use a dummy vector for the query
    dummy_vector = [0.0] * 768  # Gemini embedding dimension
    
    try:
        # Query with filter for stale issues
        results = pinecone.index.query(
            vector=dummy_vector,
            top_k=10000,  # Get as many as possible
            filter={"updated_at_ts": {"$lt": cutoff_ts}},
            include_metadata=False
        )
        
        stale_ids = [match["id"] for match in results.get("matches", [])]
        
        if not stale_ids:
            logger.info("No stale issues found")
            return 0
        
        logger.info(f"Found {len(stale_ids)} stale issues to delete")
        
        # Delete in batches
        deleted_count = 0
        batch_size = 100
        for i in range(0, len(stale_ids), batch_size):
            batch = stale_ids[i:i + batch_size]
            try:
                pinecone.index.delete(ids=batch)
                deleted_count += len(batch)
                logger.info(f"Deleted batch of {len(batch)} stale issues (total: {deleted_count})")
            except Exception as e:
                logger.error(f"Error deleting stale batch: {e}")
        
        return deleted_count
        
    except Exception as e:
        logger.error(f"Error querying for stale issues: {e}")
        return 0


def main():
    parser = argparse.ArgumentParser(description="Cleanup closed and stale issues from Pinecone")
    parser.add_argument("--closed-hours", type=float, default=24,
                        help="Delete issues closed within the last N hours (default: 24)")
    parser.add_argument("--stale-days", type=int, default=20,
                        help="Delete issues not updated in N days (default: 20)")
    parser.add_argument("--skip-closed", action="store_true",
                        help="Skip checking for closed issues (only do stale cleanup)")
    parser.add_argument("--skip-stale", action="store_true",
                        help="Skip stale issue cleanup (only do closed cleanup)")
    
    args = parser.parse_args()
    
    logger.info("=" * 50)
    logger.info("Starting Pinecone Cleanup")
    logger.info("=" * 50)
    logger.info(f"Closed issues window: {args.closed_hours} hours")
    logger.info(f"Stale issues threshold: {args.stale_days} days")
    
    # Initialize clients
    pinecone = PineconeClient()
    
    total_deleted = 0
    
    # Step 1: Clean up closed issues
    if not args.skip_closed:
        logger.info("\n" + "=" * 50)
        logger.info("Step 1: Removing recently closed issues")
        logger.info("=" * 50)
        
        fetcher = GraphQLFetcher()
        closed_issues = fetcher.search_closed_issues(hours=args.closed_hours)
        logger.info(f"Found {len(closed_issues)} closed issues in the last {args.closed_hours} hours")
        
        if closed_issues:
            deleted = delete_closed_issues(pinecone, closed_issues)
            total_deleted += deleted
            logger.info(f"Deleted {deleted} closed issues from Pinecone")
    
    # Step 2: Clean up stale issues
    if not args.skip_stale:
        logger.info("\n" + "=" * 50)
        logger.info("Step 2: Removing stale issues")
        logger.info("=" * 50)
        
        deleted = delete_stale_issues(pinecone, args.stale_days)
        total_deleted += deleted
        logger.info(f"Deleted {deleted} stale issues from Pinecone")
    
    logger.info("\n" + "=" * 50)
    logger.info(f"Cleanup complete! Total deleted: {total_deleted}")
    logger.info("=" * 50)
    
    # Show final rate limit
    try:
        fetcher = GraphQLFetcher()
        rate_limit = fetcher.get_rate_limit_status()
        logger.info(f"Final rate limit: {rate_limit}")
    except:
        pass
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
