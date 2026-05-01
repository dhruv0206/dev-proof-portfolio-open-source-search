/**
 * V4 audit pipeline types — mirrors `schema/v4_output.py` in the algo repo.
 *
 * Extracted from `/dev/v4-debug/page.tsx` so production surfaces
 * (profile, public score, dashboard, detail panels) can share one source of
 * truth for the V4Output shape.
 */

export type RepoTierV4 = 'TIER_1_UI' | 'TIER_2_LOGIC' | 'TIER_3_DEEP';
export type FeatureType = 'WRAPPER' | 'COMPLEX' | 'CUSTOM';
export type SkillDepth = 'BEGINNER' | 'WORKING' | 'PROFICIENT' | 'EXPERT';
/**
 * Architectural layer of a claim's evidence — used by the post-LLM tier cap.
 * UI claims cap at TIER_2_LOGIC because AI can one-shot most UI work; only
 * non-UI Tier 3 unlocks the 90+ score band.
 */
export type ClaimLayer =
    | 'UI'
    | 'APP_LOGIC'
    | 'SERVICE'
    | 'INFRA'
    | 'SYSTEMS';
export type ErrorHandlingMode = 'explicit' | 'partial' | 'absent';
export type PatternArchType = 'STANDARD' | 'ADVANCED';
export type EvidenceRole =
    | 'primary'
    | 'implementation'
    | 'schema'
    | 'test'
    | 'config';

export interface ClaimEvidence {
    file: string;
    lines: [number, number];
    role: EvidenceRole;
}

export interface ClaimSkill {
    skill_id: string;
    depth: SkillDepth;
}

export interface ClaimStandards {
    tests_present: boolean;
    types_strict: boolean;
    error_handling: ErrorHandlingMode;
    security_concerns: string[];
}

export interface Claim {
    claim_id: string;
    feature: string;
    feature_type: FeatureType;
    tier: RepoTierV4;
    tier_reasoning: string;
    evidence: ClaimEvidence[];
    skills_demonstrated: ClaimSkill[];
    standards: ClaimStandards;
    source_functions: string[];
    source_files: string[];
    boilerplate_pct: number;
    domain_specific: boolean;
    creative_solution: boolean;
    authorship_verified: boolean;
    confidence: number;
    cross_file: boolean;
    grouping_signal: string | null;
    /** Architectural layer of evidence files; null on legacy audits before v4.1. */
    layer?: ClaimLayer | null;
    /**
     * True when the post-LLM tier cap downgraded this claim (e.g. UI-only
     * Deep-Tech claim demoted to TIER_2_LOGIC). Surface as a badge so
     * hiring managers see the algorithmic correction.
     */
    layer_capped?: boolean;
    /**
     * True when the SDK-glue cap downgraded this claim — evidence is
     * dominated by external-SDK orchestration (>50% of meaningful lines).
     * Distinct from ``layer_capped`` (which fires on UI-only evidence).
     */
    sdk_glue_capped?: boolean;
    /**
     * External SDK packages detected in this claim's evidence files
     * (e.g. ``['twilio', 'livekit']``). Used for transparency in the UI.
     */
    sdk_packages_used?: string[];
    /**
     * LLM-extracted "Chose X over Y because Z (file:lines)" decisions
     * visible in code or comments. The judgment signal — what hiring
     * managers actually want to see, beyond "this person built X."
     * Empty list is correct when no real tradeoff is visible.
     */
    tradeoffs?: string[];
}

export interface ArchitecturePatternV4 {
    name: string;
    type: PatternArchType;
    files: string[];
}

export interface ScoreComponentData {
    score: number;
    max: number;
}

export interface V4ScoreBreakdown {
    features: ScoreComponentData;
    architecture: ScoreComponentData;
    intent_and_standards: ScoreComponentData;
    forensics: ScoreComponentData;
}

export interface OwnershipComponentData {
    score: number | null;
    weight: number;
}

export interface V4Forensics {
    session_count: number;
    avg_session_duration_mins: number;
    fix_ratio: number;
    message_quality: number;
    time_spread_days: number;
    history_rewritten: boolean;
    insufficient_data: boolean;
}

export interface V4StageLatencies {
    ingest: number;
    skeleton: number;
    tag: number;
    map: number;
    reduce: number;
    verify: number;
}

export interface V4PipelineMeta {
    stage_latencies_ms: V4StageLatencies;
    verification_triggered: boolean;
    degraded_mode: string | null;
    evidence_file_count: number;
    core_set_size: number;
    periphery_size: number;
}

export interface V4OutputData {
    schema_version: string;
    pipeline_version: string;
    audited_at: string;
    repo_url: string;
    commit_sha: string | null;
    applicant_username: string | null;
    repo_score: number;
    repo_tier: RepoTierV4;
    ownership_score: number | null;
    discipline: string;
    authorship_percent: number;
    score_breakdown: V4ScoreBreakdown;
    ownership_breakdown: Record<string, OwnershipComponentData>;
    claims: Claim[];
    architecture: { detected_patterns: ArchitecturePatternV4[] };
    stack: { languages: string[]; frameworks: string[]; libs: string[] };
    forensics: V4Forensics;
    pipeline_meta: V4PipelineMeta;
}

/**
 * Wrapper the backend returns when V4 has completed for a project.
 * ``output`` carries the full ``V4OutputData`` payload.
 */
export interface V4Bundle {
    score: number | null;
    tier: RepoTierV4 | null;
    output: V4OutputData;
    audited_at: string | null;
}

/**
 * Aggregate every skill mentioned across claims into a deduped list,
 * keeping the highest depth seen for each skill_id. Ordering: EXPERT >
 * PROFICIENT > WORKING > BEGINNER — so recruiters see the most signal first.
 */
const DEPTH_RANK: Record<SkillDepth, number> = {
    EXPERT: 3,
    PROFICIENT: 2,
    WORKING: 1,
    BEGINNER: 0,
};

export function aggregateSkills(claims: Claim[]): ClaimSkill[] {
    const byId = new Map<string, ClaimSkill>();
    for (const c of claims) {
        for (const s of c.skills_demonstrated ?? []) {
            const existing = byId.get(s.skill_id);
            if (!existing || DEPTH_RANK[s.depth] > DEPTH_RANK[existing.depth]) {
                byId.set(s.skill_id, s);
            }
        }
    }
    return Array.from(byId.values()).sort(
        (a, b) => DEPTH_RANK[b.depth] - DEPTH_RANK[a.depth],
    );
}
