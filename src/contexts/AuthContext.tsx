// src/contexts/AuthContext.tsx
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        // setUser(null) will be handled by onAuthStateChanged
        router.push('/login'); 
    } catch (error) {
        console.error("Error signing out: ", error);
        // Handle sign out error if needed
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !auth.app.options.apiKey) {
        // Firebase is not configured, don't run auth logic.
        // This allows viewing public pages if Firebase isn't set up for dev.
        if (!['/login', '/signup'].includes(pathname) && process.env.NODE_ENV === 'development') {
            // In dev, if firebase isn't configured, maybe show a warning or allow access.
            // For now, we'll just bypass redirection.
            console.warn("AuthProvider: Firebase not configured. Bypassing auth checks for non-public pages in development.");
        }
        return;
    }

    if (!loading) {
      const isAuthPage = pathname === '/login' || pathname === '/signup';
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  if (loading && !['/login', '/signup'].includes(pathname)) {
    // Show a loading skeleton for protected routes while auth state is being determined
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <Skeleton className="h-10 w-3/4 mb-4 md:w-1/2" />
        <Skeleton className="h-8 w-1/2 mb-2 md:w-1/3" />
        <Skeleton className="h-8 w-1/2 md:w-1/3" />
        <p className="mt-4 text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
