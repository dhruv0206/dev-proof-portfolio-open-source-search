-- Migration 002: Add V2 scoring columns for intent signals, forensics, discipline
-- Run against the PostgreSQL database used by the ai-engine

-- Add V2 columns to project_audits
ALTER TABLE project_audits
    ADD COLUMN IF NOT EXISTS forensics_data JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS intent_signals JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS scoring_version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS discipline VARCHAR DEFAULT NULL;

-- Add V2 columns to audit_cache
ALTER TABLE audit_cache
    ADD COLUMN IF NOT EXISTS forensics_data JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS intent_signals JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS scoring_version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS discipline VARCHAR DEFAULT NULL;

-- Index for filtering by scoring version (useful for analytics)
CREATE INDEX IF NOT EXISTS ix_project_audits_scoring_version
    ON project_audits(scoring_version);

CREATE INDEX IF NOT EXISTS ix_project_audits_discipline
    ON project_audits(discipline);
