'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Github, ArrowRight, AlertCircle } from 'lucide-react';
import { scanPublic, auditPublic, type PublicScanResult, type PublicScoreResult } from '@/lib/api';

export type ScoringState = 'idle' | 'scanning' | 'scanned' | 'auditing' | 'complete' | 'error';

export interface ScoringCallbacks {
    onStateChange: (state: ScoringState) => void;
    onScanResult: (result: PublicScanResult) => void;
    onScoreResult: (result: PublicScoreResult) => void;
    onError: (error: string) => void;
}

export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

export function RepoScoreInput({ onStateChange, onScanResult, onScoreResult, onError }: ScoringCallbacks) {
    const [url, setUrl] = useState('');
    const [state, setState] = useState<ScoringState>('idle');
    const [error, setError] = useState('');

    const updateState = useCallback((newState: ScoringState) => {
        setState(newState);
        onStateChange(newState);
    }, [onStateChange]);

    const handleScore = async () => {
        const parsed = parseGithubUrl(url);
        if (!parsed) {
            setError('Enter a valid GitHub URL (e.g., github.com/owner/repo)');
            return;
        }

        setError('');

        // Step 1: Scan
        updateState('scanning');
        try {
            const scanResult = await scanPublic(url.trim());
            onScanResult(scanResult);
            updateState('scanned');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Scan failed';
            setError(msg);
            onError(msg);
            updateState('error');
            return;
        }

        // Step 2: Auto-audit (no manual step)
        updateState('auditing');
        try {
            const result = await auditPublic(url.trim());

            if (result.status === 'REJECTED') {
                setError(result.reason || 'Project did not meet minimum requirements');
                onError(result.reason || 'Project rejected');
                updateState('error');
                return;
            }

            onScoreResult(result);
            updateState('complete');

            // Auto-open full results in new tab
            if (parsed) {
                window.open(`/score/${parsed.owner}/${parsed.repo}`, '_blank');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Audit failed';
            setError(msg);
            onError(msg);
            updateState('error');
        }
    };

    const handleReset = useCallback(() => {
        setUrl('');
        setError('');
        updateState('idle');
    }, [updateState]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (state === 'idle' || state === 'error')) handleScore();
    };

    const isProcessing = state === 'scanning' || state === 'scanned' || state === 'auditing';

    return (
        <div className="w-full">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => { setUrl(e.target.value); setError(''); }}
                        onKeyDown={handleKeyDown}
                        disabled={isProcessing}
                        placeholder="https://github.com/owner/repo"
                        className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50"
                    />
                </div>
                {state === 'complete' ? (
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        className="h-11 px-5"
                    >
                        Score Another
                    </Button>
                ) : (
                    <Button
                        onClick={handleScore}
                        disabled={isProcessing}
                        className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white border-0 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <span className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                Scoring
                            </span>
                        ) : (
                            <>Score <ArrowRight className="w-4 h-4 ml-1" /></>
                        )}
                    </Button>
                )}
            </div>
            {error && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                </div>
            )}
        </div>
    );
}
