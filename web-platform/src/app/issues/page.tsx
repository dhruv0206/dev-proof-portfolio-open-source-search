import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { TrackedIssuesDashboard } from '@/components/issues/TrackedIssuesDashboard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AuthRequiredModal } from '@/components/shared/AuthRequiredModal';

export default async function MyIssuesPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return (
            <DashboardLayout>
                <AuthRequiredModal
                    title="Sign in to track issues"
                    message="Track issues you're working on and submit PRs for verification."
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <main className="w-full px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold mb-1">My Issues</h1>
                    <p className="text-muted-foreground">
                        Track issues you&apos;re working on and submit your PRs for verification.
                    </p>
                </div>

                <TrackedIssuesDashboard userId={session.user.id} />
            </main>
        </DashboardLayout>
    );
}
