import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing/LandingPage';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect('/dashboard');
  }

  // Fetch stats and recent issues client-side to improve initial load time
  // by not blocking the server render on backend calls

  return <LandingPage />;
}
