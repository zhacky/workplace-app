
// src/app/(app)/layout.tsx
'use client'; 

import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Booking, Customer } from "@/lib/types";
import { fetchCustomers } from "@/lib/customer-api";
import { parseISO, set, differenceInMinutes, isFuture, isValid, format } from 'date-fns';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isSuperadmin, isEnabled, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [notifiedBookingIds, setNotifiedBookingIds] = useState<Set<string>>(new Set());
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Fetch customers once for notification purposes
  useEffect(() => {
    if (user && (isSuperadmin || isEnabled)) { // Only fetch if user is authorized
      const loadCustomers = async () => {
        try {
          const customerList = await fetchCustomers();
          setCustomers(customerList);
        } catch (error) {
          console.error("Error fetching customers for notifications:", error);
        }
      };
      loadCustomers();
    }
  }, [user, isSuperadmin, isEnabled]);

  const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);

  const checkUpcomingBookings = useCallback(async () => {
    if (customers.length === 0 && !user) return; // Don't check if customers aren't loaded or no user

    try {
      const response = await fetch('/api/bookings');
      if (!response.ok) {
        console.error("Failed to fetch bookings for notifications, status:", response.status);
        return;
      }
      const bookingsData: Booking[] = await response.json();
      const now = new Date();

      bookingsData.forEach(booking => {
        if (notifiedBookingIds.has(booking.id)) {
          return; // Already notified
        }

        try {
          if (!booking.bookingDate || !booking.startTime) {
              // console.warn("Booking missing date or start time:", booking.id);
              return;
          }
          const bookingDateObj = parseISO(booking.bookingDate);
          if (!isValid(bookingDateObj)) {
            // console.warn("Invalid booking date for notification:", booking.id, booking.bookingDate);
            return;
          }

          const [startHour, startMinute] = booking.startTime.split(':').map(Number);
          const bookingStartDateTime = set(bookingDateObj, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });

          if (!isValid(bookingStartDateTime) || !isFuture(bookingStartDateTime)) {
            return; // Invalid date or already past
          }

          const minutesUntilStart = differenceInMinutes(bookingStartDateTime, now);

          // Notify if booking is 10 to 15 minutes away
          if (minutesUntilStart >= 10 && minutesUntilStart <= 15) {
            const customerName = customerMap.get(booking.customerId) || 'A customer';
            toast({
              title: "Upcoming Booking Reminder",
              description: `Booking for ${customerName} at ${booking.startTime} is starting in ${minutesUntilStart} minutes.`,
              duration: 15000, // Show for 15 seconds
            });
            setNotifiedBookingIds(prev => new Set(prev).add(booking.id));
          }
        } catch(e) {
          console.error("Error processing booking for notification:", booking.id, e);
        }
      });
    } catch (error) {
      console.error("Error in checkUpcomingBookings:", error);
    }
  }, [toast, notifiedBookingIds, customerMap, customers.length, user]);

  useEffect(() => {
    if (!loading && user && (isSuperadmin || isEnabled)) {
      // Initial check shortly after load
      const initialCheckTimeout = setTimeout(checkUpcomingBookings, 5000); // check 5s after load
      // Periodic check
      const intervalId = setInterval(checkUpcomingBookings, 60 * 1000); // Check every minute
      
      return () => {
        clearTimeout(initialCheckTimeout);
        clearInterval(intervalId);
      };
    }
  }, [checkUpcomingBookings, loading, user, isSuperadmin, isEnabled]);


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
    return null; 
  }

  if (!user || (!isSuperadmin && !isEnabled)) {
    return null;
  }
  
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
