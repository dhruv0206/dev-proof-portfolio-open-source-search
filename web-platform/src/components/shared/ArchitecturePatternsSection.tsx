'use client';

import type { ArchitecturePatternV4 } from '@/lib/types/v4-output';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';

/**
 * V4-exclusive section — renders the high-level architectural patterns
 * the pipeline detected (router, middleware chain, plugin registry, etc.).
 *
 * Intentionally plain per project UI preferences: no glassmorphism, just a
 * muted header + a list. Returns null if there are no patterns to show, so
 * callers can mount it unconditionally.
 */
export function ArchitecturePatternsSection({
    patterns,
}: {
    patterns: ArchitecturePatternV4[];
}) {
    if (!patterns || patterns.length === 0) return null;

    return (
        <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Network className="h-3.5 w-3.5" />
                Architecture Patterns
            </h3>
            <ul className="space-y-2">
                {patterns.map((p, i) => (
                    <li
                        key={`${p.name}-${i}`}
                        className="flex items-start justify-between gap-3 text-sm border rounded-md px-3 py-2"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{p.name}</span>
                                <Badge
                                    variant={p.type === 'ADVANCED' ? 'default' : 'secondary'}
                                    className="text-[10px] uppercase tracking-wider px-1.5 py-0"
                                >
                                    {p.type === 'ADVANCED' ? 'Advanced' : 'Standard'}
                                </Badge>
                            </div>
                            {p.files.length > 0 && (
                                <p className="text-[11px] text-muted-foreground mt-1 font-mono truncate">
                                    {p.files.slice(0, 3).join(', ')}
                                    {p.files.length > 3 && ` +${p.files.length - 3} more`}
                                </p>
                            )}
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                            {p.files.length} {p.files.length === 1 ? 'file' : 'files'}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
