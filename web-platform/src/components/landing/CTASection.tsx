'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github, Loader2 } from 'lucide-react';
import { signIn } from '@/lib/auth-client';
import { useState } from 'react';

export function CTASection() {
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleSignIn = async () => {
        setIsSigningIn(true);
        try {
            await signIn.social({
                provider: 'github',
                callbackURL: '/dashboard',
            });
        } catch (error) {
            console.error("Sign in failed", error);
            setIsSigningIn(false);
        }
    };

    return (
        <section className="py-16 md:py-24 border-t border-border">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                        Ready to <span className="text-emerald-500">Prove Your Skills</span>?
                    </h2>

                    <p className="text-xl text-muted-foreground mb-8">
                        Join developers who are building verified portfolios instead of padding resumes.
                    </p>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            size="lg"
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                            onClick={handleSignIn}
                            disabled={isSigningIn}
                        >
                            {isSigningIn ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <Github className="w-5 h-5" />
                                    Start Building Your Portfolio
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </motion.div>

                    <p className="text-sm text-muted-foreground mt-6">
                        No credit card required • Free forever • GitHub login
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
