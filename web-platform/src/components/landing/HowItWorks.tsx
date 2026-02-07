'use client';

import { motion } from 'framer-motion';
import { Search, GitPullRequest, BarChart3 } from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: Search,
        title: 'Discover',
        description: 'Find issues that match your skills, or add your own projects.',
        color: 'from-emerald-500 to-emerald-600',
    },
    {
        number: '02',
        icon: GitPullRequest,
        title: 'Build',
        description: 'Contribute to open source or ship your own verified projects.',
        color: 'from-blue-500 to-blue-600',
    },
    {
        number: '03',
        icon: BarChart3,
        title: 'Get Hired',
        description: 'Share your verified portfolio. Let your work speak for itself.',
        color: 'from-amber-500 to-amber-600',
    },
];

export function HowItWorks() {
    return (
        <section className="py-20 border-t border-border">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 md:mb-16"
                >
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                        How <span className="text-emerald-500">DevProof</span> Works
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Three simple steps to build your verified developer portfolio
                    </p>
                </motion.div>

                <div className="relative max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="relative"
                            >
                                <div className="p-6 rounded-xl border border-border bg-card text-center">
                                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${step.color} text-white font-bold text-lg mb-4`}>
                                        {step.number}
                                    </div>

                                    <div className="flex justify-center mb-4">
                                        <step.icon className="w-8 h-8 text-muted-foreground" />
                                    </div>

                                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                                    <p className="text-muted-foreground text-sm">{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
