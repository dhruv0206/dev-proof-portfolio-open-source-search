# DevProof — Manual Test Guide

What to test for everything shipped in the algo-fix + Phase 4 sprint
(2026-04-30 → 2026-05-01).

## What was shipped

### Algo (`devproof_ranking_algo`)
- **Phase 1**: Layer classifier + UI cap on Tier 3 (no UI claims hit Deep Tech)
- **Phase 2**: SDK-glue cap (>50% SDK orchestration → Tier 2 max)
- **Phase 2.9**: Maturity-detector + tradeoff prompt rule (LLM emits "Chose X over Y")
- **Phase 3**: Rule-9 enforcement (Tier 3 must cite sub-criterion (a)-(f))
- **Phase 4.1**: `person_score` + `reach_score` formulas (dual-axis)
- **Phase 4.2**: GitHub repo discovery → `PersonRepoSummary` list
- **Phase 4.3**: Cohort-key scaffold (key populated, percentile staged for ≥30 users)
- **Phase 4.4**: OSS contribution graph (merged-PR scoring)
- **Phase 4.5**: `/p/[username]/score` dual-axis profile page
- **Phase 4.5b**: `GET /api/profile/{username}` backend route
- **Phase 4.6**: Skill taxonomy normalization (~100 canonical IDs + alias map)
- **Calibration corpus**: 19-repo code-grounded labels, 17/19 in_range

### Frontend (`web-platform`)
- `/methodology` — public calibration page
- `/p/[username]/score` — dual-axis profile (real API + fixture fallback)
- `/settings/github` — GitHub Access management
- `AddProjectModal` — structured private-repo error UX
- v4 algorithmic badges (Layer / SDK-glue cap / Rule-9 cap / tradeoffs panel)

---

## Setup

### Backend
```bash
cd D:\Projects\github-contributions-search\ai-engine
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd D:\Projects\github-contributions-search\web-platform
npm run dev
# → http://localhost:3000
```

### Algo (for unit tests + scripts only)
```bash
cd D:\Projects\devproof_ranking_algo
python -m pytest -q   # 529/529 should pass
```

---

## Test 1 — Algo unit tests

```bash
cd D:\Projects\devproof_ranking_algo
python -m pytest -q
```

**Expected:** `529 passed in ~11s`. If anything fails, stop here — the
rest of the manual tests depend on the algo being green.

Targeted checks:
```bash
python -m pytest tests/test_layer_classifier.py -v
python -m pytest tests/test_sdk_glue_detector.py -v
python -m pytest tests/test_maturity_detector.py -v
python -m pytest tests/test_reduce_phase.py::test_layer_cap -v
python -m pytest tests/test_person_score.py -v
python -m pytest tests/test_skill_taxonomy.py -v
python -m pytest tests/test_contribution_graph.py -v
```

---

## Test 2 — Calibration corpus

The calibration set is the credibility play for `/methodology`. Verify
17/19 repos land in their hand-labeled range.

```bash
cd D:\Projects\devproof_ranking_algo
python scripts/run_phase2_calibration.py --resume
python scripts/export_calibration.py > scripts/calibration_export.json
```

**Expected:**
- 17/19 in_range (the two outliers are documented edge cases:
  `awesome` — link list, expected 0-30; `pre-commit-hooks` — wrappers).
- `calibration_export.json` matches `web-platform/src/lib/calibration-data.ts`.

---

## Test 3 — `/methodology` page

Open: http://localhost:3000/methodology

**Check:**
- Calibration table renders 19 rows
- Score, hand-label range, in-range badge per row
- "Known Limitations" section visible
- Methodology version + formula version badges show

---

## Test 4 — Algo Phase 1+2+2.9 (v4-debug surface)

Pick a repo audit with the new debug UI:

1. Open http://localhost:3000/dev/v4-debug
2. Audit `https://github.com/Nenyax-AI/Nenyax` (or any prior cached repo)
3. **Verify badges appear on claims:**
   - **Layer chip**: ui / api / cli / data / config / infra / build / test / ai / rtc
   - **`SdkPackageChip`**: shows livekit / twilio / openai etc. when detected
   - **`LayerCappedBadge`**: appears red on claims that got demoted from T3 due to UI files
   - **`SdkGlueCappedBadge`**: amber on claims with >50% SDK orchestration
   - **`Rule9CappedBadge`**: appears when T3 was demoted for missing sub-criterion citation
4. **Tradeoffs panel:** expand a claim — should see "Chose X over Y because Z (file:lines)" entries when the LLM emitted them
5. **Acceptance test for Nenyax:** previously scored 91/ELITE; should now sit ~72-76 with multiple capped claims and tradeoffs surfaced

---

## Test 5 — Person profile (Phase 4.5)

