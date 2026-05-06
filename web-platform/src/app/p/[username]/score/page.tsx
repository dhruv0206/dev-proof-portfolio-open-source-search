'use client';

/**
 * /p/[username]/score — Phase 4.5 person profile (dual-axis scoreboard).
 *
 * Phase 4.5b: fetches /api/profile/{username} for real data. Falls back
 * to FIXTURE_PROFILES when the API isn't reachable (local dev without
 * backend, or for the demo accounts).
 *
 * The dual-axis hero (person_score AND reach_score, never collapsed)
 * is the differentiation: addresses the Sindre-Sorhus / awesome insight
 * where one-axis scoring breaks at extremes.
 *
 * Visual treatment: "techy minimal" — bracket-corner schematic cards,
 * mono labels, hairline section dividers, Clay accent (#CC785C) used
 * sparingly only on primary CTA + engineering-depth score number.
 */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { FIXTURE_PROFILES } from '@/lib/person-fixture';
import type { PersonScore, PersonRepoSummary, SkillBadge } from '@/lib/types/person-output';
import { Loader2 } from 'lucide-react';


// ─── Tokens ───────────────────────────────────────────────────────────────────

const CLAY = '#CC785C';
const TEXT_DIM = '#666666';
const CORNER = 'rgba(255,255,255,0.18)';

// ─── Atoms ────────────────────────────────────────────────────────────────────

function CornerBrackets() {
    const corner: React.CSSProperties = {
        position: 'absolute',
        width: 10,
        height: 10,
        pointerEvents: 'none',
    };
    return (
        <>
            <span style={{ ...corner, top: 0, left: 0, borderTop: `1px solid ${CORNER}`, borderLeft: `1px solid ${CORNER}` }} />
            <span style={{ ...corner, top: 0, right: 0, borderTop: `1px solid ${CORNER}`, borderRight: `1px solid ${CORNER}` }} />
            <span style={{ ...corner, bottom: 0, left: 0, borderBottom: `1px solid ${CORNER}`, borderLeft: `1px solid ${CORNER}` }} />
            <span style={{ ...corner, bottom: 0, right: 0, borderBottom: `1px solid ${CORNER}`, borderRight: `1px solid ${CORNER}` }} />
        </>
    );
}

function Hairline() {
    return <div className="h-px bg-border" />;
}

function MonoLabel({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="font-mono text-foreground/60"
            style={{
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: TEXT_DIM,
            }}
        >
            {children}
        </div>
    );
}

// Section header — `LABEL · VERSION` in tiny mono caps.
function CommentHeader({ label, version }: { label: string; version?: string }) {
    return (
        <div
            className="font-mono"
            style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: TEXT_DIM,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <span className="text-muted-foreground">{label}</span>
            {version && (
                <>
                    <span style={{ color: TEXT_DIM, opacity: 0.6 }}>·</span>
                    <span>{version}</span>
                </>
            )}
        </div>
    );
}

// Title with the 2px vertical accent bar.
function AccentedTitle({
    children, mono = true,
}: { children: React.ReactNode; mono?: boolean }) {
    return (
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 14 }}>
            <div style={{ width: 2, background: '#EDEDED', flexShrink: 0 }} />
            <div
                className={mono ? 'font-mono' : ''}
                style={{
                    fontSize: mono ? 22 : 26,
                    fontWeight: 500,
                    letterSpacing: mono ? '0.02em' : '-0.015em',
                    color: '#EDEDED',
                    paddingTop: 2,
                    paddingBottom: 2,
                    textTransform: mono ? 'uppercase' : 'none',
                }}
            >
                {children}
            </div>
        </div>
    );
}

// Bracket-corner schematic card. Used for both the dual-axis hero and the
// per-repo audited list.
function SchematicCard({
    index,
    typeCode,
    statusOk,
    statusLabel,
    bottomRight,
    children,
}: {
    index: string;
    typeCode: string;
    statusOk: boolean;
    statusLabel: string;
    bottomRight: string;
    children: React.ReactNode;
}) {
    const corner: React.CSSProperties = {
        position: 'absolute',
        width: 10,
        height: 10,
        pointerEvents: 'none',
    };
    return (
        <div
            className="font-mono"
            style={{
                position: 'relative',
                padding: '32px 26px',
                minHeight: 200,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
            }}
        >
            <div style={{ ...corner, top: 0, left: 0, borderTop: `1px solid ${CORNER}`, borderLeft: `1px solid ${CORNER}` }} />
            <div style={{ ...corner, top: 0, right: 0, borderTop: `1px solid ${CORNER}`, borderRight: `1px solid ${CORNER}` }} />
            <div style={{ ...corner, bottom: 0, left: 0, borderBottom: `1px solid ${CORNER}`, borderLeft: `1px solid ${CORNER}` }} />
            <div style={{ ...corner, bottom: 0, right: 0, borderBottom: `1px solid ${CORNER}`, borderRight: `1px solid ${CORNER}` }} />

            {/* Top labels in corner gaps */}
            <div
                style={{
                    position: 'absolute',
                    top: 8,
                    left: 30,
                    right: 30,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 10,
                    color: TEXT_DIM,
                    letterSpacing: '0.12em',
                }}
            >
                <span>{index}</span>
                <span>{typeCode}</span>
            </div>

            {/* Bottom labels */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 30,
                    right: 30,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                }}
            >
                <span style={{ color: statusOk ? CLAY : TEXT_DIM }}>● {statusLabel}</span>
                <span style={{ color: TEXT_DIM }}>{bottomRight}</span>
            </div>

            <div style={{ paddingTop: 6 }}>{children}</div>
        </div>
    );
}

