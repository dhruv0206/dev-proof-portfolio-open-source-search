'use client';

import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    ResponsiveContainer,
} from 'recharts';

interface ScoreBreakdownChartProps {
    features: number;
    architecture: number;
    intent: number;
    forensics: number;
}

export function ScoreBreakdownChart({
    features,
    architecture,
    intent,
    forensics,
}: ScoreBreakdownChartProps) {
    const data = [
        { subject: `Features ${features.toFixed(0)}/40`, value: (features / 40) * 100 },
        { subject: `Arch ${architecture.toFixed(0)}/15`, value: (architecture / 15) * 100 },
        { subject: `Intent ${intent.toFixed(0)}/25`, value: (intent / 25) * 100 },
        { subject: `Forensics ${forensics.toFixed(0)}/20`, value: (forensics / 20) * 100 },
    ];

    const total = features + architecture + intent + forensics;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold font-mono">{total.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/100</span>
            </div>

            <div className="flex-1 min-h-[200px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                        <PolarGrid
                            stroke="var(--border)"
                            strokeDasharray="3 3"
                            gridType="polygon"
                        />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{
                                fontSize: 10,
                                fill: 'var(--muted-foreground)',
                                fontWeight: 500,
                                fontFamily: 'ui-monospace, monospace',
                            }}
                        />
                        <Radar
                            name="Score"
                            dataKey="value"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.2}
                            strokeWidth={2}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
