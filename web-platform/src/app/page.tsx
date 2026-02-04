import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { OpenSourceFinder } from '@/components/finder/OpenSourceFinder';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Footer } from '@/components/layout/Footer';
import { getRecentIssues, SearchResult } from '@/lib/api';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect('/dashboard');
  }

  // Pre-fetch recent issues for SSR/ISR
  // Matches default filters in OpenSourceFinder component:
  // sortBy="newest", unassignedOnly=true
  let initialIssues: SearchResult[] = [];
  try {
    const response = await getRecentIssues(
      50,         // limit
      "newest",   // sortBy
      undefined,  // languages
      undefined,  // labels
      null,       // daysAgo
      true        // unassignedOnly
    );
    initialIssues = response.results;
  } catch (err) {
    console.error("Failed to pre-fetch recent issues for homepage:", err);
    // We continue rendering with empty initialIssues, client will try to fetch or show empty state
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Open Source Finder</h1>
          <p className="text-muted-foreground">
            Search for new contribution opportunities.
          </p>
        </div>
        <OpenSourceFinder initialRecentIssues={initialIssues} />
        <Footer />
      </main>
    </DashboardLayout>
  );
}
