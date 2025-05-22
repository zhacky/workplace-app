
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
  const { user, isSuperadmin, isEnabled, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isSuperadmin && !isEnabled) {
        router.push('/pending-review');
      }
    }
  }, [user, isSuperadmin, isEnabled, loading, router]);

  if (loading) {
    // AuthProvider shows its own skeleton, so we can return null here
    // or a more specific app layout skeleton if desired.
    return null; 
  }

  if (!user || (!isSuperadmin && !isEnabled)) {
    // If not loading, and user is not present or not authorized, 
    // redirection should have happened via AuthProvider.
    // Return null to prevent rendering app layout if redirection is pending or user is unauthorized.
    return null;
  }
  
  // User is authenticated, authorized and not loading, render the app layout
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
