import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing/LandingPage';
import { getStats, getRecentIssues } from '@/lib/api';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect('/dashboard');
  }

  // Fetch stats server-side
  // Fetch stats and recent issues server-side
  let stats;
  let recentIssues: import('@/lib/api').SearchResult[] = [];
  try {
    const [statsRes, recentRes] = await Promise.all([
      getStats(),
      getRecentIssues(3)
    ]);
    stats = statsRes;
    recentIssues = recentRes.results;
  } catch (error) {
    console.error('Failed to pre-load landing data:', error);
  }

  return <LandingPage totalIssues={stats?.total_issues} recentIssues={recentIssues} />;
}
