'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useSession, signIn } from '@/lib/auth-client';
import { Loader2, Menu, X } from 'lucide-react';

export function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { data: session, isPending } = useSession();
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSignIn = async () => {
        setIsSigningIn(true);
        try {
            await signIn.social({ provider: 'github', callbackURL: '/dashboard' });
        } catch (error) {
            setIsSigningIn(false);
        }
    };

    const navItems = [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Future', href: '#roadmap' },
    ];

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm'
                : 'bg-transparent'
                }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <a href="/" className="flex items-center gap-2 group">
                        <motion.div
                            className="flex items-center text-xl font-bold"
                            whileHover={{ scale: 1.02 }}
                        >
                            <span className="text-muted-foreground group-hover:text-emerald-500 transition-colors">&lt;</span>
                            <img src="/logo_transparent.png" alt="DevProof" className="w-8 h-8 mx-1" />
                            <span>DevProof</span>
                            <span className="text-muted-foreground group-hover:text-emerald-500 transition-colors">/&gt;</span>
                        </motion.div>
                    </a>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {item.name}
                            </a>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* GitHub Star - Hidden on very small screens */}
                        <a
                            href="https://github.com/dhruv0206/opensource-issues-finder"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden sm:block"
                        >
                            <Button variant="outline" size="sm" className="gap-1.5 h-8 md:h-9">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                                <span className="hidden lg:inline">Star on GitHub</span>
                                <span className="lg:hidden">Star</span>
                            </Button>
                        </a>

                        <ThemeToggle />

                        {/* Auth - Minimal on mobile */}
                        {isPending ? (
                            <div className="w-20 md:w-24 h-8 md:h-9 rounded-md bg-muted animate-pulse" />
                        ) : session ? (
                            <Button variant="default" size="sm" className="h-8 md:h-9" asChild>
                                <a href="/dashboard">Dashboard</a>
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 h-8 md:h-9"
                                onClick={handleSignIn}
                                disabled={isSigningIn}
                            >
                                {isSigningIn ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <>
                                        <span className="hidden sm:inline">Sign In</span>
                                        <span className="sm:hidden text-xs">Login</span>
                                    </>
                                )}
                            </Button>
                        )}

                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden p-1 px-1.5"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="md:hidden border-b border-border bg-background/95 backdrop-blur-md overflow-hidden"
                    >
                        <nav className="flex flex-col p-4 gap-4">
                            {navItems.map((item) => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                                >
                                    {item.name}
                                </a>
                            ))}
                            <div className="pt-2 border-t border-border flex flex-col gap-3">
                                <a
                                    href="https://github.com/dhruv0206/opensource-issues-finder"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                    </svg>
                                    Star on GitHub
                                </a>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
