'use client';

import { aggregateSkills, type Claim, type SkillDepth } from '@/lib/types/v4-output';
import { Sparkles } from 'lucide-react';

/**
 * V4-exclusive section — aggregates the ``skills_demonstrated`` arrays across
 * every claim and renders a deduped, depth-sorted chip list. Meant for
 * recruiter-facing surfaces where "what this dev can do" matters more than
 * "what this repo does".
 *
 * Returns null when nothing to show.
 */

const DEPTH_STYLES: Record<SkillDepth, string> = {
    EXPERT: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    PROFICIENT: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    WORKING: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    BEGINNER: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
};

const DEPTH_LABEL: Record<SkillDepth, string> = {
    EXPERT: 'Expert',
    PROFICIENT: 'Proficient',
    WORKING: 'Working',
    BEGINNER: 'Beginner',
};

export function SkillsDemonstratedSection({ claims }: { claims: Claim[] }) {
    const skills = aggregateSkills(claims ?? []);
    if (skills.length === 0) return null;

    return (
        <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Skills Demonstrated
                <span className="text-[11px] text-muted-foreground font-normal">
                    ({skills.length})
                </span>
            </h3>
            <div className="flex flex-wrap gap-1.5 max-w-full">
                {skills.map((s) => (
                    <span
                        key={s.skill_id}
                        className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border whitespace-nowrap max-w-full ${DEPTH_STYLES[s.depth]}`}
                        title={`${s.skill_id} — ${DEPTH_LABEL[s.depth]}`}
                    >
                        <span className="truncate">{s.skill_id}</span>
                        <span className="text-[10px] opacity-70 shrink-0">{DEPTH_LABEL[s.depth]}</span>
                    </span>
                ))}
            </div>
        </section>
    );
}
