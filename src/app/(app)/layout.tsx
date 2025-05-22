// src/app/(app)/layout.tsx
'use client'; 

import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This is a secondary check; AuthProvider handles primary redirection.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // If loading, AuthProvider will show its own loading UI.
  // We avoid rendering the app layout until auth state is confirmed.
  if (loading) {
    return null; 
  }

  // If not loading and no user, redirection should have happened.
  // Return null to prevent rendering app layout on auth pages if redirection is pending.
  if (!user) {
    return null;
  }
  
  // User is authenticated and not loading, render the app layout
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r">
        <MainNav />
      </Sidebar>
      <div className="flex flex-col w-full">
        <SiteHeader />
        <SidebarInset>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
