# DevProof 🚀

**Prove Your Code. Build Your Credibility.**

Discover contribution opportunities with AI-powered search. Track your work. Build a verified developer portfolio.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-dev--proof-blue)](https://orenda.vision)
[![Discord](https://img.shields.io/badge/Discord-Join_Community-7289DA?logo=discord&logoColor=white)](https://discord.gg/dZRFt9kN)
![Powered by Gemini](https://img.shields.io/badge/AI-Gemini%202.0-4285F4?logo=google&logoColor=white)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)

---

## 🎯 What is DevProof?

DevProof helps developers:

1. **🔍 Find Issues** — AI-powered semantic search across 10,000+ open source issues
2. **📊 Track Progress** — Monitor issues you're working on
3. **✅ Verify Contributions** — Prove your merged PRs with cryptographic verification
4. **🪪 Build Portfolio** — Share a public profile showcasing your verified work

---

## ✨ Key Features

### 🔍 AI-Powered Search (The Core)

> **[🚀 Try the AI Search Now →](https://dev-proof-portfolio.vercel.app/finder)**

Find the perfect issue in seconds using natural language:

```
"beginner Python issues in machine learning projects"
"unassigned TypeScript bugs in popular repos"  
"documentation issues I can fix today"
```

**How it works:**
- **Gemini AI** parses your query → extracts language, difficulty, labels, recency
- **Semantic Search** via Pinecone finds conceptually similar issues
- **Smart Ranking** combines relevance (40%) + freshness (35%) + popularity (25%)

| Query | What it finds |
|-------|---------------|
| `beginner Python issues` | Good first issues in Python repos |
| `unassigned help wanted` | Unclaimed issues needing contributors |
| `recent TypeScript CLI tools` | Fresh issues in CLI projects |
| `easy issues nobody working on` | Beginner-friendly unassigned work |

### 📊 Contribution Dashboard

- Track issues you're working on
- Submit PRs for verification
- See your progress at a glance

### ✅ Verified Contributions

When your PR gets merged:
- We verify authorship via GitHub API
- Your contribution is **cryptographically linked** to your profile
- Shows lines added/removed, merge date, repository

### 🪪 Public Portfolio

Shareable developer profile at `devproof.io/p/your-username`:
- Verified PR count
- Lines of code contributed
- Contribution timeline
- One-click sharing to LinkedIn/X

---

## 🏗️ Architecture

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

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database
- API Keys: [Pinecone](https://www.pinecone.io/), [Google AI](https://aistudio.google.com/), [GitHub](https://github.com/settings/tokens)

### 1. Clone & Setup

```bash
git clone https://github.com/dhruv0206/opensource-issues-finder.git
cd opensource-issues-finder
```

### 2. Backend (ai-engine)

```bash
cd ai-engine
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure .env
cp .env.example .env
# Add your API keys

# Run
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend (web-platform)

```bash
cd web-platform
npm install
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
devproof/
├── ai-engine/                 # Python Backend
│   ├── app/
│   │   ├── main.py           # FastAPI entry
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

---

## 🔧 API Reference

### Search Issues
```http
POST /api/search
{
  "query": "beginner Python issues",
  "limit": 20,
  "page": 1
}
```

### Get Recent Issues
```http
GET /api/search/recent?limit=20&sort_by=newest
```

### Public Profile
```http
GET /api/users/profile/{username}
```

### Track Issue
```http
POST /api/issues/track
{
  "user_id": "...",
  "issue_url": "https://github.com/...",
  "repo_owner": "org",
  "repo_name": "repo",
  "issue_number": 123
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | FastAPI, Python 3.11 |
| **AI** | Google Gemini 2.0 (embeddings + query parsing) |
| **Vector DB** | Pinecone (semantic search) |
| **Database** | PostgreSQL (user data, contributions) |
| **Auth** | BetterAuth (GitHub OAuth) |
| **Hosting** | Vercel (frontend), GCP Cloud Run (backend) |

---

## 📊 Data Freshness

Issues are ingested on a tiered schedule:

| Frequency | Stars | Window | Purpose |
|-----------|-------|--------|---------|
| Every 4 hours | 0+ | Last 4h | Catch new issues fast |
| Daily (4 AM) | 100+ | 7 days | Deep refresh |
| Daily (6 AM) | 100+ | 24h | Gap fill |

---

## 🤝 Contributing

DevProof is **source available** — the code is public and we welcome contributions!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Open a PR

Have ideas or feedback? [Join our Discord](https://discord.gg/dZRFt9kN) or reach out on [LinkedIn](https://www.linkedin.com/in/dhruv-patel-0206).

---

## 📝 License

This project is licensed under the **Business Source License 1.1 (BSL)**.

- **Source available** — you can view, fork, and contribute to the code
- **Non-production use** is freely permitted (learning, testing, development)
- **Production use** requires a commercial license from the maintainer
- On **2035-01-01**, the license converts to **MIT** (fully open source)

> ⚠️ DevProof is **not** open source. It is source available under BSL 1.1. See the [`LICENSE`](./LICENSE) file for full terms.

---

**Built with ❤️ to help developers break into open source.**

[Try it now →](https://dev-proof-portfolio.vercel.app)
