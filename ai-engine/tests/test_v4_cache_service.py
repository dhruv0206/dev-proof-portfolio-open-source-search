"""Tests for v4_cache_service serialization roundtrips.

These tests avoid a live DB — they exercise the serialization layer which
is the most fragile part (str-enum rehydration, tuple→list coercion on
JSON roundtrip). DB integration tests live in a separate file (not yet
written) because the models use PostgreSQL-specific UUID columns.
"""
from __future__ import annotations

import json

import pytest

from app.services.v4_cache_service import (
    _deserialize_map_result,
    _deserialize_tagger_result,
    _serialize_map_result,
    _serialize_tagger_result,
)


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture
def sample_tagger_result():
    from devproof_ranking_algo.v4.types import FileKind, FileTag, TaggerResult
    return TaggerResult(
        tags=[
            FileTag(
                file_path="app/main.py",
                content_hash="a" * 64,
                description="FastAPI entry point. Wires routes.",
                kind=FileKind.ENTRY,
                interesting_features=["OpenAPI routes", "DI container"],
                cached=False,
            ),
            FileTag(
                file_path="app/routes/auth.py",
                content_hash="b" * 64,
                description="JWT authentication endpoints.",
                kind=FileKind.ROUTE,
                interesting_features=["JWT verification"],
                cached=True,
            ),
        ],
        latency_ms=18250,
        errors=["flaky_file_2: timeout"],
        cache_hits=1,
        cache_misses=1,
    )


@pytest.fixture
def sample_map_result():
    from devproof_ranking_algo.v4.types import (
        AuthenticitySignal,
        ChunkAnalysis,
        ComplexitySignal,
        EvidenceSpan,
        IntegrationDepth,
        MapPhaseResult,
        StylisticConsistency,
    )
    return MapPhaseResult(
        chunks=[
            ChunkAnalysis(
                chunk_id="app/main.py:1-40",
                file="app/main.py",
                start_line=1,
                end_line=40,
                complexity_signal=ComplexitySignal(
                    novel_algorithm=False,
                    integration_depth=IntegrationDepth.MULTI_SYSTEM,
                    boilerplate_pct=30,
                ),
                authenticity_signal=AuthenticitySignal(
                    appears_ai_generated=False,
                    stylistic_consistency=StylisticConsistency.HIGH,
                ),
                patterns=["dependency_injection", "router"],
                evidence_spans=[
                    EvidenceSpan(lines=(10, 25), reason="Complex route wiring"),
                    EvidenceSpan(lines=(30, 40), reason="Middleware chain"),
                ],
            ),
            ChunkAnalysis(
                chunk_id="app/main.py:41-80",
                file="app/main.py",
                start_line=41,
                end_line=80,
                complexity_signal=ComplexitySignal(
                    novel_algorithm=True,
                    integration_depth=IntegrationDepth.DEEP,
                    boilerplate_pct=5,
                ),
                authenticity_signal=AuthenticitySignal(
                    appears_ai_generated=False,
                    stylistic_consistency=StylisticConsistency.HIGH,
                ),
                patterns=[],
                evidence_spans=[],
            ),
        ],
        latency_ms=96000,
        errors=[],
        flash_call_count=2,
        chunks_skipped=0,
    )


# ─── Tagger roundtrip ────────────────────────────────────────────────────────

