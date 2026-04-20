"""V4 Shadow Audit Model — stores V4 pipeline output alongside V3 results.

While V4 is under validation, every V3 audit triggers a shadow V4 run.
V3 still serves the user-visible response. V4 output is stored here only,
so we can compare V3 vs V4 offline before flipping the default.

Keyed by project_audit_id so each shadow row corresponds 1:1 with a V3 audit.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, JSON, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class AuditV4Shadow(Base):
    """Shadow-run output of the V4 pipeline for a given V3 audit.

    One row per successful V3 audit while the feature flag is on.
    v4_output holds the full structured V4 payload (graph stats,
    importance, patterns, ownership). latency_ms and errors surface
    per-stage observability.
    """

    __tablename__ = "audit_v4_shadow"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link back to the V3 audit this shadow corresponds to
    project_audit_id = Column(
        UUID(as_uuid=True),
        ForeignKey("project_audits.id", ondelete="CASCADE"),
        nullable=True,  # nullable so shadow survives audit deletion during dev
        index=True,
    )

    # Repo context (duplicated from project_audits for easy querying)
    repo_url = Column(String, nullable=False, index=True)
    commit_sha = Column(String(40), nullable=True)
    applicant_username = Column(String, nullable=True)

    # V4 pipeline output (full structured payload)
    v4_output = Column(JSON, nullable=False)

    # Observability
    latency_ms = Column(JSON, nullable=True)        # {tarball, graph, importance, patterns, ownership, total}
    errors = Column(JSON, nullable=True)            # list[str] of non-fatal stage errors
    pipeline_version = Column(String, default="v4-phase1")

    # Outcome flag — true if all major stages succeeded (graph + importance at minimum)
    succeeded = Column(Integer, default=1)          # 0/1 as int for simple filtering

    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_audit_v4_shadow_repo_commit", "repo_url", "commit_sha"),
        Index("ix_audit_v4_shadow_created_at", "created_at"),
    )
