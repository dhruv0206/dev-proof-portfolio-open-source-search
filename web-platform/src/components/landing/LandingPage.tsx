'use client';

import { HeroSection } from './HeroSection';
import { FeaturesGrid } from './FeaturesGrid';
import { RecentlyScored } from './RecentlyScored';
import { SearchPreview } from './SearchPreview';
import { CTASection } from './CTASection';
import { LandingFooter } from './LandingFooter';
import { LandingNavbar } from './LandingNavbar';

import { SearchResult } from '@/lib/api';

export function LandingPage({ totalIssues, recentIssues }: { totalIssues?: number; recentIssues?: SearchResult[] }) {
    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <LandingNavbar />
            <HeroSection totalIssues={totalIssues} />
            <FeaturesGrid />
            <div id="recent-scores">
                <RecentlyScored />
            </div>
            <SearchPreview initialIssues={recentIssues} />
            <CTASection />
            <LandingFooter />
        </div>
    );
}
