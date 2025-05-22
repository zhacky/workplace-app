
// src/app/(app)/settings/components/settings-form.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { CompanySettings } from "@/lib/types";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const settingsFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  companyAddress: z.string().min(10, "Company address must be at least 10 characters."),
  companyContact: z.string().min(5, "Company contact info must be at least 5 characters."),
  paymentInstructions: z.string().min(10, "Payment instructions must be at least 10 characters."),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function SettingsForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      companyName: "",
      companyAddress: "",
      companyContact: "",
      paymentInstructions: "",
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        const data: CompanySettings = await response.json();
        form.reset(data);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error Fetching Settings",
          description: "Could not load current company settings. Displaying defaults.",
          variant: "destructive",
        });
        // Defaults are already set in useForm, but explicit reset can be done here if needed for API defaults
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, [form, toast]);

  async function onSubmit(values: SettingsFormValues) {
    setIsSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save settings.");
      }

      toast({
        title: "Settings Saved",
        description: "Company details have been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-10 bg-muted rounded animate-pulse w-1/2"></div>
          <div className="h-20 bg-muted rounded animate-pulse"></div>
          <div className="h-10 bg-muted rounded animate-pulse w-3/4"></div>
          <div className="h-20 bg-muted rounded animate-pulse"></div>
          <div className="h-10 bg-muted rounded animate-pulse w-1/4 mt-4"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Company Details</CardTitle>
        <CardDescription>
          Update the company information that appears on invoices and other documents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. The Workplace Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. 123 Innovation Drive, Tech City, TC 54321"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Contact Info (for Invoice Header)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. contact@example.com | (555) 000-1111" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Instructions (for Invoice Footer)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Bank: XYZ Bank, Acc: 123456789 | GCash: 09XX-XXX-XXXX (Name)"
                      className="min-h-[100px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
