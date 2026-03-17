import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SettingsContent } from '@/components/settings/SettingsContent';
import { AuthRequiredModal } from '@/components/shared/AuthRequiredModal';

export default async function SettingsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return (
            <DashboardLayout>
                <AuthRequiredModal
                    title="Sign in to access settings"
                    message="Manage your account preferences."
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <main className="w-full px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Settings</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your profile and preferences
                    </p>
                </div>
                <SettingsContent userId={session.user.id} />
            </main>
        </DashboardLayout>
    );
}
