import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { AuthRequiredModal } from '@/components/shared/AuthRequiredModal';

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return (
            <DashboardLayout>
                <AuthRequiredModal
                    title="Sign in to access Dashboard"
                    message="Track your contributions, view stats, and manage your open source journey."
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <main className="w-full px-8 py-8">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold mb-3">Dashboard</h1>
                    <p className="text-muted-foreground text-lg">
                        Your open source contribution overview and progress.
                    </p>
                </div>

                <DashboardContent userId={session.user.id} />
            </main>
        </DashboardLayout>
    );
}