// ─── Hero score panel ─────────────────────────────────────────────────────────

function AxisCard({
    index,
    typeCode,
    label,
    score,
    helper,
    isPrimary,
    missing,
}: {
    index: string;
    typeCode: string;
    label: string;
    score: number | null;
    helper: string;
    isPrimary: boolean;
    missing?: string;
}) {
    const hasScore = score !== null;
    return (
        <SchematicCard
            index={index}
            typeCode={typeCode}
            statusOk={hasScore}
            statusLabel={hasScore ? 'OK' : 'NULL'}
            bottomRight="V1.0"
        >
            <MonoLabel>{label}</MonoLabel>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 14, marginBottom: 14 }}>
                {hasScore ? (
                    <>
                        <span
                            style={{
                                fontFamily: 'inherit',
                                fontSize: 56,
                                fontWeight: 400,
                                color: isPrimary ? CLAY : '#EDEDED',
                                fontVariantNumeric: 'tabular-nums',
                                lineHeight: 1,
                                letterSpacing: '-0.04em',
                            }}
                        >
                            {score}
                        </span>
                        <span style={{ fontSize: 12, color: TEXT_DIM }}>/100</span>
                    </>
                ) : (
                    <span
                        style={{
                            fontSize: 56,
                            fontWeight: 400,
                            color: TEXT_DIM,
                            lineHeight: 1,
                        }}
                    >
                        —
                    </span>
                )}
            </div>
            {!hasScore && missing && (
                <div className="font-mono text-muted-foreground" style={{ fontSize: 11, marginBottom: 10 }}>
                    {missing}
                </div>
            )}
            <div
                className="font-mono text-muted-foreground"
                style={{ fontSize: 11, lineHeight: 1.55 }}
            >
                {helper}
            </div>
        </SchematicCard>
    );
}

// ─── Repo card ────────────────────────────────────────────────────────────────

function languageCode(lang: string | null): string {
    if (!lang) return '—';
    const map: Record<string, string> = {
        TypeScript: 'TS',
        JavaScript: 'JS',
        Python: 'PY',
        Rust: 'RS',
        Go: 'GO',
        Java: 'JV',
        Ruby: 'RB',
        'C++': 'CPP',
        'C#': 'CS',
        Swift: 'SW',
        Kotlin: 'KT',
        Shell: 'SH',
        HTML: 'HTML',
        CSS: 'CSS',
    };
    return map[lang] ?? lang.slice(0, 4).toUpperCase();
}

function tierLabel(tier: PersonRepoSummary['repo_tier']): string {
    if (!tier) return '';
    return tier.replace('TIER_', 'T').replace('_DEEP', '·DEEP').replace('_LOGIC', '·LOGIC').replace('_UI', '·UI');
}

// Format star counts compactly: 1234 → 1.2k, 1_400_000 → 1.4M.
function formatCompactNumber(n: number): string {
    if (n >= 1_000_000) {
        const v = n / 1_000_000;
        return `${v >= 10 ? v.toFixed(0) : v.toFixed(1)}M`;
    }
    if (n >= 1_000) {
        const v = n / 1_000;
        return `${v >= 10 ? v.toFixed(0) : v.toFixed(1)}k`;
    }
    return n.toString();
}

// Convert PR age (in years) to a short relative label: "3mo ago", "2y ago".
function formatPrAge(ageYears: number): string {
    if (ageYears < 1 / 12) {
        return 'recent';
    }
    if (ageYears < 1) {
        const months = Math.max(1, Math.round(ageYears * 12));
        return `${months}mo ago`;
    }
    const years = Math.round(ageYears);
    return `${years}y ago`;
}

// ─── Skill taxonomy ───────────────────────────────────────────────────────────

type SkillCategory =
    | 'Languages'
    | 'Frameworks'
    | 'Infrastructure'
    | 'AI / ML'
    | 'Real-time'
    | 'Patterns'
    | 'Databases'
    | 'Testing'
    | 'Other';

