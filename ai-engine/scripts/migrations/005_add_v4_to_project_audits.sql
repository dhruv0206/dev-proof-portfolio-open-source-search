-- Migration: Add V4 output columns to project_audits
-- Purpose: Persist V4 pipeline results alongside V3 so user-visible surfaces
--          can display V4 scores. All columns nullable — V4 is still shadow
--          mode on existing audits, and old rows have no V4 data.
--
-- Ordering vs. legacy "scoring_version": existing column encodes V1/V2 of the
-- old pipeline. V4 gets its own dedicated fields so both can coexist during
-- the shadow-then-flip rollout.

ALTER TABLE project_audits
    ADD COLUMN IF NOT EXISTS v4_score FLOAT,
    ADD COLUMN IF NOT EXISTS v4_tier VARCHAR,
    ADD COLUMN IF NOT EXISTS v4_output JSONB,
    ADD COLUMN IF NOT EXISTS v4_audited_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN project_audits.v4_score IS
  'V4 pipeline final score (0-100). Null if V4 has not run for this audit.';
COMMENT ON COLUMN project_audits.v4_tier IS
  'V4 tier label: TIER_1_SURFACE | TIER_2_LOGIC | TIER_3_DEEP.';
COMMENT ON COLUMN project_audits.v4_output IS
  'Full V4Output JSON payload (claims, architecture, score_breakdown, etc.).';
COMMENT ON COLUMN project_audits.v4_audited_at IS
  'When the V4 pipeline completed for this row. Usually after audited_at because V4 runs in a background shadow task.';
