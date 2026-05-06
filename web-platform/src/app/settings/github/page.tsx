'use client';

/**
 * /settings/github — GitHub Access management.
 *
 * Shows the user's currently-granted OAuth scopes, lets them upgrade
 * to repo-read for private repo audits, and surfaces what each scope
 * enables.
 *
 * Phase 1 implementation: status display + "coming soon" upgrade flow.
 * Real OAuth re-prompt with the `repo` scope is a follow-up since it
 * requires either:
 *   - BetterAuth `linkSocialAccount` flow with scope override, or
 *   - A separate "GitHub App" install path (different OAuth model)
 *
 * For now, this page exists so users can:
 *   1. See what we currently have access to
 *   2. Understand why private repo audits don't work
 *   3. Find this page from the AddProjectModal error flow
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useSession } from '@/lib/auth-client';
import {
    Github, ShieldCheck, ShieldAlert, CheckCircle2, XCircle,
    ExternalLink, Lock, Globe, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ScopeInfo {
    scope: string;
    label: string;
    description: string;
    granted: boolean;
    enables: string[];
}

const ALL_SCOPES: Omit<ScopeInfo, 'granted'>[] = [
    {
        scope: 'read:user',
        label: 'Read profile',
        description: "Your public GitHub profile (username, name, avatar).",
        enables: [
            "Sign you in",
            "Show your profile on your public DevProof page",
        ],
    },
    {
        scope: 'user:email',
        label: 'Email address',
        description: "Your verified primary email.",
        enables: [
            "Account recovery",
            "Notifications (when we add them)",
        ],
    },
    {
        scope: 'public_repo',
        label: 'Public repos',
        description: "Read access to your public repositories.",
        enables: [
            "Audit your public repos",
            "Compute person score across your portfolio",
            "List your repos for /p/[username]/score",
        ],
    },
    {
        scope: 'repo',
        label: 'Private repos',
        description: "Full read access to your repositories — public AND private.",
        enables: [
            "Audit private repos (work projects, internal libraries)",
            "Include private work in your DevProof score",
            "Detect private contributions you'd want hiring managers to see",
        ],
    },
];


export default function GitHubAccessPage() {
    const { data: session, isPending } = useSession();
    const [scopes, setScopes] = useState<string[]>([]);
    const [loadingScopes, setLoadingScopes] = useState(true);

    // Fetch the user's current scopes from the backend account record.
    // For now we infer from the session — when we wire a real /api/auth/scopes
    // endpoint we'll get the actual scope string from the access token.
    useEffect(() => {
        if (isPending || !session?.user) return;
        // Phase 1: assume default scopes (read:user, user:email).
        // When BetterAuth exposes the granted scope set we'll read the real value.
        setScopes(['read:user', 'user:email']);
        setLoadingScopes(false);
    }, [session, isPending]);

    const annotated: ScopeInfo[] = ALL_SCOPES.map((s) => ({
        ...s,
        granted: scopes.includes(s.scope),
    }));

    const hasPublicRepoScope = annotated.some(
        (s) => (s.scope === 'public_repo' || s.scope === 'repo') && s.granted,
    );
    const hasPrivateRepoScope = annotated.find((s) => s.scope === 'repo')?.granted ?? false;

    const handleUpgrade = () => {
        // Phase 2: trigger BetterAuth re-auth with `repo` scope.
        // For now this is a placeholder that explains the limitation.
        alert(
            "Private-repo access is coming soon. Today, DevProof only audits " +
            "public repos. Once we ship the OAuth re-prompt flow, this button " +
            "will trigger a one-click upgrade to grant private-repo read access."
        );
    };

    if (isPending) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8">
                    <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (!session) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-8 max-w-2xl">
                    <h1 className="text-2xl font-bold mb-4">GitHub Access</h1>
                    <p className="text-muted-foreground">
                        Sign in to manage your GitHub permissions.
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Hero */}
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="h-7 w-7 text-primary" />
                        <h1 className="text-2xl font-bold">GitHub Access</h1>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Manage what DevProof can see in your GitHub account. We only
                        request the minimum needed — and we never write to your
                        account, only read.
                    </p>
                </header>

                {/* Current connection */}
                <section className="mb-8 rounded-xl border bg-card p-6">
                    <div className="flex items-start justify-between mb-3 gap-4">
                        <div className="flex items-center gap-3">
                            <Github className="h-6 w-6" />
                            <div>
                                <div className="font-semibold">Connected as @{session.user.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {session.user.email}
                                </div>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className="text-xs text-green-600 dark:text-green-400 border-green-500/30"
                        >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Manage this connection on{' '}
                        <a
                            href="https://github.com/settings/applications"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground hover:underline inline-flex items-center gap-1"
                        >
                            github.com/settings/applications
                            <ExternalLink className="h-3 w-3" />
                        </a>
                        {' '}(revoke or re-authorize from there).
                    </p>
                </section>

                {/* Permission matrix */}
                <section className="mb-8">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Permissions
                    </h2>
                    <div className="space-y-3">
                        {annotated.map((scope) => (
                            <div
                                key={scope.scope}
                                className={`rounded-lg border p-4 ${
                                    scope.granted
                                        ? 'border-green-500/30 bg-green-500/5'
                                        : 'border-border bg-card opacity-90'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex items-start gap-3 min-w-0">
                                        {scope.granted ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                        )}
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm flex items-center gap-2">
                                                {scope.label}
                                                <code className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                    {scope.scope}
                                                </code>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                {scope.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <ul className="space-y-1 ml-8 mt-2">
                                    {scope.enables.map((line) => (
                                        <li
                                            key={line}
                                            className={`text-xs flex items-start gap-1.5 ${
                                                scope.granted
                                                    ? 'text-foreground/80'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            <span className="opacity-50 shrink-0">→</span>
                                            <span>{line}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Upgrade CTA */}
                {!hasPrivateRepoScope && (
                    <section className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
                        <div className="flex items-start gap-3 mb-3">
                            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold mb-1">Want to audit private repos?</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    DevProof currently only audits <strong>public repositories</strong>.
                                    To include private work in your portfolio score, we'd need to read
                                    your private repos — which requires the <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">repo</code> OAuth scope.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleUpgrade}
                            variant="outline"
                            className="ml-8 mt-2"
                        >
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Grant private repo access
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                                Coming soon
                            </Badge>
                        </Button>
                        <p className="ml-8 mt-3 text-xs text-muted-foreground">
                            We'll never write to your repos, post issues, or modify code. Read-only.
                        </p>
                    </section>
                )}

                {/* Privacy note */}
                <section className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="text-xs text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Privacy:</strong> DevProof requests
                            the minimum scopes needed for the features above. We don't store your
                            access token unencrypted, we never write to your account, and you can{' '}
                            <a
                                href="https://github.com/settings/applications"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground hover:underline"
                            >
                                revoke access at any time
                            </a>
                            {' '}from your GitHub settings.
                        </div>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
}
