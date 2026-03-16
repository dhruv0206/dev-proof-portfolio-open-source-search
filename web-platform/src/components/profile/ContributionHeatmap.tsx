'use client';

import { useMemo } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { buildActivityData } from '@/lib/profileUtils';
import { BentoCard, BentoLabel } from '@/components/dashboard/BentoCard';

interface ContributionHeatmapProps {
  contributions: Array<{ mergedAt: string | null }>;
}

export function ContributionHeatmap({ contributions }: ContributionHeatmapProps) {
  const activityData = useMemo(() => buildActivityData(contributions), [contributions]);

  if (!contributions.length || !activityData.length) {
    return null;
  }

  return (
    <BentoCard delay={0.15}>
      <BentoLabel>Contribution Activity</BentoLabel>
      <div className="mt-2">
        <ActivityCalendar
          data={activityData}
          theme={{
            light: ['#e5e5e5', '#064e3b', '#047857', '#059669', '#10b981'],
            dark: ['#171717', '#064e3b', '#047857', '#059669', '#10b981'],
          }}
          blockSize={12}
          blockRadius={3}
          blockMargin={3}
          fontSize={12}
          labels={{
            totalCount: '{{count}} verified contributions in the last year',
          }}
        />
      </div>
    </BentoCard>
  );
}
