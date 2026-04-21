"""V4 Tier-1 Cache Model — applicant-agnostic LLM stage outputs.

Stores tagger_result + map_result keyed on (repo_url, code_hash) so a fresh
applicant auditing the same repo can skip the expensive Gemini stages.
See ``audit_v4_cache.py`` for the tier-2 (applicant-specific) cache.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, JSON, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class AuditV4CodeCache(Base):
    __tablename__ = "audit_v4_code_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    repo_url = Column(String, nullable=False)
    code_hash = Column(String(40), nullable=False)

    tagger_result = Column(JSON, nullable=False)
    map_result = Column(JSON, nullable=False)

    pipeline_version = Column(String, default="v4.0")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index(
            "ix_audit_v4_code_cache_repo_hash",
            "repo_url", "code_hash", unique=True,
        ),
        Index("ix_audit_v4_code_cache_expires_at", "expires_at"),
    )
