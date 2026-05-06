'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    CheckCircle2,
    GitFork,
    Code,
    ExternalLink,
    Share2,
    Calendar,
    AlertCircle,
    Copy,
    Check,
    MapPin,
    Building2,
    Globe,
} from 'lucide-react';
import { ProjectShowcaseCard } from '@/components/shared/ProjectShowcaseCard';
import { ProjectDetailPanel } from '@/components/shared/ProjectDetailPanel';
import type { ProjectProps } from '@/components/shared/ProjectShowcaseCard';
import { DualAxisHero } from '@/components/profile/DualAxisHero';
import { ContributionHeatmap } from '@/components/profile/ContributionHeatmap';
import { TechStackSection } from '@/components/profile/TechStackSection';
import { aggregateTechStack } from '@/lib/profileUtils';

interface ProfileData {
    profile: {
        name: string | null;
        username: string;
        avatarUrl: string | null;
        bio: string | null;
        location: string | null;
        company: string | null;
        blog: string | null;
        twitter: string | null;
    };
    stats: {
        verifiedPRs: number;
        repositories: number;
        linesAdded: number;
        linesRemoved: number;
    };
    languages: string[];
    contributions: Array<{
        id: string;
        title: string;
        repoOwner: string;
        repoName: string;
        repoFullName: string;
        prUrl: string | null;
        issueUrl: string;
        mergedAt: string | null;
    }>;
    verifiedProjects: Array<{
        name: string;
        repoUrl: string;
        authorship: number;
        stack: {
            languages: string[];
            frameworks: string[];
            libs: string[];
        };
        verifiedFeatures: Array<{
            feature: string;
            status: "VERIFIED" | "Wrapper" | "Unverified";
            evidence_file?: string;
            tier?: "TIER_1_UI" | "TIER_2_LOGIC" | "TIER_3_DEEP";
            feature_type?: string;
        }>;
        score?: number;
        tier?: string;
        recommendations?: string[];
        // V2 fields
        scoringVersion?: number;
        discipline?: string;
        forensicsData?: {
            insufficient_data: boolean;
            commit_count?: number;
            sessions?: { count: number; avg_duration_mins: number; per_week: number };
            fix_ratio?: number;
            message_quality?: number;
            evolution_mix?: { add: number; refactor: number; delete: number };
            time_spread_reasonable?: boolean;
        };
        scoreBreakdown?: {
            feature_score: number;
            architecture_score: number;
            intent_score: number;
            forensics_score: number;
            scoring_version: number;
        };
    }>;
}

interface ProfileContentProps {
    username: string;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
}

