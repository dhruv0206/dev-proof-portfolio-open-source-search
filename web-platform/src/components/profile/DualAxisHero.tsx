'use client';

/**
 * Dual-axis score hero — drops into both /p/[username] (front door) and
 * /p/[username]/score (deep dive). Fetches /api/profile/{username} with
 * graceful fixture fallback for offline dev / demo accounts.
 *
 * The dual-axis (person_score + reach_score, never collapsed) is the
 * differentiation: a Sindre Sorhus-style maintainer with 461K stars but
 * a single-page README scores LOW on engineering depth and HIGH on reach,
 * which a single number can't express.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { FIXTURE_PROFILES } from '@/lib/person-fixture';
import type { PersonScore } from '@/lib/types/person-output';


function ScoreCard({
    label,
    score,
    helper,
    color,
    missing,
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


export function DualAxisHero({
    username,
    showDeepDiveLink = true,
}: {
    username: string;
    showDeepDiveLink?: boolean;
}) {
    const [profile, setProfile] = useState<PersonScore | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(
                    `${API_URL}/api/profile/${encodeURIComponent(username)}?include_contributions=false`,
                );
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setProfile(data);
                    return;
                }
            } catch {
                // Network error / backend down — fall through to fixture
            }
            const fixture = FIXTURE_PROFILES[username.toLowerCase()];
            if (!cancelled) setProfile(fixture);
        }
        load().finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [username]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!profile) {
        // Backend returned 404 and no fixture — gracefully hide the hero
        // (the rest of the profile page still renders).
        return null;
    }

    return (
        <div className="space-y-3">
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
            {showDeepDiveLink && (
                <div className="flex justify-end">
                    <Link
                        href={`/p/${username}/score`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Full score breakdown
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            )}
        </div>
    );
}
