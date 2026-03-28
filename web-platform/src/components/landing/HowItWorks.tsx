'use client';

import { motion } from 'framer-motion';

const steps = [
    { num: '01', title: 'Paste', desc: 'Drop any public GitHub repo URL. No signup needed.' },
    { num: '02', title: 'Score', desc: 'AI analyzes code, architecture, and commit patterns in 60 seconds.' },
    { num: '03', title: 'Share', desc: 'Get a shareable score page, OG image, and README badge.' },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-20 border-t border-border">
            <div className="container mx-auto px-4 max-w-3xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <h2 className="text-2xl sm:text-3xl font-bold">
                        How it works
                    </h2>
                </motion.div>

                <div className="space-y-8">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.num}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-6 items-start"
                        >
                            <span className="text-3xl font-bold text-emerald-500/30 font-mono shrink-0 w-10 select-none">
                                {step.num}
                            </span>
                            <div>
                                <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
