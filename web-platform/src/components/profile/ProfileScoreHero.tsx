'use client';

import { BentoCard, BentoLabel } from '@/components/dashboard/BentoCard';
import { ScoreRadial } from '@/components/shared/ScoreRadial';
import { ScoreBreakdownChart } from '@/components/shared/ScoreBreakdownChart';
import { Badge } from '@/components/ui/badge';
import { Briefcase, FolderCheck } from 'lucide-react';

interface ProfileScoreHeroProps {
    bestProject: {
        name: string;
        score?: number;
        tier?: string;
        discipline?: string;
        scoreBreakdown?: {
            feature_score: number;
            architecture_score: number;
            intent_score: number;
            forensics_score: number;
        };
    } | null;
    disciplines: string[];
    projectCount: number;
}

const tierColors: Record<string, string> = {
    ELITE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    ADVANCED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    INTERMEDIATE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    BASIC: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
};

function getTierColor(tier?: string): string {
    return tierColors[tier?.toUpperCase() ?? ''] ?? tierColors.BASIC;
}

export function ProfileScoreHero({ bestProject, disciplines, projectCount }: ProfileScoreHeroProps) {
    if (!bestProject) return null;

    const primaryDiscipline = bestProject.discipline ?? disciplines[0];
    const otherDisciplines = disciplines.filter((d) => d !== primaryDiscipline);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Score Radial */}
            <div className="lg:col-span-4">
                <BentoCard highlight delay={0} className="h-full flex flex-col items-center justify-center">
                    <ScoreRadial
                        score={bestProject.score ?? 0}
                        tier={bestProject.tier ?? 'BASIC'}
                        label="Best TDS"
                    />
                </BentoCard>
            </div>

            {/* Center: Radar Chart */}
            <div className="lg:col-span-4">
                <BentoCard delay={0.05} className="h-full">
                    <BentoLabel>
                        {bestProject.name.length > 30
                            ? bestProject.name.slice(0, 30) + '...'
                            : bestProject.name}
                    </BentoLabel>
                    {bestProject.scoreBreakdown && (
                        <div className="mt-2">
                            <ScoreBreakdownChart
                                features={bestProject.scoreBreakdown.feature_score}
                                architecture={bestProject.scoreBreakdown.architecture_score}
                                intent={bestProject.scoreBreakdown.intent_score}
                                forensics={bestProject.scoreBreakdown.forensics_score}
                            />
                        </div>
                    )}
                </BentoCard>
            </div>

            {/* Right: Overview */}
            <div className="lg:col-span-4">
                <BentoCard delay={0.1} className="h-full">
                    <BentoLabel>Overview</BentoLabel>

                    <div className="mt-4 flex flex-col gap-4">
                        {primaryDiscipline && (
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <Badge
                                    variant="outline"
                                    className={`text-sm px-3 py-1 ${getTierColor(bestProject.tier)}`}
                                >
                                    {primaryDiscipline}
                                </Badge>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <FolderCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground font-medium">
                                {projectCount} Verified Project{projectCount !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {otherDisciplines.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {otherDisciplines.map((discipline) => (
                                    <Badge
                                        key={discipline}
                                        variant="outline"
                                        className={`text-xs ${getTierColor(bestProject.tier)}`}
                                    >
                                        {discipline}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </BentoCard>
            </div>
        </div>
    );
}