export function ProfileContent({ username }: ProfileContentProps) {
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [badgeCopied, setBadgeCopied] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectProps | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/api/users/profile/${username}`);

                if (response.status === 404) {
                    setError('User not found');
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }

                const profileData = await response.json();
                setData(profileData);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [username]);

    const handleShare = async () => {
        const url = window.location.href;

        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopyBadge = async () => {
        const markdown = `[![DevProof Verified](https://orenda.vision/api/badge/${username})](https://orenda.vision/p/${username})`;
        try {
            await navigator.clipboard.writeText(markdown);
            setBadgeCopied(true);
            setTimeout(() => setBadgeCopied(false), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = markdown;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setBadgeCopied(true);
            setTimeout(() => setBadgeCopied(false), 2000);
        }
    };

    const verifiedProjects = data?.verifiedProjects ?? [];
    const contributions = data?.contributions ?? [];

    const techStack = useMemo(() => aggregateTechStack(verifiedProjects), [verifiedProjects]);

    if (loading) {
        return (
            <div className="space-y-8">
                {/* Profile Header Skeleton */}
                <div className="flex items-center gap-6">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>

                {/* Score Hero Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-[250px] rounded-xl" />
                    ))}
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-20 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Heatmap Skeleton */}
                <Skeleton className="h-[160px] rounded-xl" />

                {/* Tech Stack Skeleton */}
                <div className="rounded-xl border border-border p-5">
                    <Skeleton className="h-3 w-20 mb-3" />
                    <div className="flex flex-wrap gap-2">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-6 w-16 rounded-full" />
                        ))}
                    </div>
                </div>

                {/* Projects Skeleton */}
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <Skeleton className="h-5 w-full mb-2" />
                                <Skeleton className="h-4 w-48" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <Card className="max-w-md mx-auto mt-12">
                <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold mb-2">
                        {error === 'User not found' ? 'Profile Not Found' : 'Something Went Wrong'}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        {error === 'User not found'
                            ? `We couldn't find a user with the username "${username}".`
                            : 'Unable to load this profile. Please try again later.'}
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const { profile, stats } = data;

    return (
        <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                {profile.avatarUrl ? (
                    <img
                        src={profile.avatarUrl}
                        alt={profile.name || profile.username}
                        className="w-24 h-24 rounded-full border-4 border-primary/20"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">
                            {(profile.name || profile.username).charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Info */}
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-bold mb-1">
                        {profile.name || profile.username}
                    </h1>
                    <a
                        href={`https://github.com/${profile.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                        @{profile.username}
                        <ExternalLink className="h-3 w-3" />
                    </a>

                    {/* Verified Badge */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified Developer
                        </Badge>
                    </div>

                    {/* Bio & Info */}
                    {profile.bio && (
                        <p className="text-sm text-muted-foreground mt-3 max-w-lg">
                            {profile.bio}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        {profile.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {profile.location}
                            </span>
                        )}
                        {profile.company && (
                            <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {profile.company}
                            </span>
                        )}
                        {profile.blog && (
                            <a
                                href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                                <Globe className="h-3 w-3" />
                                {profile.blog.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                        {profile.twitter && (
                            <a
                                href={`https://twitter.com/${profile.twitter}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                                @{profile.twitter}
                            </a>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        className="gap-2"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Share2 className="h-4 w-4" />
                                Share Profile
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyBadge}
                        className="gap-2"
                    >
                        {badgeCopied ? (
                            <>
                                <Check className="h-4 w-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Copy Badge
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Dual-axis score hero — Phase 4.5 (replaces legacy ProfileScoreHero) */}
            <DualAxisHero username={username} />

            {/* Stats Grid — bracket-corner technical treatment */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                    { idx: '01', section: 'STATS', sub: 'VERIFIED_PRS', icon: CheckCircle2, color: 'text-green-500', value: stats.verifiedPRs.toString(), valueClass: '' },
                    { idx: '02', section: 'STATS', sub: 'REPOSITORIES', icon: GitFork, color: 'text-blue-500', value: stats.repositories.toString(), valueClass: '' },
                    { idx: '03', section: 'DIFF', sub: 'LINES_ADDED', icon: Code, color: 'text-green-500', value: '+' + formatNumber(stats.linesAdded), valueClass: 'text-green-500' },
                    { idx: '04', section: 'DIFF', sub: 'LINES_REMOVED', icon: Code, color: 'text-red-500', value: '-' + formatNumber(stats.linesRemoved), valueClass: 'text-red-500' },
                ].map((s) => (
                    <div key={s.idx} className="relative bg-card p-5 border border-border/40 hover:border-border/70 transition-colors">
                        <span className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-foreground/[0.18]" />
                        <span className="pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-foreground/[0.18]" />
                        <span className="pointer-events-none absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-foreground/[0.18]" />
                        <span className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-foreground/[0.18]" />
                        <span className="pointer-events-none absolute top-1.5 left-3 font-mono text-[9px] tracking-[0.1em] text-muted-foreground/70 select-none">{s.idx}</span>
                        <div className="flex items-center justify-between mt-2.5">
                            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
                                <span>{s.section}</span>
                                <span className="opacity-50 mx-1.5">·</span>
                                <span>{s.sub}</span>
                            </span>
                            <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                        </div>
                        <p className={`font-mono text-3xl font-bold tabular-nums tracking-[-0.02em] mt-3 ${s.valueClass}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Contribution Heatmap */}
            <ContributionHeatmap contributions={contributions} />

            {/* Tech Stack */}
            <TechStackSection techStack={techStack} />

            {/* Verified Projects Section */}
            <div>
                <h2 className="mb-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
                    <span className="text-primary">*</span>
                    <span>PROJECTS</span>
                    <span className="opacity-50">·</span>
                    <span>VERIFIED_BY_AUDIT</span>
                </h2>

                {(!verifiedProjects || verifiedProjects.length === 0) ? (
                    <Card className="mb-8 border-dashed">
                        <CardContent className="p-6 text-center text-muted-foreground">
                            No full projects verified yet.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                        {verifiedProjects.map((project, idx) => (
                            <ProjectShowcaseCard
                                key={idx}
                                project={project}
                                onSelect={setSelectedProject}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Project Detail Dialog */}
            <ProjectDetailPanel
                project={selectedProject}
                open={selectedProject !== null}
                onClose={() => setSelectedProject(null)}
            />

            {/* Contributions List */}
            <div>
                <h2 className="mb-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
                    <span className="text-primary">*</span>
                    <span>CONTRIBUTIONS</span>
                    <span className="opacity-50">·</span>
                    <span>VERIFIED_PRS</span>
                </h2>

                {contributions.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">
                                No verified contributions yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {contributions.map((contribution) => (
                            <Card key={contribution.id} className="hover:border-primary/30 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium truncate">
                                                {contribution.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <a
                                                    href={`https://github.com/${contribution.repoFullName}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-primary transition-colors"
                                                >
                                                    {contribution.repoFullName}
                                                </a>
                                                {contribution.mergedAt && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(contribution.mergedAt)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {contribution.prUrl && (
                                            <a
                                                href={contribution.prUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button variant="outline" size="sm" className="gap-1">
                                                    <ExternalLink className="h-3 w-3" />
                                                    View PR
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
