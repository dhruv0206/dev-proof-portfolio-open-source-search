import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProfileContent } from '@/components/profile/ProfileContent';
import { AuthRequiredModal } from '@/components/shared/AuthRequiredModal';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';


export default async function ProfilePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return (
            <DashboardLayout>
                <AuthRequiredModal
                    title="Sign in to view your profile"
                    message="Build and share your verified developer portfolio."
                />
            </DashboardLayout>
        );
    }

    // Get the user's GitHub username from session (mapped to 'name' in auth.ts)
    const githubUsername = session.user.name;

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
            <main className="w-full px-8 py-8">
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
