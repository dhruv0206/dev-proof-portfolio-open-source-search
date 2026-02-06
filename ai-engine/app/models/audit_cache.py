"""Audit Cache Model - Stores audit results keyed by repo+commit."""
import uuid
from sqlalchemy import Column, String, Float, JSON, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone

from app.database import Base


class AuditCache(Base):
    """
    Caches audit results by repository and commit SHA.
    
    Key: (repo_url, commit_sha)
    Value: Full audit result JSON
    
    This eliminates variance - same commit version = same score always.
    """
    __tablename__ = "audit_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Cache Key
    repo_url = Column(String, nullable=False, index=True)
    commit_sha = Column(String(40), nullable=False)  # Git SHA is 40 chars
    
    # Cached Result
    tds_score = Column(Float, nullable=False)
    complexity_tier = Column(String, nullable=False)
    audit_report = Column(JSON, nullable=False)
    stack = Column(JSON, nullable=False)
    authorship = Column(Float, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Composite unique constraint on (repo_url, commit_sha)
    __table_args__ = (
        Index('ix_audit_cache_repo_commit', 'repo_url', 'commit_sha', unique=True),
    )
