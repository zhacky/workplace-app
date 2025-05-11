import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { Logo } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="md:hidden" />
          <div className="hidden md:block">
            <Logo iconOnly />
          </div>
        </div>
        
        {/* Placeholder for user actions or other header items */}
        <Button variant="ghost" size="icon">
          <UserCircle className="h-6 w-6" />
          <span className="sr-only">User Profile</span>
        </Button>
      </div>
    </header>
  );
}
