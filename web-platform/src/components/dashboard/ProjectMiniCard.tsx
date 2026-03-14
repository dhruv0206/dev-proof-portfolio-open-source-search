'use client';

import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ProjectMiniCardProps {
    name: string;
    score: number;
    tier: string;
    discipline?: string;
    languages: string[];
    index: number;
}

const tierColors: Record<string, string> = {
    ELITE: '#a855f7',
    ADVANCED: '#3b82f6',
    INTERMEDIATE: '#10b981',
    BASIC: '#737373',
};

export function ProjectMiniCard({
    name,
    score,
    tier,
    discipline,
    languages,
    index,
}: ProjectMiniCardProps) {
    const color = tierColors[tier?.toUpperCase()] || tierColors.BASIC;
    const pct = Math.min((score / 100) * 100, 100);

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
        >
            {/* Score pill */}
            <div
                className="flex items-center justify-center w-11 h-11 rounded-lg font-mono text-sm font-bold shrink-0"
                style={{
                    color,
                    backgroundColor: `${color}15`,
                    border: `1px solid ${color}30`,
                }}
            >
                {score.toFixed(0)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                    {name}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                    {discipline && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                            {discipline}
                        </span>
                    )}
                    {languages.slice(0, 2).map((l) => (
                        <Badge key={l} variant="secondary" className="text-[9px] h-4 px-1.5 font-mono">
                            {l}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Score bar — wider with brighter track */}
            <div className="w-20 shrink-0">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
