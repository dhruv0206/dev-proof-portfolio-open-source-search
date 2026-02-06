-- Migration: Create audit_cache table
-- Purpose: Cache audit results by repo+commit for consistent scoring
-- Run this on your PostgreSQL database

CREATE TABLE IF NOT EXISTS audit_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache Key
    repo_url VARCHAR NOT NULL,
    commit_sha VARCHAR(40) NOT NULL,
    
    -- Cached Result
    tds_score FLOAT NOT NULL,
    complexity_tier VARCHAR NOT NULL,
    audit_report JSONB NOT NULL,
    stack JSONB NOT NULL,
    authorship FLOAT NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique composite index on (repo_url, commit_sha)
CREATE UNIQUE INDEX IF NOT EXISTS ix_audit_cache_repo_commit 
ON audit_cache(repo_url, commit_sha);

-- Create index on repo_url for faster lookups
CREATE INDEX IF NOT EXISTS ix_audit_cache_repo_url 
ON audit_cache(repo_url);

-- Comment
COMMENT ON TABLE audit_cache IS 'Caches audit results by repository and commit SHA to eliminate AI variance';
