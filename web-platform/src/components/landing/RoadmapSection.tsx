'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';

const roadmapItems = [
    {
        title: "Semantic Candidate Search",
        status: "Planned",
        description: "Recruiters can search naturally: 'Find a developer with 3 years of experience building Voice AI models.' We parse the intent and match based on actual code, not resume keywords.",
    },
    {
        title: "Deep Contribution Verification",
        status: "In Development",
        description: "We don't just match the person. We show the exact lines of code, pull requests, and architectural decisions that prove they built the Voice AI features they claim.",
    },
    {
        title: "Intent & Decision Patterns",
        status: "Researching",
        description: "Code is just the output. We analyze the 'why' behind it: architectural patterns, trade-offs, and design choices. Did they choose the right tool for the job? We verify the human judgment, not just the syntax.",
    },
    {
        title: "The Resume-Less Economy",
        status: "Future Vision",
        description: "A world where you never write another resume. Your verified portfolio becomes your dynamic, living credential: instantly trusted by top teams. Hiring becomes a conversation about your work, not a quiz about algorithms.",
    },
];

export function RoadmapSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end end"]
    });

    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <section id="roadmap" ref={containerRef} className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                        Building the <span className="text-emerald-500">Resume-Less Future</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        We are building the standard for how developers prove their worth. Here is where we are going.
                    </p>
                </motion.div>

                <div className="max-w-4xl mx-auto relative">
                    {/* The Line Container */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-muted-foreground/20 -translate-x-1/2" />

                    {/* The Animated Fill Line */}
                    <motion.div
                        style={{ scaleY, originY: 0 }}
                        className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 to-emerald-400 -translate-x-1/2 origin-top shadow-[0_0_12px_2px_rgba(16,185,129,0.3)]"
                    >
                        {/* Glowing Head */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(16,185,129,0.5)] blur-[1px]" />
                    </motion.div>

                    <div className="space-y-16 md:space-y-24 relative">
                        {roadmapItems.map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                            >
                                {/* Content Side */}
                                <div className="flex-1 ml-16 md:ml-0">
                                    <div className="relative group">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-muted text-muted-foreground bg-secondary/50 border border-border/50">
                                                {item.status}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-bold mb-3 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                                        <p className="text-muted-foreground text-base leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Center Node */}
                                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex flex-col items-center justify-center">
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        whileInView={{ scale: 1, opacity: 1 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.4, delay: 0.2 }}
                                        className="relative w-4 h-4"
                                    >
                                        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
                                        <div className="absolute inset-0 rounded-full border-2 border-emerald-500 bg-background shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" />
                                        <div className="absolute inset-[3px] rounded-full bg-emerald-500" />
                                    </motion.div>
                                </div>

                                {/* Empty space for layout balance */}
                                <div className="flex-1 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
