
// src/app/(app)/bookings/components/bookings-table.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isValid } from 'date-fns';
import type { Customer } from '@/lib/types';
import { fetchCustomers } from '@/lib/customer-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface BookingFromAPI {
  id: string;
  customerId: string;
  bookingDate: string; // "yyyy-MM-dd"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  hours: number;
  cost: number;
  notes?: string;
  createdAt?: string; // ISO date string - made optional
}

interface EnrichedBooking extends BookingFromAPI {
  customerName?: string;
}

interface BookingsTableProps {
  refreshKey: number; // Used to trigger re-fetch
}

export function BookingsTable({ refreshKey }: BookingsTableProps) {
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingsAndCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsResponse, customersData] = await Promise.all([
        fetch('/api/bookings'),
        fetchCustomers()
      ]);

      if (!bookingsResponse.ok) {
        const errorText = bookingsResponse.statusText || `HTTP error status: ${bookingsResponse.status}`;
        throw new Error(`Error fetching bookings: ${errorText}`);
      }
      const bookingsData: BookingFromAPI[] = await bookingsResponse.json();
      
      setCustomers(customersData);
      const customerMap = new Map(customersData.map(c => [c.id, c.name]));

      const enrichedBookingsData = bookingsData.map(b => ({
        ...b,
        customerName: customerMap.get(b.customerId) || b.customerId,
      }));
      
      setBookings(enrichedBookingsData);

    } catch (error: any) {
      console.error("Could not fetch bookings or customers:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookingsAndCustomers();
  }, [fetchBookingsAndCustomers, refreshKey]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bookings List</CardTitle>
          <CardDescription>Loading bookings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>Bookings List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-center py-8">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bookings List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No bookings found. Create one to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Bookings List</CardTitle>
          <CardDescription>
            Showing {bookings.length} recent bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Booking Date</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-center">Notes</TableHead>
                <TableHead className="text-right">Created On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map(booking => {
                let formattedCreatedAt = 'N/A';
                if (booking.createdAt && typeof booking.createdAt === 'string') {
                  try {
                    const parsedDate = parseISO(booking.createdAt);
                    if (isValid(parsedDate)) {
                       formattedCreatedAt = format(parsedDate, "MMM d, yyyy, p");
                    } else {
                      console.warn(`Invalid date string for booking ${booking.id}: ${booking.createdAt}`);
                    }
                  } catch (e) {
                    console.error(`Error parsing date for booking ${booking.id}: ${booking.createdAt}`, e);
                  }
                } else if (booking.createdAt) {
                  // If createdAt exists but is not a string (e.g., already a Date object from a different source, though unlikely here)
                  try {
                    const dateValue = new Date(booking.createdAt as any); // Attempt to coerce
                    if (isValid(dateValue)) { 
                       formattedCreatedAt = format(dateValue, "MMM d, yyyy, p");
                    } else {
                       console.warn(`Invalid non-string date value for booking ${booking.id}:`, booking.createdAt);
                    }
                  } catch(e) {
                     console.error(`Error coercing/formatting date for booking ${booking.id}:`, booking.createdAt, e);
                  }
                }


                return (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.customerName || 'N/A'}</TableCell>
                  <TableCell>{format(parseISO(booking.bookingDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>{booking.startTime} - {booking.endTime}</TableCell>
                  <TableCell className="text-center">{booking.hours} hr(s)</TableCell>
                  <TableCell className="text-right">₱{booking.cost ? booking.cost.toFixed(2) : 'N/A'}</TableCell>
                  <TableCell className="text-center">
                    {booking.notes ? (
                       <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border shadow-md">
                          <p>{booking.notes}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formattedCreatedAt}</TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

    