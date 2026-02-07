'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, GitPullRequest, Code2, ExternalLink } from 'lucide-react';

const portfolios = [
    {
        name: 'Alex Rivera',
        username: '@alex_codes',
        avatar: 'AR',
        prs: 32,
        score: 7.8,
        skills: ['Python', 'FastAPI', 'PostgreSQL'],
        color: 'from-orange-500 to-red-500',
    },
    {
        name: 'Maya Patel',
        username: '@maya_dev',
        avatar: 'MP',
        prs: 58,
        score: 9.2,
        skills: ['React', 'Next.js', 'GraphQL'],
        color: 'from-blue-500 to-purple-500',
    },
    {
        name: 'Chris Wu',
        username: '@cwu_dev',
        avatar: 'CW',
        prs: 24,
        score: 6.5,
        skills: ['Go', 'Kubernetes', 'Docker'],
        color: 'from-cyan-500 to-teal-500',
    },
];

export function FeaturedPortfolios() {
    return (
        <section className="py-24 relative">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                        Featured <span className="text-emerald-500">Portfolios</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        See what verified developer profiles look like
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {portfolios.map((dev, index) => (
                        <motion.div
                            key={dev.username}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="glass rounded-2xl p-6 cursor-pointer group"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-5">
                                <div className="relative">
                                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${dev.color} flex items-center justify-center text-white font-bold text-lg`}>
                                        {dev.avatar}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold">{dev.name}</div>
                                    <div className="text-sm text-muted-foreground">{dev.username}</div>
                                </div>
                                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 mb-5">
                                <div className="glass rounded-lg p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-purple-400 mb-1">
                                        <GitPullRequest className="w-4 h-4" />
                                        <span className="font-bold">{dev.prs}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Verified PRs</div>
                                </div>
                                <div className="glass rounded-lg p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-cyan-400 mb-1">
                                        <Code2 className="w-4 h-4" />
                                        <span className="font-bold">{dev.score}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Avg Score</div>
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-2">
                                {dev.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
