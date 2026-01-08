"""Search API routes."""

from fastapi import APIRouter, HTTPException
import logging

from app.models.query import SearchQuery, SearchResult, ParsedQuery
from app.services.search_engine import SearchEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/search", tags=["search"])

# Initialize search engine
search_engine = SearchEngine()


@router.post("")
async def search(query: SearchQuery) -> dict:
    """
    Search for GitHub issues using natural language.
    
    The query will be parsed to extract:
    - Semantic meaning (for embedding search)
    - Structured filters (language, stars, labels, etc.)
    
    Returns matching issues ranked by combined score (relevance + recency + stars).
    """
    try:
        all_results, parsed_query = search_engine.search(query)
        
        # Calculate pagination
        total = len(all_results)
        total_pages = (total + query.limit - 1) // query.limit if total > 0 else 1
        page = max(1, min(query.page, total_pages))
        
        # Slice results for current page
        start_idx = (page - 1) * query.limit
        end_idx = start_idx + query.limit
        page_results = all_results[start_idx:end_idx]
        
        return {
            "results": [r.model_dump() for r in page_results],
            "parsed_query": parsed_query.model_dump(),
            "total": total,
            "page": page,
            "limit": query.limit,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent")
async def get_recent_issues(
    limit: int = 20, 
    sort_by: str = "newest",
    languages: str | None = None,
    labels: str | None = None,
    days_ago: int | None = None
) -> dict:
    """
    Get recent contribution opportunities for homepage display.
    
    Args:
        limit: Number of results to return
        sort_by: 
            - "newest" (newly created issues - DEFAULT)
            - "recently_discussed" (recently updated/commented)
            - "relevance" (combined score)
            - "stars" (popularity)
        languages: Comma-separated languages (e.g., "Python,JavaScript,TypeScript")
        labels: Comma-separated labels (e.g., "good first issue,help wanted")
        days_ago: Filter by issues updated within N days
    
    Returns issues from the last 30 days (or 24h for "newest" sort).
    """
    try:
        # Parse comma-separated values into lists
        language_list = [l.strip() for l in languages.split(",")] if languages else None
        label_list = [l.strip() for l in labels.split(",")] if labels else None
        
        results = search_engine.get_recent_issues(
            limit=limit, 
            sort_by=sort_by,
            languages=language_list,
            labels=label_list,
            days_ago=days_ago
        )
        
        return {
            "results": [r.model_dump() for r in results],
            "total": len(results)
        }
        
    except Exception as e:
        logger.error(f"Recent issues error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/last-updated")
async def get_last_updated() -> dict:
    """Get the timestamp of the last successful ingestion run."""
    try:
        from datetime import datetime
        
        # Fetch the stats record by ID
        stats_id = "__ingestion_stats__"
        result = search_engine.pinecone.index.fetch(ids=[stats_id])
        
        if result.vectors and stats_id in result.vectors:
            metadata = result.vectors[stats_id].metadata
            last_run_at = metadata.get("last_run_at", 0)
            total_issues = metadata.get("total_issues_ingested", 0)
            
            if last_run_at > 0:
                dt = datetime.fromtimestamp(last_run_at)
                return {
                    "last_updated": dt.isoformat(),
                    "timestamp": last_run_at,
                    "total_issues": total_issues
                }
        
        return {"last_updated": None, "timestamp": None, "total_issues": 0}
        
    except Exception as e:
        logger.error(f"Error getting last updated: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check() -> dict:
    """Check if search service is healthy."""
    try:
        stats = search_engine.pinecone.get_index_stats()
        return {
            "status": "healthy",
            "index_stats": stats
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
