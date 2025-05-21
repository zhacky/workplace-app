// src/app/(app)/bookings/components/bookings-table.tsx
'use client';

import { useState, useEffect } from 'react';
// Import your table component (adjust the path if needed)
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// You might want to define an interface for your booking data based on what your API returns
interface Booking {
  id: string;
  customerId: string; // Or a customer object if you join data
  hours: number;
  cost: number;
  createdAt: string; // Changed from Firestore Timestamp to string, as it's serialized to JSON
  // Optionally add other fields returned by the API if needed for the table
  // customerName?: string;
  // bookingDate?: string; // Dates from API will be strings
  // startTime?: string;
  // endTime?: string;
  // notes?: string;
}

export function BookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const response = await fetch('/api/bookings');
        if (!response.ok) {
          const errorText = response.statusText || `HTTP error status: ${response.status}`;
          throw new Error(`Error fetching bookings: ${errorText}`);
        }
        const data: Booking[] = await response.json();
        setBookings(data);
      } catch (error: any) {
        console.error("Could not fetch bookings:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  if (loading) {
    return <div>Loading bookings...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (bookings.length === 0) {
    return <div>No bookings found.</div>;
  }

  return (
    // Replace this div with your actual table component usage
    // You'll need to map over the 'bookings' array to populate the table rows
    <div>
      <h2>Bookings List (Placeholder Table)</h2>
      {/* Example of how you might use a table component: */}
      {/*
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer ID</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map(booking => (
            <TableRow key={booking.id}>
              <TableCell>{booking.customerId}</TableCell>
              <TableCell>{booking.hours}</TableCell>
              <TableCell>{booking.cost.toFixed(2)}</TableCell>
              <TableCell>{new Date(booking.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      */}
      {/* Basic list for now to show data is fetched */}
      <ul>
        {bookings.map(booking => (
          <li key={booking.id}>
            Customer ID: {booking.customerId}, Hours: {booking.hours}, Amount: {booking.cost ? booking.cost.toFixed(2) : 'N/A'}, Date: {new Date(booking.createdAt).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
