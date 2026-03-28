'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

function Counter({ value, inView }: { value: number; inView: boolean }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!inView) return;
        const dur = 1000;
        const start = performance.now();
        const run = (now: number) => {
            const t = Math.min((now - start) / dur, 1);
            setCount(Math.round((1 - Math.pow(1 - t, 3)) * value));
            if (t < 1) requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
    }, [value, inView]);
    return <>{count}</>;
}

export function FeaturesGrid() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, amount: 0.15 });

    const cardClass = 'p-6 rounded-xl border border-border bg-card transform-gpu transition-transform duration-300 hover:-translate-y-[2px]';

    return (
        <section id="features" className="py-24 border-t border-border">
            <div className="container mx-auto px-4 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-14"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                        The 4-Bucket Engine
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        We analyze what you built, how you structured it, and whether the commit history is real.
                    </p>
                </motion.div>

                <div ref={ref} className="grid grid-cols-1 sm:grid-cols-6 gap-4">

                    {/* Features — hero card */}
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4 }}
                        className={`${cardClass} sm:col-span-4`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-[10px] text-emerald-500/60 font-mono uppercase tracking-widest">Bucket A</p>
                            <span className="text-4xl font-bold font-mono text-emerald-500">
                                <Counter value={40} inView={inView} />
                            </span>
                        </div>
                        <h3 className="text-xl font-bold mb-3">Features</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            What you built — custom implementations, algorithms, API integrations. Each feature is evidence-verified against your source code and classified into three complexity tiers.
                        </p>
                        <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                            <div className="p-2.5 rounded-lg bg-muted/50">
                                <span className="text-emerald-500 font-mono font-bold text-sm">20</span>
                                <span className="text-muted-foreground ml-1">pts</span>
                                <p className="mt-1 text-[10px]">Deep — algorithms, custom engines</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-muted/50">
                                <span className="text-blue-500 font-mono font-bold text-sm">6</span>
                                <span className="text-muted-foreground ml-1">pts</span>
                                <p className="mt-1 text-[10px]">Logic — business rules, APIs</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-muted/50">
                                <span className="text-zinc-400 font-mono font-bold text-sm">1</span>
                                <span className="text-muted-foreground ml-1">pt</span>
                                <p className="mt-1 text-[10px]">UI — layouts, styling, markup</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Architecture */}
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.08 }}
                        className={`${cardClass} sm:col-span-2`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-[10px] text-blue-500/60 font-mono uppercase tracking-widest">Bucket B</p>
                            <span className="text-3xl font-bold font-mono text-blue-500">
                                <Counter value={15} inView={inView} />
                            </span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Architecture</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Design patterns, separation of concerns, reusable abstractions. Diminishing returns prevent gaming.
                        </p>
                    </motion.div>

                    {/* Intent */}
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.16 }}
                        className={`${cardClass} sm:col-span-2`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-[10px] text-purple-500/60 font-mono uppercase tracking-widest">Bucket C</p>
                            <span className="text-3xl font-bold font-mono text-purple-500">
                                <Counter value={25} inView={inView} />
                            </span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Intent</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Error handling, config management, test coverage, edge cases. Six quality signals normalized to 25.
                        </p>
                    </motion.div>

                    {/* Forensics */}
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.24 }}
                        className={`${cardClass} sm:col-span-4`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-[10px] text-amber-500/60 font-mono uppercase tracking-widest">Bucket D</p>
                            <span className="text-3xl font-bold font-mono text-amber-500">
                                <Counter value={20} inView={inView} />
                            </span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">Forensics</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                            Commit sessions, fix ratio, message quality, evolution patterns. Detects bulk imports and fake history.
                        </p>
                        <div className="flex gap-4 text-[10px] text-muted-foreground">
                            <span>Session analysis</span>
                            <span className="text-zinc-700">·</span>
                            <span>Time-spread check</span>
                            <span className="text-zinc-700">·</span>
                            <span>Commit authenticity</span>
                            <span className="text-zinc-700">·</span>
                            <span>Evolution mix</span>
                        </div>
                    </motion.div>

                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-xs text-muted-foreground mt-8"
                >
                    Protected by 10 anti-gaming layers including evidence gates, authorship verification, and time-spread analysis.
                </motion.p>
            </div>
        </section>
    );
}
