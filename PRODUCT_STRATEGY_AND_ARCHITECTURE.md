# DevProof — Product Strategy & Architecture

**Last updated:** 2026-04-16
**Status:** Strategy doc. Implementation not yet started beyond Cloud Run timeout fix.
**Related docs:**
- `D:/Projects/devproof_ranking_algo/RESEARCH_V4_PIPELINE.md` — detailed V4 technical spec
- `C:/Users/dhruv/.claude/projects/D--Projects-github-contributions-search/memory/project_audit_pipeline_v4.md` — memory pointer

---

## 1. What DevProof actually is

**Not** a repo scorer. DevProof is a **verified-developer hiring platform** where recruiters find engineers based on evidence-linked claims from real code.

**Core insight from research:** Nobody has solved "prove skill X from code Y" at production scale. Incumbents either:
- Measure interview-skill, not engineering-skill (Karat, HackerRank, ex-Triplebyte)
- Measure shallow volume signals (Codersrank: LOC-weighted language)
- Avoid scoring entirely (GitHub — deliberately, citing Goodhart's law)

The category is genuinely open. DevProof's wedge is **evidence-linked per-claim verification** — recruiters click a skill, see the 3 commits that prove it.

---

## 2. The platform model: one platform, two roles

**Same platform, different surfaces — LinkedIn model.**

- **Developer role** (current) — sign up, connect GitHub, get audited, build profile.
- **Recruiter role** (future, month 9-12) — search, view profiles with evidence, endorse, reach out.

Same codebase, same DB, same graph. Different UI surfaces. Different pricing tiers.

**Why same platform:**
- Data flywheel — devs and recruiters on the same graph
- Devs control their profiles (trust requirement)
- Network effects ("3 recruiters viewed your profile")
- Single ops stack

**Why NOT split:**
- Splitting breaks the data flywheel
- Doubles ops cost
- Trust model breaks if dev profiles live elsewhere

---

## 3. The 7-layer architecture

### Layer 1 — Repo Audit (V4)
**Purpose:** Given a repo, extract structured claims with evidence.
**Output:** `{features, patterns, complexity_map, graph, tags, ownership_score, score}` — all with file:line evidence.
**Status:** Build first. Replaces broken V3 (which dumps 1.5M chars to Gemini → 504 timeouts).
**Tech:** tree-sitter graph + importance skeleton + structural-summary-first Flash map + Pro reduce + tool-call verification.

### Layer 2 — Standards Evaluator
**Purpose:** Deterministic engineering-standards checks on the graph.
**Measurable standards** (from research):
- Test quality — **mutation score** (PIT/mutmut/Stryker), not just coverage
- Type safety — typed-function ratio, strict-mode compliance
- Security hygiene — Semgrep + gitleaks + CodeQL
- Documentation density — docstring coverage, README quality rubric
- Error handling — swallowed-exception ratio
- Observability — structured logging, OpenTelemetry presence
- API design — OpenAPI lint, REST conventions
- Commit discipline — Conventional Commits ratio, atomicity distribution
**Tech:** deterministic tools, no LLM for most checks. Evidence-linked outputs.
**Research caveat:** code-metric-only quality prediction plateaus at ~0.6-0.75 AUC. These identify **absence of bad practice** more reliably than presence of excellence — good for filtering, not for ranking top 5%.

### Layer 3 — Skill Extractor
**Purpose:** Map audit output to a skill taxonomy.
**Taxonomy:** seed with 200-500 skills (languages, frameworks, patterns, domains) with hierarchies.
**Output per skill:**
- Evidence files (1-5 links per skill)
- Depth level: Beginner / Working / Proficient / Expert
- First-used date, last-used date (trajectory)
**Tech:** LLM for fuzzy classification, verified against graph facts.

### Layer 4 — Person Aggregator
**Purpose:** Merge skills across all of a person's repos into one profile.
**Handles:**
- Authorship weighting (70% of repo → high, 5% → low)
- Recency weighting (2024 usage > 2019 usage)
- Conflict resolution (novice in A, expert in B → trust deeper evidence)
- Cross-repo consistency (uses X across 4 repos = higher confidence)
**Output:** unified person profile — skills with evidence, confidence, recency.

### Layer 5 — Benchmark / Calibration
**Purpose:** Meaningful comparisons for hiring managers.
**How:**
- Calibration set: 1000+ public developers with known-good profiles (prominent OSS, academic authors)
- Percentile ranking per skill within cohort
- "84th percentile Python backend among 2-4 year engineers"
**Rule:** **Never a single overall score** — SPACE/Schmidt-Hunter research is clear this is statistically indefensible. Always skill-specific percentiles with evidence.
**Gating:** build only after 500+ scored devs exist (calibration data requirement).

### Layer 6 — Trust / Anti-Gaming Layer
**Purpose:** Make scores defensible to hiring managers.
**Costly-to-fake signals** (from research):
- Signed commits (GPG/Sigstore) merged into external repos
- Third-party-merged PRs (another human approved)
- Sustained multi-year activity (≥ 18 months)
- Cross-repo language/pattern consistency
- Maintainer roles on others' repos
- Reviews received from independent authors

**Trust tiers:**
- **BRONZE:** Self-attested, code visible, not verified
- **SILVER:** Authorship verified (forensics + signed commits)
- **GOLD:** External validation (third-party merged, cited, maintainer)
- **PLATINUM:** Peer-endorsed (another verified engineer endorses)

**Rule:** Must ship before any recruiter traffic goes live.

### Layer 7 — Recruiter / Hiring Platform Surface
**Purpose:** The actual recruiter UX.
**Features:**
- Search: "Python engineer with distributed systems + observability, 3-5 years, verified"
- Profile view: skills with evidence links, trust tier per claim
- Comparison view: engineer A vs B on role-specific skills
- Endorsement flow: hiring manager endorses a claim → PLATINUM for future recruiters

---

## 4. The AI-coding position (critical product stance)

**DevProof does NOT detect or penalize AI-assisted code.**

Reasoning:
- AI detection is unreliable in 2026 (60-75% accuracy, high false-positive rate)
- AI coding is universal in 2026 — gating on it is anti-reality
- Penalizing AI makes the product irrelevant

**Instead: measure OWNERSHIP, not AUTHORSHIP.**

The question isn't "did you write this?" It's "do you own this?"

Ownership = can explain it, has maintained it, has extended it, has fixed it under pressure.

**Ownership signals** (upgrade of existing Forensics):
| Signal | AI can fake it? |
|---|---|
| Sustained engagement (18+ months) | No (rare) |
| Debugging history (bug-fix commits) | Partially |
| Refactoring patterns | Partially |
| Response to code review | Increasingly yes by 2027 |
| Architectural decisions against AI defaults | No |
| Edge-case handling in tests | Partially |
| Cross-repo stylistic coherence | No (each AI session resets) |
| Commit-message quality explaining *why* | Partially |

**Combinations are still hard to fake** even if individual signals are. Vibe-coder with one-weekend projects fails most; engineer-with-AI passes most.

**Product positioning:** display these signals transparently. Hiring managers decide what they value. Some want "builds fast with AI"; some want "deep ownership." Reveal both.

**2027+ problem:** AI agents will simulate all these signals. Long-term answer: verified identity (Sigstore) + third-party-attested claims + live work samples. Plan for it, don't build it yet.

---

## 5. Ownership Score (new V4 output dimension)

Alongside complexity score, V4 emits an **Ownership Score (0-100)** combining:
- Sustained engagement (commit timespan)
- Iteration depth (edits per file over time)
- Bug-fix ratio (productive churn vs scaffold churn)
- Review participation (external reviews received/given)
- Cross-repo coherence (style + pattern consistency with same author's other repos)
- Long-tail evolution (initial → refined → extended → refactored)

Published on the profile alongside Skills. Hiring manager decides weight.

---

## 6. Timing and gating

**Trigger gates, not calendar dates:**

| Milestone | Trigger | Approx timing |
|---|---|---|
| **Layer 1** (V4 Repo Audit) | Immediate | Month 1 |
| **Layer 2** (Standards) | After V4 stabilizes | Month 2-3 |
| **Layer 3** (Skills) | After Layer 2 shows signal | Month 3-4 |
| **Layer 4** (Person) | After multi-repo users exist | Month 4-5 |
| **500+ scored devs** | Growth gate | Month 5-7 |
| **Layer 5** (Benchmark) | Requires calibration population | Month 6-7 |
| **Layer 6** (Trust) | Must ship before recruiters | Month 7-9 |
| **Layer 7** (Recruiter) | Requires Layer 6 stable | Month 9-12 |

**Do not build Layer 7 before Layer 6 is stable.** Hiring managers won't trust uncalibrated scores — research is explicit on this.

**Do not open to recruiters before ~1000 active dev profiles with evidence.** Search engine without inventory = recruiters bounce, don't return.

---

## 7. Developer-facing UX evolution

While backend layers build, dev UX evolves too:

- **Now (Layer 1):** "Your repo scored 78/TIER_2."
- **Month 3 (+Layer 2):** "78/TIER_2. Standards: tests ✅, types ✅, security ⚠️ (2 findings)."
- **Month 4 (+Layer 3):** "Verified skills: Python (Proficient), FastAPI (Working), JWT Auth (Working). [evidence]"
- **Month 5 (+Layer 4):** "Full profile across 4 repos: 12 skills. Top strengths: Python async, distributed locking."
- **Month 7 (+Layer 5):** "82nd percentile Python backend among 2-4 year engineers."
- **Month 9 (+Layer 6):** "Trust level: SILVER. [how to reach GOLD]"
- **Month 12 (+Layer 7):** "3 recruiters viewed your profile this week. Opt in?"

---

## 8. V4 output schema (hiring-ready from Day 1)

The single most important architectural discipline: **V4 output must be consumable by Layers 2-7 without re-auditing.**

```json
{
  "repo_score": 78,
  "repo_tier": "TIER_2",
  "ownership_score": 72,
  "claims": [
    {
      "feature": "JWT Authentication",
      "tier": "TIER_2",
      "feature_type": "COMPLEX",
      "evidence": [
        {"file": "middleware/auth.py", "lines": [23, 67], "role": "primary"},
        {"file": "services/auth_service.py", "lines": [12, 45], "role": "implementation"},
        {"file": "models/user.py", "lines": [8, 32], "role": "schema"}
      ],
      "skills_demonstrated": [
        {"skill_id": "python.fastapi", "depth": "PROFICIENT"},
        {"skill_id": "web.authentication", "depth": "PROFICIENT"},
        {"skill_id": "security.jwt", "depth": "WORKING"}
      ],
      "standards": {
        "tests_present": true,
        "types_strict": true,
        "error_handling": "explicit",
        "security_concerns": []
      },
      "authorship_verified": true,
      "confidence": 0.87
    }
  ],
  "pipeline_version": "v4.0",
  "commit_sha": "abc123...",
  "audited_at": "2026-04-16T13:00:00Z"
}
```

Per-claim evidence with file + line range. Skill tags. Standards results. Authorship verification. Confidence. That's the extraction-ready shape.

---

## 9. Technical approach (V4) — short version

**Full detail:** `D:/Projects/devproof_ranking_algo/RESEARCH_V4_PIPELINE.md`

**Key decisions:**
- **Structural-summary-first.** Send tree-sitter AST summaries + signatures to LLM, not raw code. Raw code on-demand via tool calling.
- **7 importance signals** for file ranking: PageRank, complexity, README mention, entry point, co-change, PR cluster, LoC z-score.
- **Joern-style deterministic pattern detectors** run BEFORE any LLM. Plugin systems, event buses, DI containers have detectable graph signatures.
- **Map-reduce audit** — Flash per chunk (parallel), Pro single reduce (<150k tokens).
- **Tool-calling verification** for low-confidence outputs (RepoAudit pattern).
- **No Pinecone for audit pipeline.** In-memory vectors + Postgres description cache by content_hash. Pinecone stays for GitHub issues search (different use case, different scale).
- **pgvector optional upgrade** if we need persistent vectors later.
- **Validation gates:** recall@20 ≥ 80%, Spearman ≥ 0.70, manual review ≥ 14/20 (no LLM-as-judge).

**Expected impact:**
| | V3 now | V4 target |
|---|---|---|
| Cold audit | 5+ min → 504 | <2 min |
| Warm audit | 5+ min | <30 sec |
| Cost | baseline | 5-10× cheaper |
| Multi-fact recall | ~60% | higher |
| 504 rate | non-zero | 0 |

---

## 10. The moat (why this works)

From research, incumbents' gaps that DevProof can exploit:

1. **Evidence-linked claims vs opaque scores.** Nobody lets recruiters click a skill and see the 3 PRs that prove it. Per-claim provenance = moat.
2. **Triangulated costly signals.** Gaming one signal is cheap; gaming the aggregate (signed commits + third-party merges + sustained activity + cross-repo consistency) is prohibitive.
3. **Multi-dimensional rubric instead of single score.** SPACE/Schmidt-Hunter research: single-score ranking is statistically indefensible. Honest framing wins.
4. **Calibrated uncertainty.** Every competitor over-claims accuracy. Publishing per-claim confidence + AI-uncertainty flags + admitting limits = defensible because it's true.

---

## 11. Anti-patterns to avoid

- **Don't ship a single "developer score."** Research is unambiguous this is indefensible. Skill-specific percentiles with evidence only.
- **Don't gate on AI-use.** Unenforceable, anti-reality. Measure ownership instead.
- **Don't build Layer 7 before Layer 6.** Hiring managers won't trust uncalibrated scores.
- **Don't open recruiters before ~1000 profiles.** Empty search = bounced recruiters.
- **Don't try to detect AI-generated code.** 60-75% accuracy isn't usable. Use ownership signals instead.
- **Don't build all layers at once.** Strict phasing; each layer earns the next.
- **Don't penalize one-weekend projects.** Surface the signals; let hiring managers decide.
- **Don't split into two platforms.** Same platform, two surfaces. LinkedIn model.

---

## 12. Current state (2026-04-16)

- Cloud Run timeout bumped to 3600s (user confirmed). 504s stopped.
- V4 research + alignment complete.
- Implementation: not yet started.
- Next steps: lock V4 output schema + seed skill taxonomy, then Phase 1 scaffolding.

## 13. When you return to this doc

Before coding anything, re-read:
1. Section 8 — the output schema. **Every V4 line of code should be shaped by this.**
2. Section 4 — AI-coding position. It's a product positioning decision, not just a tech one.
3. Section 6 — trigger gates. Don't skip phases.
4. `RESEARCH_V4_PIPELINE.md` — the full technical spec.
