'use client';

/**
 * Public /methodology page — the trust play.
 *
 * Shows the calibration set: 20 hand-labeled repos with expected scores,
 * what the algo actually produced, and per-repo drift indicators.
 *
 * Why this exists: hiring managers (and candidates) discount any
 * algorithmic developer score. The remedy isn't a bigger number — it's
 * making the scoring methodology auditable. This page is the receipt.
 *
 * Disagree with a hand-label? Open a PR on
 * `scripts/phase2_calibration_set.yaml` in the algo repo.
 */

import { useState, useMemo } from 'react';
import {
    CALIBRATION_DATA,
    CALIBRATION_LABEL_META,
    DRIFT_META,
    type CalibrationLabel,
    type CalibrationRow,
} from '@/lib/methodology-data';
import { ChevronDown, ChevronRight, ExternalLink, Github, Search, Layers } from 'lucide-react';

const LABEL_ORDER: CalibrationLabel[] = [
    'wrapper',
    'mid-glue',
    'senior-infra',
    'deep-tech',
    'edge-case',
];

function shortRepo(url: string): string {
    return url.replace('https://github.com/', '');
}

function CalibrationRowDetail({ row }: { row: CalibrationRow }) {
    return (
        <div className="px-4 py-3 bg-muted/20 border-t space-y-3">
            {row.hand_notes && (
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        Hand-label rationale
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                        {row.hand_notes}
                    </p>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Score buckets
                    </div>
                    <div className="font-mono mt-0.5 space-y-0.5">
                        <div>Features: {row.features_score ?? '—'}/40</div>
                        <div>Arch: {row.architecture_score ?? '—'}/15</div>
                        <div>Intent: {row.intent_score ?? '—'}/25</div>
                        <div>Forensics: {row.forensics_score ?? '—'}/20</div>
                    </div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Claims
                    </div>
                    <div className="font-mono mt-0.5 space-y-0.5">
                        <div>Total: {row.claim_count}</div>
                        <div>Tier 3: {row.tier3_count}</div>
                        <div>Tradeoffs: {row.tradeoff_count}</div>
                    </div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Algo corrections
                    </div>
                    <div className="font-mono mt-0.5 space-y-0.5">
                        <div>Layer-capped: {row.layer_capped_count}</div>
                        <div>SDK-glue capped: {row.sdk_glue_capped_count}</div>
                    </div>
                </div>
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Audit metadata
                    </div>
                    <div className="font-mono mt-0.5 space-y-0.5">
                        <div>Algo: {row.algo_version}</div>
                        <div>Latency: {(row.total_ms / 1000).toFixed(1)}s</div>
                        <div>{new Date(row.audited_at).toLocaleDateString()}</div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
                <a
                    href={row.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Github className="h-3 w-3" />
                    Repo
                    <ExternalLink className="h-3 w-3" />
                </a>
                <a
                    href={`/score/${shortRepo(row.repo_url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Search className="h-3 w-3" />
                    Full audit
                    <ExternalLink className="h-3 w-3" />
                </a>
            </div>
        </div>
    );
}

function CalibrationRowItem({ row }: { row: CalibrationRow }) {
    const [open, setOpen] = useState(false);
    const driftMeta = DRIFT_META[row.drift_severity];

    return (
        <li className="border rounded-md overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-muted/30 transition-colors"
            >
                <div className="flex items-center gap-2 min-w-0">
                    {open ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-mono text-xs truncate">
                        {shortRepo(row.repo_url)}
                    </span>
                </div>
                <div className="text-right text-xs">
                    <span className="text-muted-foreground">Hand </span>
                    <span className="font-mono font-semibold">{row.hand_score}</span>
                </div>
                <div className="text-right text-xs">
                    <span className="text-muted-foreground">Algo </span>
                    <span className={`font-mono font-bold text-base ${
                        row.drift_severity === 'in_range'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : row.drift_severity === 'soft_drift'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                    }`}>
                        {row.repo_score ?? 'FAIL'}
                    </span>
                </div>
                <div className="text-right text-xs font-mono text-muted-foreground">
                    Δ {row.delta_from_hand !== null ? `${row.delta_from_hand >= 0 ? '+' : ''}${row.delta_from_hand}` : '—'}
                </div>
                <div className={`text-xs font-medium ${driftMeta.color}`}>
                    {driftMeta.emoji} {driftMeta.label}
                </div>
            </button>
            {open && <CalibrationRowDetail row={row} />}
        </li>
    );
}

export default function MethodologyPage() {
    const rows = CALIBRATION_DATA;

    const grouped = useMemo(() => {
        const out: Record<CalibrationLabel, CalibrationRow[]> = {
            wrapper: [],
            'mid-glue': [],
            'senior-infra': [],
            'deep-tech': [],
            'edge-case': [],
        };
        for (const r of rows) out[r.hand_label].push(r);
        return out;
    }, [rows]);

    const stats = useMemo(() => {
        const inRange = rows.filter((r) => r.drift_severity === 'in_range').length;
        const soft = rows.filter((r) => r.drift_severity === 'soft_drift').length;
        const hard = rows.filter((r) => r.drift_severity === 'hard_drift').length;
        const failed = rows.filter((r) => !r.succeeded).length;
        return { inRange, soft, hard, failed, total: rows.length };
    }, [rows]);

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 text-sm font-bold">
                        <span className="text-muted-foreground">&lt;</span>
                        <span>DevProof</span>
                        <span className="text-muted-foreground">/&gt;</span>
                    </a>
                    <a
                        href="https://github.com/dhruv0206/devproof-ranking-algo/blob/master/scripts/phase2_calibration_set.yaml"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Github className="h-3.5 w-3.5" />
                        Open a PR on the calibration set
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 max-w-5xl">
                <section className="mb-12">
                    <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3">
                        <span className="text-primary">*</span> METHODOLOGY <span className="opacity-60">·</span> CALIBRATION_V1
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                        Methodology
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                        We test our developer-scoring algorithm against {stats.total} hand-curated
                        repos covering wrappers, SDK-glue MVPs, senior production infra,
                        and deep-tech foundations. <strong>Here&apos;s how it scores them and how
                        close that lands to a human reviewer&apos;s judgment.</strong>
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                        <div className="p-3 rounded-lg border bg-emerald-500/5">
                            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                {stats.inRange}/{stats.total}
                            </div>
                            <div className="text-xs text-muted-foreground">In expected range</div>
                        </div>
                        <div className="p-3 rounded-lg border bg-amber-500/5">
                            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                                {stats.soft}
                            </div>
                            <div className="text-xs text-muted-foreground">Soft drift (±5)</div>
                        </div>
                        <div className="p-3 rounded-lg border bg-rose-500/5">
                            <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                                {stats.hard}
                            </div>
                            <div className="text-xs text-muted-foreground">Hard drift (&gt;5)</div>
                        </div>
                        <div className="p-3 rounded-lg border">
                            <div className="text-2xl font-bold font-mono text-muted-foreground">
                                {stats.failed}
                            </div>
                            <div className="text-xs text-muted-foreground">Failed audits</div>
                        </div>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-xl font-semibold mb-3">How scoring works</h2>
                    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                        <p>
                            Scores combine four buckets: <strong>Features</strong> (40), <strong>Architecture</strong> (15),{' '}
                            <strong>Intent &amp; Standards</strong> (25), and <strong>Forensics</strong> (20). Total: 100.
                        </p>
                        <p>
                            After the LLM produces tentative claims, we apply two deterministic <strong>caps</strong>:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>
                                <strong>Layer cap</strong>: UI-only claims (frontend components, shaders, audio
                                visualization) cannot reach Tier 3. AI can one-shot most UI work — it's not
                                Engineering Depth.
                            </li>
                            <li>
                                <strong>SDK-glue cap</strong>: claims dominated by external-SDK orchestration
                                (Twilio, LiveKit, OpenAI, etc.) cap at Tier 2 unless the work implements a
                                custom protocol or novel coordination pattern.
                            </li>
                        </ul>
                        <p>
                            The LLM also extracts <strong>"Why X over Y" tradeoffs</strong> for each claim — explicit
                            engineering decisions visible in code or comments, with file:line citations. These
                            are the actual judgment signals hiring managers act on, not the score.
                        </p>
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-xl font-semibold mb-3">Calibration tiers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {LABEL_ORDER.map((label) => {
                            const meta = CALIBRATION_LABEL_META[label];
                            return (
                                <div key={label} className={`p-3 rounded-lg border ${meta.bgColor}`}>
                                    <div className={`text-sm font-semibold ${meta.color}`}>
                                        {meta.label}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                                        Expected: {meta.expectedRange}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                        {meta.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="space-y-8">
                    <h2 className="text-xl font-semibold">Calibration set</h2>
                    {LABEL_ORDER.map((label) => {
                        const items = grouped[label];
                        if (!items || items.length === 0) return null;
                        const meta = CALIBRATION_LABEL_META[label];
                        return (
                            <div key={label}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className={`text-sm font-semibold uppercase tracking-wider ${meta.color}`}>
                                        {meta.label}
                                        <span className="text-muted-foreground ml-2 normal-case font-normal">
                                            ({items.length} {items.length === 1 ? 'repo' : 'repos'})
                                        </span>
                                    </h3>
                                </div>
                                <ul className="space-y-1.5">
                                    {items.map((row) => (
                                        <CalibrationRowItem key={row.repo_url} row={row} />
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </section>

                <section className="mt-16 p-6 rounded-md border border-amber-500/30 bg-amber-500/5">
                    <h2 className="text-lg font-semibold mb-2">Known limitations</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        Two repos in the calibration set drift slightly above
                        expected (within ±5-10 points). Both stem from the same
                        algo behavior: the LLM occasionally dresses up
                        procedural orchestration with state-machine / transformation-engine
                        framing, which the post-LLM rule-9 enforcement catches in
                        most cases but missed these specific phrasings. Documented
                        here transparently — fixing them is on the iteration backlog.
                    </p>
                    <div className="space-y-3">
                        <div className="rounded-md border border-border bg-background/40 p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-xs">asottile/pyupgrade</span>
                                <span className="text-xs">algo <strong>92</strong> · expected 75-88 · <span className="text-amber-600 dark:text-amber-400">+10 over</span></span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Algo flagged "Source-to-Source Transformation Engine" as TIER_3_DEEP.
                                Reading <code className="font-mono">_main.py:141-171</code> reveals
                                the function delegates to <code className="font-mono">tokenize-rt</code>'s
                                <code className="font-mono">parse_format</code> /
                                <code className="font-mono">unparse_parsed_string</code> — procedural
                                wrapping of existing infrastructure, not novel algorithmic work.
                                Should be TIER_2_LOGIC.
                            </p>
                        </div>
                        <div className="rounded-md border border-border bg-background/40 p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-xs">jd/tenacity</span>
                                <span className="text-xs">algo <strong>90</strong> · expected 75-88 · <span className="text-amber-600 dark:text-amber-400">+10 over</span></span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Algo flagged "action-based state machine for retry iteration"
                                as TIER_3_DEEP. Reading <code className="font-mono">__init__.py:405-427</code>:
                                actual code is <code className="font-mono">for action in self.iter_state.actions: action(retry_state)</code>{' — '}
                                a callback queue, not a state machine.
                                Should be TIER_2_LOGIC.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-8 p-6 rounded-md border bg-muted/30">
                    <h2 className="text-lg font-semibold mb-2">Disagree with a score?</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        Hand-labels are subjective. If you think a repo's expected range is
                        wrong, or the algo behaves badly on a class of repo we haven't tested,
                        open a PR on the calibration set. We re-run the corpus on every
                        algorithm change and surface drifts publicly.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://github.com/dhruv0206/devproof-ranking-algo/blob/master/scripts/phase2_calibration_set.yaml"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
                        >
                            <Github className="h-4 w-4" />
                            View calibration_set.yaml
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <a
                            href="https://github.com/dhruv0206/devproof-ranking-algo/blob/master/ALGO_FIX_HANDOFF_2026-05-01.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted transition-colors text-sm"
                        >
                            <Layers className="h-4 w-4" />
                            Latest algo handoff doc
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                </section>

                <footer className="mt-12 pt-6 border-t text-xs text-muted-foreground">
                    <p>
                        Algo version: <span className="font-mono">{rows[0]?.algo_version || 'unknown'}</span>
                        {' · '}
                        Last updated: {rows[0] ? new Date(rows[0].audited_at).toLocaleDateString() : '—'}
                        {' · '}
                        Calibration runs are re-executed on every algorithm change.
                    </p>
                </footer>
            </main>
        </div>
    );
}
