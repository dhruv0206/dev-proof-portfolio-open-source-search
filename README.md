# DevProof

**Prove What You Build. Not What You Claim.**

Score any GitHub repo with AI-powered code analysis. Get a Technical Depth Score, share it, and build a verified developer portfolio.

[![Live Demo](https://img.shields.io/badge/Live_Demo-orenda.vision-10b981)](https://orenda.vision)
[![Discord](https://img.shields.io/badge/Discord-Join_Community-7289DA?logo=discord&logoColor=white)](https://discord.gg/dZRFt9kN)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)

---

## What is DevProof?

DevProof analyzes GitHub repositories across four dimensions and produces a **Technical Depth Score (TDS)** from 0 to 100.

**No signup required.** Paste a repo URL, get a score in 60 seconds.

### Score any repo

Paste a GitHub URL on the landing page. The AI engine scans the codebase and scores it across 4 buckets:

| Bucket | Max | What it measures |
|--------|-----|-----------------|
| **Features** | 40 | What you built — custom implementations, algorithms, integrations |
| **Architecture** | 15 | How you structured it — design patterns, separation of concerns |
| **Intent** | 25 | Code quality signals — error handling, tests, config management |
| **Forensics** | 20 | Commit history — sessions, fix ratio, message quality, evolution |

Total: **100 points**. Tier: ELITE (90+), ADVANCED (75-89), INTERMEDIATE (40-74), BASIC (0-39).

### Find contribution opportunities

Semantic search across **430,000+ open source issues** using natural language:

```
"beginner Python issues in machine learning projects"
"unassigned TypeScript bugs in popular repos"
"documentation issues I can fix today"
```

### Build your portfolio

Sign in with GitHub to save scores, track contributions, and build a verified developer profile with shareable score pages and README badges.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | FastAPI, Python 3.11, Pydantic v2 |
| **AI** | Google Gemini (embeddings + code analysis) |
| **Vector DB** | Pinecone (semantic search, 430K+ issues) |
| **Database** | PostgreSQL |
| **Auth** | BetterAuth (GitHub OAuth) |
| **Hosting** | Vercel (frontend), GCP Cloud Run (backend) |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database
- API Keys: [Pinecone](https://www.pinecone.io/), [Google AI](https://aistudio.google.com/), [GitHub](https://github.com/settings/tokens)

### Backend

```bash
cd ai-engine
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Add your API keys
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd web-platform
npm install
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
devproof/
├── ai-engine/                 # Python Backend (FastAPI)
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── routes/
│   │   │   ├── search.py     # Issue search
│   │   │   ├── projects.py   # Repo scoring (public + auth)
│   │   │   ├── issues.py     # Issue tracking & verification
│   │   │   └── users.py      # Profiles & settings
│   │   ├── middleware/
│   │   │   └── rate_limit.py # Public endpoint rate limiting
│   │   └── services/
│   │       └── cache_service.py  # Score caching by commit SHA
│   └── scripts/
│       └── migrations/       # Database migrations
│
└── web-platform/              # Next.js Frontend
    └── src/
        ├── app/
        │   ├── page.tsx            # Landing page
        │   ├── dashboard/          # User dashboard
        │   ├── finder/             # Issue finder
        │   ├── score/[owner]/[repo]/ # Public score page
        │   ├── projects/           # My projects
        │   ├── profile/            # My profile
        │   └── api/
        │       ├── badge/score/    # SVG badge generation
        │       └── og/score/       # OG image generation
        └── components/
            ├── landing/            # Landing page sections
            ├── score/              # Public score display
            ├── dashboard/          # Dashboard components
            ├── finder/             # Search components
            └── shared/             # Reusable components
```

---

## API

### Score a repo (public, rate-limited)

```http
POST /api/projects/scan-public
{ "repo_url": "https://github.com/owner/repo" }

POST /api/projects/audit-public
{ "repo_url": "https://github.com/owner/repo" }
```

### Get a cached score

```http
GET /api/projects/score/{owner}/{repo}
```

### Search issues

```http
POST /api/search
{ "query": "beginner Python issues", "limit": 20, "page": 1 }
```

---

## Contributing

DevProof is **source available** — the code is public and we welcome contributions.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Open a PR

Have ideas or feedback? [Join our Discord](https://discord.gg/dZRFt9kN) or reach out on [LinkedIn](https://www.linkedin.com/in/dhruv-patel-0206).

---

## License

This project is licensed under the **Business Source License 1.1 (BSL)**.

- **Source available** — you can view, fork, and contribute
- **Non-production use** is freely permitted (learning, testing, development)
- **Production use** requires a commercial license
- On **2035-01-01**, the license converts to **MIT**

See [`LICENSE`](./LICENSE) for full terms.

---

**[Score your first repo →](https://orenda.vision)**
