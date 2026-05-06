'use client';

import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { V4Bundle } from '@/lib/types/v4-output';

export interface VerifiedFeature {
    feature: string;
    status: 'VERIFIED' | 'Wrapper' | 'Unverified' | 'COMPLEX';
    evidence_file?: string;
    tier?: 'TIER_1_UI' | 'TIER_2_LOGIC' | 'TIER_3_DEEP';
    feature_type?: string;
}

export interface ScoreBreakdown {
    feature_score: number;
    architecture_score: number;
    intent_score: number;
    forensics_score: number;
    scoring_version: number;
}

export interface ForensicsData {
    insufficient_data: boolean;
    commit_count?: number;
    sessions?: { count: number; avg_duration_mins: number; per_week: number };
    fix_ratio?: number;
    message_quality?: number;
    evolution_mix?: { add: number; refactor: number; delete: number };
    time_spread_reasonable?: boolean;
}

export interface ProjectProps {
    name: string;
    repoUrl: string;
    authorship: number;
    score?: number;
    tier?: string;
    recommendations?: string[];
    stack: { languages: string[]; frameworks: string[]; libs: string[] };
    verifiedFeatures: VerifiedFeature[];
    scoringVersion?: number;
    discipline?: string;
    forensicsData?: ForensicsData;
    scoreBreakdown?: ScoreBreakdown;
    v4?: V4Bundle;
}

interface ProjectShowcaseCardProps {
    project: ProjectProps;
    onSelect?: (project: ProjectProps) => void;
}

const CLAY = '#CC785C';
const CORNER = 'rgba(255,255,255,0.18)';

const langDots: Record<string, string> = {
    Python: '#3572A5',
    TypeScript: '#3178C6',
    JavaScript: '#F7DF1E',
    Rust: '#DEA584',
    Go: '#00ADD8',
    Java: '#B07219',
    'C++': '#F34B7D',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
};

function BracketCorner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
    const base: React.CSSProperties = {
        position: 'absolute',
        width: 10,
        height: 10,
        pointerEvents: 'none',
        borderColor: CORNER,
        borderStyle: 'solid',
        borderWidth: 0,
    };
    const map = {
        tl: { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1 },
        tr: { top: 0, right: 0, borderTopWidth: 1, borderRightWidth: 1 },
        bl: { bottom: 0, left: 0, borderBottomWidth: 1, borderLeftWidth: 1 },
        br: { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1 },
    };
    return <span style={{ ...base, ...map[position] }} />;
}

export function ProjectShowcaseCard({ project, onSelect }: ProjectShowcaseCardProps) {
    const hasV4 = !!project.v4?.output;
    const displayScore = project.v4?.output?.repo_score ?? project.score ?? 0;
    const tier = project.tier?.toUpperCase() || 'BASIC';

    const verifiedCount = project.verifiedFeatures.filter(
        (f) => f.status === 'VERIFIED' || f.status === 'COMPLEX'
    ).length;

    const languages = project.stack.languages.slice(0, 3);
    const frameworks = project.stack.frameworks.slice(0, 3);

    const circumference = 2 * Math.PI * 22;
    const progress = Math.min(displayScore / 100, 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => onSelect?.(project)}
            whileHover={{ background: 'rgba(255,255,255,0.035)' }}
            className={cn(
                'relative cursor-pointer transition-colors duration-200',
                'p-7',
            )}
            style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <BracketCorner position="tl" />
            <BracketCorner position="tr" />
            <BracketCorner position="bl" />
            <BracketCorner position="br" />

            {/* Corner identifiers in the bracket gaps */}
            <div
                className="absolute flex justify-between font-mono"
                style={{
                    top: 8,
                    left: 32,
                    right: 32,
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    color: '#666',
                    textTransform: 'uppercase',
                }}
            >
                <span>repo</span>
                <span>tier · {tier.toLowerCase()}</span>
            </div>
            <div
                className="absolute flex justify-between font-mono"
                style={{
                    bottom: 8,
                    left: 32,
                    right: 32,
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    color: '#666',
                    textTransform: 'uppercase',
                }}
            >
                <span style={{ color: hasV4 ? CLAY : '#666' }}>
                    ● {hasV4 ? 'audited · v4' : 'audited'}
                </span>
                <span>auth · {project.authorship}%</span>
            </div>

            {/* Body — sits inside the bracket frame */}
            <div className="pt-4 pb-4">
                {/* Top: score ring + project info */}
                <div className="flex items-start gap-5 mb-5">
                    {/* Score ring — Clay */}
                    <div className="relative w-16 h-16 shrink-0">
                        <svg width="64" height="64" viewBox="0 0 56 56">
                            <circle
                                cx="28"
                                cy="28"
                                r="22"
                                fill="none"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="2.5"
                            />
                            <circle
                                cx="28"
                                cy="28"
                                r="22"
                                fill="none"
                                stroke={CLAY}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference * (1 - progress)}
                                transform="rotate(-90 28 28)"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span
                                className="font-mono tabular-nums"
                                style={{
                                    color: CLAY,
                                    fontSize: 18,
                                    fontWeight: 500,
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {Math.round(displayScore)}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Repo headline — uppercase mono caps */}
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className="font-mono uppercase tracking-wide truncate"
                                style={{
                                    fontSize: 16,
                                    color: '#EDEDED',
                                    letterSpacing: '0.02em',
                                    fontWeight: 500,
                                }}
                            >
                                {project.name}
                            </span>
                            <a
                                href={project.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </div>

                        {/* Discipline · score axis sub-row */}
                        {project.discipline && (
                            <div
                                className="font-mono"
                                style={{
                                    fontSize: 11,
                                    color: '#A1A1A1',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                {project.discipline.toLowerCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hairline divider */}
                <div className="h-px bg-border my-4" />

                {/* Languages + Frameworks row */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4">
                    {languages.map((lang) => (
                        <span key={lang} className="flex items-center gap-1.5">
                            <span
                                className="inline-block w-1.5 h-1.5"
                                style={{ backgroundColor: langDots[lang] || '#6b7280' }}
                            />
                            <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wide">
                                {lang}
                            </span>
                        </span>
                    ))}
                    {frameworks.map((fw) => (
                        <span
                            key={fw}
                            className="font-mono text-[10px] text-muted-foreground"
                            style={{
                                letterSpacing: '0.04em',
                                padding: '2px 6px',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}
                        >
                            [{fw.toLowerCase()}]
                        </span>
                    ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-xs">
                    <span
                        className="font-mono"
                        style={{
                            color: '#A1A1A1',
                            fontSize: 11,
                            letterSpacing: '0.04em',
                        }}
                    >
                        <span style={{ color: CLAY }}>●</span>{' '}
                        <span className="tabular-nums">{verifiedCount}</span> features verified
                    </span>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-20 h-px"
                            style={{ background: 'rgba(255,255,255,0.08)', height: 2 }}
                        >
                            <div
                                className="h-full"
                                style={{ width: `${project.authorship}%`, background: CLAY }}
                            />
                        </div>
                        <span
                            className="font-mono tabular-nums"
                            style={{ fontSize: 11, color: '#A1A1A1' }}
                        >
                            {project.authorship}%
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
