---
name: pinecone-operations
description: Work with Pinecone vector database for semantic search operations
---

# Pinecone Vector Database Skill

## When to Use
Use this skill when working with Pinecone for:
- Storing and retrieving vector embeddings
- Semantic search operations
- Issue ingestion and indexing
- Filtering and metadata queries

## Setup

### Environment Variables
```bash
# .env
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=devproof-issues
PINECONE_ENVIRONMENT=us-east-1-aws  # or your region
```

### Installation
```bash
pip install pinecone-client
```

### Initialize Client
```python
from pinecone import Pinecone, ServerlessSpec
import os

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# Get existing index
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

# Or create new index
def create_index(index_name: str, dimension: int = 768):
    """Create a new Pinecone index."""
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
    return pc.Index(index_name)
```

## Vector Operations

### Upsert Vectors (Add/Update)
```python
from typing import List, Dict, Any

async def upsert_issues(issues: List[Dict[str, Any]]):
    """Upsert issue embeddings to Pinecone."""
    vectors = []
    
    for issue in issues:
        vectors.append({
            "id": issue["id"],
            "values": issue["embedding"],  # 768-dim vector from Gemini
            "metadata": {
                "title": issue["title"][:500],  # Metadata has size limits
                "repo": issue["repo"],
                "owner": issue["owner"],
                "language": issue["language"],
                "labels": issue["labels"],
                "stars": issue["stars"],
                "created_at": issue["created_at"],
                "url": issue["url"],
                "state": issue["state"],
                "assigned": issue.get("assigned", False)
            }
        })
    
    # Upsert in batches of 100
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch)

async def upsert_single(id: str, embedding: List[float], metadata: Dict):
    """Upsert a single vector."""
    index.upsert(vectors=[{
        "id": id,
        "values": embedding,
        "metadata": metadata
    }])
```

### Query Vectors (Search)
```python
from pydantic import BaseModel
from typing import Optional, List

class SearchFilters(BaseModel):
    language: Optional[str] = None
    labels: Optional[List[str]] = None
    min_stars: Optional[int] = None
    assigned: Optional[bool] = None
    state: Optional[str] = "open"

def build_filter(filters: SearchFilters) -> Dict:
    """Build Pinecone metadata filter."""
    filter_dict = {}
    
    if filters.language:
        filter_dict["language"] = {"$eq": filters.language}
    
    if filters.labels:
        filter_dict["labels"] = {"$in": filters.labels}
    
    if filters.min_stars:
        filter_dict["stars"] = {"$gte": filters.min_stars}
    
    if filters.assigned is not None:
        filter_dict["assigned"] = {"$eq": filters.assigned}
    
    if filters.state:
        filter_dict["state"] = {"$eq": filters.state}
    
    return filter_dict if filter_dict else None

async def search_issues(
    query_embedding: List[float],
    filters: Optional[SearchFilters] = None,
    top_k: int = 20
) -> List[Dict]:
    """Search for similar issues."""
    filter_dict = build_filter(filters) if filters else None
    
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        filter=filter_dict
    )
    
    return [
        {
            "id": match.id,
            "score": match.score,
            **match.metadata
        }
        for match in results.matches
    ]
```

### Delete Vectors
```python
async def delete_by_ids(ids: List[str]):
    """Delete vectors by their IDs."""
    index.delete(ids=ids)

async def delete_by_filter(filter_dict: Dict):
    """Delete vectors matching a filter."""
    index.delete(filter=filter_dict)

async def delete_by_repo(owner: str, repo: str):
    """Delete all issues from a specific repo."""
    index.delete(filter={
        "owner": {"$eq": owner},
        "repo": {"$eq": repo}
    })
```

### Fetch Vectors
```python
async def fetch_by_ids(ids: List[str]) -> Dict:
    """Fetch vectors by their IDs."""
    return index.fetch(ids=ids)

async def get_issue(issue_id: str) -> Optional[Dict]:
    """Get a single issue by ID."""
    result = index.fetch(ids=[issue_id])
    if issue_id in result.vectors:
        vec = result.vectors[issue_id]
        return {
            "id": issue_id,
            "metadata": vec.metadata
        }
    return None
```

## Advanced Queries

### Hybrid Search (Combine Filters)
```python
async def hybrid_search(
    query_embedding: List[float],
    text_keywords: List[str],
    filters: SearchFilters,
    top_k: int = 50
) -> List[Dict]:
    """Semantic search with metadata filtering."""
    
    # Build complex filter
    filter_dict = {
        "$and": [
            build_filter(filters),
            {"state": {"$eq": "open"}}
        ]
    }
    
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True,
        filter=filter_dict
    )
    
    # Re-rank by keyword matches
    scored_results = []
    for match in results.matches:
        keyword_score = sum(
            1 for kw in text_keywords 
            if kw.lower() in match.metadata.get("title", "").lower()
        )
        combined_score = match.score * 0.7 + (keyword_score * 0.1)
        scored_results.append({
            **match.metadata,
            "id": match.id,
            "semantic_score": match.score,
            "combined_score": combined_score
        })
    
    return sorted(scored_results, key=lambda x: x["combined_score"], reverse=True)
```

### Pagination
```python
async def paginated_search(
    query_embedding: List[float],
    page: int = 1,
    limit: int = 20,
    filters: Optional[SearchFilters] = None
) -> tuple[List[Dict], int]:
    """Search with pagination."""
    # Pinecone doesn't have native pagination, so we fetch more and slice
    total_fetch = page * limit + limit
    
    results = await search_issues(
        query_embedding=query_embedding,
        filters=filters,
        top_k=total_fetch
    )
    
    start = (page - 1) * limit
    end = start + limit
    
    return results[start:end], len(results)
```

## Index Statistics
```python
def get_index_stats():
    """Get statistics about the index."""
    stats = index.describe_index_stats()
    return {
        "total_vectors": stats.total_vector_count,
        "dimension": stats.dimension,
        "namespaces": stats.namespaces
    }
```

## Metadata Limits

**Important:** Pinecone has metadata size limits:
- Total metadata per vector: ~40KB
- String values: truncate to reasonable lengths

```python
def truncate_metadata(metadata: Dict) -> Dict:
    """Truncate metadata to stay within limits."""
    return {
        "title": metadata.get("title", "")[:500],
        "body": metadata.get("body", "")[:2000],  # Truncate long bodies
        "repo": metadata.get("repo", ""),
        "owner": metadata.get("owner", ""),
        "language": metadata.get("language"),
        "labels": metadata.get("labels", [])[:10],  # Limit array size
        "stars": metadata.get("stars", 0),
        "url": metadata.get("url", ""),
        "created_at": metadata.get("created_at", ""),
        "state": metadata.get("state", "open"),
        "assigned": metadata.get("assigned", False)
    }
```

## Checklist

- [ ] API key and index name configured
- [ ] Using batch operations for bulk upserts
- [ ] Metadata truncated to stay within limits
- [ ] Filters use correct Pinecone operators ($eq, $in, $gte, etc.)
- [ ] Error handling for API failures
- [ ] Considering rate limits for large operations
