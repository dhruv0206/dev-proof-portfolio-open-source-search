'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScoreBreakdownChart } from '@/components/shared/ScoreBreakdownChart';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ExternalLink, GitCommit } from 'lucide-react';
import type { ProjectProps, VerifiedFeature } from '@/components/shared/ProjectShowcaseCard';
import { ArchitecturePatternsSection } from '@/components/shared/ArchitecturePatternsSection';
import { SkillsDemonstratedSection } from '@/components/shared/SkillsDemonstratedSection';
import { VerifiedClaimsSection } from '@/components/shared/VerifiedClaimsSection';

interface ProjectDetailPanelProps {
    project: ProjectProps | null;
    open: boolean;
    onClose: () => void;
}

const tierConfig: Record<string, { color: string; text: string; bg: string }> = {
    ELITE: { color: '#a855f7', text: 'text-purple-400', bg: 'rgba(168, 85, 247, 0.08)' },
    ADVANCED: { color: '#3b82f6', text: 'text-blue-400', bg: 'rgba(59, 130, 246, 0.08)' },
    INTERMEDIATE: { color: '#10b981', text: 'text-emerald-400', bg: 'rgba(16, 185, 129, 0.08)' },
    BASIC: { color: '#737373', text: 'text-neutral-400', bg: 'rgba(115, 115, 115, 0.08)' },
};

const tierLabels: Record<string, string> = {
    TIER_3_DEEP: 'Deep Tech',
    TIER_2_LOGIC: 'Core Logic',
    TIER_1_UI: 'Essentials',
};

function groupFeatures(features: VerifiedFeature[]) {
    const groups: { label: string; key: string; items: VerifiedFeature[] }[] = [
        { label: 'Deep Tech', key: 'TIER_3_DEEP', items: [] },
        { label: 'Core Logic', key: 'TIER_2_LOGIC', items: [] },
        { label: 'Essentials', key: 'TIER_1_UI', items: [] },
        { label: 'Unverified', key: 'UNVERIFIED', items: [] },
    ];

    for (const f of features) {
        if (f.status === 'Unverified') {
            groups[3].items.push(f);
        } else if (f.tier === 'TIER_3_DEEP') {
            groups[0].items.push(f);
        } else if (f.tier === 'TIER_2_LOGIC') {
            groups[1].items.push(f);
        } else {
            groups[2].items.push(f);
        }
    }

    return groups.filter((g) => g.items.length > 0);
}

