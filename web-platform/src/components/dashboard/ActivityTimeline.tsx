'use client';

import {
    GitPullRequest,
    PlayCircle,
    CheckCircle2,
} from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'started' | 'submitted' | 'verified';
    issueTitle: string;
    repoName: string;
    timestamp: string;
}

interface ActivityTimelineProps {
    activities: ActivityItem[];
}

const activityConfig = {
    started: {
        icon: PlayCircle,
        label: 'Started',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        dotColor: 'bg-blue-500',
    },
    submitted: {
        icon: GitPullRequest,
        label: 'PR Submitted',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        dotColor: 'bg-amber-500',
    },
    verified: {
        icon: CheckCircle2,
        label: 'Verified',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        dotColor: 'bg-green-500',
    },
};

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
    return (
        <div>
            {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-4">
                    No activity yet. Start tracking an issue to see your progress here.
                </p>
            ) : (
                <div className="mt-4 space-y-0">
                    {activities.slice(0, 8).map((activity, index) => {
                        const config = activityConfig[activity.type];
                        return (
                            <div key={activity.id} className="flex gap-3 group">
                                {/* Timeline column */}
                                <div className="flex flex-col items-center w-5 shrink-0">
                                    <div className={`w-2 h-2 rounded-full ${config.dotColor} mt-2 shrink-0`} />
                                    {index < activities.length - 1 && (
                                        <div className="w-px flex-1 bg-border" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-4 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm truncate">
                                                <span className={`font-medium ${config.color}`}>
                                                    {config.label}
                                                </span>
                                                {' '}
                                                <span className="text-muted-foreground">·</span>
                                                {' '}
                                                <span className="font-medium">{activity.issueTitle}</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[11px] text-muted-foreground font-mono">
                                                    {activity.repoName}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 font-mono">
                                            {formatRelativeTime(activity.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
