"""Smoke tests for the V4 diagnostic endpoint.

These tests exercise wiring only — import resolution, request validation,
auth gate, URL parsing. They do NOT hit the network or the full V4 pipeline
(that's covered by the underlying module tests). Run with::

    pytest app/routes/v4_diagnostic_test.py -v
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.routes.v4_diagnostic import (
    ALLOWED_DIAGNOSTIC_USERS,
    V4DiagnosticRequest,
    _authorize,
    _find_readme,
    _graph_stats,
    _parse_owner_repo,
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
