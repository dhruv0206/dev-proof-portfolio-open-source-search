"""V4 Tier-2 Cache Model — applicant-specific full V4Output.

Stores the complete V4Output JSON keyed on
(repo_url, code_hash, applicant_username). Same user re-clicking "audit" =
instant return. Different users get their own forensics/ownership scores.
See ``audit_v4_code_cache.py`` for the shared tier-1 intermediate cache.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, JSON, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class AuditV4Cache(Base):
    __tablename__ = "audit_v4_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    repo_url = Column(String, nullable=False)
    code_hash = Column(String(40), nullable=False)
    applicant_username = Column(String, nullable=False)

    v4_output = Column(JSON, nullable=False)

    pipeline_version = Column(String, default="v4.0")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index(
            "ix_audit_v4_cache_repo_hash_user",
            "repo_url", "code_hash", "applicant_username", unique=True,
        ),
        Index("ix_audit_v4_cache_expires_at", "expires_at"),
    )
