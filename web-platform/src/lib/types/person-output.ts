/**
 * PersonScore types — mirrors `schema/person_output.py` in the algo repo.
 *
 * Phase 4.1 + 4.2 ship the python pieces; this file is the matching
 * frontend contract for `/p/[username]` rendering.
 */

import type { RepoTierV4 } from './v4-output';

export type CalibrationLabel =
    | 'wrapper'
    | 'mid-glue'
    | 'senior-infra'
    | 'deep-tech'
    | 'edge-case';

export interface PersonRepoSummary {
    repo_url: string;
    repo_score: number | null;
    repo_tier: RepoTierV4 | null;
    authorship_percent: number;
    age_years: number;
    stars: number;
    forks: number;
    dependent_count: number | null;
    primary_language: string | null;
    discipline: string | null;
    is_owner: boolean;
    last_commit_at: string | null;
    weight_authorship: number | null;
    weight_recency: number | null;
    weight_impact: number | null;
    weight_combined: number | null;
    skipped: boolean;
    skip_reason: string | null;
}

export interface PersonScoreBreakdown {
    weighted_score_sum: number;
    weight_sum: number;
    repo_count_total: number;
    repo_count_included: number;
    repo_count_skipped: number;
    top_repo_url: string | null;
}

export interface ReachScoreBreakdown {
    total_stars: number;
    total_forks: number;
    total_dependents: number | null;
    popular_repo_count: number;
}

export interface TopContribution {
    pr_url: string;
    pr_title: string;
    recipient_repo: string;
    recipient_stars: number;
    age_years: number;
}

export interface OssContributionSummary {
    contribution_score: number;
    total_merged_prs: number;
    unique_orgs: number;
    total_recipient_stars: number;
    top_contributions: TopContribution[];
    errors: string[];
}

export interface SkillBadge {
    skill_id: string;
    repo_count: number;
}

export interface PersonScore {
    schema_version: string;
    formula_version: string;
    computed_at: string;
    github_username: string;
    person_score: number | null;
    reach_score: number | null;
    insufficient_data: boolean;
    person_breakdown: PersonScoreBreakdown | null;
    reach_breakdown: ReachScoreBreakdown | null;
    repos: PersonRepoSummary[];
    primary_language: string | null;
    primary_discipline: string | null;
    cohort_key: string | null;
    cohort_percentile: number | null;
    cohort_size: number | null;
    oss_contributions?: OssContributionSummary | null;
    skills?: SkillBadge[];
}
