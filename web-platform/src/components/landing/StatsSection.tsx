'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

const stats = [
    { value: 10000, suffix: '+', label: 'Issues Indexed' },
    { value: 500, suffix: '+', label: 'PRs Verified' },
    { value: 50, suffix: '+', label: 'Repos Tracked' },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;

        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [isInView, value]);

    return (
        <span ref={ref} className="tabular-nums">
            {count.toLocaleString()}{suffix}
        </span>
    );
}

export function StatsSection() {
    return (
        <section className="py-16 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="glass rounded-2xl p-8 md:p-12"
                >
                    <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-4xl md:text-5xl font-bold text-emerald-500 mb-2">
                                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                                </div>
                                <div className="text-muted-foreground">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
