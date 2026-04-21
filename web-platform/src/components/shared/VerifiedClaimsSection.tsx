'use client';

import { useState } from 'react';
import type { Claim, FeatureType, RepoTierV4 } from '@/lib/types/v4-output';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Layers,
    FileCode,
    Plus,
    Minus,
} from 'lucide-react';

/**
 * V4-aware verified features renderer — shows the full claim payload V4
 * produces (feature_type, cross_file, tier_reasoning, all evidence files)
 * instead of the minimal legacy V3-shape view.
 *
 * Each claim is expandable: collapsed by default for density, clickable
 * to reveal the tier reasoning + every evidence file with line ranges.
 *
 * Progressive disclosure: when total claim count exceeds PROGRESSIVE_LIMIT
 * we show the first N (prioritised by tier: Deep Tech > Core Logic >
 * Essentials) with a "Show N more" toggle. Keeps the recruiter-scan
 * view tight while allowing full depth on demand.
 */

const PROGRESSIVE_LIMIT = 8;

const TIER_GROUPS: { label: string; key: RepoTierV4 }[] = [
    { label: 'Deep Tech', key: 'TIER_3_DEEP' },
    { label: 'Core Logic', key: 'TIER_2_LOGIC' },
    { label: 'Essentials', key: 'TIER_1_UI' },
];

const TIER_TEXT: Record<RepoTierV4, string> = {
    TIER_3_DEEP: 'text-purple-400',
    TIER_2_LOGIC: 'text-blue-400',
    TIER_1_UI: 'text-neutral-400',
};

const FEATURE_TYPE_STYLE: Record<FeatureType, string> = {
    CUSTOM: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    COMPLEX: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    WRAPPER: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
};

function groupClaims(claims: Claim[]): { label: string; key: RepoTierV4; items: Claim[] }[] {
    return TIER_GROUPS.map((g) => ({
        ...g,
        items: claims.filter((c) => c.tier === g.key),
    })).filter((g) => g.items.length > 0);
}

/**
 * Trim groups so the flat list totals at most ``limit`` claims, drawing
 * from higher-tier groups first (TIER_3_DEEP > TIER_2_LOGIC > TIER_1_UI).
 * Any group that runs out of budget becomes empty and is dropped.
 */
function applyProgressiveLimit(
    groups: { label: string; key: RepoTierV4; items: Claim[] }[],
    limit: number,
): { label: string; key: RepoTierV4; items: Claim[] }[] {
    let remaining = limit;
    const trimmed: typeof groups = [];
    for (const g of groups) {
        if (remaining <= 0) break;
        const take = Math.min(g.items.length, remaining);
        trimmed.push({ ...g, items: g.items.slice(0, take) });
        remaining -= take;
    }
    return trimmed;
}

function ClaimRow({ claim }: { claim: Claim }) {
    const [open, setOpen] = useState(false);
    const hasExpandableDetail =
        (claim.tier_reasoning && claim.tier_reasoning.length > 0) ||
        (claim.evidence && claim.evidence.length > 0);

    return (
        <li className="border rounded-md overflow-hidden">
            <button
                type="button"
                onClick={() => hasExpandableDetail && setOpen((o) => !o)}
                disabled={!hasExpandableDetail}
                className="w-full flex items-start gap-2 text-sm px-3 py-2 text-left hover:bg-muted/30 transition-colors disabled:hover:bg-transparent disabled:cursor-default"
            >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{claim.feature}</span>
                        <Badge
                            variant="outline"
                            className={`text-[10px] uppercase tracking-wider px-1.5 py-0 ${FEATURE_TYPE_STYLE[claim.feature_type]}`}
                        >
                            {claim.feature_type}
                        </Badge>
                        {claim.cross_file && (
                            <Badge
                                variant="outline"
                                className="text-[10px] uppercase tracking-wider px-1.5 py-0 text-emerald-400 border-emerald-500/30"
                                title="Spans multiple files — architectural work"
                            >
                                <Layers className="h-2.5 w-2.5 mr-1" />
                                Cross-file
                            </Badge>
                        )}
                    </div>
                    {claim.evidence && claim.evidence.length > 0 && (
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                            {claim.evidence[0].file}
                            {claim.evidence.length > 1 &&
                                ` +${claim.evidence.length - 1} more`}
                        </p>
                    )}
                </div>
                {hasExpandableDetail && (
                    open ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    )
                )}
            </button>

            {open && hasExpandableDetail && (
                <div className="px-3 py-2 border-t bg-muted/20 space-y-2">
                    {claim.tier_reasoning && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {claim.tier_reasoning}
                        </p>
                    )}
                    {claim.evidence && claim.evidence.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                                Evidence ({claim.evidence.length})
                            </p>
                            <ul className="space-y-0.5">
                                {claim.evidence.map((e, i) => (
                                    <li
                                        key={`${e.file}-${i}`}
                                        className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground"
                                    >
                                        <FileCode className="h-3 w-3 shrink-0" />
                                        <span className="truncate" title={`${e.file}:${e.lines[0]}-${e.lines[1]}`}>
                                            {e.file}
                                            <span className="text-muted-foreground/60">:{e.lines[0]}-{e.lines[1]}</span>
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 shrink-0">
                                            {e.role}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </li>
    );
}

export function VerifiedClaimsSection({ claims }: { claims: Claim[] }) {
    const [showAll, setShowAll] = useState(false);

    if (!claims || claims.length === 0) return null;
    const allGroups = groupClaims(claims);
    const needsProgressive = claims.length > PROGRESSIVE_LIMIT;
    const displayGroups = needsProgressive && !showAll
        ? applyProgressiveLimit(allGroups, PROGRESSIVE_LIMIT)
        : allGroups;
    const hiddenCount = claims.length - PROGRESSIVE_LIMIT;

    return (
        <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Verified Features ({claims.length})
            </h3>
            <div className="space-y-4">
                {displayGroups.map((g) => (
                    <div key={g.key}>
                        <p className={`text-xs font-medium mb-1.5 ${TIER_TEXT[g.key]}`}>
                            {g.label} ({g.items.length})
                        </p>
                        <ul className="space-y-1.5">
                            {g.items.map((c) => (
                                <ClaimRow key={c.claim_id || c.feature} claim={c} />
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {needsProgressive && (
                <button
                    type="button"
                    onClick={() => setShowAll((s) => !s)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    {showAll ? (
                        <>
                            <Minus className="h-3 w-3" />
                            Show fewer
                        </>
                    ) : (
                        <>
                            <Plus className="h-3 w-3" />
                            Show {hiddenCount} more feature{hiddenCount !== 1 ? 's' : ''}
                        </>
                    )}
                </button>
            )}
        </section>
    );
}
