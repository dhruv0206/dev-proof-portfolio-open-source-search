'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { SearchBar } from '@/components/finder/SearchBar';
import { SearchResults } from '@/components/finder/SearchResults';
import { ParsedQueryDisplay } from '@/components/finder/ParsedQueryDisplay';
import { Pagination } from '@/components/shared/Pagination';
import { useSearch } from '@/hooks/useSearch';
import { useSearchLimit } from '@/hooks/useSearchLimit';
import { getRecentIssues, SearchResult } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { SignupPromptModal } from '@/components/modals/SignupPromptModal';
import { StatsBar } from '@/components/finder/StatsBar';
import { useSession } from '@/lib/auth-client';
import dynamic from 'next/dynamic';

const FilterBar = dynamic(() => import('@/components/finder/FilterBar').then(mod => mod.FilterBar), {
    ssr: false,
    loading: () => <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
});

const ITEMS_PER_PAGE = 10;

interface OpenSourceFinderProps {
    showSidebarTrigger?: boolean;
    initialRecentIssues?: SearchResult[];
}

export function OpenSourceFinder({ showSidebarTrigger = false, initialRecentIssues = [] }: OpenSourceFinderProps) {
    const { results, parsedQuery, isLoading, error, pagination, search, goToPage, clearResults, currentQuery } = useSearch();
    const { searchCount, incrementSearch, limitState, isAtSoftLimit, isAtHardLimit, isSignedIn } = useSearchLimit();
    const [hasSearched, setHasSearched] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [softLimitDismissed, setSoftLimitDismissed] = useState(false);
    const { data: clientSession } = useSession();

    // Filter State
    const [languages, setLanguages] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<"newest" | "recently_discussed" | "relevance" | "stars">("recently_discussed");
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [daysAgo, setDaysAgo] = useState<number | null>(null);
    const [unassignedOnly, setUnassignedOnly] = useState(true);

    // Initialize with props if available
    const [allRecentIssues, setAllRecentIssues] = useState<SearchResult[]>(initialRecentIssues);
    const [recentLoading, setRecentLoading] = useState(initialRecentIssues.length === 0);
    const [recentPage, setRecentPage] = useState(1);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Load recent issues and last updated time on page mount or when filters change
    useEffect(() => {
        async function loadRecent() {
            setRecentLoading(true);
            try {
                // Pass all filters to recent issues API
                const response = await getRecentIssues(50, sortBy, languages, selectedLabels, daysAgo, unassignedOnly);
                setAllRecentIssues(response.results);
            } catch (err) {
                console.error('Failed to load recent issues:', err);
            } finally {
                setRecentLoading(false);
            }
        }

        async function loadLastUpdated() {
            try {
                const { getLastUpdated } = await import('@/lib/api');
                const response = await getLastUpdated();
                if (response.last_updated) {
                    setLastUpdated(response.last_updated);
                }
            } catch (err) {
                console.error('Failed to load last updated:', err);
            }
        }

        // Only reload recent issues when NOT in search mode
        if (!hasSearched) {
            // If we have initial data (from SSR) and no filters changed, skip first load
            const isInitialLoad = initialRecentIssues.length > 0 && 
                                  allRecentIssues === initialRecentIssues &&
                                  sortBy === "newest" && 
                                  languages.length === 0 && 
                                  selectedLabels.length === 0 &&
                                  daysAgo === null &&
                                  unassignedOnly === true;

            if (!isInitialLoad) {
                loadRecent();
            }
        }
        loadLastUpdated();
    }, [sortBy, languages, selectedLabels, daysAgo, unassignedOnly, hasSearched]);

    // Sync UI state with AI-parsed query
    useEffect(() => {
        if (parsedQuery) {
            // Sync Language
            if (parsedQuery.language) setLanguages([parsedQuery.language]);

            // Sync Sort (map legacy 'recency' to 'recently_discussed')
            if (parsedQuery.sort_by) {
                const sortMap: Record<string, "newest" | "recently_discussed" | "relevance" | "stars"> = {
                    "recency": "recently_discussed",
                    "relevance": "relevance",
                    "stars": "stars",
                    "newest": "newest"
                };
                setSortBy(sortMap[parsedQuery.sort_by] || "recently_discussed");
            }

            // Sync Time
            if (parsedQuery.days_ago) setDaysAgo(parsedQuery.days_ago);

            // Sync Labels
            if (parsedQuery.labels && parsedQuery.labels.length > 0) {
                setSelectedLabels(parsedQuery.labels);
            }
        }
    }, [parsedQuery]);

    // Paginate recent issues locally
    const recentPagination = useMemo(() => {
        if (allRecentIssues.length === 0) return null;
        const total = allRecentIssues.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        const page = Math.min(recentPage, totalPages);
        return {
            page,
            totalPages,
            total,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }, [allRecentIssues, recentPage]);

    const recentIssues = useMemo(() => {
        const startIdx = (recentPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        return allRecentIssues.slice(startIdx, endIdx);
    }, [allRecentIssues, recentPage]);

    const handleSearch = async (query: string) => {
        // Check for hard limit before searching
        if (isAtHardLimit && !isSignedIn) {
            setShowSignupModal(true);
            return;
        }

        // Increment search count for anonymous users
        if (!isSignedIn) {
            incrementSearch();
        }

        // Reset filters on new search
        setLanguages([]);
        setSortBy("recently_discussed");
        setSelectedLabels([]);
        setDaysAgo(null);
        setHasSearched(true);

        // Perform search with default/empty filters
        await search(query, {
            language: null,
            sortBy: "recently_discussed",
            labels: undefined,
            daysAgo: null
        });

        // Show soft limit modal after search completes
        if (limitState === 'soft' && !softLimitDismissed && !isSignedIn) {
            setShowSignupModal(true);
        }
    };

    // Filter Handlers
    const handleLanguageChange = (langs: string[]) => {
        setLanguages(langs);
        if (hasSearched) {
            search(currentQuery, {
                language: langs.length === 1 ? langs[0] : null, // Search API still uses single language
                sortBy,
                labels: selectedLabels.length > 0 ? selectedLabels : undefined,
                daysAgo,
                unassignedOnly
            });
        }
    };

    const handleSortChange = (sort: "newest" | "recently_discussed" | "relevance" | "stars") => {
        setSortBy(sort);
        if (hasSearched) {
            search(currentQuery, {
                language: languages.length === 1 ? languages[0] : null,
                sortBy: sort,
                labels: selectedLabels.length > 0 ? selectedLabels : undefined,
                daysAgo,
                unassignedOnly
            });
        }
    };

    const handleLabelChange = (labels: string[]) => {
        setSelectedLabels(labels);
        if (hasSearched) {
            search(currentQuery, {
                language: languages.length === 1 ? languages[0] : null,
                sortBy,
                labels: labels.length > 0 ? labels : undefined,
                daysAgo,
                unassignedOnly
            });
        }
    };

    const handleTimeChange = (days: number | null) => {
        setDaysAgo(days);
        if (hasSearched) {
            search(currentQuery, {
                language: languages.length === 1 ? languages[0] : null,
                sortBy,
                labels: selectedLabels.length > 0 ? selectedLabels : undefined,
                daysAgo: days,
                unassignedOnly
            });
        }
    };

    const handleUnassignedChange = (unassigned: boolean) => {
        setUnassignedOnly(unassigned);
        if (hasSearched) {
            search(currentQuery, {
                language: languages.length === 1 ? languages[0] : null,
                sortBy,
                labels: selectedLabels.length > 0 ? selectedLabels : undefined,
                daysAgo,
                unassignedOnly: unassigned
            });
        }
    };

    const handleClear = () => {
        clearResults();
        setHasSearched(false);
        setRecentPage(1);
        // Reset all filters to defaults
        setLanguages([]);
        setSortBy("recently_discussed");
        setSelectedLabels([]);
        setDaysAgo(null);
        setUnassignedOnly(false);
    };

    const handleRecentPageChange = (page: number) => {
        setRecentPage(page);
        window.scrollTo({ top: 300, behavior: 'smooth' });
    };

    // Show recent issues if no search has been performed
    const displayResults = hasSearched ? results : recentIssues;
    const showLoading = hasSearched ? isLoading : recentLoading;
    const currentPagination = hasSearched ? pagination : recentPagination;
    const handlePageChange = hasSearched ? goToPage : handleRecentPageChange;

    // Pagination component to reuse
    const PaginationBlock = () => (
        currentPagination && displayResults.length > 0 ? (
            <Pagination
                currentPage={currentPagination.page}
                totalPages={currentPagination.totalPages}
                totalItems={currentPagination.total}
                onPageChange={handlePageChange}
            />
        ) : null
    );

    // Count active filters for the FILTERS · N_ACTIVE label
    const activeFilterCount =
        languages.length +
        selectedLabels.length +
        (daysAgo !== null ? 1 : 0) +
        (sortBy !== "recently_discussed" ? 1 : 0) +
        (unassignedOnly ? 1 : 0);

    return (
        <div className="w-full">
            {/* Page Header — left-aligned mono treatment */}
            <section className="pt-8 pb-2 px-4">
                <div className="w-full max-w-5xl mx-auto">
                    <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-2">
                        <span className="text-primary">*</span> FINDER <span className="opacity-60">·</span> CONTRIBUTION_OPPORTUNITIES
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                        Find OSS issues to contribute to.
                    </h1>
                </div>
            </section>

            {/* Search Layout */}
            <section className="pt-6 pb-8 px-4">
                <div className="w-full max-w-5xl mx-auto flex flex-col">
                    <div className="w-full mb-6">
                        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
                    </div>

                    {/* Filter section header */}
                    <div className="border-t border-white/[0.06] pt-4 mb-3">
                        <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
                            <span className="text-primary">*</span> FILTERS <span className="opacity-60">·</span> <span className="tabular-nums">{activeFilterCount}_ACTIVE</span>
                        </div>
                    </div>

                    <div className="w-full">
                        <FilterBar
                            languages={languages}
                            sortBy={sortBy}
                            selectedLabels={selectedLabels}
                            daysAgo={daysAgo}
                            unassignedOnly={unassignedOnly}
                            onLanguageChange={handleLanguageChange}
                            onSortChange={handleSortChange}
                            onLabelChange={handleLabelChange}
                            onTimeChange={handleTimeChange}
                            onUnassignedChange={handleUnassignedChange}
                        />
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section className="px-4 pb-16">
                <div className="w-full max-w-8xl mx-auto">
                    {/* Error Message */}
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <ExclamationCircleIcon className="h-4 w-4" />
                            <AlertTitle>Search failed</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Parsed Query Display */}
                    {parsedQuery && !isLoading && (
                        <ParsedQueryDisplay parsedQuery={parsedQuery} onClear={handleClear} />
                    )}

                    {/* Section Title — Recent Contribution Opportunities */}
                    {!hasSearched && !recentLoading && allRecentIssues.length > 0 && (
                        <div className="mb-6 border-t border-b border-white/[0.06] py-4">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <span aria-hidden>🔥</span>
                                    <span>Recent Contribution Opportunities</span>
                                </h2>
                                <StatsBar />
                            </div>
                            <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mt-2">
                                UPDATED_EVERY_2H
                                {lastUpdated && (
                                    <>
                                        <span className="opacity-60 mx-1.5">·</span>
                                        LAST_UPDATE
                                        <span className="opacity-60 mx-1">=</span>
                                        <span className="tabular-nums">
                                            {new Date(lastUpdated).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit'
                                            }).replace(/\s+/g, '_').toUpperCase()}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Top Pagination */}
                    <PaginationBlock />

                    {/* Results with blur overlay for limit states */}
                    <div className="relative">
                        {/* Blur overlay for soft/hard limit - blocks interaction */}
                        {(isAtSoftLimit || isAtHardLimit) && !isSignedIn && hasSearched && (
                            <div className="absolute inset-0 z-10">
                                <div className="h-[450px] pointer-events-none" /> {/* Show first 3 results clearly */}
                                <div className="backdrop-blur-md bg-background/60 h-full cursor-not-allowed" /> {/* Blocks clicks */}
                            </div>
                        )}
                        <div className={(isAtSoftLimit || isAtHardLimit) && !isSignedIn && hasSearched ? "pointer-events-none" : ""}>
                            <SearchResults
                                results={displayResults}
                                isLoading={showLoading}
                                userId={clientSession?.user?.id}
                            />
                        </div>
                    </div>

                    {/* Soft limit banner — hairline strip, no gradient */}
                    {isAtSoftLimit && !isAtHardLimit && !isSignedIn && hasSearched && !softLimitDismissed && (
                        <div className="mt-6 p-4 bg-[rgba(255,255,255,0.02)] border border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-1">
                                    <span className="text-primary">*</span> SEARCH_LIMIT <span className="opacity-60">·</span> <span className="tabular-nums">{4 - searchCount}_REMAINING</span>
                                </div>
                                <p className="text-sm text-foreground">Sign up for unlimited searches.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSoftLimitDismissed(true)}
                                >
                                    Dismiss
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => setShowSignupModal(true)}
                                >
                                    Sign in with GitHub
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Bottom Pagination */}
                    <PaginationBlock />

                    {/* Empty State - only after search */}
                    {hasSearched && !isLoading && results.length === 0 && !error && (
                        <div className="text-center py-12">
                            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-3">
                                <span className="text-primary">*</span> SEARCH <span className="opacity-60">·</span> NO_RESULTS
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No issues found</h3>
                            <p className="text-muted-foreground">
                                Try adjusting your search query or using different keywords.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Signup Modal */}
            {showSignupModal && (
                <SignupPromptModal
                    mode={isAtHardLimit ? 'hard' : 'soft'}
                    onDismiss={() => {
                        setShowSignupModal(false);
                        setSoftLimitDismissed(true);
                    }}
                />
            )}
        </div>
    );
}
