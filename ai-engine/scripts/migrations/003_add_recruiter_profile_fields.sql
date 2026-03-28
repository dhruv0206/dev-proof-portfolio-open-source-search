-- Migration 003: Add recruiter-facing profile fields to user table
-- Run against the PostgreSQL database used by the ai-engine

-- Hiring profile fields
ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "openToWork" BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS "preferredRoles" JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS "workType" VARCHAR DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "yearsOfExperience" VARCHAR DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "timezone" VARCHAR DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "linkedinUrl" VARCHAR DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS "workExperience" JSONB DEFAULT '[]'::jsonb;

-- Index for recruiter search: find open-to-work + discoverable developers
CREATE INDEX IF NOT EXISTS ix_user_open_to_work
    ON "user"("openToWork") WHERE "openToWork" = TRUE AND "discoverable" = TRUE;
