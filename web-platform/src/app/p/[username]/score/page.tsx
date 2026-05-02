'use client';

/**
 * /p/[username]/score — Phase 4.5 person profile (dual-axis scoreboard).
 *
 * Sub-route of the existing /p/[username] profile so legacy profile UI
 * isn't disrupted. Currently uses fixture data; Phase 4.5b wires the
 * real backend route.
 *
 * The dual-axis hero (person_score AND reach_score, never collapsed)
 * is the differentiation: addresses the Sindre-Sorhus / awesome insight
 * where one-axis scoring breaks at extremes.
 */

import { use } from 'react';
import Link from 'next/link';
import { FIXTURE_PROFILES } from '@/lib/person-fixture';
import type { PersonScore, PersonRepoSummary } from '@/lib/types/person-output';
import {
    ExternalLink, Github, Star, GitFork, Calendar, Code,
    AlertCircle, TrendingUp, Layers, ArrowRight,
} from 'lucide-react';


// ─── Score card ───────────────────────────────────────────────────────────────

function ScoreCard({
    label, score, helper, color, missing,
}: {
    label: string;
    score: number | null;
    helper: string;
    color: 'emerald' | 'sky';
    missing?: string;
}) {
    const colorClass = color === 'emerald'
        ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
        : 'text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/5';
    return (
        <div className={`flex-1 rounded-xl border p-6 ${colorClass}`}>
            <div className="text-xs uppercase tracking-wider opacity-80 font-semibold mb-2">
                {label}
            </div>
            {score !== null ? (
                <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-bold font-mono">{score}</span>
                    <span className="text-base opacity-70">/ 100</span>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold opacity-60">—</span>
                    {missing && (
                        <span className="text-xs opacity-70">{missing}</span>
                    )}
                </div>
            )}
            <div className="mt-3 text-xs leading-relaxed opacity-80">
                {helper}
            </div>
        </div>
    );
}

// ─── Repo card ────────────────────────────────────────────────────────────────

