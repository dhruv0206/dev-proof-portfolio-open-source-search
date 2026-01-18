'use client';

import { useEffect, useState } from 'react';
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
    Check
} from 'lucide-react';

interface ProfileData {
    profile: {
        name: string | null;
        username: string;
        avatarUrl: string | null;
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

                {/* Contributions Skeleton */}
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
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

    const { profile, stats, contributions } = data;

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
                    <div className="mt-3">
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified Developer
                        </Badge>
                    </div>
                </div>

                {/* Share Button */}
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
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold">{stats.verifiedPRs}</p>
                        <p className="text-xs text-muted-foreground">Verified PRs</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <GitFork className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                        <p className="text-2xl font-bold">{stats.repositories}</p>
                        <p className="text-xs text-muted-foreground">Repositories</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Code className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
                        <p className="text-2xl font-bold text-emerald-600">+{formatNumber(stats.linesAdded)}</p>
                        <p className="text-xs text-muted-foreground">Lines Added</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 text-center">
                        <Code className="h-6 w-6 mx-auto text-red-500 mb-2" />
                        <p className="text-2xl font-bold text-red-600">-{formatNumber(stats.linesRemoved)}</p>
                        <p className="text-xs text-muted-foreground">Lines Removed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Contributions List */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Verified Contributions
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
