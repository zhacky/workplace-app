
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { InvoiceTable } from "./components/invoice-table";
import type { Invoice, Customer } from "@/lib/types";
import Link from "next/link";

async function getInvoices(): Promise<Invoice[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/invoices`, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`Failed to fetch invoices: ${res.status} ${res.statusText}`);
    // throw new Error('Failed to fetch invoices'); // Or return empty array
    return [];
  }
  return res.json();
}

async function getCustomers(): Promise<Customer[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/customers`, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`Failed to fetch customers: ${res.status} ${res.statusText}`);
    // throw new Error('Failed to fetch customers'); // Or return empty array
    return [];
  }
  return res.json();
}


export default async function InvoicesPage() {
  const invoices = await getInvoices();
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Manage and track all customer invoices.</p>
        </div>
        <Button asChild>
          {/* TODO: Create invoice functionality needs to be properly implemented */}
          <Link href="/bookings"> 
            <PlusCircle className="mr-2 h-4 w-4" /> Create Invoice from Booking
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>Showing {invoices.length} invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <InvoiceTable initialInvoices={invoices} customers={customers} />
          ) : (
            <p className="text-muted-foreground text-center py-8">No invoices found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

