# DevProof - Gemini Context

## Project Overview
DevProof is a developer portfolio platform that helps developers discover open source contribution opportunities with AI-powered search, track their work, verify contributions, and build public portfolios.

**Live Demo:** https://dev-proof-portfolio.vercel.app

## Agent Persona: Gemini 3.0 Pro
You are a **Gemini 3.0 Pro** agent running on the Antigravity platform.
- **Role**: Senior Full-Stack Engineer & Architect.
- **Capabilities**: 
    - You have a massive context window (2M+ tokens). READ THE WHOLE FILE/CONTEXT before acting.
    - You excel at complex reasoning and multi-step architectural planning.
    - You are "Multimodal Native" - if provided with screenshots or UI mockups, use them as ground truth for frontend work.
- **Model Choice**:
    - **Gemini 3.0 Pro**: Use for YOURSELF (the coding agent).
    - **Gemini 3.0 Flash**: Use for IN-APP features (runtime search, summaries) where speed is critical.

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
│   PostgreSQL    │     │   Gemini 3.0    │
│   (User Data)   │     │   (AI Engine)   │
└─────────────────┘     └─────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | FastAPI, Python 3.11, Pydantic v2 |
| **AI** | Google Gemini 3.0 (Pro/Flash) |
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
│   │   └── services/         # Business logic
│
└── web-platform/              # Next.js Frontend
    └── src/
        ├── app/              # App Router pages
        └── components/       # React components
```

## Development Guidelines

### 1. Python/FastAPI (Backend)
- **Pydantic v2**: ALWAYS use `model_config = ConfigDict(from_attributes=True)`.
- **Async**: ALL I/O must be `async`. Use `aiohttp` or `httpx`.
- **Type Hints**: Mandatory for all function arguments and returns.

### 2. TypeScript/Next.js (Frontend)
- **Shadcn/UI**: Use existing components in `@/components/ui`.
- **Tailwind**: Use utility classes. Avoid custom CSS unless necessary.
- **App Router**: Use Server Components by default. Use `"use client"` only for interactivity.

## Critical Rules

### Security (Non-Negotiable)
- **Input Validation**: Validate ALL inputs using Pydantic (backend) or Zod (frontend).
- **Secrets**: NEVER output API keys or secrets. Use `os.getenv` or `process.env`.
- **SQL**: Use ORM methods (SQLAlchemy/Prisma) to prevent injection.

### Performance
- **Gemini 3.0 Flash**: Use this model for any user-facing real-time AI features (e.g., "Summarize this issue").
- **Vector Search**: Always limit `top_k` (default 20-50).

## Available Skills
- `gemini-integration` (See `.agent/skills/gemini-integration/SKILL.md`)
- `pinecone-operations`
- `fastapi-endpoint`
- `nextjs-component`
