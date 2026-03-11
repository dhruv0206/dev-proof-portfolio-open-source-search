'use client';

import { useState } from 'react';
import { X, Gift, Mail, Linkedin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EarlyAdopterBanner({ className }: { className?: string }) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className={cn("px-6 pt-6", className)}>
            <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-yellow-500/5 p-5">
                {/* Decorative glow */}
                <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />

                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                        <Gift className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-foreground">
                                Early Adopter Perks
                            </h3>
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            You&apos;re one of our first 50 users! I have credits for vibecoding platforms,
                            AI models, and more that I&apos;d love to share with you to build something.
                            First come, first served, reach out before they&apos;re gone!
                        </p>
                        <p className="text-xs text-muted-foreground/80 mt-1">
                            Also, feel free to share any feedback or features you&apos;d love to see on the platform.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href="https://www.linkedin.com/in/dhruv-patel-0206"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#004182]"
                        >
                            <Linkedin className="h-3.5 w-3.5" />
                            LinkedIn
                        </a>
                        <a
                            href="mailto:dhruv0128@gmail.com"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-medium text-amber-700 dark:text-amber-300 transition-colors hover:bg-amber-500/20"
                        >
                            <Mail className="h-3.5 w-3.5" />
                            Email
                        </a>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-amber-500/10 text-muted-foreground"
                            onClick={() => setIsVisible(false)}
                        >
                            <X className="h-3.5 w-3.5" />
                            <span className="sr-only">Dismiss</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
