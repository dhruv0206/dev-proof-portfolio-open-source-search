---
name: fastapi-endpoint
description: Create FastAPI endpoints with proper Pydantic models, async patterns, and error handling
---

# FastAPI Endpoint Creation Skill

## When to Use
Use this skill when creating new API endpoints for the DevProof ai-engine backend.

## Endpoint Structure

### Route File Pattern
```python
# app/routes/your_route.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from app.services.your_service import YourService

router = APIRouter(prefix="/api/your-resource", tags=["your-resource"])

# Pydantic Models (Request/Response)
class CreateResourceRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class ResourceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str
    
    model_config = ConfigDict(from_attributes=True)

class ResourceListResponse(BaseModel):
    items: List[ResourceResponse]
    total: int
    page: int
    limit: int

# Route Handlers
@router.post("/", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(request: CreateResourceRequest):
    """Create a new resource."""
    try:
        result = await YourService.create(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(resource_id: str):
    """Get a resource by ID."""
    result = await YourService.get_by_id(resource_id)
    if not result:
        raise HTTPException(status_code=404, detail="Resource not found")
    return result

@router.get("/", response_model=ResourceListResponse)
async def list_resources(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None
):
    """List resources with pagination."""
    items, total = await YourService.list(page=page, limit=limit, search=search)
    return ResourceListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit
    )
```

## File Locations

| Type | Location |
|------|----------|
| Route handlers | `ai-engine/app/routes/` |
| Business logic | `ai-engine/app/services/` |
| Pydantic models | `ai-engine/app/models/` or inline |
| Database models | `ai-engine/app/database/` |

## Pydantic v2 Patterns

### IMPORTANT: Use Pydantic v2 Syntax
```python
# ✅ Correct (Pydantic v2)
from pydantic import BaseModel, ConfigDict

class UserResponse(BaseModel):
    id: str
    email: str
    
    model_config = ConfigDict(from_attributes=True)

# ❌ Wrong (Pydantic v1 - DEPRECATED)
class UserResponse(BaseModel):
    class Config:
        orm_mode = True  # DON'T USE THIS
```

### Validation
```python
from pydantic import BaseModel, Field, field_validator

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=20, ge=1, le=100)
    page: int = Field(default=1, ge=1)
    
    @field_validator('query')
    @classmethod
    def clean_query(cls, v: str) -> str:
        return v.strip()
```

## Error Handling

### Standard HTTP Exceptions
```python
from fastapi import HTTPException, status

# 400 Bad Request
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid query parameter"
)

# 404 Not Found
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Resource not found"
)

# 500 Internal Server Error (let it propagate or log)
import logging
logger = logging.getLogger(__name__)

try:
    result = await external_api_call()
except Exception as e:
    logger.error(f"External API failed: {e}")
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="External service unavailable"
    )
```

## Async Patterns

### Database Operations
```python
async def get_user_by_id(user_id: str) -> Optional[User]:
    async with get_db_session() as session:
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
```

### External API Calls
```python
import httpx

async def fetch_github_issue(owner: str, repo: str, issue_number: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/issues/{issue_number}",
            headers={"Authorization": f"Bearer {GITHUB_TOKEN}"}
        )
        response.raise_for_status()
        return response.json()
```

## Registering Routes

In `app/main.py`:
```python
from app.routes import search, issues, users, your_new_route

app.include_router(search.router)
app.include_router(issues.router)
app.include_router(users.router)
app.include_router(your_new_route.router)
```

## Environment Variables

Access via:
```python
import os
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
```

## Testing Pattern

```python
# tests/test_your_route.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_resource():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/your-resource/",
            json={"name": "Test", "description": "A test resource"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test"
```

## Checklist

- [ ] Uses async/await for all I/O operations
- [ ] Pydantic models with `ConfigDict(from_attributes=True)`
- [ ] Proper HTTP status codes
- [ ] Request validation with Field constraints
- [ ] Error handling with HTTPException
- [ ] Route registered in main.py
- [ ] API documented (docstrings appear in /docs)