const SKILL_CATEGORY_ORDER: SkillCategory[] = [
    'Languages',
    'Frameworks',
    'Infrastructure',
    'AI / ML',
    'Real-time',
    'Patterns',
    'Databases',
    'Testing',
    'Other',
];

function categorizeSkill(skillId: string): SkillCategory {
    const id = skillId.toLowerCase();
    if (!id.includes('.')) return 'Languages';
    const prefix = id.split('.', 1)[0];
    switch (prefix) {
        case 'infra':
            return 'Infrastructure';
        case 'ai':
        case 'stt':
        case 'tts':
            return 'AI / ML';
        case 'rtc':
            return 'Real-time';
        case 'pattern':
        case 'ops':
            return 'Patterns';
        case 'db':
        case 'orm':
            return 'Databases';
        case 'testing':
            return 'Testing';
        case 'python':
        case 'typescript':
        case 'javascript':
        case 'ruby':
        case 'go':
        case 'rust':
        case 'java':
        case 'kotlin':
        case 'swift':
        case 'php':
        case 'csharp':
        case 'cpp':
        case 'c':
        case 'shell':
        case 'html':
        case 'css':
            return 'Frameworks';
        default:
            return 'Other';
    }
}

function RepoCard({ repo, index }: { repo: PersonRepoSummary; index: number }) {
    const shortUrl = repo.repo_url.replace('https://github.com/', '');
    const weightPct = repo.weight_combined !== null ? Math.round(repo.weight_combined * 100) : 0;
    const idx = String(index + 1).padStart(2, '0');
    const typeCode = `TYPE · ${languageCode(repo.primary_language)}`;
    const isOk = !repo.skipped && repo.repo_score !== null;
    const bottomRight = repo.skipped ? 'SKIPPED' : `WEIGHT · ${weightPct}%`;

    return (
        <a
            href={repo.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block transition-opacity hover:opacity-90"
            style={{ opacity: repo.skipped ? 0.55 : 1 }}
        >
            <SchematicCard
                index={`INDEX · ${idx}`}
                typeCode={typeCode}
                statusOk={isOk}
                statusLabel={repo.skipped ? 'SKIP' : 'OK'}
                bottomRight={bottomRight}
            >
                <div
                    style={{
                        fontSize: 10,
                        color: TEXT_DIM,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: 6,
                        wordBreak: 'break-all',
                    }}
                >
                    {shortUrl}
                </div>
                <div
                    style={{
                        fontSize: 14,
                        color: '#EDEDED',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        marginBottom: 14,
                        lineHeight: 1.35,
                    }}
                >
                    {shortUrl.split('/').slice(-1)[0].replace(/[-_]/g, ' ')}
                </div>

                <div className="h-px bg-border" style={{ margin: '12px 0' }} />

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span
                        style={{
                            fontSize: 10,
                            color: TEXT_DIM,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                        }}
                    >
                        score
                    </span>
                    {repo.skipped || repo.repo_score === null ? (
                        <span style={{ fontSize: 28, color: TEXT_DIM, lineHeight: 1 }}>—</span>
                    ) : (
                        <>
                            <span
                                style={{
                                    fontSize: 28,
                                    color: '#EDEDED',
                                    fontVariantNumeric: 'tabular-nums',
                                    letterSpacing: '-0.03em',
                                    fontWeight: 400,
                                    lineHeight: 1,
                                }}
                            >
                                {repo.repo_score}
                            </span>
                            <span style={{ fontSize: 11, color: TEXT_DIM }}>/100</span>
                        </>
                    )}
                    {repo.repo_tier && !repo.skipped && (
                        <span
                            style={{
                                fontSize: 10,
                                color: TEXT_DIM,
                                letterSpacing: '0.08em',
                                marginLeft: 'auto',
                            }}
                        >
                            {tierLabel(repo.repo_tier)}
                        </span>
                    )}
                </div>
                <div
                    style={{
                        marginTop: 10,
                        fontSize: 10,
                        color: TEXT_DIM,
                        letterSpacing: '0.06em',
                        display: 'flex',
                        gap: 10,
                        flexWrap: 'wrap',
                    }}
                >
                    <span>★ {repo.stars.toLocaleString()}</span>
                    <span>⑂ {repo.forks.toLocaleString()}</span>
                    <span>{repo.age_years.toFixed(1)}Y</span>
                    <span>{Math.round(repo.authorship_percent)}% AUTH</span>
                </div>
                {repo.skipped && repo.skip_reason && (
                    <div
                        style={{
                            marginTop: 10,
                            fontSize: 10,
                            color: TEXT_DIM,
                            letterSpacing: '0.04em',
                            fontStyle: 'italic',
                        }}
                    >
                        // {repo.skip_reason}
                    </div>
                )}
            </SchematicCard>
        </a>
    );
}

// ─── Pipeline / data row ──────────────────────────────────────────────────────

function DataRow({
    n,
    name,
    desc,
    status,
}: { n: string; name: string; desc: string; status: string }) {
    return (
        <div
            className="font-mono"
            style={{
                gridTemplateColumns: '32px 180px 1fr auto',
                display: 'grid',
                gap: 12,
                alignItems: 'baseline',
                padding: '12px 0',
            }}
        >
            <div style={{ fontSize: 11, color: TEXT_DIM, fontVariantNumeric: 'tabular-nums' }}>{n}</div>
            <div style={{ fontSize: 11, color: '#EDEDED', letterSpacing: '0.04em' }}>{name}</div>
            <div className="font-sans text-muted-foreground" style={{ fontSize: 11, lineHeight: 1.5 }}>
                {desc}
            </div>
            <div style={{ fontSize: 11, color: '#EDEDED', fontVariantNumeric: 'tabular-nums' }}>{status}</div>
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
    const [profile, setProfile] = useState<PersonScore | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            // Try the real backend first
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const res = await fetch(`${API_URL}/api/profile/${encodeURIComponent(username)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (!cancelled) setProfile(data);
                    return;
                }
                if (res.status === 404) {
                    // Backend says user doesn't exist — fall through to fixture check
                }
            } catch (e) {
                // Network error / backend down — fall through to fixture
            }
            // Fixture fallback (demo accounts + offline dev)
            const fixture = FIXTURE_PROFILES[username.toLowerCase()];
            if (!cancelled) {
                if (fixture) {
                    setProfile(fixture);
                } else {
                    setError('not_found');
                }
                setLoading(false);
            }
        }
        load().then(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="font-mono text-xs text-muted-foreground" style={{ letterSpacing: '0.08em' }}>
                        COMPUTING · <span className="text-foreground">{username}</span>
                    </p>
                    <p className="font-mono text-xs mt-2" style={{ color: TEXT_DIM, letterSpacing: '0.04em' }}>
                        // discovering repos + aggregating cached audits
                    </p>
                </div>
            </div>
        );
    }

    if (!profile || error === 'not_found') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <CommentHeader label="STATUS" version="404 · NOT_FOUND" />
                    <div style={{ height: 12 }} />
                    <AccentedTitle mono>PROFILE_NOT_COMPUTED</AccentedTitle>
                    <div style={{ height: 18 }} />
                    <p className="font-mono text-muted-foreground" style={{ fontSize: 12, lineHeight: 1.65 }}>
                        <span style={{ color: TEXT_DIM }}>// </span>
                        Phase 4.5b will wire real backend data so any GitHub username
                        is computable on demand. For now, fixture profiles available for{' '}
                        <Link href="/p/dhruv0206/score" className="text-primary hover:underline">
                            dhruv0206
                        </Link>{' '}
                        and{' '}
                        <Link href="/p/sindresorhus/score" className="text-primary hover:underline">
                            sindresorhus
                        </Link>.
                    </p>
                    <div style={{ height: 24 }} />
                    <Hairline />
                    <div style={{ height: 14 }} />
                    <Link
                        href="/"
                        className="font-mono text-xs text-muted-foreground hover:text-foreground"
                        style={{ letterSpacing: '0.08em' }}
                    >
                        ← BACK_TO_HOME
                    </Link>
                </div>
            </div>
        );
    }

    const eligibleRepos = profile.repos
        .filter((r) => !r.skipped)
        .sort((a, b) => (b.weight_combined ?? 0) - (a.weight_combined ?? 0));
    const skippedRepos = profile.repos.filter((r) => r.skipped);

    return (
        <div className="min-h-screen bg-background">
            {/* Top bar */}
            <header className="border-b border-border">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
                    <Link href="/" className="font-mono text-sm" style={{ color: '#EDEDED' }}>
                        <span style={{ color: TEXT_DIM }}>{'<'}</span>
                        <span>devproof</span>
                        <span className="text-primary">/</span>
                        <span style={{ color: TEXT_DIM }}>{'>'}</span>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 max-w-5xl">
                {/* ─── Header ─── */}
                <section className="mb-12">
                    <div
                        className="font-mono"
                        style={{
                            fontSize: 10,
                            letterSpacing: '0.12em',
                            color: TEXT_DIM,
                            textTransform: 'uppercase',
                            marginBottom: 14,
                            display: 'flex',
                            gap: 8,
                        }}
                    >
                        <span className="text-muted-foreground">SPEC</span>
                        <span style={{ opacity: 0.6 }}>·</span>
                        <span>V1.0.0</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'stretch', gap: 14, marginBottom: 16 }}>
                        <div style={{ width: 2, background: '#EDEDED', flexShrink: 0 }} />
                        <h1
                            className="font-mono"
                            style={{
                                fontSize: 26,
                                fontWeight: 500,
                                letterSpacing: '0.02em',
                                textTransform: 'uppercase',
                                paddingTop: 2,
                                color: '#EDEDED',
                            }}
                        >
                            ▌SCORE_REPORT
                        </h1>
                    </div>
                    <div
                        className="font-mono"
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'baseline',
                            gap: 10,
                            fontSize: 12,
                        }}
                    >
                        <a
                            href={`https://github.com/${profile.github_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary"
                            style={{ color: '#EDEDED', letterSpacing: '0.02em' }}
                        >
                            {profile.github_username}
                        </a>
                        {profile.primary_language && (
                            <>
                                <span style={{ color: TEXT_DIM, opacity: 0.6 }}>·</span>
                                <span style={{ color: '#A1A1A1' }}>{profile.primary_language.toUpperCase()}</span>
                            </>
                        )}
                        {profile.primary_discipline && (
                            <>
                                <span style={{ color: TEXT_DIM, opacity: 0.6 }}>·</span>
                                <span style={{ color: '#A1A1A1' }}>{profile.primary_discipline.toUpperCase()}</span>
                            </>
                        )}
                        <span style={{ color: TEXT_DIM, opacity: 0.6 }}>·</span>
                        <span style={{ color: TEXT_DIM }}>
                            {profile.person_breakdown?.repo_count_total || 0} REPOS
                        </span>
                    </div>
                </section>

                {/* ─── Dual-axis hero ─── */}
                <section className="mb-14">
                    <CommentHeader label="SCOREBOARD" version="DUAL_AXIS" />
                    <div style={{ height: 14 }} />
                    <Hairline />
                    <div style={{ paddingTop: 14, paddingBottom: 14 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AxisCard
                                index="01"
                                typeCode="AXIS · DEPTH"
                                label="ENG_DEPTH"
                                score={profile.person_score}
                                isPrimary
                                helper="Weighted aggregate of audit scores across this person's repos. Authorship × recency × impact."
                                missing={profile.insufficient_data ? '// need ≥3 audited repos' : undefined}
                            />
                            <AxisCard
                                index="02"
                                typeCode="AXIS · REACH"
                                label="REACH"
                                score={profile.reach_score}
                                isPrimary={false}
                                helper="Total impact: stars + forks + downstream dependents. Independent of code depth."
                            />
                        </div>
                    </div>
                    <Hairline />
                    <div style={{ height: 14 }} />
                    <p
                        className="font-mono text-muted-foreground"
                        style={{ fontSize: 11, lineHeight: 1.7, maxWidth: 760 }}
                    >
                        <span style={{ color: TEXT_DIM }}>// </span>
                        Two scores, never collapsed. A senior backend hire is best evaluated on
                        ENG_DEPTH. A developer-relations / community hire on REACH. Picking which
                        axis matters per role is the hiring manager&apos;s call.
                    </p>
                </section>

                {/* ─── Breakdowns ─── */}
                <section className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile.person_breakdown && (
                        <div
                            style={{
                                position: 'relative',
                                padding: '24px 26px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <CornerBrackets />
                            <CommentHeader label="BREAKDOWN" version="ENG_DEPTH" />
                            <div style={{ height: 14 }} />
                            <Hairline />
                            <DataRow
                                n="01"
                                name="REPOS_AUDITED"
                                desc="Total repos discovered for this person."
                                status={String(profile.person_breakdown.repo_count_total)}
                            />
                            <Hairline />
                            <DataRow
                                n="02"
                                name="INCLUDED"
                                desc="Repos contributing to the weighted score."
                                status={String(profile.person_breakdown.repo_count_included)}
                            />
                            <Hairline />
                            <DataRow
                                n="03"
                                name="FILTERED_OUT"
                                desc="Skipped: forks, archived, low authorship."
                                status={String(profile.person_breakdown.repo_count_skipped)}
                            />
                            <Hairline />
                            {profile.person_breakdown.top_repo_url && (
                                <>
                                    <div className="font-mono" style={{ padding: '14px 0' }}>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: TEXT_DIM,
                                                letterSpacing: '0.12em',
                                                textTransform: 'uppercase',
                                                marginBottom: 6,
                                            }}
                                        >
                                            ▶ TOP_REPO
                                        </div>
                                        <a
                                            href={profile.person_breakdown.top_repo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-primary"
                                            style={{
                                                fontSize: 12,
                                                color: '#EDEDED',
                                                letterSpacing: '0.02em',
                                                wordBreak: 'break-all',
                                            }}
                                        >
                                            {profile.person_breakdown.top_repo_url.replace('https://github.com/', '')}
                                        </a>
                                    </div>
                                    <Hairline />
                                </>
                            )}
                        </div>
                    )}
                    {profile.reach_breakdown && (
                        <div
                            style={{
                                position: 'relative',
                                padding: '24px 26px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <CornerBrackets />
                            <CommentHeader label="BREAKDOWN" version="REACH" />
                            <div style={{ height: 14 }} />
                            <Hairline />
                            <DataRow
                                n="01"
                                name="TOTAL_STARS"
                                desc="Sum of stars across all owned repos."
                                status={profile.reach_breakdown.total_stars.toLocaleString()}
                            />
                            <Hairline />
                            <DataRow
                                n="02"
                                name="TOTAL_FORKS"
                                desc="Sum of forks across all owned repos."
                                status={profile.reach_breakdown.total_forks.toLocaleString()}
                            />
                            <Hairline />
                            <DataRow
                                n="03"
                                name="POPULAR_REPOS"
                                desc="Repos with ≥100 stars."
                                status={String(profile.reach_breakdown.popular_repo_count)}
                            />
                            <Hairline />
                            {profile.reach_breakdown.total_dependents !== null && (
                                <>
                                    <DataRow
                                        n="04"
                                        name="DEPENDENTS"
                                        desc="Downstream packages depending on these repos."
                                        status={profile.reach_breakdown.total_dependents.toLocaleString()}
                                    />
                                    <Hairline />
                                </>
                            )}
                        </div>
                    )}
                </section>

                {/* ─── OSS contributions ─── */}
                {profile.oss_contributions && (
                    profile.oss_contributions.total_merged_prs > 0 ? (
                        <section className="mb-14">
                            <CommentHeader
                                label="OSS_CONTRIBUTIONS"
                                version={`GIT_MERGED · ${profile.oss_contributions.total_merged_prs}`}
                            />
                            <div style={{ height: 14 }} />
                            <Hairline />

                            {/* Headline score readout */}
                            <div
                                style={{
                                    position: 'relative',
                                    padding: '28px 26px',
                                    marginTop: 18,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <CornerBrackets />
                                <MonoLabel>OSS_IMPACT_SCORE</MonoLabel>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 6,
                                        marginTop: 12,
                                        marginBottom: 12,
                                    }}
                                >
                                    <span
                                        className="font-mono"
                                        style={{
                                            fontSize: 56,
                                            color: CLAY,
                                            fontVariantNumeric: 'tabular-nums',
                                            letterSpacing: '-0.04em',
                                            lineHeight: 1,
                                            fontWeight: 400,
                                        }}
                                    >
                                        {profile.oss_contributions.contribution_score}
                                    </span>
                                    <span className="font-mono" style={{ fontSize: 12, color: TEXT_DIM }}>
                                        /100
                                    </span>
                                </div>
                                <div
                                    className="font-mono text-muted-foreground"
                                    style={{ fontSize: 11, lineHeight: 1.6, maxWidth: 520 }}
                                >
                                    <span style={{ color: TEXT_DIM }}>// </span>
                                    OSS impact score · weighted by recipient stars + recency + diversity
                                </div>
                            </div>

                            {/* Stat strip */}
                            <div style={{ paddingTop: 22, paddingBottom: 18 }}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <div
                                            className="font-mono"
                                            style={{
                                                fontSize: 32,
                                                color: '#EDEDED',
                                                fontVariantNumeric: 'tabular-nums',
                                                letterSpacing: '-0.03em',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {profile.oss_contributions.total_merged_prs}
                                        </div>
                                        <div
                                            className="font-sans text-muted-foreground"
                                            style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}
                                        >
                                            PRs merged in repos they don&apos;t own
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            className="font-mono"
                                            style={{
                                                fontSize: 32,
                                                color: '#EDEDED',
                                                fontVariantNumeric: 'tabular-nums',
                                                letterSpacing: '-0.03em',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {profile.oss_contributions.unique_orgs}
                                        </div>
                                        <div
                                            className="font-sans text-muted-foreground"
                                            style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}
                                        >
                                            distinct orgs
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            className="font-mono"
                                            style={{
                                                fontSize: 32,
                                                color: '#EDEDED',
                                                fontVariantNumeric: 'tabular-nums',
                                                letterSpacing: '-0.03em',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {formatCompactNumber(profile.oss_contributions.total_recipient_stars)}
                                        </div>
                                        <div
                                            className="font-sans text-muted-foreground"
                                            style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}
                                        >
                                            stars across recipient repos
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Hairline />

                            {profile.oss_contributions.top_contributions.length > 0 && (
                                <div style={{ paddingTop: 18 }}>
                                    <div
                                        className="font-mono"
                                        style={{
                                            fontSize: 10,
                                            color: TEXT_DIM,
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                            marginBottom: 12,
                                        }}
                                    >
                                        // top_merged
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {profile.oss_contributions.top_contributions.slice(0, 5).map((c, i) => (
                                            <li key={c.pr_url}>
                                                <a
                                                    href={c.pr_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:opacity-80"
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '28px 1fr auto',
                                                        gap: 14,
                                                        alignItems: 'baseline',
                                                        padding: '14px 0',
                                                        borderBottom: '1px solid var(--border)',
                                                    }}
                                                    title={c.pr_title}
                                                >
                                                    <span
                                                        className="font-mono"
                                                        style={{
                                                            fontSize: 11,
                                                            color: TEXT_DIM,
                                                            fontVariantNumeric: 'tabular-nums',
                                                            letterSpacing: '0.04em',
                                                        }}
                                                    >
                                                        {String(i + 1).padStart(2, '0')}
                                                    </span>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div
                                                            style={{
                                                                fontSize: 13,
                                                                color: '#EDEDED',
                                                                lineHeight: 1.4,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                marginBottom: 4,
                                                            }}
                                                        >
                                                            {c.pr_title}
                                                        </div>
                                                        <div
                                                            className="font-mono"
                                                            style={{
                                                                fontSize: 11,
                                                                color: TEXT_DIM,
                                                                letterSpacing: '0.02em',
                                                                display: 'flex',
                                                                gap: 6,
                                                                flexWrap: 'wrap',
                                                                alignItems: 'baseline',
                                                            }}
                                                        >
                                                            <span style={{ color: '#A1A1A1' }}>{c.recipient_repo}</span>
                                                            <span style={{ opacity: 0.6 }}>·</span>
                                                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                                ★ {c.recipient_stars.toLocaleString()} stars
                                                            </span>
                                                            <span style={{ opacity: 0.6 }}>·</span>
                                                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                                merged {formatPrAge(c.age_years)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span
                                                        className="font-mono"
                                                        style={{
                                                            fontSize: 10,
                                                            color: TEXT_DIM,
                                                            letterSpacing: '0.08em',
                                                            textTransform: 'uppercase',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        ↗ PR
                                                    </span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>
                    ) : (
                        <section className="mb-14">
                            <CommentHeader label="OSS_CONTRIBUTIONS" version="GIT_MERGED · 00" />
                            <div style={{ height: 14 }} />
                            <Hairline />
                            <div style={{ padding: '18px 0' }}>
                                <p
                                    className="font-mono text-muted-foreground"
                                    style={{ fontSize: 11, lineHeight: 1.6 }}
                                >
                                    <span style={{ color: TEXT_DIM }}>// </span>
                                    No external OSS contributions yet
                                </p>
                            </div>
                            <Hairline />
                        </section>
                    )
                )}

                {/* ─── Skills ─── */}
                {profile.skills && (() => {
                    const skills = profile.skills;
                    if (skills.length === 0) {
                        return (
                            <section className="mb-14">
                                <CommentHeader label="SKILLS" version="00_DETECTED" />
                                <div style={{ height: 14 }} />
                                <Hairline />
                                <div style={{ padding: '18px 0' }}>
                                    <p
                                        className="font-mono text-muted-foreground"
                                        style={{ fontSize: 11, lineHeight: 1.6 }}
                                    >
                                        <span style={{ color: TEXT_DIM }}>// </span>
                                        No verified skills yet — audit a repo to populate this section.
                                    </p>
                                </div>
                                <Hairline />
                            </section>
                        );
                    }

                    // Group by category. Skills already arrive sorted by repo_count desc.
                    const grouped = new Map<SkillCategory, typeof skills>();
                    for (const s of skills) {
                        const cat = categorizeSkill(s.skill_id);
                        const arr = grouped.get(cat) ?? [];
                        arr.push(s);
                        grouped.set(cat, arr);
                    }

                    const primaryStack = skills.slice(0, 3);

                    const renderChip = (skill: SkillBadge) => {
                        const highlighted = skill.repo_count >= 2;
                        return (
                            <span
                                key={skill.skill_id}
                                className="font-mono"
                                style={{
                                    fontSize: 11,
                                    color: '#EDEDED',
                                    letterSpacing: '0.04em',
                                    padding: '4px 8px',
                                    border: `1px solid ${highlighted ? CLAY : 'rgba(255,255,255,0.08)'}`,
                                    background: highlighted ? 'rgba(204,120,92,0.06)' : 'transparent',
                                    fontWeight: highlighted ? 500 : 400,
                                    display: 'inline-flex',
                                    alignItems: 'baseline',
                                    gap: 4,
                                }}
                            >
                                <span style={{ color: TEXT_DIM }}>[</span>
                                <span>{skill.skill_id}</span>
                                {skill.repo_count > 1 && (
                                    <span
                                        style={{
                                            color: highlighted ? CLAY : TEXT_DIM,
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        ×{skill.repo_count}
                                    </span>
                                )}
                                <span style={{ color: TEXT_DIM }}>]</span>
                            </span>
                        );
                    };

                    return (
                        <section className="mb-14">
                            <CommentHeader
                                label="SKILLS"
                                version={`${String(skills.length).padStart(2, '0')}_DETECTED`}
                            />
                            <div style={{ height: 14 }} />
                            <Hairline />

                            {/* Primary stack callout */}
                            <div
                                style={{
                                    position: 'relative',
                                    padding: '18px 22px',
                                    marginTop: 18,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <CornerBrackets />
                                <div
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        gap: 10,
                                    }}
                                >
                                    <span
                                        className="font-mono"
                                        style={{
                                            fontSize: 10,
                                            color: TEXT_DIM,
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                            marginRight: 4,
                                        }}
                                    >
                                        Primary stack
                                    </span>
                                    <span style={{ color: TEXT_DIM, opacity: 0.6 }}>·</span>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 6,
                                        }}
                                    >
                                        {primaryStack.map(renderChip)}
                                    </div>
                                </div>
                            </div>

                            {/* Categorized lists */}
                            <div style={{ paddingTop: 24 }}>
                                {SKILL_CATEGORY_ORDER.map((cat) => {
                                    const items = grouped.get(cat);
                                    if (!items || items.length === 0) return null;
                                    return (
                                        <div key={cat} style={{ marginBottom: 22 }}>
                                            <div
                                                className="font-mono"
                                                style={{
                                                    fontSize: 10,
                                                    color: TEXT_DIM,
                                                    letterSpacing: '0.12em',
                                                    textTransform: 'uppercase',
                                                    display: 'flex',
                                                    alignItems: 'baseline',
                                                    gap: 8,
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <span style={{ color: '#A1A1A1' }}>{cat}</span>
                                                <span style={{ opacity: 0.6 }}>·</span>
                                                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                    {String(items.length).padStart(2, '0')}
                                                </span>
                                            </div>
                                            <Hairline />
                                            <div
                                                style={{
                                                    paddingTop: 12,
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 6,
                                                }}
                                            >
                                                {items.map(renderChip)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <Hairline />
                            <div style={{ height: 10 }} />
                            <p
                                className="font-mono text-muted-foreground"
                                style={{ fontSize: 11, lineHeight: 1.6 }}
                            >
                                <span style={{ color: TEXT_DIM }}>// </span>
                                Aggregated from claims across audited repos. Skills shown in Clay border
                                are demonstrated in 2+ repos.
                            </p>
                        </section>
                    );
                })()}

                {/* ─── Audited repos ─── */}
                {eligibleRepos.length > 0 && (
                    <section className="mb-14">
                        <CommentHeader
                            label="REPOS_AUDITED"
                            version={`${String(eligibleRepos.length).padStart(2, '0')}_INCLUDED`}
                        />
                        <div style={{ height: 14 }} />
                        <Hairline />
                        <div style={{ padding: '18px 0' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {eligibleRepos.map((repo, i) => (
                                    <RepoCard key={repo.repo_url} repo={repo} index={i} />
                                ))}
                            </div>
                        </div>
                        <Hairline />
                    </section>
                )}

                {/* ─── Skipped repos ─── */}
                {skippedRepos.length > 0 && (
                    <section className="mb-14">
                        <details>
                            <summary
                                className="font-mono cursor-pointer hover:text-foreground text-muted-foreground"
                                style={{
                                    fontSize: 10,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                ▶ SKIPPED · {String(skippedRepos.length).padStart(2, '0')}_FILTERED
                            </summary>
                            <div style={{ height: 14 }} />
                            <Hairline />
                            <div style={{ padding: '18px 0' }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {skippedRepos.map((repo, i) => (
                                        <RepoCard key={repo.repo_url} repo={repo} index={i} />
                                    ))}
                                </div>
                            </div>
                            <Hairline />
                        </details>
                    </section>
                )}

                {/* ─── Footer ─── */}
                <footer style={{ marginTop: 64 }}>
                    <Hairline />
                    <div
                        className="font-mono"
                        style={{
                            marginTop: 18,
                            fontSize: 11,
                            color: TEXT_DIM,
                            display: 'flex',
                            gap: 18,
                            letterSpacing: '0.04em',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span>{profile.formula_version}</span>
                        <span>schema.v4.0</span>
                        <span>computed · {new Date(profile.computed_at).toISOString().slice(0, 10)}</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
