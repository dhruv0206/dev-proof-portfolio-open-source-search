"""V4 Shadow Runner — orchestrates the V4 Phase 1 pipeline for a repo.

Extracted so both the diagnostic endpoint and the /import shadow-run path
can share the same orchestration. Never raises — returns a structured
payload with `errors: []` on partial failures, `succeeded: bool` overall.

Designed to be safe to call from a FastAPI BackgroundTasks job: all
exceptions are caught, logged, and surfaced in the output dict.
"""
from __future__ import annotations

import logging
import re
import time
from dataclasses import asdict
from typing import Any, Optional

from devproof_ranking_algo import (
    GithubIngestor,
    TarballFetcher,
    build_complexity_map,
)
from devproof_ranking_algo.v4.graph_builder import build_graph
from devproof_ranking_algo.v4.importance import compute as compute_importance
from devproof_ranking_algo.v4.ownership import compute as compute_ownership
from devproof_ranking_algo.v4.pattern_detectors import detect_all as detect_patterns

log = logging.getLogger(__name__)

_README_CANDIDATES = (
    "README.md", "readme.md", "Readme.md", "README.MD",
    "README.rst", "readme.rst",
    "README", "readme",
    "README.txt", "readme.txt",
)

_OWNERSHIP_TOP_N = 20


def _parse_owner_repo(repo_url: str) -> Optional[tuple[str, str]]:
    """Extract (owner, repo). Returns None on invalid input."""
    match = re.search(r"github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$", repo_url)
    return (match.group(1), match.group(2)) if match else None


def _find_readme(file_map: dict[str, str]) -> str:
    for name in _README_CANDIDATES:
        if name in file_map:
            return file_map[name]
    for path, content in file_map.items():
        if "/" not in path and path.lower().startswith("readme"):
            return content
    return ""


def _pattern_to_dict(p: Any) -> dict[str, Any]:
    d = asdict(p)
    kind = d.get("kind")
    if hasattr(kind, "value"):
        d["kind"] = kind.value
    elif not isinstance(kind, str):
        d["kind"] = str(kind)
    return d


def _ownership_to_dict(o: Any) -> dict[str, Any]:
    return {
        "score": o.score,
        "signals": asdict(o.signals),
        "weights_used": dict(o.weights_used),
        "evidence": dict(o.evidence),
    }


def _graph_stats(graph: Any) -> dict[str, Any]:
    return {
        "files": len(graph.file_list),
        "symbols": len(graph.symbols),
        "reference_edges": graph.references.number_of_edges(),
        "import_edges": graph.imports.number_of_edges(),
        "coverage": graph.coverage_stats(),
    }


