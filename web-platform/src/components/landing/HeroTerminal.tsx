'use client';

import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useEffect, useState, useRef, useMemo } from 'react';
import { ArrowRight, ExternalLink, Share2, Check, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoreRadial } from '@/components/shared/ScoreRadial';
import type { ScoringState } from './RepoScoreInput';
import type { PublicScanResult, PublicScoreResult } from '@/lib/api';
import { cn } from '@/lib/utils';

interface HeroTerminalProps {
    state: ScoringState;
    scanResult: PublicScanResult | null;
    scoreResult: PublicScoreResult | null;
    repoUrl?: string;
}

const TIER_COLORS: Record<string, string> = {
    ELITE: '#a855f7',
    ADVANCED: '#3b82f6',
    INTERMEDIATE: '#10b981',
    BASIC: '#71717a',
};

const DEMO_REPOS = [
    {
        cmd: 'dhruv0206/Clawckathon',
        stack: 'Python, TypeScript, FastAPI, Next.js, React',
        features: '40/40', arch: '11/15', intent: '11/25', forensics: '5/20',
        score: 67, tier: 'INTERMEDIATE',
    },
    {
        cmd: 'dhruv0206/reddit-calendar',
        stack: 'TypeScript, React, Gemini AI',
        features: '32/40', arch: '10/15', intent: '14/25', forensics: '8/20',
        score: 53, tier: 'INTERMEDIATE',
    },
    {
        cmd: 'dhruv0206/jokes-app',
        stack: 'TypeScript, React',
        features: ' 3/40', arch: ' 2/15', intent: ' 5/25', forensics: ' 4/20',
        score: 14, tier: 'BASIC',
    },
];

/* ── Terminal shell (adapted from Magic UI) ── */
function TerminalShell({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            'w-full rounded-lg border border-zinc-800 bg-[#0d1117] overflow-hidden shadow-2xl shadow-black/50',
            className
        )}>
            <div className="flex items-center px-4 py-2.5 border-b border-zinc-800/80 bg-[#161b22]">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="flex-1 text-center text-[11px] text-zinc-600 font-mono">devproof — zsh</span>
            </div>
            <div className="p-4 h-[340px] overflow-hidden">
                <pre className="font-mono text-[13px] leading-[1.8]">
                    <code className="grid gap-y-0.5">{children}</code>
                </pre>
            </div>
        </div>
    );
}

/* ── Typing animation (from Magic UI pattern) ── */
function TypingText({ children, duration = 50, onComplete, className }: {
    children: string; duration?: number; onComplete?: () => void; className?: string;
}) {
    const [displayed, setDisplayed] = useState('');
    const doneRef = useRef(false);

    useEffect(() => {
        setDisplayed('');
        doneRef.current = false;
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayed(children.slice(0, i));
            if (i >= children.length) {
                clearInterval(interval);
                if (!doneRef.current) { doneRef.current = true; onComplete?.(); }
            }
        }, duration);
        return () => clearInterval(interval);
    }, [children, duration, onComplete]);

    return <span className={className}>{displayed}</span>;
}

/* ── Elapsed timer ── */
function ElapsedTimer() {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return <span className="text-zinc-600 font-mono">{mins}:{String(secs).padStart(2, '0')}</span>;
}

/* ── Animated line that fades in ── */
function AnimLine({ children, className, delay = 0 }: {
    children: React.ReactNode; className?: string; delay?: number;
}) {
    return (
        <motion.span
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: delay / 1000 }}
            className={cn('block', className)}
        >
            {children}
        </motion.span>
    );
}

