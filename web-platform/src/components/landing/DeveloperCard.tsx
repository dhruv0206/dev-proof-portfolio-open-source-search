'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { CheckCircle2, GitPullRequest, Calendar, ExternalLink, Zap, BrainCircuit, Layout } from 'lucide-react';

interface DeveloperCardProps {
  className?: string;
}

export function DeveloperCard({ className = '' }: DeveloperCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Enhanced Mock Data
  const verifiedContributions = [
    {
      repo: 'facebook/react',
      title: 'Fix memory leak',
      tier: 'Elite',
      tierColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      decision: 'Refactored Fiber reconciler to use WeakMap for cyclic refs.',
      impact: '-40% Memory Usage',
    },
    {
      repo: 'vercel/next.js',
      title: 'Add TypeScript types',
      tier: 'Advanced',
      tierColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      decision: 'Implemented recursive type alias for nested layouts.',
      impact: 'Zero Runtime Overhead',
    },
  ];

  const skills = ['React', 'TypeScript', 'Node.js', 'Python'];

  return (
    <motion.div
      className={`relative perspective-1000 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Subtle shadow */}
      <div className="absolute -inset-2 bg-black/5 dark:bg-white/5 rounded-3xl blur-xl" />

      {/* Main card */}
      <div className="relative bg-card border border-border rounded-2xl p-4 md:p-5 w-full max-w-[360px] shadow-xl overflow-hidden mx-auto lg:mx-0">
        {/* Plain card body - no internal grid */}

        {/* Header */}
        <div className="flex items-start gap-4 mb-6 relative">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
              alt="Sarah Chen"
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-card flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">Sarah Chen</div>
            <div className="text-muted-foreground text-sm font-mono">@sarah_dev</div>
          </div>
          <a href="#" className="text-muted-foreground hover:text-emerald-500 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* SKILL DNA (Radar Chart + Stats) */}
        <div className="grid grid-cols-[1fr_100px] gap-4 mb-6">
          {/* Stats List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-500" /> Deep Tech
              </span>
              <span className="font-bold">Elite</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-blue-500" /> Core Logic
              </span>
              <span className="font-bold">Advanced</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-slate-500" /> UI / UX
              </span>
              <span className="font-bold">Solid</span>
            </div>
          </div>

          {/* Radar Visual (Tiny SVG) */}
          <div className="relative h-[80px] w-[90px] flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              {/* Background Triangle */}
              <polygon points="50,10 90,80 10,80" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
              {/* Inner Triangle */}
              <polygon points="50,35 75,70 25,70" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
              {/* Data Shape (Deep Tech: High, Logic: Med, UI: Low) */}
              <polygon
                points="50,15 85,75 25,75"
                className="fill-emerald-500/20 stroke-emerald-500"
                strokeWidth="2"
              />
              {/* Dots */}
              <circle cx="50" cy="15" r="3" className="fill-purple-500" />
              <circle cx="85" cy="75" r="3" className="fill-blue-500" />
              <circle cx="25" cy="75" r="3" className="fill-slate-500" />
            </svg>
            <div className="absolute -bottom-3 text-[9px] font-mono text-muted-foreground tracking-widest uppercase">Skill DNA</div>
          </div>
        </div>

        {/* Verified Contributions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Verified Decisions</div>
            <div className="text-xs font-mono text-emerald-500">12 Verified</div>
          </div>
          <div className="space-y-3">
            {verifiedContributions.map((contrib, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="group relative"
              >
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-border group-hover:bg-emerald-500 transition-colors" />
                <div className="pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-medium ${contrib.tierColor}`}>
                      {contrib.tier}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{contrib.repo}</span>
                  </div>
                  <div className="text-sm font-medium mb-1">{contrib.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-emerald-500 font-medium">Why: </span>
                    {contrib.decision}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{contrib.impact}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Joined Jan 2024</span>
          </div>
          <div className="text-xs font-mono text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified by AI
          </div>
        </div>
      </div>
    </motion.div>
  );
}
