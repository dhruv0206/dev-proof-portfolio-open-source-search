'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BentoCardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    highlight?: boolean;
    /** Optional 2-character index shown in the top-left corner ("01", "02", etc.) */
    index?: string;
    /** Optional status token shown in the top-right corner ("OK", "LIVE", "OFFLINE", etc.) */
    status?: string;
    /** Visual treatment. "bracket" adds L-shaped bracket-corner accents and removes the full border. */
    variant?: 'default' | 'bracket';
}

export function BentoCard({
    children,
    className,
    delay = 0,
    highlight = false,
    index,
    status,
    variant = 'bracket',
}: BentoCardProps) {
    const isBracket = variant === 'bracket';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                'relative bg-card p-5 transition-colors duration-200',
                isBracket
                    ? 'border border-border/40 hover:border-border/70'
                    : 'rounded-xl border border-border hover:border-border/80',
                highlight && (isBracket
                    ? 'border-primary/40 hover:border-primary/60'
                    : 'border-primary/30 hover:border-primary/40'),
                className
            )}
        >
            {isBracket && (
                <>
                    {/* Bracket-corner accents */}
                    <span className="pointer-events-none absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-foreground/[0.18]" />
                    <span className="pointer-events-none absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-foreground/[0.18]" />
                    <span className="pointer-events-none absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-foreground/[0.18]" />
                    <span className="pointer-events-none absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-foreground/[0.18]" />

                    {/* Optional micro-labels */}
                    {index && (
                        <span className="pointer-events-none absolute top-1.5 left-3 font-mono text-[9px] tracking-[0.1em] text-muted-foreground/70 select-none">
                            {index}
                        </span>
                    )}
                    {status && (
                        <span className="pointer-events-none absolute top-1.5 right-3 font-mono text-[9px] tracking-[0.1em] text-primary/80 uppercase select-none">
                            [{status}]
                        </span>
                    )}
                </>
            )}
            {children}
        </motion.div>
    );
}

/**
 * BentoLabel renders a section label in mono caps with a `·` separator pattern.
 * Pass either:
 *   <BentoLabel>STATS · VERIFIED_PRS</BentoLabel>      (children form)
 *   <BentoLabel section="STATS" sub="VERIFIED_PRS" />  (props form)
 */
export function BentoLabel({
    children,
    className,
    section,
    sub,
}: {
    children?: React.ReactNode;
    className?: string;
    section?: string;
    sub?: string;
}) {
    if (section || sub) {
        return (
            <span
                className={cn(
                    'font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground',
                    className,
                )}
            >
                {section && <span>{section}</span>}
                {section && sub && <span className="opacity-50 mx-1.5">·</span>}
                {sub && <span>{sub}</span>}
            </span>
        );
    }
    return (
        <span
            className={cn(
                'font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground',
                className,
            )}
        >
            {children}
        </span>
    );
}

export function BentoValue({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'font-mono text-4xl font-bold tabular-nums tracking-[-0.02em] text-foreground',
                className,
            )}
        >
            {children}
        </span>
    );
}
