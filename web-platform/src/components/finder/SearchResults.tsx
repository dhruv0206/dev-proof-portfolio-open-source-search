'use client';

import { motion } from 'framer-motion';
import { SearchResult } from '@/lib/api';
import { IssueCard } from './IssueCard';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';

interface SearchResultsProps {
    results: SearchResult[];
    isLoading: boolean;
    userId?: string;
}

export function SearchResults({ results, isLoading, userId }: SearchResultsProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div
                        key={i}
                        className="relative p-5 bg-[rgba(255,255,255,0.02)] border border-white/[0.06]"
                    >
                        <span aria-hidden className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/[0.18]" />
                        <span aria-hidden className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/[0.18]" />
                        <span aria-hidden className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-white/[0.18]" />
                        <span aria-hidden className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/[0.18]" />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                            <div className="flex gap-2 pt-2">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return null;
    }

    return (
        <TooltipProvider>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
            >
                <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mb-4">
                    RESULTS <span className="opacity-60">·</span> <span className="tabular-nums text-foreground">{results.length}</span> CONTRIBUTION_OPPORTUNITIES
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {results.map((issue, index) => (
                        <IssueCard key={issue.issue_id} issue={issue} index={index} userId={userId} />
                    ))}
                </div>
            </motion.div>
        </TooltipProvider>
    );
}
