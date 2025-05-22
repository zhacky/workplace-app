
// src/app/(app)/customers/components/add-customer-form.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/lib/types";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phone: z.string().optional(),
  company: z.string().optional(),
  hourlyRate: z.coerce.number().min(0, "Hourly rate must be a non-negative number."),
  gender: z.enum(['male', 'female', 'unknown'], { required_error: "Gender is required." }),
});

type AddCustomerFormValues = z.infer<typeof formSchema>;

interface AddCustomerFormProps {
  initialData?: Customer; // For editing
  onSuccess?: () => void;
}

export function AddCustomerForm({ initialData, onSuccess }: AddCustomerFormProps) {
  const { toast } = useToast();
  const isEditMode = !!initialData;

  const form = useForm<AddCustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      email: initialData.email,
      phone: initialData.phone || "",
      company: initialData.company || "",
      hourlyRate: initialData.hourlyRate,
      gender: initialData.gender,
    } : {
      name: "",
      email: "",
      phone: "",
      company: "",
      hourlyRate: 25,
      gender: "unknown",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone || "",
        company: initialData.company || "",
        hourlyRate: initialData.hourlyRate,
        gender: initialData.gender,
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: AddCustomerFormValues) {
    form.clearErrors("root.serverError");
    const endpoint = '/api/customers';
    const method = isEditMode ? 'PUT' : 'POST';
    const body = isEditMode ? JSON.stringify({ ...values, id: initialData?.id }) : JSON.stringify(values);

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      toast({
        title: isEditMode ? "Customer Updated" : "Customer Added",
        description: `${values.name} has been successfully ${isEditMode ? 'updated' : 'added'}.`,
      });
      if (!isEditMode) { // Only reset fully if adding, otherwise keep edited values for potential further edits
          form.reset({ name: "", email: "", phone: "", company: "", hourlyRate: 25, gender: "unknown" });
      }
      onSuccess?.();
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} customer:`, error);
      toast({
        title: `Failed to ${isEditMode ? 'Update' : 'Add'} Customer`,
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      form.setError("root.serverError", { type: "manual", message: error.message || "An unexpected error occurred."});
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g. john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 555-1234" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Acme Corp" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate (₱)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Gender</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="male" />
                    </FormControl>
                    <FormLabel className="font-normal">Male</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="female" />
                    </FormControl>
                    <FormLabel className="font-normal">Female</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="unknown" />
                    </FormControl>
                    <FormLabel className="font-normal">Unknown</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.serverError && (
            <FormMessage className="text-destructive text-sm font-medium">
                {form.formState.errors.root.serverError.message}
            </FormMessage>
        )}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting 
            ? (isEditMode ? "Updating..." : "Adding...") 
            : (isEditMode ? "Update Customer" : "Add Customer")}
        </Button>
      </form>
    </Form>
  );
}
