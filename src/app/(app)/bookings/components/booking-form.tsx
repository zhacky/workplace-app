// src/app/(app)/bookings/components/booking-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { Customer } from "@/lib/types";
import { fetchCustomers } from "@/lib/customer-api"; // Import the fetchCustomers function
import { CalendarIcon, ClockIcon } from "lucide-react";
import { format, differenceInHours, set, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const bookingFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  bookingDate: z.date({ required_error: "Booking date is required." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:mm)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:mm)."),
  notes: z.string().optional(),
}).refine(data => {
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    return (endHour > startHour) || (endHour === startHour && endMinute > startMinute);
}, {
    message: "End time must be after start time.",
    path: ["endTime"],
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});


export function BookingForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);

  // Fetch customers when the component mounts
  useEffect(() => {
    const loadCustomers = async () => {
      const customerList = await fetchCustomers();
      setCustomers(customerList);
    };
    loadCustomers();
  }, []);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customerId: "",
      bookingDate: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      notes: "",
    },
  });

  const { watch, setValue } = form;
  const watchedCustomerId = watch("customerId");
  const watchedDate = watch("bookingDate");
  const watchedStartTime = watch("startTime");
  const watchedEndTime = watch("endTime");

  useEffect(() => {
    if (watchedCustomerId && watchedDate && watchedStartTime && watchedEndTime) {
      const customer = customers.find(c => c.id === watchedCustomerId);
      if (!customer) return;

      const [startHour, startMinute] = watchedStartTime.split(':').map(Number);
      const [endHour, endMinute] = watchedEndTime.split(':').map(Number);

      const startDate = set(new Date(watchedDate), { hours: startHour, minutes: startMinute, seconds: 0, milliseconds: 0 });
      const endDate = set(new Date(watchedDate), { hours: endHour, minutes: endMinute, seconds: 0, milliseconds: 0 });
      
      if (isValid(startDate) && isValid(endDate) && endDate > startDate) {
        const hours = differenceInHours(endDate, startDate) + (differenceInMinutes(endDate, startDate) % 60) / 60;
        setCalculatedHours(hours);
        setCalculatedCost(hours * customer.hourlyRate);
      } else {
        setCalculatedHours(null);
        setCalculatedCost(null);
      }
    }
  }, [watchedCustomerId, watchedDate, watchedStartTime, watchedEndTime, customers]);


  function onSubmit(values: BookingFormValues) {
    console.log("Booking created:", values, { calculatedHours, calculatedCost });
    form.reset();
    setCalculatedCost(null);
    setCalculatedHours(null);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} (Rate: ${customer.hourlyRate}/hr)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bookingDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Booking Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <ClockIcon className="mr-2 h-4 w-4 opacity-50" />
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeOptions.map(time => (
                        <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <ClockIcon className="mr-2 h-4 w-4 opacity-50" />
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timeOptions.map(time => (
                        <SelectItem key={`end-${time}`} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {calculatedHours !== null && calculatedCost !== null && (
          <Card className="bg-secondary/50">
            <CardContent className="pt-6">
              <p className="text-lg font-semibold text-foreground">
                Total Duration: <span className="text-primary">{calculatedHours.toFixed(1)} hours</span>
              </p>
              <p className="text-2xl font-bold text-foreground">
                Estimated Cost: <span className="text-primary">${calculatedCost.toFixed(2)}</span>
              </p>
            </CardContent>
          </Card>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific requests or notes for this booking?"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || calculatedCost === null}>
          {form.formState.isSubmitting ? "Creating Booking..." : "Create Booking"}
        </Button>
      </form>
    </Form>
  );
}

// Helper for minute difference, as date-fns differenceInHours rounds down.
function differenceInMinutes(dateLeft: Date, dateRight: Date): number {
  return (dateLeft.getTime() - dateRight.getTime()) / (1000 * 60);
}

