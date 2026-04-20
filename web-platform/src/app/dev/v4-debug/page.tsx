'use client';

import { useMemo, useState } from 'react';
import {
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
    ResponsiveContainer,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthRequiredModal } from '@/components/shared/AuthRequiredModal';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSession } from '@/lib/auth-client';
import { AlertCircle, Check, Loader2, Lock, Play, X } from 'lucide-react';

const DEV_WHITELIST = ['dhruv0206'];
const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─────────────────────────── Types ───────────────────────────

interface ImportanceRow {
    file: string;
    total_score: number;
    pagerank: number;
    complexity_grade_score: number;
    readme_mentioned: number;
    entry_point: number;
    cochange_centrality: number;
    pr_cluster_score: number;
    loc_zscore: number;
}

interface PatternEntry {
    kind: string;
    files: string[];
    evidence: string[];
    confidence: number;
    notes: string;
}

interface OwnershipBlock {
    score: number;
    signals: {
        sustained_engagement: number | null;
        iteration_depth: number | null;
        bug_fix_ratio: number | null;
        review_participation: number | null;
        long_tail_evolution: number | null;
    };
    weights_used: Record<string, number>;
    evidence: Record<string, string>;
}

interface V4DiagnosticResponse {
    repo_url: string;
    commit_sha: string;
    pipeline_version: string;
    latency_ms: {
        tarball_fetch: number;
        graph_build: number;
        importance: number;
        patterns: number;
        ownership: number;
        total: number;
    };
    graph_stats: {
        files: number;
        symbols: number;
        reference_edges: number;
        import_edges: number;
        coverage: { ast: number; line_fallback: number; skipped: number };
    } | null;
    importance: {
        top_20: ImportanceRow[];
        core_set_size: number;
        periphery_size: number;
        guaranteed_inclusions: string[];
        weights_used: Record<string, number>;
    } | null;
    patterns: PatternEntry[] | null;
    ownership: OwnershipBlock | null;
    errors: string[];
}

// ─────────────────────────── Helpers ───────────────────────────

function formatPatternKind(kind: string): string {
    return kind
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function confidenceBadgeVariant(
    confidence: number
): 'default' | 'secondary' | 'outline' {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.5) return 'secondary';
    return 'outline';
}

function confidenceColorClass(confidence: number): string {
    if (confidence >= 0.8) return 'bg-emerald-500 text-white hover:bg-emerald-500/90';
    if (confidence >= 0.5)
        return 'bg-amber-500 text-white hover:bg-amber-500/90';
    return 'bg-muted text-muted-foreground hover:bg-muted/80';
}

function fmtMs(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
}

function fmtScore(n: number): string {
    return n.toFixed(3);
}

function shortSha(sha: string): string {
    return sha ? sha.slice(0, 7) : '—';
}

// ─────────────────────────── Page ───────────────────────────

