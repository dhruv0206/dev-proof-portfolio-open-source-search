import { Metadata } from 'next';
import { PublicScorePage } from '@/components/score/PublicScorePage';
import { notFound } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface PageProps {
    params: Promise<{ owner: string; repo: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { owner, repo } = await params;

    try {
        const res = await fetch(`${API_BASE_URL}/api/projects/score/${owner}/${repo}`, {
            next: { revalidate: 3600 },
        });

        if (!res.ok) {
            return {
                title: `${owner}/${repo} | DevProof`,
                description: `Score ${owner}/${repo} on DevProof — AI-powered code analysis`,
            };
        }

        const data = await res.json();
        const score = Math.round(data.score);
        const tier = data.tier || 'BASIC';

        return {
            title: `${owner}/${repo} — ${score}/100 (${tier}) | DevProof`,
            description: `${owner}/${repo} scored ${score}/100 (${tier}) on DevProof. Features: ${data.score_breakdown?.feature_score || 0}/40, Architecture: ${data.score_breakdown?.architecture_score || 0}/15, Intent: ${data.score_breakdown?.intent_score || 0}/25, Forensics: ${data.score_breakdown?.forensics_score || 0}/20.`,
            openGraph: {
                title: `${owner}/${repo} — ${score}/100 (${tier}) | DevProof`,
                description: `AI-powered code analysis scored this project ${score}/100`,
                images: [{ url: `/api/og/score/${owner}/${repo}`, width: 1200, height: 630 }],
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${owner}/${repo} — ${score}/100 (${tier})`,
                description: `AI-powered code analysis scored this project ${score}/100`,
                images: [`/api/og/score/${owner}/${repo}`],
            },
        };
    } catch {
        return {
            title: `${owner}/${repo} | DevProof`,
            description: `Score ${owner}/${repo} on DevProof`,
        };
    }
}

export default async function ScorePage({ params }: PageProps) {
    const { owner, repo } = await params;

    try {
        const res = await fetch(`${API_BASE_URL}/api/projects/score/${owner}/${repo}`, {
            next: { revalidate: 3600 },
        });

        if (!res.ok) {
            // No score yet — show a "Score this repo" page
            return (
                <div className="min-h-screen bg-background flex flex-col">
                    <header className="border-b border-border bg-background">
                        <div className="container mx-auto px-4 flex items-center justify-between h-14">
                            <a href="/" className="flex items-center gap-2 text-lg font-bold">
                                <span className="text-muted-foreground">&lt;</span>
                                <img src="/logo_transparent.png" alt="DevProof" className="w-6 h-6" />
                                <span>DevProof</span>
                                <span className="text-muted-foreground">/&gt;</span>
                            </a>
                        </div>
                    </header>
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="text-center max-w-md">
                            <h1 className="text-2xl font-bold mb-2">{owner}/{repo}</h1>
                            <p className="text-muted-foreground mb-6">
                                This repository hasn&apos;t been scored yet. Be the first to score it!
                            </p>
                            <a
                                href={`/?repo=https://github.com/${owner}/${repo}`}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                            >
                                Score This Repo
                                <span className="text-lg">&rarr;</span>
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        const data = await res.json();
        return <PublicScorePage data={data} />;
    } catch {
        notFound();
    }
}
