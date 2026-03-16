"use client"

import { useEffect, useState } from 'react';
import { ProjectShowcaseCard } from '@/components/shared/ProjectShowcaseCard';
import { ProjectDetailPanel } from '@/components/shared/ProjectDetailPanel';
import type { ProjectProps } from '@/components/shared/ProjectShowcaseCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export function ProjectsList({ userId, currentUser }: { userId: string, currentUser?: string }) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectProps | null>(null);

    useEffect(() => {
        async function fetchProjects() {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/api/users/me/projects`, {
                    credentials: 'include',
                    headers: {
                        'X-User-Id': userId,
                    },
                });

                if (!response.ok) throw new Error("Failed to fetch projects");

                const data = await response.json();
                setProjects(data.projects);
            } catch (err) {
                console.error(err);
                setError("Failed to load projects");
            } finally {
                setLoading(false);
            }
        }
        fetchProjects();
    }, [userId]);

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {projects.map((p, i) => (
                    <ProjectShowcaseCard
                        key={i}
                        project={p}
                        onSelect={setSelectedProject}
                    />
                ))}
            </div>
            <ProjectDetailPanel
                project={selectedProject}
                open={selectedProject !== null}
                onClose={() => setSelectedProject(null)}
            />
        </>
    );
}
