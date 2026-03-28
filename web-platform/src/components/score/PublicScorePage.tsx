'use client';

import { ScoreRadial } from '@/components/shared/ScoreRadial';
import { ScoreBreakdownChart } from '@/components/shared/ScoreBreakdownChart';
import { ExternalLink, Github, ArrowRight, Share2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth-client';
import { motion } from 'framer-motion';

interface Claim {
    feature: string;
    status: string;
    tier: string;
    tier_reasoning?: string;
    evidence_file?: string;
}

interface ScoreData {
    owner: string;
    repo: string;
    repo_url: string;
    score: number;
    tier: string;
    discipline?: string;
    scoring_version?: number;
    score_breakdown: {
        feature_score?: number;
        architecture_score?: number;
        intent_score?: number;
        forensics_score?: number;
    };
    breakdown_available?: boolean;
    claims?: Claim[];
    stack: { languages: string[]; frameworks: string[]; libs: string[] };
    authorship?: number;
    forensics_data?: Record<string, unknown>;
    scored_at?: string;
}

const TIER_COLORS: Record<string, { color: string; bg: string; border: string }> = {
    ELITE: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    ADVANCED: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    INTERMEDIATE: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    BASIC: { color: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
};

const TIER_CLAIM: Record<string, { label: string; color: string }> = {
    TIER_3_DEEP: { label: 'Deep', color: 'text-purple-400' },
    TIER_2_LOGIC: { label: 'Logic', color: 'text-blue-400' },
    TIER_1_UI: { label: 'UI', color: 'text-zinc-400' },
};

function ClaimStatusIcon({ status }: { status: string }) {
    if (status === 'VERIFIED') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (status === 'WRAPPER') return <Clock className="w-3.5 h-3.5 text-amber-400" />;
    return <XCircle className="w-3.5 h-3.5 text-zinc-500" />;
}

export function PublicScorePage({ data }: { data: ScoreData }) {
    const tier = data.tier?.toUpperCase() || 'BASIC';
    const tierConfig = TIER_COLORS[tier] || TIER_COLORS.BASIC;
    const bd = data.score_breakdown || {};
    const hasBreakdown = !!(bd.feature_score || bd.architecture_score || bd.intent_score || bd.forensics_score);

    const handleShare = () => {
        const shareUrl = `${window.location.origin}/score/${data.owner}/${data.repo}`;
        const text = `${data.owner}/${data.repo} scored ${Math.round(data.score)}/100 (${data.tier}) on DevProof`;
        navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Navbar */}
            <header className="border-b border-border bg-background">
                <div className="container mx-auto px-4 flex items-center justify-between h-14">
                    <a href="/" className="flex items-center gap-2 text-lg font-bold">
                        <span className="text-muted-foreground">&lt;</span>
                        <img src="/logo_transparent.png" alt="DevProof" className="w-6 h-6" />
                        <span>DevProof</span>
                        <span className="text-muted-foreground">/&gt;</span>
                    </a>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Share</span>
                        </Button>
                        <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0" asChild>
                            <a href="/">Score a Repo</a>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-bold">
                            {data.owner}/{data.repo}
                        </h1>
                        <a href={data.repo_url} target="_blank" rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${tierConfig.color} ${tierConfig.bg} ${tierConfig.border}`}>
                            {tier}
                        </span>
                        {data.discipline && (
                            <span className="px-3 py-1 rounded-full text-xs text-muted-foreground bg-muted border border-border">
                                {data.discipline}
                            </span>
                        )}
                        {data.scored_at && (
                            <span className="text-xs text-muted-foreground">
                                Scored {new Date(data.scored_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Score + Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
                >
                    <div className="p-6 rounded-xl border border-border bg-card flex items-center justify-center">
                        <ScoreRadial score={Math.round(data.score)} tier={tier} label="TDS" />
                    </div>
                    <div className="p-6 rounded-xl border border-border bg-card">
                        {hasBreakdown ? (
                            <ScoreBreakdownChart
                                features={bd.feature_score || 0}
                                architecture={bd.architecture_score || 0}
                                intent={bd.intent_score || 0}
                                forensics={bd.forensics_score || 0}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Scored with an older version. Re-score for full breakdown.
                                </p>
                                <a
                                    href={`/?repo=${encodeURIComponent(data.repo_url)}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                                >
                                    Re-score
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Tech Stack */}
                {data.stack && (data.stack.languages?.length > 0 || data.stack.frameworks?.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-6 rounded-xl border border-border bg-card mb-8"
                    >
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tech Stack</h2>
                        <div className="flex flex-wrap gap-2">
                            {data.stack.languages?.map(l => (
                                <span key={l} className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    {l}
                                </span>
                            ))}
                            {data.stack.frameworks?.map(f => (
                                <span key={f} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {f}
                                </span>
                            ))}
                            {data.stack.libs?.slice(0, 8).map(l => (
                                <span key={l} className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                    {l}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Verified Features */}
                {data.claims && data.claims.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-6 rounded-xl border border-border bg-card mb-8"
                    >
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                            Verified Features ({data.claims.length})
                        </h2>
                        <div className="space-y-2">
                            {data.claims.map((claim, i) => {
                                const tierInfo = TIER_CLAIM[claim.tier] || { label: claim.tier, color: 'text-zinc-400' };
                                return (
                                    <div key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                                        <ClaimStatusIcon status={claim.status} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{claim.feature}</span>
                                                <span className={`text-[10px] font-bold uppercase ${tierInfo.color}`}>
                                                    {tierInfo.label}
                                                </span>
                                            </div>
                                            {claim.evidence_file && (
                                                <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                                                    {claim.evidence_file}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-xs shrink-0 ${
                                            claim.status === 'VERIFIED' ? 'text-emerald-500' :
                                            claim.status === 'WRAPPER' ? 'text-amber-400' : 'text-zinc-500'
                                        }`}>
                                            {claim.status}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Forensics Summary */}
                {data.forensics_data && !data.forensics_data.insufficient_data && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-6 rounded-xl border border-border bg-card mb-8"
                    >
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Commit Forensics</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {data.forensics_data.commit_count != null && (
                                <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <p className="text-lg font-bold font-mono">{String(data.forensics_data.commit_count)}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Commits</p>
                                </div>
                            )}
                            {(data.forensics_data.sessions as Record<string, unknown>)?.count != null && (
                                <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <p className="text-lg font-bold font-mono">{String((data.forensics_data.sessions as Record<string, unknown>).count)}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Sessions</p>
                                </div>
                            )}
                            {data.forensics_data.fix_ratio != null && (
                                <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <p className="text-lg font-bold font-mono">{(Number(data.forensics_data.fix_ratio) * 100).toFixed(0)}%</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Fix Ratio</p>
                                </div>
                            )}
                            {data.forensics_data.message_quality != null && (
                                <div className="p-3 rounded-lg bg-muted/50 text-center">
                                    <p className="text-lg font-bold font-mono">{Number(data.forensics_data.message_quality).toFixed(1)}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Msg Quality</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-3 p-6 rounded-xl border border-border bg-card"
                >
                    <Button className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0" asChild>
                        <a href="/">
                            Score Your Own Repo
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() => signIn.social({ provider: 'github', callbackURL: '/dashboard' })}
                    >
                        <Github className="w-4 h-4" />
                        Sign Up to Save to Portfolio
                    </Button>
                </motion.div>

                {/* Badge embed */}
                <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground mb-2">Add this badge to your README:</p>
                    <code className="text-xs bg-muted px-3 py-1.5 rounded-md text-muted-foreground font-mono">
                        {`[![DevProof Score](${typeof window !== 'undefined' ? window.location.origin : 'https://orenda.vision'}/api/badge/score/${data.owner}/${data.repo})](${typeof window !== 'undefined' ? window.location.origin : 'https://orenda.vision'}/score/${data.owner}/${data.repo})`}
                    </code>
                </div>
            </div>
        </div>
    );
}
