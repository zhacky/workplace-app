
// src/app/(app)/bookings/components/booking-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import type { Customer } from "@/lib/types"; // EnrichedBooking might be better if it includes customerRate
import type { EnrichedBooking } from "./bookings-table"; // Assuming EnrichedBooking is exported
import { fetchCustomers } from "@/lib/customer-api";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { format, differenceInMinutes, set, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const bookingFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  bookingDate: z.date({ required_error: "Booking date is required." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:mm)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:mm)."),
  notes: z.string().optional(),
}).refine(data => {
    if (!data.startTime || !data.endTime) return true;
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

interface BookingFormProps {
  initialData?: EnrichedBooking; // For editing
  onSuccess?: () => void;
}

export function BookingForm({ initialData, onSuccess }: BookingFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);
  const [minCalendarDate, setMinCalendarDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const isEditMode = !!initialData;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: initialData ? {
      customerId: initialData.customerId,
      bookingDate: initialData.bookingDate && isValid(parseISO(initialData.bookingDate)) ? parseISO(initialData.bookingDate) : new Date(),
      startTime: initialData.startTime,
      endTime: initialData.endTime,
      notes: initialData.notes || "",
    } : {
      customerId: "",
      bookingDate: undefined, // Will be set in useEffect
      startTime: "09:00",
      endTime: "10:00",
      notes: "",
    },
  });

  const { watch, setValue, setError, reset } = form;

  useEffect(() => {
    if (!isEditMode) {
      const now = new Date();
      setValue("bookingDate", now, { shouldValidate: true });
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      setMinCalendarDate(todayStart);
    } else if (initialData?.bookingDate) {
        const initialDate = parseISO(initialData.bookingDate);
        if (isValid(initialDate)) {
            setValue("bookingDate", initialDate, {shouldValidate: true});
        } else {
            setValue("bookingDate", new Date(), {shouldValidate: true}); // Fallback
        }
        const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        setMinCalendarDate(todayStart); // Still restrict past dates for editing future bookings
    }
  }, [isEditMode, initialData, setValue]);
  

  useEffect(() => {
    const loadCustomers = async () => {
      const customerList = await fetchCustomers();
      setCustomers(customerList);
    };
    loadCustomers();
  }, []);

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
        const totalMinutes = differenceInMinutes(endDate, startDate);
        const hours = totalMinutes / 60;
        setCalculatedHours(hours);
        setCalculatedCost(hours * customer.hourlyRate);
      } else {
        setCalculatedHours(null);
        setCalculatedCost(null);
      }
    } else {
        setCalculatedHours(null);
        setCalculatedCost(null);
    }
  }, [watchedCustomerId, watchedDate, watchedStartTime, watchedEndTime, customers]);

  async function onSubmit(values: BookingFormValues) {
    if (calculatedHours === null || calculatedCost === null) {
      const [startHour, startMinute] = values.startTime.split(':').map(Number);
      const [endHour, endMinute] = values.endTime.split(':').map(Number);
      if (!((endHour > startHour) || (endHour === startHour && endMinute > startMinute))) {
          setError("endTime", { type: "manual", message: "End time must be after start time." });
          return;
      }
      toast({
        title: "Error",
        description: "Cannot submit booking without calculated cost or valid times.",
        variant: "destructive",
      });
      return;
    }
    
    const bookingPayload = {
      ...values,
      bookingDate: format(values.bookingDate, "yyyy-MM-dd"), // API expects string
      hours: calculatedHours,
      cost: calculatedCost,
      id: isEditMode ? initialData?.id : undefined,
    };

    try {
      const response = await fetch('/api/bookings', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} booking`);
      }
      
      await response.json(); 

      toast({
        title: isEditMode ? "Booking Updated" : "Booking Created",
        description: `The booking has been successfully ${isEditMode ? 'updated' : 'created'}.`,
      });
      
      if (!isEditMode) {
        reset({ 
          customerId: "", 
          bookingDate: new Date(),
          startTime: "09:00", 
          endTime: "10:00", 
          notes: "" 
        });
        setCalculatedCost(null);
        setCalculatedHours(null);
        const now = new Date();
        setValue("bookingDate", now, { shouldValidate: true });
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        setMinCalendarDate(todayStart);
      }
      
      onSuccess?.();

    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} booking:`, error);
      setError("root.serverError", { type: "manual", message: error.message });
      toast({
        title: `Booking ${isEditMode ? 'Update' : 'Creation'} Failed`,
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
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
              <Select onValueChange={field.onChange} value={field.value || ""} disabled={isEditMode && !!initialData?.customerId /* Optionally disable customer change on edit */}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} (Rate: ₱{customer.hourlyRate}/hr)
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
                    onSelect={(date) => {
                        if (date) field.onChange(date);
                    }}
                    disabled={(date) => minCalendarDate ? date < minCalendarDate : true}
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
                 <Select onValueChange={field.onChange} value={field.value}>
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
                  <Select onValueChange={field.onChange} value={field.value}>
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

        {calculatedHours !== null && calculatedCost !== null && calculatedHours > 0 && (
          <Card className="bg-secondary/50">
            <CardContent className="pt-6">
              <p className="text-lg font-semibold text-foreground">
                Total Duration: <span className="text-primary">{calculatedHours.toFixed(1)} hours</span>
              </p>
              <p className="text-2xl font-bold text-foreground">
                Estimated Cost: <span className="text-primary">₱{calculatedCost.toFixed(2)}</span>
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
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.serverError && (
            <FormMessage className="text-destructive text-sm">
                {form.formState.errors.root.serverError.message}
            </FormMessage>
        )}
        <Button 
          type="submit" 
          className="w-full" 
          disabled={form.formState.isSubmitting || calculatedCost === null || calculatedHours === null || calculatedHours <= 0}
        >
          {form.formState.isSubmitting 
            ? (isEditMode ? "Updating Booking..." : "Creating Booking...") 
            : (isEditMode ? "Update Booking" : "Create Booking")}
        </Button>
      </form>
    </Form>
  );
}
