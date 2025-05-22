
// src/app/pending-review/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/logo';
import { Clock, RefreshCw, LogOut, Loader2 } from 'lucide-react';

export default function PendingReviewPage() {
  const { user, signOut, refreshUserStatus, isEnabled, isSuperadmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (isEnabled || isSuperadmin) {
        router.push('/dashboard');
      }
    }
  }, [user, isEnabled, isSuperadmin, authLoading, router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUserStatus();
    // useEffect will handle redirection if status changed
    setIsRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    // AuthContext handles redirection to /login
  };
  
  // Show a minimal loading state or nothing while auth is still loading
  if (authLoading && !user) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading account status...</p>
        </div>
      );
  }

  // If user is somehow null after loading (should be redirected by AuthContext, but as a safeguard)
  if (!user && !authLoading) {
    return null; 
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center">
            <Clock className="mr-2 h-6 w-6 text-primary" />
            Account Pending Review
          </CardTitle>
          <CardDescription>
            Thank you for signing up, {user?.email}! Your account is currently awaiting review by management.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            You will be notified once your account is approved. This usually takes 1-2 business days.
            If you have any urgent inquiries, please contact support.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-6">
          <Button onClick={handleRefresh} className="w-full" disabled={isRefreshing || authLoading}>
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {isRefreshing ? 'Checking...' : 'Refresh Status'}
          </Button>
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
