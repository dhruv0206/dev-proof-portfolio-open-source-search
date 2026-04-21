-- Migration: Create V4 two-tier cache tables
-- Purpose: Cache V4 audit outputs to eliminate redundant Gemini calls.
--
-- Tier 1 (audit_v4_code_cache): applicant-agnostic intermediate results
--   Key: (repo_url, code_hash)
--   Stores: tagger_result + map_result JSON blobs
--   Purpose: skip the expensive LLM stages when a different applicant
--            audits the same repo at the same commit
--
-- Tier 2 (audit_v4_cache): applicant-specific final output
--   Key: (repo_url, code_hash, applicant_username)
--   Stores: full V4Output JSON
--   Purpose: instant return when the same applicant re-audits
--
-- These replace the broken-by-design shared cache pattern where user A's
-- ownership/authorship/forensics scores were served to user B.

CREATE TABLE IF NOT EXISTS audit_v4_code_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Cache Key (applicant-agnostic)
    repo_url VARCHAR NOT NULL,
    code_hash VARCHAR(40) NOT NULL,

    -- Cached intermediate results
    tagger_result JSONB NOT NULL,
    map_result JSONB NOT NULL,

    -- Metadata
    pipeline_version VARCHAR DEFAULT 'v4.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_audit_v4_code_cache_repo_hash
ON audit_v4_code_cache(repo_url, code_hash);

CREATE INDEX IF NOT EXISTS ix_audit_v4_code_cache_expires_at
ON audit_v4_code_cache(expires_at);

COMMENT ON TABLE audit_v4_code_cache IS
  'Tier-1 V4 cache: applicant-agnostic LLM stage outputs (tagger + map). Key = (repo_url, code_hash).';


CREATE TABLE IF NOT EXISTS audit_v4_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Cache Key (applicant-specific)
    repo_url VARCHAR NOT NULL,
    code_hash VARCHAR(40) NOT NULL,
    applicant_username VARCHAR NOT NULL,

    -- Cached full output
    v4_output JSONB NOT NULL,

    -- Metadata
    pipeline_version VARCHAR DEFAULT 'v4.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_audit_v4_cache_repo_hash_user
ON audit_v4_cache(repo_url, code_hash, applicant_username);

CREATE INDEX IF NOT EXISTS ix_audit_v4_cache_expires_at
ON audit_v4_cache(expires_at);

COMMENT ON TABLE audit_v4_cache IS
  'Tier-2 V4 cache: applicant-specific full V4Output. Key = (repo_url, code_hash, applicant_username).';
