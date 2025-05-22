'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        // If Firebase is not configured client-side (e.g. missing API key),
        // auth might be null, and loading might be false quickly.
        // In this case, we still want to direct to login.
        if (auth.app.options.apiKey) {
             router.replace('/login');
        } else {
            // If firebase is not configured, let login page show a warning.
            router.replace('/login');
        }
      }
    }
  }, [user, loading, router]);

  // Show a loading indicator while auth state is resolving and redirection is pending.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <Skeleton className="h-10 w-3/4 mb-4 md:w-1/2" />
        <Skeleton className="h-8 w-1/2 mb-2 md:w-1/3" />
        <Skeleton className="h-8 w-1/2 md:w-1/3" />
        <p className="mt-4 text-muted-foreground">Initializing application...</p>
    </div>
  );
}

// Need to import auth to check config
import { auth } from '@/lib/firebase/client';