export function ProjectDetailPanel({ project, open, onClose }: ProjectDetailPanelProps) {
    if (!project) return null;

    const tier = project.tier?.toUpperCase() || 'BASIC';
    const config = tierConfig[tier] || tierConfig.BASIC;
    const featureGroups = groupFeatures(project.verifiedFeatures);
    const forensics = project.forensicsData;
    const breakdown = project.scoreBreakdown;

    // V4 data — optional. When present, render two additional sections
    // (Architecture + Skills) that V3 can't produce, and use V4's score +
    // breakdown in place of V3's.
    const v4 = project.v4?.output;

    const displayScore = v4?.repo_score ?? project.score ?? 0;
    const displayBreakdown = v4
        ? {
            feature_score: v4.score_breakdown.features.score,
            architecture_score: v4.score_breakdown.architecture.score,
            intent_score: v4.score_breakdown.intent_and_standards.score,
            forensics_score: v4.score_breakdown.forensics.score,
        }
        : breakdown;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                {project.name}
                                <a
                                    href={project.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge
                                    variant="outline"
                                    className="text-[10px] uppercase tracking-wider px-1.5 py-0"
                                    style={{
                                        color: config.color,
                                        borderColor: `${config.color}40`,
                                        backgroundColor: config.bg,
                                    }}
                                >
                                    {tier}
                                </Badge>
                                <span
                                    className="text-lg font-bold font-mono"
                                    style={{ color: config.color }}
                                >
                                    {Math.round(displayScore)}
                                </span>
                                {v4 && (
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] uppercase tracking-wider px-1.5 py-0 text-emerald-400 border-emerald-500/30"
                                    >
                                        V4
                                    </Badge>
                                )}
                                {project.discipline && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                        {project.discipline}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Section 1: Score Breakdown — V4 values when present, else V3 */}
                    {displayBreakdown && (
                        <section>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                Score Breakdown
                            </h3>
                            <div className="h-[250px]">
                                <ScoreBreakdownChart
                                    features={displayBreakdown.feature_score}
                                    architecture={displayBreakdown.architecture_score}
                                    intent={displayBreakdown.intent_score}
                                    forensics={displayBreakdown.forensics_score}
                                />
                            </div>
                        </section>
                    )}

                    {/* Section 2: Verified Features
                        V4 path reads from v4.claims directly to surface the
                        full payload (feature_type, cross_file, tier_reasoning,
                        full evidence list). Falls back to the legacy V3-shape
                        renderer for projects audited before the V4 flip. */}
                    {v4 && v4.claims && v4.claims.length > 0 ? (
                        <VerifiedClaimsSection claims={v4.claims} />
                    ) : project.verifiedFeatures.length > 0 ? (
                        <section>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                Verified Features
                            </h3>
                            <div className="space-y-4">
                                {featureGroups.map((group) => (
                                    <div key={group.key}>
                                        <p className="text-xs font-medium text-muted-foreground mb-1.5">
                                            {group.label} ({group.items.length})
                                        </p>
                                        <ul className="space-y-1">
                                            {group.items.map((f, i) => (
                                                <li
                                                    key={`${group.key}-${i}`}
                                                    className="flex items-start gap-2 text-sm"
                                                >
                                                    {f.status === 'Unverified' ? (
                                                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                                                    ) : (
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                                    )}
                                                    <span className="flex-1">{f.feature}</span>
                                                    {f.evidence_file && (
                                                        <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">
                                                            {f.evidence_file}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {/* V4-exclusive: Architecture Patterns */}
                    {v4 && (
                        <ArchitecturePatternsSection
                            patterns={v4.architecture?.detected_patterns ?? []}
                        />
                    )}

                    {/* V4-exclusive: Skills Demonstrated */}
                    {v4 && <SkillsDemonstratedSection claims={v4.claims ?? []} />}

                    {/* Section 3: Forensics */}
                    {forensics && !forensics.insufficient_data && (
                        <section>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                Forensics
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {forensics.commit_count != null && (
                                    <Badge variant="secondary" className="text-xs gap-1">
                                        <GitCommit className="h-3 w-3" />
                                        {forensics.commit_count} commits
                                    </Badge>
                                )}
                                {forensics.sessions && (
                                    <Badge variant="secondary" className="text-xs">
                                        {forensics.sessions.count} sessions
                                    </Badge>
                                )}
                                {forensics.fix_ratio != null && (
                                    <Badge variant="secondary" className="text-xs">
                                        {Math.round(forensics.fix_ratio * 100)}% fixes
                                    </Badge>
                                )}
                                {forensics.message_quality != null && (
                                    <Badge variant="secondary" className="text-xs">
                                        {forensics.message_quality}/10 msg quality
                                    </Badge>
                                )}
                                {forensics.evolution_mix && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{Math.round(forensics.evolution_mix.add * 100)}% add / ~{Math.round(forensics.evolution_mix.refactor * 100)}% refactor / -{Math.round(forensics.evolution_mix.delete * 100)}% delete
                                    </Badge>
                                )}
                                {forensics.time_spread_reasonable != null && (
                                    <Badge
                                        variant="secondary"
                                        className={`text-xs ${forensics.time_spread_reasonable ? 'text-emerald-500' : 'text-amber-500'}`}
                                    >
                                        {forensics.time_spread_reasonable ? 'Natural time spread' : 'Unusual time spread'}
                                    </Badge>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Section 4: Recommendations */}
                    {project.recommendations && project.recommendations.length > 0 && (
                        <section>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                Recommendations
                            </h3>
                            <ul className="list-disc list-inside space-y-1">
                                {project.recommendations.map((rec, i) => (
                                    <li key={i} className="text-sm text-muted-foreground">
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Section 5: Stack */}
                    <section>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">
                            Stack
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                            {project.stack.languages.map((lang) => (
                                <Badge key={lang} variant="outline" className="text-xs">
                                    {lang}
                                </Badge>
                            ))}
                            {project.stack.frameworks.map((fw) => (
                                <Badge key={fw} variant="secondary" className="text-xs">
                                    {fw}
                                </Badge>
                            ))}
                            {project.stack.libs.map((lib) => (
                                <Badge key={lib} variant="secondary" className="text-xs text-muted-foreground">
                                    {lib}
                                </Badge>
                            ))}
                        </div>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export type { ProjectProps };