class TestTaggerSerialization:
    def test_serialized_dict_is_json_safe(self, sample_tagger_result):
        serialized = _serialize_tagger_result(sample_tagger_result)
        # Must survive json.dumps without custom encoder
        json.dumps(serialized)

    def test_enum_becomes_string(self, sample_tagger_result):
        serialized = _serialize_tagger_result(sample_tagger_result)
        kinds = [t["kind"] for t in serialized["tags"]]
        assert kinds == ["entry", "route"]
        assert all(isinstance(k, str) for k in kinds)

    def test_roundtrip_preserves_tags(self, sample_tagger_result):
        serialized = _serialize_tagger_result(sample_tagger_result)
        roundtripped_json = json.loads(json.dumps(serialized))
        restored = _deserialize_tagger_result(roundtripped_json)

        assert len(restored.tags) == 2
        t0, t1 = restored.tags
        assert t0.file_path == "app/main.py"
        assert t0.content_hash == "a" * 64
        assert t0.description == "FastAPI entry point. Wires routes."
        assert t0.kind.value == "entry"
        assert t0.interesting_features == ["OpenAPI routes", "DI container"]
        assert t0.cached is False

        assert t1.file_path == "app/routes/auth.py"
        assert t1.kind.value == "route"
        assert t1.cached is True

    def test_roundtrip_preserves_metadata(self, sample_tagger_result):
        serialized = _serialize_tagger_result(sample_tagger_result)
        restored = _deserialize_tagger_result(json.loads(json.dumps(serialized)))
        assert restored.latency_ms == 18250
        assert restored.errors == ["flaky_file_2: timeout"]
        assert restored.cache_hits == 1
        assert restored.cache_misses == 1

    def test_empty_tagger_result_roundtrips(self):
        from devproof_ranking_algo.v4.types import TaggerResult
        original = TaggerResult(tags=[], latency_ms=0)
        serialized = _serialize_tagger_result(original)
        restored = _deserialize_tagger_result(json.loads(json.dumps(serialized)))
        assert restored.tags == []
        assert restored.latency_ms == 0
        assert restored.errors == []


# ─── Map roundtrip ───────────────────────────────────────────────────────────

class TestMapSerialization:
    def test_serialized_dict_is_json_safe(self, sample_map_result):
        serialized = _serialize_map_result(sample_map_result)
        json.dumps(serialized)

    def test_nested_enums_become_strings(self, sample_map_result):
        serialized = _serialize_map_result(sample_map_result)
        cs = serialized["chunks"][0]["complexity_signal"]
        au = serialized["chunks"][0]["authenticity_signal"]
        assert cs["integration_depth"] == "multi_system"
        assert au["stylistic_consistency"] == "high"

    def test_tuple_evidence_becomes_list_and_rehydrates(self, sample_map_result):
        """tuple[int, int] → JSON list → tuple again on deserialization."""
        serialized = _serialize_map_result(sample_map_result)
        # After JSON roundtrip, evidence lines are lists
        after_json = json.loads(json.dumps(serialized))
        lines_as_json = after_json["chunks"][0]["evidence_spans"][0]["lines"]
        assert lines_as_json == [10, 25]  # JSON always gives list

        restored = _deserialize_map_result(after_json)
        # Deserializer must convert back to tuple
        restored_lines = restored.chunks[0].evidence_spans[0].lines
        assert restored_lines == (10, 25)
        assert isinstance(restored_lines, tuple)

    def test_roundtrip_preserves_chunks(self, sample_map_result):
        serialized = _serialize_map_result(sample_map_result)
        restored = _deserialize_map_result(json.loads(json.dumps(serialized)))
        assert len(restored.chunks) == 2

        c0 = restored.chunks[0]
        assert c0.chunk_id == "app/main.py:1-40"
        assert c0.file == "app/main.py"
        assert c0.start_line == 1
        assert c0.end_line == 40
        assert c0.complexity_signal.novel_algorithm is False
        assert c0.complexity_signal.integration_depth.value == "multi_system"
        assert c0.complexity_signal.boilerplate_pct == 30
        assert c0.authenticity_signal.appears_ai_generated is False
        assert c0.authenticity_signal.stylistic_consistency.value == "high"
        assert c0.patterns == ["dependency_injection", "router"]
        assert len(c0.evidence_spans) == 2
        assert c0.evidence_spans[0].lines == (10, 25)
        assert c0.evidence_spans[0].reason == "Complex route wiring"

        c1 = restored.chunks[1]
        assert c1.complexity_signal.novel_algorithm is True
        assert c1.complexity_signal.integration_depth.value == "deep"
        assert c1.evidence_spans == []

    def test_roundtrip_preserves_metadata(self, sample_map_result):
        serialized = _serialize_map_result(sample_map_result)
        restored = _deserialize_map_result(json.loads(json.dumps(serialized)))
        assert restored.latency_ms == 96000
        assert restored.flash_call_count == 2
        assert restored.chunks_skipped == 0

    def test_empty_map_result_roundtrips(self):
        from devproof_ranking_algo.v4.types import MapPhaseResult
        original = MapPhaseResult(chunks=[], latency_ms=0)
        serialized = _serialize_map_result(original)
        restored = _deserialize_map_result(json.loads(json.dumps(serialized)))
        assert restored.chunks == []
        assert restored.latency_ms == 0