export default function V4DebugPage() {
    const { data: session, isPending } = useSession();

    if (isPending) {
        return (
            <DashboardLayout>
                <main className="w-full px-6 lg:px-8 py-6">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <Skeleton className="h-64 w-full" />
                </main>
            </DashboardLayout>
        );
    }

    if (!session?.user) {
        return (
            <DashboardLayout>
                <AuthRequiredModal
                    title="Sign in to access V4 Debug"
                    message="This dev tool requires an authenticated GitHub session."
                />
            </DashboardLayout>
        );
    }

    const githubUsername = session.user.name;
    if (!githubUsername || !DEV_WHITELIST.includes(githubUsername)) {
        return (
            <DashboardLayout>
                <main className="w-full px-6 lg:px-8 py-10">
                    <Card className="max-w-xl mx-auto">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center">
                                <Lock className="h-7 w-7 text-destructive" />
                            </div>
                            <CardTitle>403 — Restricted</CardTitle>
                            <CardDescription>
                                This diagnostic page is only available to core
                                developers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center text-sm text-muted-foreground">
                            Signed in as{' '}
                            <span className="font-mono">{githubUsername}</span>.
                        </CardContent>
                    </Card>
                </main>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <main className="w-full px-6 lg:px-8 py-6 space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">V4 Diagnostic</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Dev-only tool for inspecting V4 audit pipeline output.
                    </p>
                </div>

                <V4DebugForm userId={session.user.id} />
            </main>
        </DashboardLayout>
    );
}

// ─────────────────────────── Form + Results ───────────────────────────

function V4DebugForm({ userId }: { userId: string }) {
    const [repoUrl, setRepoUrl] = useState('');
    const [githubUsername, setGithubUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<V4DiagnosticResponse | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!repoUrl.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/projects/v4-diagnostic`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Id': userId,
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        repo_url: repoUrl.trim(),
                        user_id: userId,
                        github_username: githubUsername.trim() || undefined,
                    }),
                }
            );

            if (!response.ok) {
                let detail = `Request failed: ${response.status}`;
                try {
                    const body = await response.json();
                    detail = body.detail || body.message || detail;
                } catch {
                    /* ignore */
                }
                throw new Error(detail);
            }

            const data: V4DiagnosticResponse = await response.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Run Diagnostic</CardTitle>
                    <CardDescription>
                        Paste any public GitHub repo URL. Optionally include a
                        GitHub username to compute ownership score.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end"
                    >
                        <div className="space-y-1.5">
                            <Label htmlFor="repo-url">Repo URL</Label>
                            <Input
                                id="repo-url"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/owner/repo"
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="github-username">
                                GitHub Username (optional)
                            </Label>
                            <Input
                                id="github-username"
                                value={githubUsername}
                                onChange={(e) =>
                                    setGithubUsername(e.target.value)
                                }
                                placeholder="octocat"
                                disabled={loading}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading || !repoUrl.trim()}
                            className="gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Running…
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4" />
                                    Run V4 Diagnostic
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {error && (
                <Card className="border-destructive">
                    <CardContent className="p-4 flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                            <div className="font-medium">Request failed</div>
                            <div className="font-mono text-xs mt-1 break-all">
                                {error}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading && <LoadingSkeleton />}

            {result && <V4Results result={result} />}
        </>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
}

// ─────────────────────────── Results ───────────────────────────

function V4Results({ result }: { result: V4DiagnosticResponse }) {
    return (
        <div className="space-y-6">
            {result.errors.length > 0 && <ErrorBanner errors={result.errors} />}
            <SummaryHeader result={result} />
            {result.graph_stats && <GraphStatsCard stats={result.graph_stats} />}
            {result.importance && <ImportanceTable importance={result.importance} />}
            {result.patterns && result.patterns.length > 0 && (
                <PatternsSection patterns={result.patterns} />
            )}
            {result.ownership && <OwnershipSection ownership={result.ownership} />}
            {result.importance && result.importance.guaranteed_inclusions.length > 0 && (
                <GuaranteedInclusions
                    inclusions={result.importance.guaranteed_inclusions}
                />
            )}
        </div>
    );
}

function ErrorBanner({ errors }: { errors: string[] }) {
    return (
        <Card className="border-destructive bg-destructive/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-destructive flex items-center gap-2 text-base">
                    <AlertCircle className="h-4 w-4" />
                    {errors.length} non-fatal{' '}
                    {errors.length === 1 ? 'error' : 'errors'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="text-sm font-mono space-y-1 text-destructive">
                    {errors.map((err, i) => (
                        <li key={i} className="break-all">
                            • {err}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

// ─────────────────────── Summary + Latency ───────────────────────

function SummaryHeader({ result }: { result: V4DiagnosticResponse }) {
    const stageOrder: Array<{
        key: keyof V4DiagnosticResponse['latency_ms'];
        label: string;
        color: string;
    }> = [
        { key: 'tarball_fetch', label: 'Tarball', color: 'bg-blue-500' },
        { key: 'graph_build', label: 'Graph', color: 'bg-violet-500' },
        { key: 'importance', label: 'Importance', color: 'bg-emerald-500' },
        { key: 'patterns', label: 'Patterns', color: 'bg-amber-500' },
        { key: 'ownership', label: 'Ownership', color: 'bg-rose-500' },
    ];

    const total = result.latency_ms.total || 1;

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <CardTitle className="font-mono text-base break-all">
                            {result.repo_url}
                        </CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                            <Badge variant="outline" className="font-mono">
                                {shortSha(result.commit_sha)}
                            </Badge>
                            <Badge variant="secondary">
                                {result.pipeline_version}
                            </Badge>
                            <span>Total: {fmtMs(result.latency_ms.total)}</span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex h-6 w-full overflow-hidden rounded-md border">
                    {stageOrder.map((stage) => {
                        const ms = result.latency_ms[stage.key] ?? 0;
                        const pct = total > 0 ? (ms / total) * 100 : 0;
                        if (pct <= 0) return null;
                        return (
                            <div
                                key={stage.key}
                                className={`${stage.color} h-full transition-all`}
                                style={{ width: `${pct}%` }}
                                title={`${stage.label}: ${fmtMs(ms)}`}
                            />
                        );
                    })}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {stageOrder.map((stage) => {
                        const ms = result.latency_ms[stage.key] ?? 0;
                        return (
                            <div
                                key={stage.key}
                                className="flex items-center gap-2 text-xs"
                            >
                                <span
                                    className={`inline-block h-2.5 w-2.5 rounded-full ${stage.color}`}
                                />
                                <span className="text-muted-foreground">
                                    {stage.label}
                                </span>
                                <span className="font-mono ml-auto">
                                    {fmtMs(ms)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// ─────────────────────── Graph Stats ───────────────────────

function GraphStatsCard({
    stats,
}: {
    stats: V4DiagnosticResponse['graph_stats'];
}) {
    const total =
        stats.coverage.ast +
        stats.coverage.line_fallback +
        stats.coverage.skipped || 1;

    const segments = [
        {
            label: 'AST',
            value: stats.coverage.ast,
            color: 'bg-emerald-500',
        },
        {
            label: 'Line fallback',
            value: stats.coverage.line_fallback,
            color: 'bg-amber-500',
        },
        {
            label: 'Skipped',
            value: stats.coverage.skipped,
            color: 'bg-muted-foreground/40',
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Graph Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatTile label="Files" value={stats.files} />
                    <StatTile label="Symbols" value={stats.symbols} />
                    <StatTile
                        label="Reference edges"
                        value={stats.reference_edges}
                    />
                    <StatTile label="Import edges" value={stats.import_edges} />
                </div>

                <div>
                    <div className="text-xs text-muted-foreground mb-2">
                        Parse coverage
                    </div>
                    <div className="flex h-4 w-full overflow-hidden rounded border">
                        {segments.map((s) => {
                            const pct = (s.value / total) * 100;
                            if (pct <= 0) return null;
                            return (
                                <div
                                    key={s.label}
                                    className={`${s.color} h-full`}
                                    style={{ width: `${pct}%` }}
                                    title={`${s.label}: ${s.value}`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs">
                        {segments.map((s) => (
                            <div
                                key={s.label}
                                className="flex items-center gap-1.5"
                            >
                                <span
                                    className={`inline-block h-2.5 w-2.5 rounded-full ${s.color}`}
                                />
                                <span className="text-muted-foreground">
                                    {s.label}:
                                </span>
                                <span className="font-mono">{s.value}</span>
                                <span className="text-muted-foreground">
                                    ({((s.value / total) * 100).toFixed(1)}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatTile({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold font-mono mt-1">
                {value.toLocaleString()}
            </div>
        </div>
    );
}

// ─────────────────────── Importance Table ───────────────────────

function ImportanceTable({
    importance,
}: {
    importance: V4DiagnosticResponse['importance'];
}) {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <CardTitle className="text-base">
                            Importance — Top 20
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Core set: {importance.core_set_size} · Periphery:{' '}
                            {importance.periphery_size}
                        </CardDescription>
                    </div>
                    <WeightsPopover weights={importance.weights_used} />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">#</TableHead>
                            <TableHead>File</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right" title="PageRank">
                                PR
                            </TableHead>
                            <TableHead
                                className="text-right"
                                title="Complexity grade score"
                            >
                                CX
                            </TableHead>
                            <TableHead
                                className="text-center"
                                title="README mentioned"
                            >
                                RM
                            </TableHead>
                            <TableHead
                                className="text-center"
                                title="Entry point"
                            >
                                EP
                            </TableHead>
                            <TableHead
                                className="text-right"
                                title="Co-change centrality"
                            >
                                CC
                            </TableHead>
                            <TableHead
                                className="text-right"
                                title="PR cluster score"
                            >
                                PR-Clust
                            </TableHead>
                            <TableHead
                                className="text-right"
                                title="LoC z-score"
                            >
                                LoC-z
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {importance.top_20.map((row, idx) => (
                            <TableRow
                                key={`${row.file}-${idx}`}
                                className={
                                    idx < 3
                                        ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                        : undefined
                                }
                            >
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {idx + 1}
                                </TableCell>
                                <TableCell className="font-mono text-xs max-w-[320px] truncate">
                                    {row.file}
                                </TableCell>
                                <TableCell className="text-right font-mono font-semibold">
                                    {fmtScore(row.total_score)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                    {fmtScore(row.pagerank)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                    {fmtScore(row.complexity_grade_score)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <BoolIcon on={row.readme_mentioned > 0} />
                                </TableCell>
                                <TableCell className="text-center">
                                    <BoolIcon on={row.entry_point > 0} />
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                    {fmtScore(row.cochange_centrality)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                    {fmtScore(row.pr_cluster_score)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                    {row.loc_zscore.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {importance.top_20.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={10}
                                    className="text-center text-sm text-muted-foreground py-6"
                                >
                                    No importance rows returned.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function BoolIcon({ on }: { on: boolean }) {
    return on ? (
        <Check className="h-4 w-4 text-emerald-600 inline-block" />
    ) : (
        <X className="h-4 w-4 text-muted-foreground/50 inline-block" />
    );
}

function WeightsPopover({ weights }: { weights: Record<string, number> }) {
    const entries = Object.entries(weights);
    if (entries.length === 0) return null;
    return (
        <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
                weights used
            </summary>
            <div className="mt-2 rounded border p-2 bg-muted/30 grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                {entries.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{k}</span>
                        <span>{v.toFixed(3)}</span>
                    </div>
                ))}
            </div>
        </details>
    );
}

// ─────────────────────── Patterns ───────────────────────

function PatternsSection({ patterns }: { patterns: PatternEntry[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">
                    Patterns Detected ({patterns.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {patterns.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">
                        No architectural patterns detected.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {patterns.map((p, i) => (
                            <PatternCard key={`${p.kind}-${i}`} pattern={p} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function PatternCard({ pattern }: { pattern: PatternEntry }) {
    const shownFiles = pattern.files.slice(0, 5);
    const moreFiles = pattern.files.length - shownFiles.length;
    const shownEvidence = pattern.evidence.slice(0, 3);

    return (
        <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-sm">
                    {formatPatternKind(pattern.kind)}
                </div>
                <Badge
                    variant={confidenceBadgeVariant(pattern.confidence)}
                    className={confidenceColorClass(pattern.confidence)}
                >
                    {pattern.confidence.toFixed(2)}
                </Badge>
            </div>
            {pattern.notes && (
                <div className="text-xs text-muted-foreground">
                    {pattern.notes}
                </div>
            )}
            {shownFiles.length > 0 && (
                <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                        Files
                    </div>
                    <ul className="space-y-0.5">
                        {shownFiles.map((f) => (
                            <li
                                key={f}
                                className="font-mono text-xs truncate"
                                title={f}
                            >
                                {f}
                            </li>
                        ))}
                        {moreFiles > 0 && (
                            <li className="text-xs text-muted-foreground">
                                + {moreFiles} more
                            </li>
                        )}
                    </ul>
                </div>
            )}
            {shownEvidence.length > 0 && (
                <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                        Evidence
                    </div>
                    <ul className="space-y-1">
                        {shownEvidence.map((e, i) => (
                            <li
                                key={i}
                                className="font-mono text-xs bg-muted/40 rounded px-2 py-1 break-all"
                            >
                                {e}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─────────────────────── Ownership Radar ───────────────────────

const OWNERSHIP_AXES: Array<{
    key: keyof OwnershipBlock['signals'];
    label: string;
}> = [
    { key: 'sustained_engagement', label: 'Sustained' },
    { key: 'iteration_depth', label: 'Iteration' },
    { key: 'bug_fix_ratio', label: 'Bug-fix' },
    { key: 'review_participation', label: 'Review' },
    { key: 'long_tail_evolution', label: 'Long-tail' },
];

function OwnershipSection({ ownership }: { ownership: OwnershipBlock }) {
    const data = useMemo(
        () =>
            OWNERSHIP_AXES.map((axis) => ({
                subject: axis.label,
                value:
                    ownership.signals[axis.key] == null
                        ? 0
                        : Math.max(
                              0,
                              Math.min(100, ownership.signals[axis.key] as number)
                          ),
            })),
        [ownership]
    );

    const evidenceEntries = Object.entries(ownership.evidence);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Ownership</CardTitle>
                <CardDescription>
                    Multi-signal ownership score with per-signal radar
                    breakdown.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-center">
                    <div className="relative min-h-[280px]">
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart
                                cx="50%"
                                cy="50%"
                                outerRadius="75%"
                                data={data}
                            >
                                <PolarGrid
                                    stroke="var(--border)"
                                    strokeDasharray="3 3"
                                    gridType="polygon"
                                />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{
                                        fontSize: 11,
                                        fill: 'var(--muted-foreground)',
                                        fontFamily:
                                            'ui-monospace, monospace',
                                    }}
                                />
                                <Radar
                                    name="Ownership"
                                    dataKey="value"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.2}
                                    strokeWidth={2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-3xl font-bold font-mono">
                                    {ownership.score.toFixed(0)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    /100
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-xs text-muted-foreground mb-2">
                            Per-signal values
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Signal</TableHead>
                                    <TableHead className="text-right">
                                        Value
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Weight
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {OWNERSHIP_AXES.map((axis) => {
                                    const v = ownership.signals[axis.key];
                                    const w = ownership.weights_used[axis.key];
                                    return (
                                        <TableRow key={axis.key}>
                                            <TableCell className="text-xs">
                                                {axis.label}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                {v == null
                                                    ? '—'
                                                    : v.toFixed(1)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                                {w == null
                                                    ? '—'
                                                    : w.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {evidenceEntries.length > 0 && (
                    <div>
                        <div className="text-xs text-muted-foreground mb-2">
                            Evidence
                        </div>
                        <div className="rounded border bg-muted/30 p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
                            {evidenceEntries.map(([k, v]) => (
                                <div
                                    key={k}
                                    className="flex justify-between gap-4 border-b border-border/40 pb-1 last:border-b-0"
                                >
                                    <span className="text-muted-foreground">
                                        {k}
                                    </span>
                                    <span className="text-right break-all">
                                        {v}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────── Guaranteed Inclusions ───────────────────────

function GuaranteedInclusions({ inclusions }: { inclusions: string[] }) {
    if (!inclusions || inclusions.length === 0) return null;
    return (
        <Card>
            <CardContent className="p-0">
                <Accordion type="single" collapsible>
                    <AccordionItem value="guaranteed" className="border-0">
                        <AccordionTrigger className="px-6">
                            Guaranteed inclusions ({inclusions.length})
                        </AccordionTrigger>
                        <AccordionContent className="px-6">
                            <ul className="space-y-0.5 font-mono text-xs">
                                {inclusions.map((f) => (
                                    <li key={f} className="break-all">
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}
