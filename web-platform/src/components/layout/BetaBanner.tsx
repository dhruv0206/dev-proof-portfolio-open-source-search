'use client';

import { Sparkles } from 'lucide-react';

export function BetaBanner() {
    return (
        <div className="bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 border-b border-primary/20 px-8 py-2.5">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                <span className="text-muted-foreground">
                    🚀 <span className="text-foreground font-medium">Coming up with amazing updates</span> and a <span className="text-primary font-medium">better UI</span> — stay tuned!
                </span>
            </div>
        </div>
    );
}
