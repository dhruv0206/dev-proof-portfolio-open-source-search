'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ExternalLink, Star, MessageSquare, Calendar, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRecentIssues, searchIssues, SearchResult } from '@/lib/api';

function formatNumber(num: number): string {
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

function getLabelVariant(label: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const lower = label.toLowerCase();
    if (lower === 'good first issue') return 'default';
    if (lower === 'help wanted') return 'secondary';
    if (lower === 'bug') return 'destructive';
    return 'outline';
}

function IssueCard({ issue, index }: { issue: SearchResult; index: number }) {
    return (
        <motion.a
            href={issue.issue_url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className="block"
        >
            <Card className="hover:border-muted-foreground/50 transition-colors h-full">
                <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{issue.repo_full_name}</span>
                        <span className="flex items-center gap-1 text-yellow-500">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {formatNumber(issue.repo_stars)}
                        </span>
                        {issue.language && (
                            <Badge variant="outline" className="text-xs">
                                {issue.language}
                            </Badge>
                        )}
                    </CardDescription>
                    <CardTitle className="text-base">
                        <span className="flex items-start gap-2">
                            <span className="text-muted-foreground">#{issue.issue_number}</span>
                            <span className="line-clamp-2">{issue.title}</span>
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {issue.body && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {issue.body}
                        </p>
                    )}
                    {issue.labels && issue.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {issue.labels.slice(0, 3).map((label) => (
                                <Badge key={label} variant={getLabelVariant(label)} className="text-xs">
                                    {label}
                                </Badge>
                            ))}
                            {issue.labels.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{issue.labels.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {issue.comments_count}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(issue.created_at)}
                        </span>
                    </div>
                </CardContent>
            </Card>
        </motion.a>
    );
}

export function SearchPreview({ initialIssues }: { initialIssues?: SearchResult[] }) {
    const [query, setQuery] = useState('');
    const [issues, setIssues] = useState<SearchResult[]>(initialIssues || []);
    const [loading, setLoading] = useState(!initialIssues);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        if (initialIssues) return;

        async function loadIssues() {
            try {
                const response = await getRecentIssues(3);
                setIssues(response.results);
            } catch (err) {
                console.error('Failed to load issues:', err);
            } finally {
                setLoading(false);
            }
        }
        loadIssues();
    }, [initialIssues]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        setHasSearched(true);

        try {
            const response = await searchIssues({ query: query.trim(), limit: 3 });
            setIssues(response.results);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleClear = async () => {
        setQuery('');
        setHasSearched(false);
        setLoading(true);
        try {
            const response = await getRecentIssues(3);
            setIssues(response.results);
        } catch (err) {
            console.error('Failed to load issues:', err);
        } finally {
            setLoading(false);
        }
    };

    const isLoading = loading || searching;

    return (
        <section className="py-12 md:py-20">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                        Find Your Next <span className="text-emerald-500">Contribution</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Semantic search across 10,000+ open source issues
                    </p>
                </motion.div>

                <motion.form
                    onSubmit={handleSearch}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-xl mx-auto mb-10"
                >
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border border-border rounded-lg">
                        <Search className="w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Try: 'React hooks'..."
                            className="flex-1 min-w-0 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
                        />
                        {hasSearched && (
                            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                                Clear
                            </Button>
                        )}
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                            disabled={searching || !query.trim()}
                        >
                            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                        </Button>
                    </div>
                </motion.form>

                {hasSearched && !isLoading && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-sm text-muted-foreground mb-4"
                    >
                        Showing top 3 results for &ldquo;{query}&rdquo;
                    </motion.p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto mb-8">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="pb-3">
                                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                                    <div className="h-5 bg-muted rounded w-3/4" />
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="h-4 bg-muted rounded w-full mb-2" />
                                    <div className="h-4 bg-muted rounded w-2/3" />
                                </CardContent>
                            </Card>
                        ))
                    ) : issues.length > 0 ? (
                        issues.map((issue, index) => (
                            <IssueCard key={issue.issue_id} issue={issue} index={index} />
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-8 text-muted-foreground">
                            No issues found for &ldquo;{query}&rdquo;
                        </div>
                    )}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                        <Link href={hasSearched && query ? `/finder?q=${encodeURIComponent(query)}` : '/finder'}>
                            {hasSearched ? 'See All Results' : 'Explore All Issues'}
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
