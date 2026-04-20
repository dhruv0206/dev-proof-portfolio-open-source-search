"""Smoke tests for the V4 diagnostic endpoint.

These tests exercise wiring only — import resolution, request validation,
auth gate, URL parsing, and the response envelope when the underlying
shadow runner is mocked. They do NOT hit the network or the full V4
pipeline (that's covered by module tests under ``devproof_ranking_algo/v4``).
Run with::

    pytest app/routes/v4_diagnostic_test.py -v
"""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.routes.v4_diagnostic import (
    ALLOWED_DIAGNOSTIC_USERS,
    V4DiagnosticRequest,
    _authorize,
    _find_readme,
    _graph_stats,
    _parse_owner_repo,
    run_v4_diagnostic,
)


# ── URL parsing ──────────────────────────────────────────────────────────────


def test_parse_owner_repo_basic():
    assert _parse_owner_repo("https://github.com/tiangolo/fastapi") == ("tiangolo", "fastapi")


def test_parse_owner_repo_trailing_slash():
    assert _parse_owner_repo("https://github.com/foo/bar/") == ("foo", "bar")


def test_parse_owner_repo_dot_git():
    assert _parse_owner_repo("https://github.com/foo/bar.git") == ("foo", "bar")


def test_parse_owner_repo_invalid():
    with pytest.raises(ValueError):
        _parse_owner_repo("https://example.com/foo/bar")


# ── README detection ─────────────────────────────────────────────────────────


def test_find_readme_md():
    fm = {"README.md": "# Hello", "src/main.py": "x = 1"}
    assert _find_readme(fm) == "# Hello"


def test_find_readme_case_variant():
    fm = {"readme.md": "# lower"}
    assert _find_readme(fm) == "# lower"


def test_find_readme_missing():
    fm = {"src/main.py": "x = 1"}
    assert _find_readme(fm) == ""


def test_find_readme_rst_fallback():
    fm = {"README.rst": "rst doc", "src/main.py": "x = 1"}
    assert _find_readme(fm) == "rst doc"


# ── Auth gate ────────────────────────────────────────────────────────────────


def _mock_db_with_user(github_username: str | None):
    db = MagicMock()
    user = MagicMock()
    user.githubUsername = github_username
    db.query.return_value.filter.return_value.first.return_value = user
    return db


def test_authorize_rejects_missing_user():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    with pytest.raises(HTTPException) as exc:
        _authorize(db, "some-id")
    assert exc.value.status_code == 403


def test_authorize_rejects_non_allowlisted_user():
    db = _mock_db_with_user("someone-else")
    with pytest.raises(HTTPException) as exc:
        _authorize(db, "some-id")
    assert exc.value.status_code == 403


def test_authorize_accepts_allowlisted_user():
    assert "dhruv0206" in ALLOWED_DIAGNOSTIC_USERS
    db = _mock_db_with_user("dhruv0206")
    user = _authorize(db, "some-id")
    assert user.githubUsername == "dhruv0206"


# ── Pydantic validation ──────────────────────────────────────────────────────


def test_request_requires_repo_url():
    with pytest.raises(Exception):
        V4DiagnosticRequest(user_id="u1")  # type: ignore[call-arg]


def test_request_accepts_optional_username():
    req = V4DiagnosticRequest(
        repo_url="https://github.com/foo/bar",
        user_id="u1",
    )
    assert req.github_username is None


def test_request_rejects_too_short_repo_url():
    with pytest.raises(Exception):
        V4DiagnosticRequest(repo_url="short", user_id="u1")


def test_request_defaults_run_full_pipeline_true():
    req = V4DiagnosticRequest(
        repo_url="https://github.com/foo/bar",
        user_id="u1",
    )
    assert req.run_full_pipeline is True
    assert req.enable_verify is True


def test_request_accepts_pipeline_flags():
    req = V4DiagnosticRequest(
        repo_url="https://github.com/foo/bar",
        user_id="u1",
        run_full_pipeline=False,
        enable_verify=False,
    )
    assert req.run_full_pipeline is False
    assert req.enable_verify is False


# ── Graph stats shape ────────────────────────────────────────────────────────


def test_graph_stats_shape():
    """Verify _graph_stats returns the documented keys without touching NetworkX graphs directly."""
    import networkx as nx

    fake = MagicMock()
    fake.file_list = ["a.py", "b.py"]
    fake.symbols = [object(), object(), object()]
    fake.references = nx.DiGraph([("a", "b"), ("b", "c")])
    fake.imports = nx.DiGraph([("a.py", "b.py")])
    fake.coverage_stats.return_value = {"ast": 2, "line_fallback": 0, "skipped": 0}

    stats = _graph_stats(fake)
    assert stats == {
        "files": 2,
        "symbols": 3,
        "reference_edges": 2,
        "import_edges": 1,
        "coverage": {"ast": 2, "line_fallback": 0, "skipped": 0},
    }


# ── Response envelope (shadow runner mocked) ────────────────────────────────


def _sample_v4_output_dict() -> dict:
    """Minimal dict that mirrors the shape of ``V4Output.model_dump()``.

    We don't need a fully schema-valid object — the endpoint treats the dict
    opaquely and forwards it. The test just checks presence + key subset.
    """
    return {
        "schema_version": "v4.0",
        "pipeline_version": "v4",
        "repo_score": 78,
        "repo_tier": "TIER_2_LOGIC",
        "claims": [],
        "architecture": {"detected_patterns": []},
        "score_breakdown": {},
        "pipeline_meta": {"verification_triggered": True},
    }


