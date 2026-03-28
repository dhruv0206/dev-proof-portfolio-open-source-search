'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
    return (
        <section className="py-20 border-t border-border">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto text-center"
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                        Build your verified portfolio.
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Score your first repo — free, no signup, 60 seconds.
                    </p>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            size="lg"
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 px-8"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            Score a Repo
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
