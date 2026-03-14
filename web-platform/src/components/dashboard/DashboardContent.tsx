'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BentoCard, BentoLabel } from '@/components/dashboard/BentoCard';
import { ScoreRadial } from '@/components/dashboard/ScoreRadial';
import { ScoreBreakdownChart } from '@/components/dashboard/ScoreBreakdownChart';
import { ProjectMiniCard } from '@/components/dashboard/ProjectMiniCard';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import Link from 'next/link';
import {
    CheckCircle2,
    Clock,
    GitFork,
    ArrowRight,
    AlertCircle,
    FolderCode,
    GitPullRequestDraft,
} from 'lucide-react';

interface DashboardStats {
    verifiedPRs: number;
    inProgress: number;
    prSubmitted: number;
    repositories: number;
    projectCount: number;
    bestScore: number;
    avgScore: number;
    recentActivity: Array<{
        id: string;
        type: 'started' | 'submitted' | 'verified';
        issueTitle: string;
        repoName: string;
        timestamp: string;
    }>;
    activeIssues: Array<{
        id: string;
        title: string;
        repoName: string;
        status: string;
        createdAt: string;
    }>;
}

interface ProjectData {
    name: string;
    repoUrl: string;
    score?: number;
    tier?: string;
    discipline?: string;
    authorship: number;
    scoringVersion?: number;
    scoreBreakdown?: {
        feature_score: number;
        architecture_score: number;
        intent_score: number;
        forensics_score: number;
    };
    stack: { languages: string[]; frameworks: string[]; libs: string[] };
}

function StatCell({
    label,
    value,
    icon: Icon,
    color,
    delay,
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    delay: number;
}) {
    return (
        <BentoCard delay={delay}>
            <BentoLabel>{label}</BentoLabel>
            <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-bold font-mono tabular-nums">
                    {value > 0 ? <NumberTicker value={value} delay={delay} /> : '0'}
                </span>
                <Icon className={`h-5 w-5 ${color} mb-1`} />
            </div>
        </BentoCard>
    );
}

