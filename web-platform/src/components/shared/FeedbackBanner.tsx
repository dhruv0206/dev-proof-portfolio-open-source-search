'use client';

import { useState } from 'react';
import { X, MessageSquare, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FeedbackBanner({ className }: { className?: string }) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className={cn(
            "relative bg-blue-600/10 border-b border-blue-600/20 px-4 py-3 text-sm",
            className
        )}>
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1 text-blue-900 dark:text-blue-100">
                    <p className="font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        We value your feedback!
                    </p>
                    <p className="text-muted-foreground dark:text-blue-200/80">
                        If you have any doubts, feedback, or think the projects audit is not up to the mark, please reach out.
                    </p>
                    <p className="text-xs opacity-90 mt-1">
                        We are working everyday to make the platform better. Profile updates coming soon!
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <a
                        href="mailto:dhruv0128@gmail.com"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-medium transition-colors"
                    >
                        <Mail className="h-3 w-3" />
                        Email Founder
                    </a>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-600/20"
                        onClick={() => setIsVisible(false)}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Dismiss</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
