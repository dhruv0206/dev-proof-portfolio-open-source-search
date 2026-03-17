'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Building2, Globe, Twitter, Github, ExternalLink } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UserSettings {
    id: string;
    name: string;
    email: string;
    image: string;
    githubUsername: string;
    githubId: number;
    company: string | null;
    blog: string | null;
    location: string | null;
    bio: string | null;
    twitterUsername: string | null;
    publicRepos: number;
    followers: number;
    following: number;
    hireable: boolean | null;
    discoverable: boolean;
}

interface SettingsContentProps {
    userId: string;
}

function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-20" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-44" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-36" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-6 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

export function SettingsContent({ userId }: SettingsContentProps) {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savedMessage, setSavedMessage] = useState(false);
    const [toggling, setToggling] = useState(false);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/users/me/settings`, {
                credentials: 'include',
                headers: { 'X-User-Id': userId },
            });
            if (!response.ok) {
                throw new Error('Failed to load settings');
            }
            const data: UserSettings = await response.json();
            setSettings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleDiscoverableToggle = async (newValue: boolean) => {
        if (toggling) return;
        setToggling(true);
        try {
            const response = await fetch(`${API_URL}/api/users/me/settings`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'X-User-Id': userId,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ discoverable: newValue }),
            });
            if (!response.ok) {
                throw new Error('Failed to update settings');
            }
            setSettings((prev) => (prev ? { ...prev, discoverable: newValue } : prev));
            setSavedMessage(true);
            setTimeout(() => setSavedMessage(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setToggling(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl">
                <ProfileSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl">
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={fetchSettings}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Try again
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!settings) return null;

    return (
        <div className="max-w-2xl space-y-6">
            {/* Profile Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        {settings.image ? (
                            <img
                                src={settings.image}
                                alt={settings.name}
                                width={64}
                                height={64}
                                className="rounded-full"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <Github className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        <div>
                            <p className="text-lg font-semibold">{settings.name}</p>
                            <p className="text-sm text-muted-foreground">
                                @{settings.githubUsername}
                            </p>
                            <p className="text-sm text-muted-foreground">{settings.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Location:</span>
                            <span>
                                {settings.location || (
                                    <span className="text-muted-foreground italic">
                                        Not set on GitHub
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Company:</span>
                            <span>
                                {settings.company || (
                                    <span className="text-muted-foreground italic">
                                        Not set on GitHub
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Website:</span>
                            {settings.blog ? (
                                <a
                                    href={
                                        settings.blog.startsWith('http')
                                            ? settings.blog
                                            : `https://${settings.blog}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1 truncate"
                                >
                                    {settings.blog}
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                            ) : (
                                <span className="text-muted-foreground italic">
                                    Not set on GitHub
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <Twitter className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Twitter:</span>
                            {settings.twitterUsername ? (
                                <a
                                    href={`https://twitter.com/${settings.twitterUsername}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                    @{settings.twitterUsername}
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                            ) : (
                                <span className="text-muted-foreground italic">
                                    Not set on GitHub
                                </span>
                            )}
                        </div>

                        {settings.bio && (
                            <div className="col-span-1 md:col-span-2 text-sm">
                                <p className="text-muted-foreground mb-1">Bio</p>
                                <p>{settings.bio}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <Github className="h-4 w-4 shrink-0" />
                        <span>
                            {settings.publicRepos} public repos &middot; {settings.followers}{' '}
                            followers
                        </span>
                    </div>

                    <p className="text-xs text-muted-foreground pt-2">
                        Profile data synced from GitHub. Update your GitHub profile to change
                        these.
                    </p>
                </CardContent>
            </Card>

            {/* Hiring Preferences Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Hiring Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Discoverable by companies</p>
                            <CardDescription>
                                When enabled, your verified portfolio will be visible to companies
                                searching for developers. Your code and contributions speak for
                                themselves — no forms to fill out.
                            </CardDescription>
                            {savedMessage && (
                                <p className="text-xs text-primary font-medium">Saved</p>
                            )}
                        </div>
                        <Switch
                            checked={settings.discoverable}
                            onCheckedChange={handleDiscoverableToggle}
                            disabled={toggling}
                            aria-label="Toggle discoverable by companies"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
