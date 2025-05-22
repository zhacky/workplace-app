
// src/app/(app)/settings/components/change-password-form.tsx
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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updatePassword } from "firebase/auth";
import { useState } from "react";

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to change your password.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(user, values.newPassword);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Error updating password:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/requires-recent-login') {
        description = "This operation is sensitive and requires recent authentication. Please log out and log back in to continue.";
      } else if (error.code === 'auth/weak-password') {
        description = "The new password is too weak. Please choose a stronger password.";
      }
      toast({
        title: "Password Update Failed",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your account password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Change Password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
