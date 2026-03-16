'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { BentoCard, BentoLabel } from '@/components/dashboard/BentoCard';
import { Badge } from '@/components/ui/badge';
import { TechItem } from '@/lib/profileUtils';

interface TechStackSectionProps {
  techStack: TechItem[];
}

const categoryStyles: Record<TechItem['category'], string> = {
  language: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  framework: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  library: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const MAX_VISIBLE = 15;

export function TechStackSection({ techStack }: TechStackSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (techStack.length === 0) return null;

  const visibleItems = showAll ? techStack : techStack.slice(0, MAX_VISIBLE);
  const hasMore = techStack.length > MAX_VISIBLE;

  return (
    <BentoCard delay={0.2}>
      <BentoLabel>Tech Stack</BentoLabel>
      <div className="flex flex-wrap gap-2 mt-3">
        {visibleItems.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
          >
            <Badge variant="outline" className={categoryStyles[item.category]}>
              {item.name}
            </Badge>
          </motion.div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mt-2"
        >
          <ChevronDown className="h-3 w-3" />
          {showAll ? 'Show less' : `Show all (${techStack.length})`}
        </button>
      )}
    </BentoCard>
  );
}
