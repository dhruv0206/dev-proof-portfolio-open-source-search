import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfileContent } from '@/components/profile/ProfileContent';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Pool } from 'pg';

// Database pool for querying
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function getGitHubUsername(userId: string): Promise<string | null> {
    try {
        const result = await pool.query(
            'SELECT "githubUsername" FROM "user" WHERE id = $1',
            [userId]
        );
        return result.rows[0]?.githubUsername || null;
    } catch (error) {
        console.error('Failed to fetch GitHub username:', error);
        return null;
    }
}

export default async function ProfilePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        redirect('/');
    }

    // Get the user's GitHub username from database
    const githubUsername = await getGitHubUsername(session.user.id);

    if (!githubUsername) {
        return (
            <DashboardLayout>
                <main className="container mx-auto px-8 py-8">
                    <div className="text-center py-12">
                        <h1 className="text-2xl font-bold mb-4">Profile Not Available</h1>
                        <p className="text-muted-foreground mb-4">
                            We couldn&apos;t find your GitHub username. Please sign out and sign back in.
                        </p>
                    </div>
                </main>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <main className="container mx-auto px-8 py-8">
                {/* Header with public link */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                        <p className="text-muted-foreground">
                            Your public developer portfolio
                        </p>
                    </div>
                    <Link href={`/p/${githubUsername}`} target="_blank">
                        <Button variant="outline" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            View Public Profile
                        </Button>
                    </Link>
                </div>

                {/* Reuse the ProfileContent component */}
                <ProfileContent username={githubUsername} />
            </main>
        </DashboardLayout>
    );
}
