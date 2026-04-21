"use client"

import { useEffect, useState, useRef, useCallback } from 'react';
import { ProjectShowcaseCard } from '@/components/shared/ProjectShowcaseCard';
import { ProjectDetailPanel } from '@/components/shared/ProjectDetailPanel';
import { PendingProjectCard } from '@/components/projects/PendingProjectCard';
import type { ProjectProps } from '@/components/shared/ProjectShowcaseCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

// Poll for updates every 30s when any project is still PENDING — lets
// an in-progress V4 audit swap its pending card for a verified one
// without forcing the user to refresh.
const POLL_INTERVAL_MS = 30_000;

interface RawProject extends ProjectProps {
    id?: string;
    status?: 'VERIFIED' | 'PENDING';
}

export function ProjectsList({ userId, currentUser }: { userId: string, currentUser?: string }) {
    const [projects, setProjects] = useState<RawProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectProps | null>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const fetchProjects = useCallback(async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(`${API_URL}/api/users/me/projects`, {
                credentials: 'include',
                headers: { 'X-User-Id': userId },
            });
            if (!response.ok) throw new Error("Failed to fetch projects");
            const data = await response.json();
            setProjects(data.projects);
            return data.projects as RawProject[];
        } catch (err) {
            console.error(err);
            setError("Failed to load projects");
            return [];
        }
    }, [userId]);

    // Initial fetch on mount
    useEffect(() => {
        fetchProjects().finally(() => setLoading(false));
    }, [fetchProjects]);

    // Polling: while any project is pending, refetch every 30s. Stop
    // automatically when all are verified. On mount or whenever the set
    // of pending projects changes, we reconcile the interval state.
    useEffect(() => {
        const hasPending = projects.some((p) => p.status === 'PENDING');
        const clearPoll = () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };

        if (!hasPending) {
            clearPoll();
            return;
        }
        if (pollRef.current) return; // already polling

        pollRef.current = setInterval(() => {
            fetchProjects();
        }, POLL_INTERVAL_MS);

        return clearPoll;
    }, [projects, fetchProjects]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-red-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    {error}
                </CardContent>
            </Card>
        );
    }

    if (projects.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="p-12 text-center text-muted-foreground">
                    <p>No verified projects yet. Import one to start!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className={`grid gap-4 ${projects.length === 1 ? 'grid-cols-1 max-w-2xl' : 'grid-cols-1 lg:grid-cols-2'}`}>
                {projects.map((p, i) =>
                    p.status === 'PENDING' ? (
                        <PendingProjectCard
                            key={p.id ?? `pending-${i}`}
                            name={p.name}
                            repoUrl={p.repoUrl}
                        />
                    ) : (
                        <ProjectShowcaseCard
                            key={p.id ?? i}
                            project={p}
                            onSelect={setSelectedProject}
                        />
                    ),
                )}
            </div>
            <ProjectDetailPanel
                project={selectedProject}
                open={selectedProject !== null}
                onClose={() => setSelectedProject(null)}
            />
        </>
    );
}