export function DashboardContent({ userId }: { userId: string }) {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        async function fetchAll() {
            try {
                const [statsRes, projectsRes] = await Promise.all([
                    fetch(`${API_URL}/api/users/me/stats`, {
                        credentials: 'include',
                        headers: { 'X-User-Id': userId },
                    }),
                    fetch(`${API_URL}/api/users/me/projects`, {
                        credentials: 'include',
                        headers: { 'X-User-Id': userId },
                    }),
                ]);

                if (!statsRes.ok) throw new Error('Failed to fetch stats');
                const statsData = await statsRes.json();
                setStats(statsData);

                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json();
                    setProjects(projectsData.projects || []);
                }
            } catch (err) {
                console.error('Error fetching dashboard:', err);
                setError('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [userId]);

    if (loading) return <DashboardSkeleton />;

    if (error || !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">{error || 'Unable to load dashboard'}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                </Button>
            </div>
        );
    }

    const bestProject = projects.length > 0
        ? projects.reduce((a, b) => ((a.score || 0) >= (b.score || 0) ? a : b))
        : null;
    const breakdown = bestProject?.scoreBreakdown || null;

    return (
        <div className="space-y-5">
            {/* ═══ ROW 1: Hero │ 2x2 Stats │ Radar ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* TDS Score Hero */}
                {bestProject && bestProject.score ? (
                    <BentoCard
                        className="lg:col-span-4 flex items-center justify-center min-h-[280px]"
                        delay={0}
                        highlight
                    >
                        <ScoreRadial
                            score={bestProject.score}
                            tier={bestProject.tier || 'BASIC'}
                            label="Best TDS"
                        />
                    </BentoCard>
                ) : (
                    <BentoCard className="lg:col-span-4 flex flex-col items-center justify-center min-h-[280px] gap-3" delay={0}>
                        <div className="p-4 rounded-full bg-muted">
                            <FolderCode className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                            Add your first project to see your TDS score
                        </p>
                        <Link href="/projects">
                            <Button size="sm">Add Project</Button>
                        </Link>
                    </BentoCard>
                )}

                {/* 2x2 Stats */}
                <div className="lg:col-span-4 grid grid-cols-2 gap-5">
                    <StatCell label="Verified PRs" value={stats.verifiedPRs} icon={CheckCircle2} color="text-emerald-500" delay={0.05} />
                    <StatCell label="In Progress" value={stats.inProgress} icon={Clock} color="text-amber-500" delay={0.08} />
                    <StatCell label="PR Submitted" value={stats.prSubmitted} icon={GitPullRequestDraft} color="text-blue-500" delay={0.1} />
                    <StatCell label="Repositories" value={stats.repositories} icon={GitFork} color="text-purple-500" delay={0.12} />
                </div>

                {/* Radar Chart */}
                <BentoCard className="lg:col-span-4 min-h-[280px] flex flex-col" delay={0.08}>
                    <div className="flex items-center justify-between mb-1">
                        <BentoLabel>Score Breakdown</BentoLabel>
                        {bestProject && (
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                                {bestProject.name}
                            </span>
                        )}
                    </div>
                    {breakdown ? (
                        <div className="flex-1">
                            <ScoreBreakdownChart
                                features={breakdown.feature_score}
                                architecture={breakdown.architecture_score}
                                intent={breakdown.intent_score}
                                forensics={breakdown.forensics_score}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground text-center">
                                Score breakdown available after V2 audit
                            </p>
                        </div>
                    )}
                </BentoCard>
            </div>

            {/* ═══ ROW 2: Quick Stats ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <BentoCard className="flex items-center gap-3" delay={0.12}>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10">
                        <FolderCode className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Projects</p>
                        <p className="text-lg font-bold font-mono">
                            {stats.projectCount > 0 ? <NumberTicker value={stats.projectCount} delay={0.12} /> : '0'}
                        </p>
                    </div>
                </BentoCard>

                <BentoCard className="flex items-center gap-3" delay={0.14}>
                    <div className="p-2.5 rounded-lg bg-blue-500/10">
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Avg Score</p>
                        <p className="text-lg font-bold font-mono">
                            {stats.avgScore > 0 ? (
                                <NumberTicker value={parseFloat(stats.avgScore.toFixed(1))} decimalPlaces={1} delay={0.14} />
                            ) : '0'}
                        </p>
                    </div>
                </BentoCard>

                <BentoCard className="flex items-center gap-3" delay={0.16}>
                    <div className="p-2.5 rounded-lg bg-amber-500/10">
                        <ArrowRight className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Best Score</p>
                        <p className="text-lg font-bold font-mono">
                            {stats.bestScore > 0 ? <NumberTicker value={Math.round(stats.bestScore)} delay={0.16} /> : '0'}
                        </p>
                    </div>
                </BentoCard>

                <BentoCard className="flex items-center gap-3" delay={0.18}>
                    <div className="p-2.5 rounded-lg bg-purple-500/10">
                        <GitFork className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium">Total PRs</p>
                        <p className="text-lg font-bold font-mono">
                            {(stats.verifiedPRs + stats.prSubmitted) > 0 ? (
                                <NumberTicker value={stats.verifiedPRs + stats.prSubmitted} delay={0.18} />
                            ) : '0'}
                        </p>
                    </div>
                </BentoCard>
            </div>

            {/* ═══ ROW 3: Projects + Activity ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <BentoCard className="lg:col-span-7" delay={0.18}>
                    <div className="flex items-center justify-between mb-4">
                        <BentoLabel>Your Projects</BentoLabel>
                        <Link href="/projects">
                            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                                View All <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>

                    {projects.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground mb-4">
                                No projects yet. Import a repo to get your TDS score.
                            </p>
                            <Link href="/projects">
                                <Button size="sm">Add Project</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {projects.slice(0, 5).map((project, i) => (
                                <ProjectMiniCard
                                    key={project.repoUrl}
                                    name={project.name}
                                    score={project.score || 0}
                                    tier={project.tier || 'BASIC'}
                                    discipline={project.discipline || undefined}
                                    languages={project.stack.languages}
                                    index={i}
                                />
                            ))}
                        </div>
                    )}
                </BentoCard>

                <BentoCard className="lg:col-span-5" delay={0.2}>
                    <ActivityTimeline activities={stats.recentActivity} />
                </BentoCard>
            </div>

            {/* ═══ ROW 4: Active Issues ═══ */}
            {stats.activeIssues.length > 0 && (
                <BentoCard delay={0.22}>
                    <div className="flex items-center justify-between mb-4">
                        <BentoLabel>Active Issues</BentoLabel>
                        <Link href="/issues">
                            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                                View All <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.activeIssues.slice(0, 6).map((issue, i) => (
                            <motion.div
                                key={issue.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.22 + i * 0.04 }}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                                <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                                    issue.status === 'pr_submitted' ? 'bg-blue-500/10' : 'bg-amber-500/10'
                                }`}>
                                    {issue.status === 'pr_submitted' ? (
                                        <GitPullRequestDraft className="h-3.5 w-3.5 text-blue-500" />
                                    ) : (
                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{issue.title}</p>
                                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                        {issue.repoName}
                                    </p>
                                </div>
                                <Badge
                                    variant={issue.status === 'pr_submitted' ? 'default' : 'secondary'}
                                    className="text-[10px] shrink-0"
                                >
                                    {issue.status === 'in_progress' ? 'Working' : 'PR Sent'}
                                </Badge>
                            </motion.div>
                        ))}
                    </div>
                </BentoCard>
            )}
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <Skeleton className="lg:col-span-4 h-[280px] rounded-xl" />
                <div className="lg:col-span-4 grid grid-cols-2 gap-5">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-[126px] rounded-xl" />
                    ))}
                </div>
                <Skeleton className="lg:col-span-4 h-[280px] rounded-xl" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-[68px] rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <Skeleton className="lg:col-span-7 h-[320px] rounded-xl" />
                <Skeleton className="lg:col-span-5 h-[320px] rounded-xl" />
            </div>
        </div>
    );
}
