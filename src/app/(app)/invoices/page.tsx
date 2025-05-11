import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { InvoiceTable } from "./components/invoice-table";
import { mockInvoices } from "@/lib/mock-data";
import Link from "next/link";

export default async function InvoicesPage() {
  // In a real app, fetch invoices here
  const invoices = mockInvoices;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Manage and track all customer invoices.</p>
        </div>
        <Button asChild>
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
            <InvoiceTable initialInvoices={invoices} />
          ) : (
            <p className="text-muted-foreground text-center py-8">No invoices found. Create one from a booking!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
