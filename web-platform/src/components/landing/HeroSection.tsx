'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github, Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import { DeveloperCard } from './DeveloperCard';
import { useEffect, useState } from 'react';
import { getStats } from '@/lib/api';

const subtitles = [
    "Verify your decisions.",
    "Showcase your intent.",
    "Prove your judgment.",
];

export function HeroSection({ totalIssues: initialTotalIssues }: { totalIssues?: number }) {
    const [totalIssues, setTotalIssues] = useState<number | null>(initialTotalIssues || null);
    const [currentSubtitle, setCurrentSubtitle] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleSignIn = () => {
        setIsSigningIn(true);
        signIn.social({ provider: 'github' });
    };

    // Fetch live stats (only if not provided by prop)
    useEffect(() => {
        if (initialTotalIssues !== undefined) return;

        async function loadStats() {
            try {
                const stats = await getStats();
                setTotalIssues(stats.total_issues);
            } catch (err) {
                console.error('Failed to load stats:', err);
            }
        }
        loadStats();
    }, [initialTotalIssues]);

    // Typing animation
    useEffect(() => {
        const current = subtitles[currentSubtitle];

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (displayText.length < current.length) {
                    setDisplayText(current.slice(0, displayText.length + 1));
                } else {
                    setTimeout(() => setIsDeleting(true), 2000);
                }
            } else {
                if (displayText.length > 0) {
                    setDisplayText(displayText.slice(0, -1));
                } else {
                    setIsDeleting(false);
                    setCurrentSubtitle((prev) => (prev + 1) % subtitles.length);
                }
            }
        }, isDeleting ? 30 : 50);

        return () => clearTimeout(timeout);
    }, [displayText, isDeleting, currentSubtitle]);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-pattern">
            <div className="container mx-auto px-4 pt-28 pb-12 md:py-20 relative z-10">
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column - Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="text-center lg:text-left"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm mb-6"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {totalIssues !== null ? (
                                <span>{totalIssues.toLocaleString()} issues indexed</span>
                            ) : (
                                <span className="inline-block w-24 h-4 bg-muted/50 rounded animate-pulse" />
                            )}
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
                            Prove What You Build.
                            <br />
                            <span className="text-emerald-500">Not What You Claim.</span>
                        </h1>

                        <div className="h-8 mb-4">
                            <p className="text-xl text-muted-foreground">
                                {displayText}
                                <span className="animate-pulse">|</span>
                            </p>
                        </div>

                        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto lg:mx-0">
                            Build a verified portfolio. Get hired on your work.
                        </p>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                    size="lg"
                                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                                    onClick={handleSignIn}
                                    disabled={isSigningIn}
                                >
                                    {isSigningIn ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Get Started Free
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                            {/* <Button size="lg" variant="outline" className="gap-2" asChild>
                                <a href="/portfolio/demo">View Demo Portfolio</a>
                            </Button> */}
                        </div>

                        <p className="text-sm text-muted-foreground">
                            <span className="underline">Free forever</span> • No credit card required • GitHub login
                        </p>
                    </motion.div>

                    {/* Right Column - Developer Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                        className="flex justify-center lg:justify-end w-full"
                    >
                        <DeveloperCard />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
