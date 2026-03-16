'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreRadialProps {
    score: number;
    tier: string;
    label?: string;
}

const tierConfig: Record<string, { color: string; glow: string; bg: string }> = {
    ELITE: { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.3)', bg: 'rgba(168, 85, 247, 0.08)' },
    ADVANCED: { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)', bg: 'rgba(59, 130, 246, 0.08)' },
    INTERMEDIATE: { color: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', bg: 'rgba(16, 185, 129, 0.08)' },
    BASIC: { color: '#737373', glow: 'rgba(115, 115, 115, 0.2)', bg: 'rgba(115, 115, 115, 0.08)' },
};

export function ScoreRadial({ score, tier, label = 'Best TDS' }: ScoreRadialProps) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const config = tierConfig[tier?.toUpperCase()] || tierConfig.BASIC;

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(score / 100, 1);

    useEffect(() => {
        const duration = 1200;
        const start = performance.now();
        const animate = (now: number) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setAnimatedScore(Math.round(eased * score));
            if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [score]);

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative">
                <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="none"
                        stroke="var(--border)"
                        strokeWidth="8"
                    />
                    <motion.circle
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="none"
                        stroke={config.color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference * (1 - progress) }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        transform="rotate(-90 90 90)"
                        style={{
                            filter: `drop-shadow(0 0 8px ${config.glow})`,
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                        className="text-4xl font-bold font-mono tabular-nums"
                        style={{ color: config.color }}
                    >
                        {animatedScore}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                        {label}
                    </span>
                </div>
            </div>
            <div
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{
                    color: config.color,
                    backgroundColor: config.bg,
                    border: `1px solid ${config.color}20`,
                }}
            >
                {tier}
            </div>
        </div>
    );
}