/* ── Demo sequence (idle — cycles repos) ── */
function DemoSequence() {
    const [repoIdx, setRepoIdx] = useState(0);
    const [step, setStep] = useState(0);
    // 0=typing cmd, 1=scanning, 2=stack, 3=features, 4=arch, 5=intent, 6=forensics, 7=score, 8=done prompt
    const repo = DEMO_REPOS[repoIdx];
    const tierColor = TIER_COLORS[repo.tier] || '#71717a';

    useEffect(() => {
        if (step === 0) return; // typing handles its own
        if (step >= 1 && step <= 7) {
            const delays = [800, 600, 500, 500, 500, 500, 700];
            const t = setTimeout(() => setStep(s => s + 1), delays[step - 1]);
            return () => clearTimeout(t);
        }
        if (step === 8) {
            const t = setTimeout(() => {
                setRepoIdx(i => (i + 1) % DEMO_REPOS.length);
                setStep(0);
            }, 4000);
            return () => clearTimeout(t);
        }
    }, [step]);

    return (
        <>
            {/* Command */}
            <span className="text-zinc-300">
                <span className="text-[#CC785C]">❯ </span>
                <span className="text-zinc-500">devproof score </span>
                {step === 0 ? (
                    <TypingText duration={60} onComplete={() => setStep(1)} className="text-white font-medium">
                        {repo.cmd}
                    </TypingText>
                ) : (
                    <span className="text-white font-medium">{repo.cmd}</span>
                )}
            </span>

            {step >= 1 && <AnimLine className="text-zinc-600">{'  Scanning ' + repo.cmd + '...'}</AnimLine>}
            {step >= 2 && <AnimLine className="text-[#CC785C]">{'  ✓ Stack detected: ' + repo.stack}</AnimLine>}

            {step >= 3 && <span className="block h-1" />}

            {step >= 3 && <AnimLine className="text-zinc-300">{'  Features     '}<span className="text-zinc-500">{repo.features}</span></AnimLine>}
            {step >= 4 && <AnimLine className="text-zinc-300">{'  Architecture '}<span className="text-zinc-500">{repo.arch}</span></AnimLine>}
            {step >= 5 && <AnimLine className="text-zinc-300">{'  Intent       '}<span className="text-zinc-500">{repo.intent}</span></AnimLine>}
            {step >= 6 && <AnimLine className="text-zinc-300">{'  Forensics    '}<span className="text-zinc-500">{repo.forensics}</span></AnimLine>}

            {step >= 7 && (
                <AnimLine className="mt-1 pt-1 border-t border-zinc-800">
                    <span className="text-zinc-500">  Score: </span>
                    <span className="font-bold" style={{ color: tierColor }}>{repo.score}</span>
                    <span className="text-zinc-600">/100</span>
                    <span className="ml-2 text-xs font-bold uppercase" style={{ color: tierColor }}>{repo.tier}</span>
                </AnimLine>
            )}

            {step >= 8 && (
                <AnimLine className="text-zinc-300 mt-1">
                    <span className="text-[#CC785C]">❯ </span>
                    <span className="animate-pulse text-[#CC785C]">▌</span>
                </AnimLine>
            )}
        </>
    );
}

