'use client';

import { motion } from 'framer-motion';
import { Github, Loader2, Zap, Users, Shield } from 'lucide-react';
import { DotPattern } from '@/components/ui/dot-pattern';
import { signIn } from '@/lib/auth-client';
import { useEffect, useState, useRef } from 'react';
import { getStats, type PublicScanResult, type PublicScoreResult } from '@/lib/api';
import { RepoScoreInput, type ScoringState } from './RepoScoreInput';
import { HeroTerminal } from './HeroTerminal';


/* ── Animated counter ── */
function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (started.current || value === 0) return;
        started.current = true;
        const duration = 1500;
        const start = performance.now();
        const animate = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(eased * value));
            if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value]);

    return <>{display.toLocaleString()}</>;
}

export function HeroSection({ totalIssues: initialTotalIssues }: { totalIssues?: number }) {
    const [totalIssues, setTotalIssues] = useState<number | null>(initialTotalIssues || null);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [repoUrl, setRepoUrl] = useState('');

    const [scoringState, setScoringState] = useState<ScoringState>('idle');
    const [scanResult, setScanResult] = useState<PublicScanResult | null>(null);
    const [scoreResult, setScoreResult] = useState<PublicScoreResult | null>(null);

    const handleSignIn = () => {
        setIsSigningIn(true);
        signIn.social({ provider: 'github', callbackURL: '/dashboard' });
    };

    useEffect(() => {
        if (initialTotalIssues !== undefined) return;
        getStats().then(s => setTotalIssues(s.total_issues)).catch(() => {});
    }, [initialTotalIssues]);

    // Capture repo URL from input via scan callback
    const handleScanResult = (result: PublicScanResult) => {
        setScanResult(result);
    };

    const handleStateChange = (state: ScoringState) => {
        setScoringState(state);
        // Extract URL from the input element when scoring starts
        if (state === 'scanning') {
            const input = document.querySelector('input[placeholder*="github.com"]') as HTMLInputElement;
            if (input) setRepoUrl(input.value);
        }
    };

    return (
        <section className="relative min-h-screen flex flex-col overflow-hidden bg-background">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                {/* Dot grid (Magic UI) */}
                <DotPattern
                    width={28}
                    height={28}
                    cr={0.7}
                    className="text-zinc-500/[0.25]"
                />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-10 relative z-10">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm mb-8"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="font-mono text-xs">
                        {totalIssues ? <><AnimatedNumber value={totalIssues} /> issues indexed</> : 'Loading...'}
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-4xl sm:text-5xl font-bold leading-[1.08] mb-8 tracking-tight text-center"
                >
                    Prove What You Build.
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 bg-clip-text text-transparent">
                        Not What You Claim.
                    </span>
                </motion.h1>

                {/* Input */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="w-full max-w-xl mx-auto mb-3"
                >
                    <RepoScoreInput
                        onStateChange={handleStateChange}
                        onScanResult={handleScanResult}
                        onScoreResult={setScoreResult}
                        onError={() => {}}
                    />
                </motion.div>

                {/* Sign in link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="flex items-center gap-2 justify-center mb-10"
                >
                    <span className="text-xs text-muted-foreground">or</span>
                    <button
                        onClick={handleSignIn}
                        disabled={isSigningIn}
                        className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                    >
                        {isSigningIn ? <Loader2 className="w-3 h-3 animate-spin" /> : <Github className="w-3 h-3" />}
                        Sign in to save scores to your portfolio
                    </button>
                </motion.div>

                {/* Terminal */}
                <HeroTerminal
                    state={scoringState}
                    scanResult={scanResult}
                    scoreResult={scoreResult}
                    repoUrl={repoUrl}
                />

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center justify-center gap-8 sm:gap-12 mt-10"
                >
                    {[
                        { icon: Zap, value: '4-Bucket', label: 'AI Scoring' },
                        { icon: Users, value: '66+', label: 'Developers' },
                        { icon: Shield, value: '10', label: 'Anti-Gaming Layers' },
                    ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
                                <stat.icon className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold leading-none">{stat.value}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
