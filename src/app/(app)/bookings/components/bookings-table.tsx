
// src/app/(app)/bookings/components/bookings-table.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isValid, isBefore, isAfter, set } from 'date-fns';
import type { Customer } from '@/lib/types';
import { fetchCustomers } from '@/lib/customer-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { BookingActions } from "./booking-actions"; // Import BookingActions

interface BookingFromAPI {
  id: string;
  customerId: string;
  bookingDate: string; // "yyyy-MM-dd"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  hours: number;
  cost: number;
  notes?: string;
  createdAt?: string | admin.firestore.Timestamp; 
  updatedAt?: string | admin.firestore.Timestamp; 
}

export interface EnrichedBooking extends Omit<BookingFromAPI, 'createdAt' | 'updatedAt'> {
  customerName?: string;
  customerHourlyRate?: number; // Useful for edit form if customer details are not re-fetched
  createdAt?: string; 
  updatedAt?: string;
}

interface BookingsTableProps {
  refreshKey: number; 
}

export function BookingsTable({ refreshKey }: BookingsTableProps) {
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDateTime(new Date());
  }, [refreshKey]);

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
      const bookingsDataFromAPI: BookingFromAPI[] = await bookingsResponse.json();
      
      setCustomers(customersData);
      const customerMap = new Map(customersData.map(c => [c.id, {name: c.name, hourlyRate: c.hourlyRate}]));

      const enrichedBookingsData: EnrichedBooking[] = bookingsDataFromAPI.map(b => {
        let createdAtString: string | undefined = undefined;
        if (typeof b.createdAt === 'string') {
          createdAtString = b.createdAt;
        } else if (b.createdAt && typeof (b.createdAt as any).toDate === 'function') {
          createdAtString = (b.createdAt as any).toDate().toISOString();
        }
        
        let updatedAtString: string | undefined = undefined;
        if (typeof b.updatedAt === 'string') {
          updatedAtString = b.updatedAt;
        } else if (b.updatedAt && typeof (b.updatedAt as any).toDate === 'function') {
          updatedAtString = (b.updatedAt as any).toDate().toISOString();
        }
        
        const customerDetails = customerMap.get(b.customerId);

        return {
          ...b,
          customerName: customerDetails?.name || b.customerId,
          customerHourlyRate: customerDetails?.hourlyRate,
          createdAt: createdAtString,
          updatedAt: updatedAtString,
        };
      });
      
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

  const handleActionComplete = () => {
    fetchBookingsAndCustomers(); // Re-fetch data when an action (edit/delete) is completed
  };

  const getBookingStatus = (booking: EnrichedBooking, now: Date | null): 'past' | 'ongoing' | 'future' | 'unknown' => {
    if (!now || !booking.bookingDate || !booking.startTime || !booking.endTime) return 'unknown';
    try {
      const bookingDateObj = parseISO(booking.bookingDate); 
      if (!isValid(bookingDateObj)) {
        console.warn(`Invalid bookingDate string for booking ${booking.id}: ${booking.bookingDate}`);
        return 'unknown';
      }

      const [startHour, startMinute] = booking.startTime.split(':').map(Number);
      const [endHour, endMinute] = booking.endTime.split(':').map(Number);

      const bookingStartDateTime = set(bookingDateObj, { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
      const bookingEndDateTime = set(bookingDateObj, { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });

      if (!isValid(bookingStartDateTime) || !isValid(bookingEndDateTime)) {
        console.warn(`Invalid start/end times for booking ${booking.id}: ${booking.startTime}, ${booking.endTime}`);
        return 'unknown';
      }
      
      if (isBefore(bookingEndDateTime, now)) return 'past';
      if (isAfter(bookingStartDateTime, now)) return 'future';
      if (isAfter(now, bookingStartDateTime) && isBefore(now, bookingEndDateTime)) return 'ongoing';
      
      return 'unknown'; // Should not happen if logic is correct
    } catch (e) {
      console.error("Error determining booking status for booking " + booking.id + ":", e);
      return 'unknown';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bookings List</CardTitle>
          <CardDescription>Loading bookings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => ( // Increased skeleton rows
              <Skeleton key={i} className="h-12 w-full rounded-md" />
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
            Showing {bookings.length} bookings. Current time: {currentDateTime ? format(currentDateTime, 'Pp') : 'Loading...'}
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
                <TableHead className="text-center hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Created/Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map(booking => {
                let formattedDateTime = 'N/A';
                const targetDateString = booking.updatedAt || booking.createdAt;

                if (typeof targetDateString === 'string' && targetDateString.length > 0) {
                  try {
                    const parsedDate = parseISO(targetDateString);
                    if (isValid(parsedDate)) {
                       formattedDateTime = format(parsedDate, "MMM d, yy, p");
                    } else {
                      console.warn(`Invalid date string for booking ${booking.id}: ${targetDateString}`);
                    }
                  } catch (e) {
                    console.error(`Error parsing date for booking ${booking.id}: ${targetDateString}`, e);
                  }
                } else if (targetDateString) {
                    console.warn(`Timestamp for booking ${booking.id} is not a non-empty string:`, targetDateString);
                }
                
                const status = getBookingStatus(booking, currentDateTime);
                const rowClasses = cn({
                  'opacity-60': status === 'past',
                  'bg-primary/10': status === 'ongoing',
                  // Future bookings use default styling
                });

                return (
                <TableRow key={booking.id} className={rowClasses}>
                  <TableCell className="font-medium">{booking.customerName || 'N/A'}</TableCell>
                  <TableCell>
                     {booking.bookingDate && isValid(parseISO(booking.bookingDate)) ? format(parseISO(booking.bookingDate), "MMM d, yyyy") : 'N/A'}
                  </TableCell>
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
                        <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground border shadow-md rounded-md p-2">
                          <p>{booking.notes}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center hidden md:table-cell">
                    <Badge variant={status === 'ongoing' ? 'default' : status === 'past' ? 'outline' : 'secondary'} 
                           className={cn("capitalize", {
                             'bg-green-100 text-green-800 border-green-300': status === 'ongoing',
                             'bg-blue-100 text-blue-800 border-blue-300': status === 'future',
                             'bg-gray-100 text-gray-600 border-gray-300': status === 'past',
                             'bg-yellow-100 text-yellow-800 border-yellow-300': status === 'unknown',
                           })}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-xs text-muted-foreground">
                    {formattedDateTime}
                    {booking.updatedAt && <Badge variant="outline" className="ml-1 text-xs p-0.5 px-1">Edited</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <BookingActions booking={booking} onActionComplete={handleActionComplete} />
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

import type admin from 'firebase-admin';
