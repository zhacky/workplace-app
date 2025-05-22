
// src/app/(app)/invoices/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Invoice, Customer, InvoiceStatus, CompanySettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, Printer, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, notFound as navigateNotFound } from "next/navigation";
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

const defaultCompanySettings: CompanySettings = {
  companyName: "The Workplace",
  companyAddress: "123 Main Street, Anytown, USA",
  companyContact: "contact@theworkplace.com",
  paymentInstructions: "Please make payments to Workplace Bank, Account #123456789.",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { toast } = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const fetchInvoiceData = useCallback(async () => {
    if (!invoiceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [invoiceRes, settingsRes] = await Promise.all([
        fetch(`/api/invoices?id=${invoiceId}`),
        fetch('/api/settings')
      ]);

      if (!invoiceRes.ok) {
        if (invoiceRes.status === 404) {
          navigateNotFound(); 
          return;
        }
        throw new Error(`Failed to fetch invoice: ${invoiceRes.statusText}`);
      }
      const invoiceData: Invoice = await invoiceRes.json();
      setInvoice(invoiceData);

      if (settingsRes.ok) {
        const settingsData: CompanySettings = await settingsRes.json();
        setCompanySettings(settingsData);
      } else {
        console.warn("Could not fetch company settings, using defaults.");
        setCompanySettings(defaultCompanySettings);
      }

      if (invoiceData.customerId) {
        const customerRes = await fetch(`/api/customers?id=${invoiceData.customerId}`);
        if (customerRes.ok) {
          const customerData: Customer = await customerRes.json();
          setCustomer(customerData);
        } else {
          console.warn(`Could not fetch customer ${invoiceData.customerId}`);
          setCustomer(null);
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
    fetchInvoiceData();
  }, [fetchInvoiceData]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // Simulating PDF generation by opening in a new tab
    // In a real app, this would trigger a PDF generation service or library
    const pdfWindow = window.open('', '_blank');
    if (pdfWindow) {
      pdfWindow.document.write('<html><head><title>Invoice PDF</title>');
      // It's non-trivial to clone stylesheets perfectly. For a simple preview:
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('');
          } catch (e) {
            // For external stylesheets, cssRules might be null due to CORS
            if (styleSheet.href) {
              return `<link rel="stylesheet" href="${styleSheet.href}">`;
            }
            return '';
          }
        })
        .join('\n');
      pdfWindow.document.write(`<style>${styles}</style></head><body>`);
      const invoiceElement = document.querySelector('.print-container');
      if (invoiceElement) {
        pdfWindow.document.write(invoiceElement.innerHTML);
      } else {
        pdfWindow.document.write('Could not find invoice content to print.');
      }
      pdfWindow.document.write('</body></html>');
      pdfWindow.document.close(); // Important for some browsers
      pdfWindow.focus(); // Try to focus the new tab
      // pdfWindow.print(); // Optionally trigger print dialog in new tab
    }
    toast({
      title: "Displaying Invoice for Download",
      description: "Showing invoice content in a new tab. For actual PDF generation, server-side rendering or a library is recommended.",
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
      setInvoice(updatedInvoiceData); 

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
    return <div className="text-center py-10">Invoice not found.</div>;
  }
  
  const customerNameForDisplay = customer?.name || invoice.customerName || 'N/A';
  const canProcessPayment = invoice.status !== 'paid' && invoice.status !== 'cancelled';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
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
              <h2 className="text-xl font-semibold text-foreground">{companySettings.companyName}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{companySettings.companyAddress}</p>
              <p className="text-sm text-muted-foreground">{companySettings.companyContact}</p>
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
        <CardFooter className="bg-muted/30 p-6 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Payment Status:</p>
            <Badge className={cn("text-base capitalize px-3 py-1", getStatusBadgeClasses(invoice.status))}>
              {invoice.status}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground text-center md:text-right">
            <p className="font-semibold">Payment Instructions:</p>
            <p className="whitespace-pre-line">{companySettings.paymentInstructions}</p>
          </div>
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
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-container .bg-muted\\/30 {
            background-color: transparent !important;
          }
          .print-container .text-primary {
            color: black !important;
          }
          .print\\:hidden {
             display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

