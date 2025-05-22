
// src/contexts/AuthContext.tsx
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { onAuthStateChanged, signOut as firebaseSignOut, getIdTokenResult } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserCustomClaims } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null;
  isSuperadmin: boolean;
  isEnabled: boolean;
  loading: boolean;
  refreshUserStatus: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserClaims = useCallback(async (currentUser: FirebaseUser | null) => {
    if (currentUser) {
      try {
        // Force refresh true to get latest claims
        const idTokenResult = await getIdTokenResult(currentUser, true);
        const claims = (idTokenResult.claims as UserCustomClaims) || {};
        setIsSuperadmin(claims.isSuperadmin === true);
        setIsEnabled(claims.isEnabled === true);
      } catch (error) {
        console.error("Error fetching user claims:", error);
        setIsSuperadmin(false);
        setIsEnabled(false);
      }
    } else {
      setIsSuperadmin(false);
      setIsEnabled(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      await fetchUserClaims(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchUserClaims]);

  const refreshUserStatus = useCallback(async () => {
    setLoading(true);
    if (auth.currentUser) {
      await fetchUserClaims(auth.currentUser);
    }
    setLoading(false);
  }, [fetchUserClaims]);

  const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        // setUser, isSuperadmin, isEnabled will be reset by onAuthStateChanged
        router.push('/login'); 
    } catch (error) {
        console.error("Error signing out: ", error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !auth.app.options.apiKey) {
        if (!['/login', '/signup', '/pending-review'].includes(pathname) && process.env.NODE_ENV === 'development') {
            console.warn("AuthProvider: Firebase not configured. Bypassing auth checks for non-public pages in development.");
        }
        return;
    }

    if (!loading) {
      const isAuthPage = pathname === '/login' || pathname === '/signup';
      const isPendingReviewPage = pathname === '/pending-review';

      if (!user) { // Not logged in
        if (!isAuthPage && !isPendingReviewPage) { // Allow access to pending-review if directly navigated to (though it should redirect if no user)
          router.push('/login');
        }
      } else { // Logged in
        if (isSuperadmin || isEnabled) { // Superadmin or Enabled User
          if (isAuthPage || isPendingReviewPage) {
            router.push('/dashboard');
          }
        } else { // Logged in, but not superadmin and not enabled
          if (!isPendingReviewPage) {
            router.push('/pending-review');
          }
        }
      }
    }
  }, [user, isSuperadmin, isEnabled, loading, pathname, router]);

  if (loading && !['/login', '/signup', '/pending-review'].includes(pathname)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
        <Skeleton className="h-10 w-3/4 mb-4 md:w-1/2" />
        <Skeleton className="h-8 w-1/2 mb-2 md:w-1/3" />
        <Skeleton className="h-8 w-1/2 md:w-1/3" />
        <p className="mt-4 text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, isSuperadmin, isEnabled, loading, refreshUserStatus, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
