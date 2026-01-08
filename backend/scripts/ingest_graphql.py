"""GraphQL-based data ingestion script.

Uses GitHub's GraphQL API for 10-20x more efficient ingestion.
Fetches 100 issues per API call instead of 1.
"""

import argparse
import logging
import sys
from dotenv import load_dotenv

# Load env before other imports
load_dotenv()

from app.services.graphql_fetcher import GraphQLFetcher
from app.services.embedder import EmbeddingService
from app.services.pinecone_client import PineconeClient
from app.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Ingest issues using GraphQL API")
    parser.add_argument(
        "--languages",
        nargs="+",
        help="Languages to fetch (default: all configured languages)"
    )
    parser.add_argument(
        "--min-stars",
        type=int,
        default=500,
        help="Minimum repo stars (default: 500)"
    )
    parser.add_argument(
        "--max-issues",
        type=int,
        default=100,
        help="Maximum issues per language (default: 100)"
    )
    parser.add_argument(
        "--recent-days",
        type=int,
        default=None,
        help="Only issues updated in last N days"
    )
    parser.add_argument(
        "--recent-hours",
        type=float,
        default=None,
        help="Only issues UPDATED in last N hours (overrides --recent-days)"
    )
    parser.add_argument(
        "--created-hours",
        type=float,
        default=None,
        help="Only issues CREATED in last N hours (for truly new issues, overrides --recent-*)"
    )
    parser.add_argument(
        "--label",
        type=str,
        default="good first issue",
        help="Issue label to search for (default: 'good first issue')"
    )
    parser.add_argument(
        "--all-labels",
        action="store_true",
        help="Search for multiple contribution labels"
    )
    parser.add_argument(
        "--any-label",
        action="store_true",
        help="Search for issues regardless of label (active issues)"
    )
    
    args = parser.parse_args()
    
    settings = get_settings()
    languages = args.languages or settings.default_languages
    
    # Labels to search
    labels = ["good first issue"]
    if args.any_label:
        labels = [None]  # Search without label filter
    elif args.all_labels:
        labels = ["good first issue", "help wanted", "beginner", "easy"]
    elif args.label:
        labels = [args.label]
    
    logger.info(f"Starting GraphQL ingestion")
    logger.info(f"Languages: {languages}")
    logger.info(f"Min stars: {args.min_stars}")
    logger.info(f"Max issues per language: {args.max_issues}")
    logger.info(f"Labels: {[l or 'ANY' for l in labels]}")
    
    # Initialize services
    fetcher = GraphQLFetcher()
    embedder = EmbeddingService()
    pinecone = PineconeClient()
    
    # Check rate limit
    rate_limit = fetcher.get_rate_limit_status()
    logger.info(f"GraphQL rate limit: {rate_limit}")
    
    total_issues = 0
    errors = []  # Track errors for proper exit code
    
    for lang in languages:
        logger.info(f"\n{'='*50}")
        logger.info(f"Processing language: {lang}")
        logger.info(f"{'='*50}")
        
        for label in labels:
            try:
                issues = fetcher.search_issues(
                    language=lang,
                    label=label,
                    min_stars=args.min_stars,
                    created_within_hours=args.created_hours,
                    updated_within_hours=args.recent_hours if not args.created_hours else None,
                    updated_within_days=args.recent_days if not args.recent_hours and not args.created_hours else None,
                    max_issues=args.max_issues
                )
                
                if not issues:
                    logger.info(f"  No issues found for {lang} with label '{label}'")
                    continue
                
                logger.info(f"  Found {len(issues)} issues for {lang} with label '{label}'")
                
                # Generate embeddings
                logger.info("  Generating embeddings...")
                texts = [embedder.create_issue_text(issue) for issue in issues]
                embeddings = embedder.generate_embeddings_batch(texts)
                logger.info(f"  Generated {len(embeddings)} embeddings")
                
                # Create Issue objects
                from app.models.issue import Issue
                import time
                now_ts = int(time.time())
                
                issue_objects = []
                for i, metadata in enumerate(issues):
                    metadata.ingested_at = now_ts
                    issue_objects.append(Issue(
                        id=Issue.create_id(metadata.repo_full_name, metadata.issue_number),
                        embedding=embeddings[i],
                        metadata=metadata
                    ))
                
                # Upsert to Pinecone
                pinecone.upsert_issues(issue_objects)
                
                total_issues += len(issues)
                logger.info(f"  Ingested {len(issues)} issues (total: {total_issues})")
                
            except Exception as e:
                if "rate limit" in str(e).lower():
                    logger.warning(f"⛔ Rate limit hit - stopping")
                    logger.info(f"Total issues ingested: {total_issues}")
                    # Update stats even on rate limit (partial success)
                    _update_ingestion_stats(pinecone, total_issues)
                    sys.exit(0)  # Rate limit is not a failure
                else:
                    logger.error(f"  Error fetching {lang}/{label}: {e}")
                    errors.append(f"{lang}/{label}: {e}")
    
    logger.info(f"\n{'='*50}")
    logger.info(f"Ingestion complete! Total issues: {total_issues}")
    logger.info(f"{'='*50}")
    
    # Final rate limit check
    rate_limit = fetcher.get_rate_limit_status()
    logger.info(f"Final rate limit: {rate_limit}")
    
    # Update ingestion stats in Pinecone (regardless of errors)
    _update_ingestion_stats(pinecone, total_issues)
    
    # Exit with error if any errors occurred
    if errors:
        logger.error(f"\n⚠️ {len(errors)} errors occurred during ingestion:")
        for err in errors:
            logger.error(f"  - {err}")
        sys.exit(1)  # Exit with error code for GitHub Actions


def _update_ingestion_stats(pinecone, total_issues: int):
    """Update the ingestion stats record in Pinecone."""
    import time
    
    stats_id = "__ingestion_stats__"
    now_ts = int(time.time())
    
    try:
        # Upsert a stats vector with metadata
        pinecone.index.upsert(
            vectors=[{
                "id": stats_id,
                "values": [1.0] + [0.0] * 767,  # Non-zero vector (Pinecone requires non-zero)
                "metadata": {
                    "last_run_at": now_ts,
                    "total_issues_ingested": total_issues,
                    "type": "stats"
                }
            }]
        )
        logger.info(f"📊 Updated ingestion stats: last_run_at={now_ts}, issues={total_issues}")
    except Exception as e:
        logger.warning(f"Failed to update ingestion stats: {e}")


if __name__ == "__main__":
    main()

