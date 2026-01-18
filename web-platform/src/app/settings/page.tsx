import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComingSoon } from '@/components/shared/ComingSoon';
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
                    message="Manage your account preferences and notification settings."
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <ComingSoon
                title="Settings"
                description="User preferences, notification settings, and account management features are currently under development."
            />
        </DashboardLayout>
    );
}