### 5a — Fixture fallback (offline / demo accounts)
Open: http://localhost:3000/p/dhruv0206/score

**Expected when backend is OFF:** falls back to `FIXTURE_DHRUV` (78/32).
- Dual-axis hero shows person_score 78, reach_score 32
- Repo cards render with weight breakdowns

Open: http://localhost:3000/p/sindresorhus/score
**Expected:** `FIXTURE_SINDRESORHUS` (56/96) — proves the dual-axis
matters: low engineering depth, near-perfect reach.

### 5b — Real backend route (Phase 4.5b)
With backend running:
```bash
curl http://localhost:8000/api/profile/dhruv0206 | jq .
```

**Expected:**
- 200 OK
- JSON has `schema_version: "person.v1.0"`, `formula_version`,
  `person_score`, `reach_score`, `cohort_key` (e.g.
  `"python|?|backend-systems"`), `cohort_percentile: null`
- `_discovery_meta.total_discovered: 27`, `total_audited: <n>`,
  `errors: []`
- Repos without cached audit show `repo_score: null`,
  `skip_reason: "audit_failed"`

Then open http://localhost:3000/p/dhruv0206/score — should now render
*real* score (not fixture), which may differ from 78/32.

### 5c — Cohort key scaffold (Phase 4.3)
Verify the key is populated but percentile is null:
```bash
curl -s http://localhost:8000/api/profile/dhruv0206 | jq '{cohort_key, cohort_percentile, cohort_size}'
```
**Expected:** `cohort_key` non-null string, `cohort_percentile: null`,
`cohort_size: null`. (Percentile is staged behind the ≥30-user
population threshold.)

---

## Test 6 — Private-repo error UX

1. Open http://localhost:3000/dashboard
2. Click "Add Project"
3. Paste a URL of a real private repo (or a non-existent one):
   `https://github.com/dhruv0206/some-private-repo`
4. Submit

**Expected:**
- 403 with structured error response
- AddProjectModal renders the **fix-flow card** (not a generic toast):
  - "We can't access this repository" headline
  - "Why this happens" explainer
  - **"Manage GitHub Access"** button → links to `/settings/github`
  - Retry button stays in the modal

---

## Test 7 — `/settings/github` page

1. Open http://localhost:3000/settings/github
2. **Verify sidebar:** "GitHub Access" item with `ShieldCheck` icon,
   appears in dashboard sidebar
3. **Page content:**
   - Permission matrix table (read:user, user:email, repo, etc.)
   - "Re-authorize with private repo access" CTA
   - Current scopes inferred from session

---

## Test 8 — Skill taxonomy (Phase 4.6)

Quick REPL check:
```python
cd D:\Projects\devproof_ranking_algo
python -c "
from devproof_ranking_algo.v4.skill_taxonomy import normalize_skills
print(normalize_skills(['React', 'react.js', 'ReactJS', 'TypeScript', 'ts', 'FastAPI', 'Python (FastAPI)']))
"
```
**Expected:** `['typescript.react', 'typescript', 'python.fastapi', 'python']`
(deduped after normalization)

---

## Test 9 — OSS contribution graph (Phase 4.4)

```python
python -c "
from devproof_ranking_algo.v4.contribution_graph import fetch_merged_prs
result = fetch_merged_prs('dhruv0206')
print(f'score={result.contribution_score} prs={result.total_merged_prs} orgs={result.unique_orgs}')
print(f'top: {[(c.recipient_repo, c.recipient_stars) for c in result.top_contributions[:3]]}')
"
```
**Expected:** Returns a `ContributionGraph` with `contribution_score 0..100`.
For `dhruv0206` likely 0 unless they have merged PRs to non-owned repos
≥5 stars. Try `torvalds` or any prolific OSS contributor for a
non-zero score.

---

## Sanity checklist before declaring "done"

- [ ] `python -m pytest` → 529/529 in algo repo
- [ ] `npm run build` → no TypeScript errors
- [ ] `/methodology` renders calibration table
- [ ] `/dev/v4-debug` shows new badges + tradeoffs
- [ ] `/p/dhruv0206/score` works both with backend ON and OFF
- [ ] `/api/profile/dhruv0206` returns valid PersonScore JSON
- [ ] AddProjectModal shows fix-flow card on private repo
- [ ] `/settings/github` reachable from sidebar
- [ ] Cohort key populated, percentile null

---

## Known not-yet-done

- Cohort percentile activation (needs ≥30 users per bucket)
- `/api/profile/{username}` doesn't trigger fresh audits — only reads cache
- Contribution graph not yet plumbed into `PersonScore` (separate field)
- Skill taxonomy not yet plumbed into person aggregation surface
- Cloud Run rebuild + production deploy
