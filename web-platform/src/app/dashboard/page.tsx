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
            <main className="w-full px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Your development overview and progress
                    </p>
                </div>

                <DashboardContent userId={session.user.id} />
            </main>
        </DashboardLayout>
    );
}
