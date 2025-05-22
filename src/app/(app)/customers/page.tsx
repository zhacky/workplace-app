
// src/app/(app)/customers/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CustomerTable } from "./components/customer-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddCustomerForm } from "./components/add-customer-form";
import type { Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }
      const data = await response.json();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleActionComplete = () => {
    fetchCustomers(); // Re-fetch customers after add, edit or delete
    setIsAddCustomerDialogOpen(false); // Close the add dialog if it was open
  };

  let content;
  if (isLoading) {
    content = (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  } else if (error) {
    content = <p className="text-destructive text-center py-8">Error: {error}</p>;
  } else if (customers.length === 0) {
    content = <p className="text-muted-foreground text-center py-8">No customers found. Add your first customer!</p>;
  } else {
    content = <CustomerTable customers={customers} onActionComplete={handleActionComplete} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer profiles and booking history.</p>
        </div>
        <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddCustomerDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new customer to The Workplace.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <AddCustomerForm onSuccess={handleActionComplete} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          {!isLoading && !error && <CardDescription>Showing {customers.length} customers.</CardDescription>}
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    </div>
  );
}
