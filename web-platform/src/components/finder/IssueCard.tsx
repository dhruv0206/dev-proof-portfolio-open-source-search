'use client';

import { motion } from 'framer-motion';
import { ChatBubbleLeftIcon, ArrowTopRightOnSquareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { StartWorkingButton } from '@/components/finder/StartWorkingButton';
import { SearchResult } from '@/lib/api';

interface IssueCardProps {
    issue: SearchResult;
    index: number;
    userId?: string;
}

const labelVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'good first issue': 'default',
    'help wanted': 'secondary',
    'bug': 'destructive',
    'documentation': 'outline',
};

function getLabelVariant(label: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const lowerLabel = label.toLowerCase();
    return labelVariants[lowerLabel] || 'outline';
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
}

// Extract repo owner and name from URL
function parseRepoUrl(repoUrl: string): { owner: string; name: string } {
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
        return { owner: match[1], name: match[2] };
    }
    return { owner: '', name: '' };
}

export function IssueCard({ issue, index, userId }: IssueCardProps) {
    const { owner, name } = parseRepoUrl(issue.repo_url);
    const matchPct = Math.round(issue.score * 100);
    const isStrongMatch = matchPct >= 80;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="h-full"
        >
            {/* Bracket-corner card */}
            <div className="relative p-5 bg-[rgba(255,255,255,0.02)] border border-white/[0.06] hover:border-white/[0.14] transition-colors h-full flex flex-col">
                <span aria-hidden className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-white/[0.18]" />
                <span aria-hidden className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/[0.18]" />
                <span aria-hidden className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-white/[0.18]" />
                <span aria-hidden className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-white/[0.18]" />

                {/* Repository Info */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
                    <a
                        href={issue.repo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[12px] tracking-tight hover:text-primary transition-colors"
                    >
                        {issue.repo_full_name}
                    </a>
                    <span className="flex items-center gap-1">
                        <StarIconSolid className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-mono tabular-nums text-xs">{formatNumber(issue.repo_stars)}</span>
                    </span>
                    {issue.language && (
                        <Badge variant="outline" className="text-xs">
                            {issue.language}
                        </Badge>
                    )}
                </div>

                {/* Issue Title */}
                <h3 className="text-base font-semibold leading-snug mb-3">
                    <a
                        href={issue.issue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors flex items-start gap-2"
                    >
                        <span className="font-mono text-muted-foreground text-sm shrink-0">#{issue.issue_number}</span>
                        <span className="flex-1">{issue.title}</span>
                        <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-50" />
                    </a>
                </h3>

                {/* Issue Body Preview */}
                {issue.body && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {issue.body}
                    </p>
                )}

                {/* Labels */}
                {issue.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {issue.labels.slice(0, 5).map((label) => (
                            <Badge key={label} variant={getLabelVariant(label)} className="text-xs">
                                {label}
                            </Badge>
                        ))}
                        {issue.labels.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                                +{issue.labels.length - 5} more
                            </Badge>
                        )}
                    </div>
                )}

                {/* Footer — mono stats row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap mt-auto pt-3 border-t border-white/[0.06]">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 cursor-help">
                                {issue.has_claimer && (!issue.assignees_count || issue.assignees_count === 0) && (
                                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                                )}
                                <ChatBubbleLeftIcon className="h-4 w-4" />
                                <span className="font-mono tabular-nums">{issue.comments_count}</span>
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{issue.comments_count} comments</p>
                            {issue.has_claimer && (!issue.assignees_count || issue.assignees_count === 0) && (
                                <p className="text-amber-500">Someone may already be working on this issue</p>
                            )}
                        </TooltipContent>
                    </Tooltip>
                    <span>Created: {formatDate(issue.created_at)}</span>
                    <span>Updated: {formatDate(issue.updated_at)}</span>
                    <span className="ml-auto flex items-center gap-2">
                        <span
                            className={`font-mono text-[10px] tracking-[0.08em] uppercase tabular-nums ${
                                isStrongMatch ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        >
                            MATCH <span className="opacity-60">·</span> {matchPct}%
                        </span>
                        <StartWorkingButton
                            issueUrl={issue.issue_url}
                            repoOwner={owner}
                            repoName={name}
                            issueNumber={issue.issue_number}
                            issueTitle={issue.title}
                            userId={userId}
                        />
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
