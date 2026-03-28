import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const TIER_COLORS: Record<string, string> = {
    ELITE: '#a855f7',
    ADVANCED: '#3b82f6',
    INTERMEDIATE: '#10b981',
    BASIC: '#737373',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ owner: string; repo: string }> }
): Promise<ImageResponse> {
    const { owner, repo } = await params;

    let score = 0;
    let tier = 'BASIC';
    let discipline = '';
    let languages: string[] = [];
    let frameworks: string[] = [];
    let breakdown = { feature_score: 0, architecture_score: 0, intent_score: 0, forensics_score: 0 };

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/projects/score/${owner}/${repo}`, {
            next: { revalidate: 3600 },
        });
        if (res.ok) {
            const data = await res.json();
            score = Math.round(data.score || 0);
            tier = (data.tier || 'BASIC').toUpperCase();
            discipline = data.discipline || '';
            languages = data.stack?.languages?.slice(0, 4) || [];
            frameworks = data.stack?.frameworks?.slice(0, 3) || [];
            breakdown = data.score_breakdown || breakdown;
        }
    } catch {}

    const tierColor = TIER_COLORS[tier] || TIER_COLORS.BASIC;
    const skills = [...languages, ...frameworks].slice(0, 5);

    const buckets = [
        { label: 'Features', value: Math.round(breakdown.feature_score || 0), max: 40 },
        { label: 'Architecture', value: Math.round(breakdown.architecture_score || 0), max: 15 },
        { label: 'Intent', value: Math.round(breakdown.intent_score || 0), max: 25 },
        { label: 'Forensics', value: Math.round(breakdown.forensics_score || 0), max: 20 },
    ];

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#0a0a0a',
                    padding: '60px',
                }}
            >
                {/* Top row: brand + tier */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>
                        DevProof
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: tierColor,
                        borderRadius: '9999px',
                        padding: '8px 24px',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#ffffff',
                    }}>
                        {tier} &middot; {score}
                    </div>
                </div>

                {/* Repo name */}
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px' }}>
                    <div style={{ display: 'flex', fontSize: '42px', fontWeight: 700, color: '#ffffff' }}>
                        {owner}/{repo}
                    </div>
                    {discipline && (
                        <div style={{ display: 'flex', fontSize: '18px', color: '#a1a1aa', marginTop: '8px' }}>
                            {discipline}
                        </div>
                    )}
                </div>

                {/* Score breakdown bars */}
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: '40px', gap: '12px', width: '100%' }}>
                    {buckets.map((b) => (
                        <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', width: '120px', fontSize: '14px', color: '#a1a1aa' }}>
                                {b.label}
                            </div>
                            <div style={{
                                display: 'flex',
                                flex: 1,
                                height: '20px',
                                backgroundColor: '#1a1a1a',
                                borderRadius: '10px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    display: 'flex',
                                    width: `${(b.value / b.max) * 100}%`,
                                    height: '100%',
                                    backgroundColor: tierColor,
                                    borderRadius: '10px',
                                }} />
                            </div>
                            <div style={{ display: 'flex', width: '60px', fontSize: '14px', color: '#ffffff', fontWeight: 600 }}>
                                {b.value}/{b.max}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Skills + footer */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexGrow: 1, width: '100%' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {skills.map((skill) => (
                            <div key={skill} style={{
                                display: 'flex',
                                backgroundColor: '#1a1a2e',
                                borderRadius: '9999px',
                                padding: '6px 16px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#10b981',
                            }}>
                                {skill}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', fontSize: '14px', color: '#a1a1aa' }}>
                        orenda.vision/score/{owner}/{repo}
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
                'Content-Type': 'image/png',
            },
        }
    );
}