function RepoCard({ repo }: { repo: PersonRepoSummary }) {
    const shortUrl = repo.repo_url.replace('https://github.com/', '');
    const tierColor = repo.repo_tier === 'TIER_3_DEEP'
        ? 'text-emerald-600 dark:text-emerald-400'
        : repo.repo_tier === 'TIER_2_LOGIC'
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-zinc-500';
    const weightPct = repo.weight_combined !== null
        ? Math.round(repo.weight_combined * 100)
        : 0;

    return (
        <div className={`rounded-lg border p-4 transition-colors ${
            repo.skipped ? 'opacity-60 bg-muted/20' : 'hover:border-border/80'
        }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                    <a
                        href={repo.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm font-medium hover:underline inline-flex items-center gap-1 break-all"
                    >
                        {shortUrl}
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                    </a>
                </div>
                {repo.repo_score !== null && !repo.skipped && (
                    <div className={`text-2xl font-bold font-mono shrink-0 ${tierColor}`}>
                        {repo.repo_score}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {repo.stars.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                    <GitFork className="h-3 w-3" />
                    {repo.forks.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {repo.age_years.toFixed(1)}y old
                </span>
                {repo.primary_language && (
                    <span className="inline-flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        {repo.primary_language}
                    </span>
                )}
            </div>

            {repo.skipped ? (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 italic flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Skipped: {repo.skip_reason || 'unknown'}
                </div>
            ) : (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>weight {weightPct}%</span>
                    <span className="opacity-50">·</span>
                    <span>{Math.round(repo.authorship_percent)}% authored</span>
                    {repo.repo_tier && (
                        <>
                            <span className="opacity-50">·</span>
                            <span className={tierColor}>
                                {repo.repo_tier
                                    .replace('TIER_', 'T')
                                    .replace('_DEEP', '·Deep')
                                    .replace('_LOGIC', '·Logic')
                                    .replace('_UI', '·UI')}
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PersonScorePage({
    params,
}: {
    params: Promise<{ username: string }>;
}) {
    const { username } = use(params);
    const profile: PersonScore | undefined = FIXTURE_PROFILES[username.toLowerCase()];

    if (!profile) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="max-w-md p-8 rounded-xl border bg-card text-center">
                    <h1 className="text-xl font-bold mb-2">Profile not yet computed</h1>
                    <p className="text-sm text-muted-foreground mb-4">
                        Phase 4.5b will wire real backend data so any GitHub username
                        is computable on demand. For now, fixture profiles available
                        for{' '}
                        <Link href="/p/dhruv0206/score" className="text-emerald-500 hover:underline">
                            dhruv0206
                        </Link>{' '}
                        and{' '}
                        <Link href="/p/sindresorhus/score" className="text-emerald-500 hover:underline">
                            sindresorhus
                        </Link>.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        ← Back to home
                    </Link>
                </div>
            </div>
        );
    }

    const eligibleRepos = profile.repos.filter((r) => !r.skipped);
    const skippedRepos = profile.repos.filter((r) => r.skipped);

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-sm font-bold">
                        <span className="text-muted-foreground">&lt;</span>
                        <span>DevProof</span>
                        <span className="text-muted-foreground">/&gt;</span>
                    </Link>
                    <Link
                        href="/methodology"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        How we score
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 max-w-5xl">
                {/* Hero */}
                <section className="mb-10">
                    <div className="flex items-center gap-4 mb-2">
                        <a
                            href={`https://github.com/${profile.github_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-3xl font-bold hover:underline"
                        >
                            <Github className="h-7 w-7" />
                            {profile.github_username}
                            <ExternalLink className="h-4 w-4 opacity-60" />
                        </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {profile.primary_language && (
                            <span className="inline-flex items-center gap-1">
                                <Code className="h-3.5 w-3.5" />
                                {profile.primary_language}
                            </span>
                        )}
                        {profile.primary_discipline && (
                            <>
                                <span className="opacity-50">·</span>
                                <span>{profile.primary_discipline}</span>
                            </>
                        )}
                        <span className="opacity-50">·</span>
                        <span>{profile.person_breakdown?.repo_count_total || 0} public repos</span>
                    </div>
                </section>

                {/* Dual-axis scoreboard */}
                <section className="mb-12">
                    <div className="flex flex-col md:flex-row gap-4">
                        <ScoreCard
                            label="Engineering Depth"
                            score={profile.person_score}
                            color="emerald"
                            helper="Weighted aggregate of audit scores across this person's repos. Authorship × recency × impact."
                            missing={profile.insufficient_data ? 'Need ≥3 audited repos' : undefined}
                        />
                        <ScoreCard
                            label="Reach"
                            score={profile.reach_score}
                            color="sky"
                            helper="Total impact: stars + forks + downstream dependents. Independent of code depth."
                        />
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground leading-relaxed max-w-3xl">
                        <strong>Two scores, never collapsed.</strong> A senior backend hire is best evaluated on
                        Engineering Depth. A developer-relations / community hire on Reach. Picking which axis
                        matters per role is the hiring manager's call —{' '}
                        <Link href="/methodology" className="text-emerald-500 hover:underline">read why</Link>.
                    </p>
                </section>

                {/* Breakdown panels */}
                <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.person_breakdown && (
                        <div className="rounded-lg border p-4">
                            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                                Engineering Depth breakdown
                            </h3>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Repos audited</dt>
                                    <dd className="font-mono">{profile.person_breakdown.repo_count_total}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Included in score</dt>
                                    <dd className="font-mono">{profile.person_breakdown.repo_count_included}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Filtered out</dt>
                                    <dd className="font-mono">{profile.person_breakdown.repo_count_skipped}</dd>
                                </div>
                                {profile.person_breakdown.top_repo_url && (
                                    <div className="pt-2 border-t border-border/50 mt-2">
                                        <dt className="text-muted-foreground text-xs mb-1">
                                            <TrendingUp className="h-3 w-3 inline mr-1" />
                                            Most-defining repo
                                        </dt>
                                        <dd>
                                            <a
                                                href={profile.person_breakdown.top_repo_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-mono text-xs hover:underline break-all"
                                            >
                                                {profile.person_breakdown.top_repo_url.replace(
                                                    'https://github.com/', '',
                                                )}
                                            </a>
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}
                    {profile.reach_breakdown && (
                        <div className="rounded-lg border p-4">
                            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                                Reach breakdown
                            </h3>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground inline-flex items-center gap-1">
                                        <Star className="h-3 w-3" /> Total stars
                                    </dt>
                                    <dd className="font-mono">
                                        {profile.reach_breakdown.total_stars.toLocaleString()}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground inline-flex items-center gap-1">
                                        <GitFork className="h-3 w-3" /> Total forks
                                    </dt>
                                    <dd className="font-mono">
                                        {profile.reach_breakdown.total_forks.toLocaleString()}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground inline-flex items-center gap-1">
                                        <Layers className="h-3 w-3" /> Popular repos (≥100 stars)
                                    </dt>
                                    <dd className="font-mono">{profile.reach_breakdown.popular_repo_count}</dd>
                                </div>
                                {profile.reach_breakdown.total_dependents !== null && (
                                    <div className="flex justify-between">
                                        <dt className="text-muted-foreground">Downstream dependents</dt>
                                        <dd className="font-mono">
                                            {profile.reach_breakdown.total_dependents.toLocaleString()}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    )}
                </section>

                {/* Eligible repos */}
                {eligibleRepos.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                            Audited repos ({eligibleRepos.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {eligibleRepos
                                .sort((a, b) => (b.weight_combined ?? 0) - (a.weight_combined ?? 0))
                                .map((repo) => (
                                    <RepoCard key={repo.repo_url} repo={repo} />
                                ))}
                        </div>
                    </section>
                )}

                {/* Skipped repos */}
                {skippedRepos.length > 0 && (
                    <section className="mb-10">
                        <details>
                            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {skippedRepos.length} repos skipped from aggregation
                            </summary>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {skippedRepos.map((repo) => (
                                    <RepoCard key={repo.repo_url} repo={repo} />
                                ))}
                            </div>
                        </details>
                    </section>
                )}

                <footer className="mt-16 pt-6 border-t text-xs text-muted-foreground">
                    <p>
                        Algo: <span className="font-mono">{profile.formula_version}</span>
                        {' · '}
                        Computed: {new Date(profile.computed_at).toLocaleDateString()}
                        {' · '}
                        <Link href="/methodology" className="hover:text-foreground">methodology</Link>
                    </p>
                </footer>
            </main>
        </div>
    );
}