/* ── Live sequence (user's repo) ── */
function LiveSequence({ state, scanResult, scoreResult, repoUrl }: {
    state: ScoringState;
    scanResult: PublicScanResult | null;
    scoreResult: PublicScoreResult | null;
    repoUrl?: string;
}) {
    const repoName = repoUrl?.replace(/https?:\/\/github\.com\//, '') || 'owner/repo';
    const bd = scoreResult?.score_breakdown || {};
    const tier = scoreResult?.tier?.toUpperCase() || 'BASIC';
    const tierColor = TIER_COLORS[tier] || '#71717a';

    const steps = [
        { label: 'Scanning repository...', done: state !== 'scanning' },
        {
            label: scanResult
                ? 'Stack detected: ' + [...(scanResult.stack.languages || []), ...(scanResult.stack.frameworks || [])].join(', ')
                : 'Detecting stack...',
            done: state === 'auditing' || state === 'complete',
            isStack: true,
        },
        { label: 'Deep analysis (~60-90s)...', done: state === 'complete', isAuditStart: true },
        { label: 'Extracting features...', done: state === 'complete' },
        { label: 'Analyzing architecture...', done: state === 'complete' },
        { label: 'Checking intent signals...', done: state === 'complete' },
        { label: 'Running commit forensics...', done: state === 'complete' },
    ];

    return (
        <>
            <span className="text-zinc-300">
                <span className="text-[#CC785C]">❯ </span>
                <span className="text-zinc-500">devproof score </span>
                <span className="text-white font-medium">{repoName}</span>
            </span>

            {steps.map((s, i) => {
                const show = s.done || (i === 0 && state === 'scanning') || (i === 1 && (state === 'scanned' || state === 'auditing')) || (i >= 2 && state === 'auditing') || state === 'complete';
                if (!show) return null;
                return (
                    <AnimLine key={i} className={s.done ? 'text-[#CC785C]' : 'text-zinc-400'}>
                        {s.done ? '  ✓ ' + s.label : (
                            <>{'  '}<motion.span className="text-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }}>⠋</motion.span>{' ' + s.label}</>
                        )}
                    </AnimLine>
                );
            })}

            {state === 'complete' && scoreResult && (
                <>
                    <span className="block h-1" />
                    <AnimLine className="text-zinc-300">{'  Features     '}<span className="text-zinc-500">{String(Math.round(bd.feature_score || 0)).padStart(2)}/40</span></AnimLine>
                    <AnimLine className="text-zinc-300">{'  Architecture '}<span className="text-zinc-500">{String(Math.round(bd.architecture_score || 0)).padStart(2)}/15</span></AnimLine>
                    <AnimLine className="text-zinc-300">{'  Intent       '}<span className="text-zinc-500">{String(Math.round(bd.intent_score || 0)).padStart(2)}/25</span></AnimLine>
                    <AnimLine className="text-zinc-300">{'  Forensics    '}<span className="text-zinc-500">{String(Math.round(bd.forensics_score || 0)).padStart(2)}/20</span></AnimLine>

                    <AnimLine className="mt-1 pt-1 border-t border-zinc-800">
                        <span className="text-zinc-500">  Score: </span>
                        <span className="font-bold" style={{ color: tierColor }}>{Math.round(scoreResult.score)}</span>
                        <span className="text-zinc-600">/100</span>
                        <span className="ml-2 text-xs font-bold uppercase" style={{ color: tierColor }}>{tier}</span>
                    </AnimLine>
                    <AnimLine className="text-[#CC785C]">  ✓ Analysis complete</AnimLine>
                </>
            )}

            {state !== 'complete' && (
                <span className="block mt-1">
                    <span className="animate-pulse text-[#CC785C]">▌</span>
                    {state === 'auditing' && (
                        <span className="ml-3"><ElapsedTimer /></span>
                    )}
                </span>
            )}
        </>
    );
}

/* ── Result card ── */
function ResultCard({ result }: { result: PublicScoreResult }) {
    const tier = result.tier?.toUpperCase() || 'BASIC';
    const tierColor = TIER_COLORS[tier] || '#71717a';
    const bd = result.score_breakdown || {};
    const [copied, setCopied] = useState(false);

    const BUCKETS = [
        { key: 'feature_score', label: 'Features', max: 40, color: '#10b981' },
        { key: 'architecture_score', label: 'Architecture', max: 15, color: '#3b82f6' },
        { key: 'intent_score', label: 'Intent', max: 25, color: '#a855f7' },
        { key: 'forensics_score', label: 'Forensics', max: 20, color: '#f59e0b' },
    ] as const;

    const handleShare = () => {
        const url = `${window.location.origin}/score/${result.owner}/${result.repo}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl shadow-black/20">
            <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${tierColor}, ${tierColor}60)` }} />
            <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="w-3 h-3 text-primary" /> Scored
                        </p>
                        <a href={result.repo_url} target="_blank" rel="noopener noreferrer"
                            className="text-lg font-bold hover:text-primary transition-colors inline-flex items-center gap-1.5">
                            {result.owner}/{result.repo} <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{ color: tierColor, backgroundColor: `${tierColor}15`, border: `1px solid ${tierColor}25` }}>
                        {tier}
                    </span>
                </div>
                <div className="flex gap-6 items-center mb-6">
                    <div className="shrink-0">
                        <ScoreRadial score={Math.round(result.score)} tier={tier} label="TDS" />
                    </div>
                    <div className="flex-1 space-y-3">
                        {BUCKETS.map(bucket => {
                            const val = (bd as Record<string, number | undefined>)[bucket.key] || 0;
                            const pct = Math.min((val / bucket.max) * 100, 100);
                            return (
                                <div key={bucket.key}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">{bucket.label}</span>
                                        <span className="font-mono font-medium">
                                            {Math.round(val)}<span className="text-muted-foreground">/{bucket.max}</span>
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                        <motion.div className="h-full rounded-full" style={{ backgroundColor: bucket.color }}
                                            initial={{ width: '0%' }} animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {result.stack && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {result.stack.languages?.map(l => (
                            <span key={l} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{l}</span>
                        ))}
                        {result.stack.frameworks?.slice(0, 4).map(f => (
                            <span key={f} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{f}</span>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground border-0 gap-1.5">
                        <a href={`/score/${result.owner}/${result.repo}`} target="_blank" rel="noopener noreferrer">
                            View Full Results <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                    </Button>
                    <Button variant="outline" className="gap-1.5" onClick={handleShare}>
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
                        {copied ? 'Copied!' : 'Share'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ── Main export ── */
export function HeroTerminal({ state, scanResult, scoreResult, repoUrl }: HeroTerminalProps) {
    const isLive = state !== 'idle' && state !== 'error';
    const isComplete = state === 'complete' && scoreResult;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-full max-w-2xl mx-auto"
        >
            <AnimatePresence mode="wait">
                {isComplete ? (
                    <motion.div key="card"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                        <ResultCard result={scoreResult} />
                    </motion.div>
                ) : (
                    <motion.div key="terminal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.3 }}>
                        <TerminalShell>
                            <AnimatePresence mode="wait">
                                {isLive ? (
                                    <motion.span key="live" className="contents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <LiveSequence state={state} scanResult={scanResult} scoreResult={scoreResult} repoUrl={repoUrl} />
                                    </motion.span>
                                ) : (
                                    <motion.span key="demo" className="contents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <DemoSequence />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </TerminalShell>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
