'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { getRecentScores, type RecentScore } from '@/lib/api';

const TIER_CONFIG: Record<string, { text: string; bg: string; border: string }> = {
    ELITE: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    ADVANCED: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    INTERMEDIATE: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    BASIC: { text: 'text-zinc-400', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' },
};

const EXAMPLE_SCORES: RecentScore[] = [
    { owner: 'fastapi', repo: 'fastapi', repo_url: 'https://github.com/fastapi/fastapi', score: 91, tier: 'ELITE', discipline: 'Backend / Systems', stack: { languages: ['Python'], frameworks: ['FastAPI', 'Starlette'], libs: [] } },
    { owner: 'vercel', repo: 'next.js', repo_url: 'https://github.com/vercel/next.js', score: 88, tier: 'ADVANCED', discipline: 'Fullstack (Web)', stack: { languages: ['TypeScript'], frameworks: ['React', 'Next.js'], libs: [] } },
    { owner: 'langchain-ai', repo: 'langchain', repo_url: 'https://github.com/langchain-ai/langchain', score: 82, tier: 'ADVANCED', discipline: 'AI / ML Engineering', stack: { languages: ['Python'], frameworks: [], libs: ['LangChain'] } },
];

export function RecentlyScored() {
    const [scores, setScores] = useState<RecentScore[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const data = await getRecentScores(6);
                setScores(data.scores.length > 0 ? data.scores : EXAMPLE_SCORES);
            } catch {
                setScores(EXAMPLE_SCORES);
            }
            setLoaded(true);
        }
        load();
    }, []);

    const displayScores = loaded ? scores : EXAMPLE_SCORES;

    return (
        <section className="py-20 border-t border-border">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                        Recently Scored
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Real projects scored by the 4-bucket engine
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                    {displayScores.slice(0, 6).map((score, index) => {
                        const tier = score.tier?.toUpperCase() || 'BASIC';
                        const config = TIER_CONFIG[tier] || TIER_CONFIG.BASIC;
                        return (
                            <motion.a
                                key={`${score.owner}/${score.repo}`}
                                href={`/score/${score.owner}/${score.repo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 4 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.06 }}
                                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                className="group p-6 rounded-xl border border-border bg-card hover:border-emerald-500/30 hover:bg-card/80 transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base font-semibold truncate group-hover:text-emerald-500 transition-colors flex items-center gap-1">
                                            {score.owner}/{score.repo}
                                            <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </p>
                                        {score.discipline && (
                                            <p className="text-xs text-muted-foreground mt-1">{score.discipline}</p>
                                        )}
                                    </div>
                                    <span className={`shrink-0 ml-3 text-2xl font-bold font-mono ${config.text}`}>
                                        {Math.round(score.score)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {score.stack?.languages?.slice(0, 2).map(l => (
                                            <span key={l} className="px-2 py-0.5 rounded text-[11px] bg-muted text-muted-foreground">{l}</span>
                                        ))}
                                        {score.stack?.frameworks?.slice(0, 2).map(f => (
                                            <span key={f} className="px-2 py-0.5 rounded text-[11px] bg-muted text-muted-foreground">{f}</span>
                                        ))}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
                                        {tier}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-emerald-500 transition-colors pt-3 border-t border-border">
                                    View score
                                    <ArrowUpRight className="w-3 h-3" />
                                </div>
                            </motion.a>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
