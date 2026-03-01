'use client';

import { Sparkles } from 'lucide-react';

export function BetaBanner() {
    return (
        <div className="bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-blue-600/10 border-b border-primary/20 px-8 py-2.5">
            <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                <span className="text-muted-foreground">
                    🚀 Pardon the rough edges — juggling updates & <span className="text-foreground font-medium">actively building a better experience.</span> <span className="text-primary font-medium">Verified portfolios, smarter search & more dropping soon — stick around!</span>
                </span>
            </div>
        </div>
    );
}
