'use client';

import { motion } from 'framer-motion';
import { Link2, Eye, BadgeCheck, ArrowUpRight } from 'lucide-react';

const steps = [
    {
        icon: BadgeCheck,
        title: 'Score your repos',
        desc: 'Get an AI-verified score that reflects what you actually built — not just stars or commit counts.',
    },
    {
        icon: Link2,
        title: 'Share one link',
        desc: 'Your public profile at devproof.dev/p/you — a single URL with every scored project and your overall tier.',
    },
    {
        icon: Eye,
        title: 'Stand out to recruiters',
        desc: 'Hiring managers see evidence-backed proof of your skills instead of self-reported bullet points.',
    },
];

export function HiringSection() {
    return (
        <section className="py-24 border-t border-border">
            <div className="container mx-auto px-4 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-14"
                >
                    <p className="text-[10px] text-emerald-500/60 font-mono uppercase tracking-widest mb-3">
                        For your next job
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                        A Portfolio Recruiters Actually Trust
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Resumes list skills. DevProof proves them. Build a verified portfolio and share it anywhere.
                    </p>
                </motion.div>

                {/* Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, y: 4 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            className="p-6 rounded-xl border border-border bg-card hover:-translate-y-[2px] transform-gpu transition-transform duration-300"
                        >
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                                <step.icon className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono mb-2">
                                Step {i + 1}
                            </p>
                            <h3 className="text-base font-bold mb-2">{step.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Mock profile preview */}
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mt-10 mx-auto max-w-2xl"
                >
                    <div className="rounded-xl border border-border bg-card p-5">
                        {/* URL bar */}
                        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                            <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                            </div>
                            <span className="text-xs text-muted-foreground font-mono ml-2">
                                devproof.dev/p/<span className="text-emerald-500">yourname</span>
                            </span>
                        </div>

                        {/* Mock profile content */}
                        <div className="flex items-start gap-4">
                            {/* Avatar placeholder */}
                            <div className="w-12 h-12 rounded-full bg-muted border border-border shrink-0 flex items-center justify-center">
                                <span className="text-lg font-bold text-muted-foreground">D</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-bold">yourname</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        ADVANCED
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">Fullstack Developer</p>

                                {/* Mini score cards */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { name: 'my-saas-app', score: 74, color: 'text-blue-400' },
                                        { name: 'ml-pipeline', score: 82, color: 'text-purple-400' },
                                        { name: 'cli-tool', score: 61, color: 'text-emerald-400' },
                                    ].map((project) => (
                                        <div
                                            key={project.name}
                                            className="p-2 rounded-lg bg-muted/50 border border-border"
                                        >
                                            <p className="text-[11px] font-medium truncate">{project.name}</p>
                                            <p className={`text-sm font-bold font-mono ${project.color}`}>{project.score}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Bottom hint */}
                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <span>Shareable. Verified. Always up to date.</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