def run_v4(
    repo_url: str,
    github_username: Optional[str] = None,
) -> dict[str, Any]:
    """Run the V4 Phase 1 pipeline on a repo and return a structured payload.

    Never raises. Tarball fetch failure yields a payload with ``succeeded=False``
    and the error in ``errors[]``. Per-stage failures are collected similarly.

    Args:
        repo_url: GitHub URL, e.g. ``https://github.com/owner/repo``.
        github_username: if provided, compute ownership score for this author.

    Returns:
        Dict with keys: repo_url, commit_sha, pipeline_version, latency_ms,
        graph_stats, importance, patterns, ownership, errors, succeeded.
    """
    result: dict[str, Any] = {
        "repo_url": repo_url,
        "commit_sha": None,
        "pipeline_version": "v4-phase1",
        "latency_ms": {},
        "graph_stats": None,
        "importance": None,
        "patterns": [],
        "ownership": None,
        "errors": [],
        "succeeded": False,
    }
    errors: list[str] = result["errors"]
    latency: dict[str, int] = result["latency_ms"]
    t_total = time.perf_counter()

    # 1. Parse owner/repo
    parsed = _parse_owner_repo(repo_url)
    if parsed is None:
        errors.append("invalid_repo_url")
        return result
    owner, repo_name = parsed

    # 2. GitHub client
    try:
        ingestor = GithubIngestor()
    except Exception as e:  # noqa: BLE001
        errors.append(f"github_client_init: {e}")
        log.warning("[v4-shadow] GithubIngestor init failed: %s", e)
        return result

    # 3. Tarball fetch — required
    t0 = time.perf_counter()
    file_map: dict[str, str] = {}
    try:
        fetcher = TarballFetcher(github_token=ingestor.token)
        with fetcher.fetch(owner, repo_name) as repo_files:
            file_map = dict(repo_files.file_map)
    except Exception as e:  # noqa: BLE001
        errors.append(f"tarball_fetch: {e}")
        log.warning("[v4-shadow] tarball fetch failed %s/%s: %s", owner, repo_name, e)
        latency["tarball_fetch"] = int((time.perf_counter() - t0) * 1000)
        return result
    latency["tarball_fetch"] = int((time.perf_counter() - t0) * 1000)

    # 4. HEAD commit SHA — best-effort
    repo_obj = None
    try:
        repo_obj = ingestor.get_repo(f"{owner}/{repo_name}")
        result["commit_sha"] = repo_obj.get_commits()[0].sha
    except Exception as e:  # noqa: BLE001
        errors.append(f"commit_sha_resolve: {e}")
        log.warning("[v4-shadow] HEAD sha resolve failed: %s", e)

    # 5. Complexity map — feeds importance
    t0 = time.perf_counter()
    complexity_map: list[dict] = []
    try:
        complexity_map = build_complexity_map(file_map)
    except Exception as e:  # noqa: BLE001
        errors.append(f"complexity_map: {e}")
        log.warning("[v4-shadow] complexity map failed: %s", e)
    complexity_ms = int((time.perf_counter() - t0) * 1000)

    # 6. Graph build
    t0 = time.perf_counter()
    graph = None
    try:
        graph = build_graph(file_map)
        result["graph_stats"] = _graph_stats(graph)
    except Exception as e:  # noqa: BLE001
        errors.append(f"graph_build: {e}")
        log.error("[v4-shadow] graph build failed: %s", e)
    latency["graph_build"] = int((time.perf_counter() - t0) * 1000) + complexity_ms

    # 7. Importance
    t0 = time.perf_counter()
    top_20_paths: list[str] = []
    readme_content = _find_readme(file_map)
    if graph is not None:
        try:
            imp = compute_importance(graph, file_map, readme_content, complexity_map)
            top_20 = imp.ranked[:20]
            top_20_paths = [r.file for r in top_20]
            result["importance"] = {
                "top_20": [asdict(rf) for rf in top_20],
                "core_set_size": len(imp.core_set),
                "periphery_size": len(imp.periphery),
                "guaranteed_inclusions": list(imp.guaranteed_inclusions),
                "weights_used": dict(imp.weights_used),
            }
        except Exception as e:  # noqa: BLE001
            errors.append(f"importance: {e}")
            log.warning("[v4-shadow] importance failed: %s", e)
    latency["importance"] = int((time.perf_counter() - t0) * 1000)

    # 8. Patterns
    t0 = time.perf_counter()
    if graph is not None:
        try:
            detected = detect_patterns(graph, file_map)
            result["patterns"] = [_pattern_to_dict(p) for p in detected]
        except Exception as e:  # noqa: BLE001
            errors.append(f"patterns: {e}")
            log.warning("[v4-shadow] patterns failed: %s", e)
    latency["patterns"] = int((time.perf_counter() - t0) * 1000)

    # 9. Ownership (optional)
    if github_username and repo_obj is not None:
        t0 = time.perf_counter()
        try:
            own = compute_ownership(
                repo_obj,
                github_username,
                importance_ranked_files=top_20_paths[:_OWNERSHIP_TOP_N] or None,
            )
            result["ownership"] = _ownership_to_dict(own)
        except Exception as e:  # noqa: BLE001
            errors.append(f"ownership: {e}")
            log.warning("[v4-shadow] ownership failed: %s", e)
        latency["ownership"] = int((time.perf_counter() - t0) * 1000)

    # Overall success: graph + importance both landed
    result["succeeded"] = (
        result["graph_stats"] is not None and result["importance"] is not None
    )
    latency["total"] = int((time.perf_counter() - t_total) * 1000)

    log.info(
        "[v4-shadow] %s/%s -> succeeded=%s, total=%dms, errors=%d",
        owner, repo_name, result["succeeded"], latency["total"], len(errors),
    )
    return result
