'use client';

import { motion } from 'framer-motion';
import { Search, Shield, Code2, User } from 'lucide-react';

const features = [
    {
        icon: Search,
        title: 'AI-Powered Search',
        description: 'Semantic search across 10,000+ open source issues. Find issues that match your exact skills.',
        accent: 'text-emerald-500',
        accentBg: 'bg-emerald-500/10',
    },
    {
        icon: Shield,
        title: 'Verified PRs',
        description: 'Blockchain-style proof of merge. Every contribution is cryptographically verified.',
        accent: 'text-blue-500',
        accentBg: 'bg-blue-500/10',
    },
    {
        icon: Code2,
        title: 'Code Scoring',
        description: 'AST-based complexity analysis. Understand the true impact of your contributions.',
        accent: 'text-amber-500',
        accentBg: 'bg-amber-500/10',
    },
    {
        icon: User,
        title: 'Public Portfolio',
        description: 'Shareable profile showcasing verified work. Stand out to recruiters and teams.',
        accent: 'text-rose-500',
        accentBg: 'bg-rose-500/10',
    },
];

export function FeaturesGrid() {
    return (
        <section id="features" className="py-24">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-16"
                >
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                        Built for <span className="text-emerald-500">Developers</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Everything you need to prove your skills and build credibility
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -4 }}
                            className="group relative p-6 rounded-xl border border-border bg-card hover:bg-card/80 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300"
                        >
                            {/* Subtle top accent line */}
                            <div className={`absolute top-0 left-6 right-6 h-px ${feature.accentBg.replace('/10', '/30')}`} />

                            {/* Icon with accent color */}
                            <div className={`w-11 h-11 rounded-lg ${feature.accentBg} flex items-center justify-center mb-4`}>
                                <feature.icon className={`w-5 h-5 ${feature.accent}`} />
                            </div>

                            <h3 className="text-lg font-semibold mb-2 group-hover:text-foreground transition-colors">
                                {feature.title}
                            </h3>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
