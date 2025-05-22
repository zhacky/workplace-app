
// src/app/(app)/invoices/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Invoice, Customer, InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, Printer, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, notFound as navigateNotFound } from "next/navigation"; // Renamed to avoid conflict
import { format, parseISO, isValid } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const getStatusBadgeClasses = (status?: InvoiceStatus) => {
    if (!status) return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'sent':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
      case 'overdue':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'cancelled':
        return 'bg-gray-400/20 text-gray-600 border-gray-400/30 line-through';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const fetchInvoiceAndCustomer = useCallback(async () => {
    if (!invoiceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const invoiceRes = await fetch(`/api/invoices?id=${invoiceId}`);
      if (!invoiceRes.ok) {
        if (invoiceRes.status === 404) {
          navigateNotFound(); // Trigger Next.js notFound
          return;
        }
        throw new Error(`Failed to fetch invoice: ${invoiceRes.statusText}`);
      }
      const invoiceData: Invoice = await invoiceRes.json();
      setInvoice(invoiceData);

      if (invoiceData.customerId) {
        const customerRes = await fetch(`/api/customers?id=${invoiceData.customerId}`);
        if (customerRes.ok) {
          const customerData: Customer = await customerRes.json();
          setCustomer(customerData);
        } else {
          console.warn(`Could not fetch customer ${invoiceData.customerId}`);
          setCustomer(null); // Set customer to null if fetch fails but invoice is present
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoiceAndCustomer();
  }, [fetchInvoiceAndCustomer]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(window.location.href, '_blank');
    toast({
      title: "Displaying Invoice",
      description: "Showing invoice content in a new tab. For actual PDF generation, further integration would be needed.",
    });
  };

  const handleProcessPayment = async () => {
    if (!invoice) return;
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoice.id, status: 'paid' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process payment.");
      }
      
      const updatedInvoiceData = await response.json();
      setInvoice(updatedInvoiceData); // Update local state with the full updated invoice

      toast({
        title: "Payment Processed",
        description: `Invoice ${invoice.invoiceNumber} marked as paid.`,
      });
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Card className="w-full max-w-4xl mx-auto shadow-xl">
          <CardHeader className="bg-muted/30 p-6">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
          <CardFooter className="bg-muted/30 p-6">
            <Skeleton className="h-10 w-1/3" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center py-10">Error loading invoice: {error}</div>;
  }

  if (!invoice) {
    // This case should ideally be handled by navigateNotFound() in fetch, but as a fallback:
    return <div className="text-center py-10">Invoice not found.</div>;
  }
  
  const customerNameForDisplay = customer?.name || invoice.customerName || 'N/A';
  const canProcessPayment = invoice.status !== 'paid' && invoice.status !== 'cancelled';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="outline" asChild>
          <Link href="/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button variant="outline" onClick={handleDownloadPdf}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
          {canProcessPayment && (
            <Button onClick={handleProcessPayment} disabled={isProcessingPayment}>
              {isProcessingPayment ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Process Payment
            </Button>
          )}
        </div>
      </div>

      <Card className="w-full max-w-4xl mx-auto shadow-xl print-container">
        <CardHeader className="bg-muted/30 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
              <p className="text-muted-foreground">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-left md:text-right">
              <h2 className="text-xl font-semibold text-foreground">The Workplace</h2>
              <p className="text-sm text-muted-foreground">123 Main Street, Anytown, USA</p>
              <p className="text-sm text-muted-foreground">contact@theworkplace.com</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-muted-foreground">Billed To:</p>
              <p className="text-foreground font-medium">{customerNameForDisplay}</p>
              {customer?.email && <p className="text-muted-foreground">{customer.email}</p>}
              {customer?.phone && <p className="text-muted-foreground">{customer.phone}</p>}
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Issue Date:</p>
              <p className="text-foreground">{invoice.issueDate && isValid(parseISO(invoice.issueDate)) ? format(parseISO(invoice.issueDate), "MMMM d, yyyy") : 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Due Date:</p>
              <p className="text-foreground">{invoice.dueDate && isValid(parseISO(invoice.dueDate)) ? format(parseISO(invoice.dueDate), "MMMM d, yyyy") : 'N/A'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Description</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items && invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-foreground">{item.description}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{item.quantity}</TableCell>
                  <TableCell className="text-right text-muted-foreground">₱{item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium text-foreground">₱{item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-6" />
          <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-foreground">₱{invoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (0%):</span>
                <span className="text-foreground">₱0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">Total Amount Due:</span>
                <span className="text-primary">₱{invoice.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Payment Status:</p>
            <Badge className={cn("text-base capitalize px-3 py-1", getStatusBadgeClasses(invoice.status))}>
              {invoice.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground text-center md:text-right">
            Thank you for your business! <br/> Please make payments to Workplace Bank, Account #123456789.
          </p>
        </CardFooter>
      </Card>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            box-shadow: none !important;
            border: none !important;
          }
          /* Add any other print-specific styles here */
          .print-container .bg-muted\\/30 { /* Example for removing background colors on print */
            background-color: transparent !important;
          }
           .print-container button, .print-container a[href="/invoices"] {
            display: none !important; /* Hide buttons on print */
          }
          .print-container .flex.flex-wrap.gap-2, .print-container .flex.items-center.justify-between > .flex.gap-2 {
            display: none !important; /* Hide button containers */
          }
           .print-container .flex.items-center.justify-between a[href="/invoices"] {
            display: none !important; /* Hides the "Back to Invoices" button specifically */
          }
          .print-container .text-primary {
            color: black !important; /* Ensure primary text is black for printing */
          }
        }
      `}</style>
    </div>
  );
}
