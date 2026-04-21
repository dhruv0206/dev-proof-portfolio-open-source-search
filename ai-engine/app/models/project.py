import uuid
from sqlalchemy import Column, String, Boolean, Float, ForeignKey, Integer, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import enum

from app.database import Base

class TagCategory(str, enum.Enum):
    LANGUAGE = "LANGUAGE"
    FRAMEWORK = "FRAMEWORK"
    LIBRARY = "LIBRARY"
    DOMAIN = "DOMAIN"
    CONCEPT = "CONCEPT"

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, index=True) # BetterAuth User ID (String)
    repo_url = Column(String, nullable=False)
    repo_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    # Verification Status
    is_verified = Column(Boolean, default=False)
    verification_status = Column(String, default="PENDING") # PENDING, VERIFIED, REJECTED
    
    # Stats
    authorship_percent = Column(Float, default=0.0)
    stars = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, onupdate=lambda: datetime.now(timezone.utc))

    # Relations
    audit = relationship("ProjectAudit", back_populates="project", uselist=False, cascade="all, delete-orphan")
    tags = relationship("TechTag", back_populates="project", cascade="all, delete-orphan")

class ProjectAudit(Base):
    __tablename__ = "project_audits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), unique=True)

    # The Hidden Score
    tds_score = Column(Float, default=0.0) # Technical Depth Score
    complexity_tier = Column(String, nullable=True) # Basic, Intermediate...

    # The Evidence Report (JSON from Gemini)
    audit_report = Column(JSON, nullable=True)

    # V2 Fields
    forensics_data = Column(JSON, nullable=True)   # Commit forensics analysis
    intent_signals = Column(JSON, nullable=True)   # Developer intent signals
    scoring_version = Column(Integer, default=1)   # 1=legacy, 2=v2
    discipline = Column(String, nullable=True)     # Detected discipline

    # V4 Fields — populated after the V4 shadow task completes.
    # v4_output holds the full V4Output JSON (claims, architecture, breakdown).
    v4_score = Column(Float, nullable=True)
    v4_tier = Column(String, nullable=True)
    v4_output = Column(JSON, nullable=True)
    v4_audited_at = Column(DateTime, nullable=True)

    audited_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relations
    project = relationship("Project", back_populates="audit")

class TechTag(Base):
    __tablename__ = "tech_tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    
    name = Column(String, index=True)
    category = Column(SQLEnum(TagCategory), nullable=False)
    confidence = Column(Float, default=1.0)
    
    # Relations
    project = relationship("Project", back_populates="tags")