def _mock_run_v4_payload(include_v4_output: bool = True) -> dict:
    payload = {
        "repo_url": "https://github.com/foo/bar",
        "commit_sha": "abc1234",
        "pipeline_version": "v4-phase3" if include_v4_output else "v4-phase1",
        "latency_ms": {
            "tarball_fetch": 10, "graph_build": 20, "importance": 5,
            "patterns": 3, "tag": 100, "map": 200, "reduce": 150,
            "verify": 0, "total": 500,
        },
        "graph_stats": {
            "files": 3, "symbols": 5, "reference_edges": 2,
            "import_edges": 1, "coverage": {"ast": 3, "line_fallback": 0, "skipped": 0},
        },
        "importance": {
            "top_20": [], "core_set_size": 2, "periphery_size": 1,
            "guaranteed_inclusions": [], "weights_used": {},
        },
        "patterns": [],
        "ownership": None,
        "v4_output": _sample_v4_output_dict() if include_v4_output else None,
        "errors": [],
        "succeeded": True,
    }
    return payload


def _invoke_endpoint(req: V4DiagnosticRequest) -> dict:
    """Run the endpoint coroutine with auth + rate-limit bypassed."""
    db = _mock_db_with_user("dhruv0206")
    fake_request = MagicMock()
    fake_request.client.host = "127.0.0.1"

    with patch("app.routes.v4_diagnostic.diagnostic_limiter.check",
               return_value=None):
        return asyncio.run(run_v4_diagnostic(req, fake_request, db))


def test_full_pipeline_response_includes_v4_output():
    """When run_full_pipeline=True, the response surfaces a v4_output dict."""
    req = V4DiagnosticRequest(
        repo_url="https://github.com/foo/bar",
        user_id="u1",
        run_full_pipeline=True,
        enable_verify=True,
    )

    payload = _mock_run_v4_payload(include_v4_output=True)
    with patch(
        "app.routes.v4_diagnostic.run_v4",
        new=AsyncMock(return_value=payload),
    ):
        resp = _invoke_endpoint(req)

    assert "v4_output" in resp
    assert resp["v4_output"] is not None
    # Forwarded verbatim from the shadow runner.
    assert resp["v4_output"]["schema_version"] == "v4.0"
    assert resp["v4_output"]["repo_tier"] == "TIER_2_LOGIC"
    # Phase-1 fields retained for backward compat.
    assert "graph_stats" in resp
    assert "importance" in resp
    assert "patterns" in resp
    assert "ownership" in resp
    # Pipeline version bumped.
    assert resp["pipeline_version"] == "v4-phase3"


def test_v4_output_is_none_when_pipeline_disabled():
    """When run_full_pipeline=False, v4_output is null but Phase-1 fields stay."""
    req = V4DiagnosticRequest(
        repo_url="https://github.com/foo/bar",
        user_id="u1",
        run_full_pipeline=False,
        enable_verify=False,
    )

    payload = _mock_run_v4_payload(include_v4_output=False)
    with patch(
        "app.routes.v4_diagnostic.run_v4",
        new=AsyncMock(return_value=payload),
    ) as mock_run:
        resp = _invoke_endpoint(req)

    assert resp["v4_output"] is None
    # Phase 1 shape still populated.
    assert resp["graph_stats"]["files"] == 3
    assert resp["importance"]["core_set_size"] == 2
    # Flags propagated to the runner.
    called_kwargs = mock_run.call_args.kwargs
    assert called_kwargs["run_full_pipeline"] is False
    assert called_kwargs["enable_verify"] is False


def test_endpoint_forwards_pipeline_flags_to_runner():
    """The run_full_pipeline / enable_verify flags reach the shadow runner."""
    req = V4DiagnosticRequest(
        repo_url="https://github.com/foo/bar",
        user_id="u1",
        github_username="someone",
        run_full_pipeline=True,
        enable_verify=True,
    )

    payload = _mock_run_v4_payload(include_v4_output=True)
    mock = AsyncMock(return_value=payload)
    with patch("app.routes.v4_diagnostic.run_v4", new=mock):
        _invoke_endpoint(req)

    args, kwargs = mock.call_args
    assert args[0] == "https://github.com/foo/bar"
    assert kwargs["github_username"] == "someone"
    assert kwargs["run_full_pipeline"] is True
    assert kwargs["enable_verify"] is True


def test_tarball_failure_surfaces_as_400():
    """If the shadow runner returns no graph_stats and a tarball_fetch error, endpoint raises 400."""
    req = V4DiagnosticRequest(
        repo_url="https://github.com/foo/bar",
        user_id="u1",
    )

    bad_payload = {
        "repo_url": req.repo_url,
        "commit_sha": None,
        "pipeline_version": "v4-phase3",
        "latency_ms": {"tarball_fetch": 12},
        "graph_stats": None,
        "importance": None,
        "patterns": [],
        "ownership": None,
        "v4_output": None,
        "errors": ["tarball_fetch: 404 Not Found"],
        "succeeded": False,
    }

    with patch(
        "app.routes.v4_diagnostic.run_v4",
        new=AsyncMock(return_value=bad_payload),
    ):
        with pytest.raises(HTTPException) as exc:
            _invoke_endpoint(req)

    assert exc.value.status_code == 400
    assert "tarball" in exc.value.detail.lower()


def test_invalid_url_surfaces_as_400_without_calling_runner():
    req = V4DiagnosticRequest(
        repo_url="https://example.com/notgithub",
        user_id="u1",
    )

    with patch("app.routes.v4_diagnostic.run_v4", new=AsyncMock()) as mock:
        with pytest.raises(HTTPException) as exc:
            _invoke_endpoint(req)

    assert exc.value.status_code == 400
    mock.assert_not_called()
