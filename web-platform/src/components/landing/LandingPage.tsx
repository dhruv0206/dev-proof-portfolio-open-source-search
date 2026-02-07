'use client';

import { HeroSection } from './HeroSection';

import { FeaturesGrid } from './FeaturesGrid';
import { RoadmapSection } from './RoadmapSection';
import { CTASection } from './CTASection';
import { LandingFooter } from './LandingFooter';
import { LandingNavbar } from './LandingNavbar';
import { SearchPreview } from './SearchPreview';
import { HowItWorks } from './HowItWorks';

import { SearchResult } from '@/lib/api';

export function LandingPage({ totalIssues, recentIssues }: { totalIssues?: number; recentIssues?: SearchResult[] }) {
    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <LandingNavbar />
            <HeroSection totalIssues={totalIssues} />
            <SearchPreview initialIssues={recentIssues} />
            <HowItWorks />
            <FeaturesGrid />
            <RoadmapSection />
            <CTASection />
            <LandingFooter />
        </div>
    );
}
