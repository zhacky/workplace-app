import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { SiteHeader } from "@/components/site-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
