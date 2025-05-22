
// src/app/(app)/invoices/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { InvoiceTable } from "./components/invoice-table";
import type { Invoice, Customer } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InvoiceForm } from "./components/invoice-form";
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateInvoiceDialogOpen, setIsCreateInvoiceDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invoicesRes, customersRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/customers')
      ]);

      if (!invoicesRes.ok) throw new Error(`Failed to fetch invoices: ${invoicesRes.statusText}`);
      if (!customersRes.ok) throw new Error(`Failed to fetch customers: ${customersRes.statusText}`);

      const invoicesData = await invoicesRes.json();
      const customersData = await customersRes.json();
      
      setInvoices(invoicesData);
      setCustomers(customersData);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleActionComplete = () => {
    setRefreshKey(prev => prev + 1);
    setIsCreateInvoiceDialogOpen(false); // Close create dialog if open
  };

  let content;
  if (isLoading) {
    content = (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
      </div>
    );
  } else if (error) {
    content = <p className="text-destructive text-center py-8">Error: {error}</p>;
  } else if (invoices.length === 0) {
    content = <p className="text-muted-foreground text-center py-8">No invoices found. Create one to get started!</p>;
  } else {
    content = <InvoiceTable initialInvoices={invoices} customers={customers} onActionComplete={handleActionComplete} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Manage and track all customer invoices.</p>
        </div>
        <Dialog open={isCreateInvoiceDialogOpen} onOpenChange={setIsCreateInvoiceDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateInvoiceDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Fill in the details for the new invoice.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <InvoiceForm onSuccess={handleActionComplete} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          {!isLoading && !error && <CardDescription>Showing {invoices.length} invoices.</CardDescription>}
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    </div>
  );
}
