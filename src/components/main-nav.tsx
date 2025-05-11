'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Clock,
  FileText,
  BarChart3,
  MessageSquareHeart,
  Briefcase,
} from 'lucide-react';
import { Logo } from './logo';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/bookings', label: 'Bookings', icon: Clock },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/satisfaction', label: 'Satisfaction Analysis', icon: MessageSquareHeart },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <>
      <div className="p-4">
         <Logo />
      </div>
      <SidebarMenu className="flex-1 px-2">
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              variant="default"
              size="default"
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              className="w-full justify-start"
              tooltip={{children: item.label, className: "bg-popover text-popover-foreground border shadow-md"}}
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </>
  );
}
