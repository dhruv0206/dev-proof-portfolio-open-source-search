'use client';

import { Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

/**
 * Pending-state card shown in the projects list while a V4 audit is
 * still running in the background. Replaces itself with a full
 * ``ProjectShowcaseCard`` once the V4 pipeline flips the project's
 * ``verification_status`` to ``VERIFIED`` — the parent list polls and
 * re-renders with the new data.
 *
 * Kept intentionally plain (no glassmorphism, no gradients) to match
 * the project's UI preferences.
 */
export function PendingProjectCard({
    name,
    repoUrl,
}: {
    name: string;
    repoUrl: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-lg border border-blue-500/30 bg-blue-500/[0.03] p-5 transition-all duration-200"
            style={{ borderTop: '3px solid #3b82f6' }}
        >
            {/* Top Row: Pending indicator + project info */}
            <div className="flex items-start gap-4 mb-4">
                <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-base font-medium truncate">{name}</span>
                        <a
                            href={repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-wider px-1.5 py-0 text-blue-400 border-blue-500/30"
                        >
                            Analyzing
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Middle Row: Status message */}
            <p className="text-xs text-muted-foreground mb-4">
                Deep analysis running — graph, semantic chunks, forensics.
            </p>

            {/* Bottom Row: Progress hint */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Checking every 30s
                </span>
                <span className="font-mono text-[11px] text-blue-500/70">
                    ~1–15 min
                </span>
            </div>
        </motion.div>
    );
}
