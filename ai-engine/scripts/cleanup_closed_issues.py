"""Improved cleanup script that checks ALL indexed issues against GitHub.

This script:
1. Lists ALL issue IDs from Pinecone
2. Batch-checks each issue on GitHub to get current state
3. Deletes any issues that are now CLOSED or NOT_FOUND

This is more reliable than the old approach which only searched for
recently closed issues and could miss many.

Usage:
    python -m scripts.cleanup_closed_issues
    python -m scripts.cleanup_closed_issues --dry-run
    python -m scripts.cleanup_closed_issues --limit 1000
"""

import argparse
import logging
import sys
from datetime import datetime, timezone

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


def main():
    parser = argparse.ArgumentParser(
        description="Cleanup closed issues from Pinecone by checking ALL indexed issues"
    )
    parser.add_argument(
        "--dry-run", 
        action="store_true",
        help="Only check issues, don't delete anything"
    )
    parser.add_argument(
        "--limit", 
        type=int, 
        default=None,
        help="Limit number of issues to check (default: None = check all)"
    )
    parser.add_argument(
        "--batch-size", 
        type=int, 
        default=50,  # Reduced from 500 to 50 to avoid rate limits
        help="Number of issues to check per batch before saving progress"
    )
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("IMPROVED PINECONE CLEANUP - Checking ALL Indexed Issues")
    logger.info("=" * 60)
    
    if args.dry_run:
        logger.info("🔍 DRY RUN MODE - No deletions will be made")
    
    # Initialize clients
    pinecone = PineconeClient()
    fetcher = GraphQLFetcher()
    
    # Step 1: Get index stats
    stats = pinecone.get_index_stats()
    total_vectors = stats.get("total_vector_count", 0)
    logger.info(f"📊 Pinecone index has {total_vectors:,} issues")
    
    # Step 2: List all issue IDs from Pinecone
    logger.info("\n" + "=" * 60)
    logger.info("Step 1: Listing all issue IDs from Pinecone...")
    logger.info("=" * 60)
    
    all_ids = pinecone.list_all_ids()
    logger.info(f"Found {len(all_ids):,} issue IDs in Pinecone")
    
    
    if not all_ids:
        logger.info("No issues to check. Exiting.")
        return 0
    
    # Apply limit if specified
    if args.limit:
        all_ids = all_ids[:args.limit]
        logger.info(f"Limited to {len(all_ids):,} issues for this run")
    
    # Step 3: Batch check issues on GitHub
    logger.info("\n" + "=" * 60)
    logger.info("Step 2: Checking issue states on GitHub...")
    logger.info("=" * 60)
    
    # Process in batches for memory efficiency
    batch_size = args.batch_size
    total_batches = (len(all_ids) + batch_size - 1) // batch_size
    logger.info(f"Processing {len(all_ids):,} issues in {total_batches} batches")
    logger.info("⚡ Deleting after each batch (incremental cleanup)")
    
    import time # Import sleep 
    
    total_deleted = 0
    total_closed = 0
    total_not_found = 0
    total_open = 0
    total_errors = 0
    
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(all_ids))
        batch_ids = all_ids[start_idx:end_idx]
        
        logger.info(f"\nProcessing batch {batch_num + 1}/{total_batches} ({len(batch_ids)} issues)")
        
        # Add sleep to prevent firing requests too fast
        if batch_num > 0:
            time.sleep(2) # 2 second pause between batches
        
        # Check this batch
        states = fetcher.batch_check_issue_states(batch_ids)
        
        # Categorize results for this batch
        batch_closed = []
        batch_not_found = []
        batch_open = 0
        batch_errors = 0
        
        for issue_id, state in states.items():
            if state == "CLOSED":
                batch_closed.append(issue_id)
            elif state == "NOT_FOUND":
                batch_not_found.append(issue_id)
            elif state == "OPEN":
                batch_open += 1
            else:
                batch_errors += 1
        
        # Update totals
        total_closed += len(batch_closed)
        total_not_found += len(batch_not_found)
        total_open += batch_open
        total_errors += batch_errors
        
        # Delete this batch's closed/not-found issues immediately
        batch_to_delete = batch_closed + batch_not_found
        if batch_to_delete and not args.dry_run:
            deleted = pinecone.delete_by_ids(batch_to_delete)
            total_deleted += deleted
            logger.info(f"Batch {batch_num + 1}: deleted {deleted} (closed: {len(batch_closed)}, not_found: {len(batch_not_found)})")
        elif batch_to_delete and args.dry_run:
            logger.info(f"Batch {batch_num + 1}: would delete {len(batch_to_delete)} (dry-run)")
        
        # Progress summary
        logger.info(f"Running totals: {total_closed} closed, {total_not_found} not found, {total_open} open, {total_deleted} deleted")
    
    # Step 4: Summary
    logger.info("\n" + "=" * 60)
    logger.info("SUMMARY")
    logger.info("=" * 60)
    logger.info(f"✅ OPEN issues (kept):      {total_open:,}")
    logger.info(f"❌ CLOSED issues (deleted): {total_closed:,}")
    logger.info(f"🔍 NOT FOUND (deleted):     {total_not_found:,}")
    logger.info(f"⚠️  ERRORS (skipped):        {total_errors:,}")
    logger.info(f"🗑️  Total deleted:           {total_deleted:,}")
    
    # Verify final index size
    if total_deleted > 0:
        new_stats = pinecone.get_index_stats()
        new_total = new_stats.get("total_vector_count", 0)
        logger.info(f"📊 New index size: {new_total:,} (was {total_vectors:,})")
    
    # Final rate limit check
    logger.info("\n" + "=" * 60)
    try:
        rate_limit = fetcher.get_rate_limit_status()
        logger.info(f"📈 Final rate limit: {rate_limit.get('remaining')}/{rate_limit.get('limit')}")
    except:
        pass
    
    logger.info("=" * 60)
    logger.info("Cleanup complete!")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
