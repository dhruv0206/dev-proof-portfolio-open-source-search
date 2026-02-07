import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { OpenSourceFinder } from '@/components/finder/OpenSourceFinder';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default async function FinderPage() {
    // Check session but don't require it - finder is public
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return (
        <DashboardLayout>
            <main className="w-full px-8 py-8">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold mb-2">Open Source Finder</h1>
                    <p className="text-muted-foreground">
                        Search for new contribution opportunities.
                    </p>
                </div>

                <Alert className="mb-6 border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800">
                    <Info className="h-4 w-4 stroke-current" />
                    <AlertTitle>Database Refresh</AlertTitle>
                    <AlertDescription>
                        Database refreshed for open source contributions search due to some updated.
                    </AlertDescription>
                </Alert>

                <OpenSourceFinder />
            </main>
        </DashboardLayout>
    );
}
