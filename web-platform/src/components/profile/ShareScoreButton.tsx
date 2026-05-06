'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Share2 } from 'lucide-react';

/**
 * Copies the public score URL (`/p/{username}/score`) to the clipboard.
 *
 * Used on the dashboard so logged-in users can grab their shareable
 * dual-axis score link without navigating to the public page first.
 */
export function ShareScoreButton({ username }: { username: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${origin}/p/${username}/score`;
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            {copied ? (
                <>
                    <Check className="h-4 w-4 text-green-500" />
                    Copied!
                </>
            ) : (
                <>
                    <Share2 className="h-4 w-4" />
                    Share Score
                </>
            )}
        </Button>
    );
}
