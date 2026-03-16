'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

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
}

interface ProjectShowcaseCardProps {
    project: ProjectProps;
    onSelect?: (project: ProjectProps) => void;
}

const tierConfig: Record<string, { color: string; border: string; bg: string; text: string }> = {
    ELITE: { color: '#a855f7', border: 'border-purple-500/30', bg: 'bg-purple-500/[0.03]', text: 'text-purple-400' },
    ADVANCED: { color: '#3b82f6', border: 'border-blue-500/30', bg: 'bg-blue-500/[0.03]', text: 'text-blue-400' },
    INTERMEDIATE: { color: '#10b981', border: 'border-emerald-500/30', bg: 'bg-emerald-500/[0.03]', text: 'text-emerald-400' },
    BASIC: { color: '#737373', border: 'border-neutral-500/30', bg: 'bg-neutral-500/[0.03]', text: 'text-neutral-400' },
};

const langColors: Record<string, string> = {
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

export function ProjectShowcaseCard({ project, onSelect }: ProjectShowcaseCardProps) {
    const tier = project.tier?.toUpperCase() || 'BASIC';
    const config = tierConfig[tier] || tierConfig.BASIC;

    const verifiedCount = project.verifiedFeatures.filter(
        (f) => f.status === 'VERIFIED' || f.status === 'COMPLEX'
    ).length;

    const languages = project.stack.languages.slice(0, 3);
    const frameworks = project.stack.frameworks.slice(0, 3);

    const circumference = 2 * Math.PI * 22;
    const progress = Math.min((project.score || 0) / 100, 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => onSelect?.(project)}
            className={cn(
                'rounded-lg border p-5 cursor-pointer transition-all duration-200',
                'hover:shadow-sm',
                config.bg,
                `hover:${config.border}`,
            )}
            style={{ borderTop: `3px solid ${config.color}` }}
        >
            {/* Top Row: Score ring + project info */}
            <div className="flex items-start gap-4 mb-4">
                <div className="relative w-14 h-14 shrink-0">
                    <svg width="56" height="56" viewBox="0 0 56 56">
                        <circle
                            cx="28"
                            cy="28"
                            r="22"
                            fill="none"
                            stroke="var(--border)"
                            strokeWidth="3"
                        />
                        <circle
                            cx="28"
                            cy="28"
                            r="22"
                            fill="none"
                            stroke={config.color}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - progress)}
                            transform="rotate(-90 28 28)"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span
                            className="text-sm font-bold font-mono"
                            style={{ color: config.color }}
                        >
                            {Math.round(project.score || 0)}
                        </span>
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-base font-medium truncate">
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
                    <div className="flex items-center gap-2 mt-1">
                        <Badge
                            variant="outline"
                            className={cn('text-[10px] uppercase tracking-wider px-1.5 py-0', config.text)}
                        >
                            {tier}
                        </Badge>
                        {project.discipline && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                {project.discipline}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Middle Row: Languages + Frameworks */}
            <div className="flex items-center flex-wrap gap-3 mb-4">
                {languages.map((lang) => (
                    <span key={lang} className="flex items-center gap-1.5">
                        <span
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: langColors[lang] || '#6b7280' }}
                        />
                        <span className="text-xs text-muted-foreground">{lang}</span>
                    </span>
                ))}
                {frameworks.map((fw) => (
                    <Badge key={fw} variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                        {fw}
                    </Badge>
                ))}
            </div>

            {/* Bottom Row: Verified count + Authorship bar */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {verifiedCount} features verified
                </span>
                <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${project.authorship}%` }}
                        />
                    </div>
                    <span className="font-mono text-[11px]">{project.authorship}%</span>
                </div>
            </div>
        </motion.div>
    );
}
