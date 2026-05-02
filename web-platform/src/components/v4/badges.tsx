'use client';

/**
 * Shared V4 badge components.
 *
 * Pulled out of /dev/v4-debug/page.tsx so the production user-facing
 * surfaces (PublicScorePage, VerifiedClaimsSection, ProjectShowcaseCard,
 * ProjectDetailPanel, etc.) can render the same algorithmic-judgment
 * signals hiring managers need to see.
 *
 * All components consume types from `@/lib/types/v4-output`.
 */

import type { Claim, ClaimLayer } from '@/lib/types/v4-output';

// ─── Layer ────────────────────────────────────────────────────────────────

const LAYER_CLASSES: Record<ClaimLayer, string> = {
    UI: 'bg-pink-500/10 text-pink-700 border-pink-500/30 dark:text-pink-400',
    APP_LOGIC: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400',
    SERVICE: 'bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-400',
    INFRA: 'bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-400',
    SYSTEMS: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
};

const LAYER_LABEL: Record<ClaimLayer, string> = {
    UI: 'UI',
    APP_LOGIC: 'App Logic',
    SERVICE: 'Service',
    INFRA: 'Infra',
    SYSTEMS: 'Systems',
};

export function LayerBadge({ layer }: { layer: ClaimLayer }) {
    return (
        <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase tracking-wider ${LAYER_CLASSES[layer]}`}
            title="Architectural layer of this claim's evidence files"
        >
            {LAYER_LABEL[layer]}
        </span>
    );
}

// ─── Cap badges ──────────────────────────────────────────────────────────

export function LayerCappedBadge() {
    return (
        <span
            className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400"
            title="Tier was reduced by the layer-aware cap — UI-only claims cannot reach Engineering Depth (AI can one-shot most UI work)"
        >
            Layer-Capped
        </span>
    );
}

export function SdkGlueCappedBadge() {
    return (
        <span
            className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400"
            title="Tier was reduced by the SDK-glue cap — claim is dominated by external-SDK orchestration (>50% of code is plumbing into Twilio/LiveKit/OpenAI/etc.). SDK orchestration, even sophisticated, is TIER_2 unless it implements a custom protocol or novel coordination."
        >
            SDK-Glue-Capped
        </span>
    );
}

export function Rule9CappedBadge() {
    return (
        <span
            className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium uppercase bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400"
            title="Tier was reduced by rule-9 enforcement — the LLM tagged this TIER_3_DEEP but its reasoning didn't explicitly cite one of the rule-5 (a)-(f) sub-criteria (novel algorithm / distributed primitive / custom protocol / performance-critical / compiled cross-file / systems-level). Generic phrases like 'complex orchestration' aren't sufficient evidence for Engineering Depth."
        >
            Rule-9-Capped
        </span>
    );
}

// ─── SDK package chip ────────────────────────────────────────────────────

export function SdkPackageChip({ pkg }: { pkg: string }) {
    return (
        <span
            className="inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono bg-muted/40 text-muted-foreground border-border"
            title={`External SDK detected in this claim's evidence: ${pkg}`}
        >
            {pkg}
        </span>
    );
}

export function SdkPackageList({ packages }: { packages: string[] }) {
    if (!packages || packages.length === 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
                SDKs:
            </span>
            {packages.map((pkg) => (
                <SdkPackageChip key={pkg} pkg={pkg} />
            ))}
        </div>
    );
}

// ─── "Engineering Judgment · Why X over Y" tradeoffs panel ───────────────

export function TradeoffsPanel({ tradeoffs }: { tradeoffs: string[] }) {
    if (!tradeoffs || tradeoffs.length === 0) return null;
    return (
        <div className="rounded border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                Engineering Judgment · Why X over Y
            </div>
            <ul className="space-y-1 list-none">
                {tradeoffs.map((t, i) => (
                    <li
                        key={i}
                        className="text-xs text-foreground/90 leading-relaxed"
                    >
                        <span className="text-emerald-600 dark:text-emerald-400 mr-1.5">
                            →
                        </span>
                        {t}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Convenience: render every algorithmic signal for a claim in one row ─

export function ClaimAlgorithmicBadges({ claim }: { claim: Claim }) {
    return (
        <>
            {claim.layer && <LayerBadge layer={claim.layer} />}
            {claim.layer_capped && <LayerCappedBadge />}
            {claim.sdk_glue_capped && <SdkGlueCappedBadge />}
            {claim.rule9_capped && <Rule9CappedBadge />}
        </>
    );
}
