'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BentoCardProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    highlight?: boolean;
}

export function BentoCard({ children, className, delay = 0, highlight = false }: BentoCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
                'rounded-xl border border-border bg-card p-5',
                'hover:border-border/80 transition-colors duration-200',
                highlight && 'border-emerald-500/30 hover:border-emerald-500/40',
                className
            )}
        >
            {children}
        </motion.div>
    );
}

export function BentoLabel({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={cn("text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>
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
        <span className={cn('text-3xl font-bold font-mono tabular-nums', className)}>
            {children}
        </span>
    );
}
