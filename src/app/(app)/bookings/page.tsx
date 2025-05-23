
// src/app/(app)/bookings/page.tsx
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookingForm } from "./components/booking-form";
import { BookingsTable } from "./components/bookings-table";
import { PlusCircle } from "lucide-react";

export default function BookingsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  const handleBookingFormSuccess = useCallback(() => {
    setIsFormOpen(false);
    setRefreshKey(prevKey => prevKey + 1); 
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Hourly Bookings</h1>
          <p className="text-muted-foreground">
            Manage workspace bookings. Edit or delete existing bookings, or create new ones.
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
              <DialogDescription>
                Select a customer, date, and time to calculate the invoice for the booking.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {/* Pass null or undefined for initialData to indicate create mode */}
              <BookingForm onSuccess={handleBookingFormSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <BookingsTable refreshKey={refreshKey} />
    </div>
  );
}
