# DevProof - Claude Context

## Project Overview
DevProof is a developer portfolio platform that helps developers discover open source contribution opportunities with AI-powered search, track their work, verify contributions, and build public portfolios.

**Live Demo:** https://dev-proof-portfolio.vercel.app

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js 16    │────▶│   FastAPI       │────▶│   Pinecone      │
│   Frontend      │     │   Backend       │     │   Vector DB     │
│   (Vercel)      │     │   (GCP)         │     │   (10k+ issues) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │   Gemini 2.0    │
│   (User Data)   │     │   (AI Engine)   │
└─────────────────┘     └─────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | FastAPI, Python 3.11, Pydantic v2 |
| **AI** | Google Gemini 2.0 (embeddings + query parsing) |
| **Vector DB** | Pinecone (semantic search) |
| **Database** | PostgreSQL |
| **Auth** | BetterAuth (GitHub OAuth) |
| **Hosting** | Vercel (frontend), GCP Cloud Run (backend) |

## Directory Structure

```
devproof/
├── ai-engine/                 # Python Backend (FastAPI)
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── routes/           # API endpoints
│   │   │   ├── search.py     # Issue search
│   │   │   ├── issues.py     # Tracking & verification
│   │   │   └── users.py      # Profiles & stats
│   │   └── services/
│   │       ├── search_engine.py    # Search orchestrator
│   │       ├── query_parser.py     # AI query parsing
│   │       └── issue_tracker.py    # Contribution tracking
│   └── scripts/
│       ├── ingest_graphql.py       # Data ingestion
│       └── verify_prs.py           # PR verification cron
│
└── web-platform/              # Next.js Frontend
    └── src/
        ├── app/
        │   ├── page.tsx            # Landing + Search
        │   ├── dashboard/          # User dashboard
        │   ├── issues/             # My Issues
        │   ├── profile/            # My Profile
        │   └── p/[username]/       # Public profiles
        └── components/
            ├── finder/             # Search components
            ├── layout/             # Navigation
            └── profile/            # Portfolio UI
```

## Key Commands

### Backend (ai-engine)
```bash
cd ai-engine
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend (web-platform)
```bash
cd web-platform
npm install
npm run dev  # http://localhost:3000
```

### Testing
```bash
# Backend tests
cd ai-engine && pytest

# Frontend tests
cd web-platform && npm test
```

## Code Style Guidelines

### TypeScript/React (Frontend)
- Use functional components with hooks
- Prefer `interface` over `type` for object shapes
- Use shadcn/ui components from `@/components/ui`
- Import paths use `@/` alias for `src/`
- Component files: PascalCase (e.g., `OpenSourceFinder.tsx`)
- Utility files: camelCase (e.g., `searchUtils.ts`)

### Python/FastAPI (Backend)
- Use Pydantic v2 models with `from_attributes = True` for ORM mode
- Async functions for all route handlers
- Use dependency injection for services
- Type hints on all function signatures
- Follow FastAPI best practices for routes

## 🔒 Security Guidelines (ALWAYS FOLLOW)

### Input Validation
- **ALWAYS** validate and sanitize user inputs using Pydantic models
- Use `Field(min_length=1, max_length=X)` for string inputs
- Use `Field(ge=1, le=X)` for numeric bounds
- **NEVER** trust client-side data — re-validate on the backend

### SQL Injection Prevention
- **NEVER** use raw string concatenation for SQL queries
- Use SQLAlchemy ORM or parameterized queries only
- Example: `session.execute(select(User).where(User.id == user_id))` ✅
- Not: `f"SELECT * FROM users WHERE id = {user_id}"` ❌

### XSS Prevention (Frontend)
- React escapes by default — **NEVER** use `dangerouslySetInnerHTML`
- Sanitize any user-generated content displayed in the UI
- Use URL encoding for query parameters

### Authentication & Authorization
- Check user authentication before accessing protected resources
- Validate user owns the resource before allowing modifications
- Use BetterAuth session verification on protected routes

### Secrets Management
- **NEVER** hardcode API keys, tokens, or credentials in code
- Use environment variables: `os.getenv("API_KEY")`
- Frontend secrets: Only expose with `NEXT_PUBLIC_` prefix if safe
- **NEVER** log sensitive data (passwords, tokens, API keys)

### API Security
- Return generic error messages to clients (don't leak stack traces)
- Implement rate limiting for public endpoints
- Validate Content-Type headers
- Use HTTPS for all external API calls

## ⚡ Performance Optimization (ALWAYS FOLLOW)

### Async Patterns (Backend)
- Use `async/await` for all I/O operations (database, HTTP, file)
- **NEVER** block the event loop with synchronous code
- Use `httpx.AsyncClient` instead of `requests`
- Use `asyncio.gather()` for parallel async operations

### Database Optimization
- Use `select()` with only needed columns, not `SELECT *`
- Add pagination for list endpoints (`LIMIT` + `OFFSET`)
- Use connection pooling for database connections
- Consider caching for frequently accessed, rarely changing data

### API Response Optimization
- Return only necessary fields in responses
- Use pagination: `{"items": [...], "total": 100, "page": 1, "limit": 20}`
- Set appropriate cache headers for static/semi-static data
- Compress large responses (automatic with FastAPI/ASGI)

### Frontend Performance
- Use React `useMemo` and `useCallback` for expensive computations
- Implement loading skeletons instead of spinners
- Lazy load components with `dynamic()` for route-based code splitting
- Optimize images: Use Next.js `<Image>` component with proper sizing

### Vector Search Optimization
- Limit Pinecone queries with `top_k` (max 100, prefer 20-50)
- Use metadata filters to reduce search space before vector similarity
- Cache frequently used embeddings
- Batch upsert operations (100 vectors per batch)

### Memory Management
- Truncate long strings before storing in Pinecone metadata (max 40KB)
- Stream large responses instead of loading into memory
- Clean up resources in `finally` blocks or async context managers

## API Patterns

### Search Endpoint
```python
POST /api/search
{
    "query": "beginner Python issues",
    "limit": 20,
    "page": 1
}
```

### Response Format
All API responses follow Pydantic models. Always return proper status codes.

## Important Notes

1. **Pydantic v2**: Use `model_config = ConfigDict(from_attributes=True)` not `orm_mode = True`
2. **Next.js 16**: Use App Router patterns, not Pages Router
3. **Tailwind**: Custom design system in `globals.css` - use CSS variables
4. **Environment Variables**: 
   - Frontend: `.env.local` with `NEXT_PUBLIC_` prefix for client vars
   - Backend: `.env` file in ai-engine directory

## Available Skills

Check `.agent/skills/` for specialized workflows:
- `nextjs-component.md` - Creating Next.js components
- `fastapi-endpoint.md` - Creating FastAPI endpoints  
- `pinecone-operations.md` - Vector database operations
- `gemini-integration.md` - AI/Gemini API patterns
- `testing.md` - Testing strategies for both stacks
- `deployment.md` - Deployment to Vercel/GCP

## Common Tasks

For common development tasks, see the workflows in `.agent/workflows/`.
