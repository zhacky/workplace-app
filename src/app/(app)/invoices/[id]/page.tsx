import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockInvoices, mockCustomers } from "@/lib/mock-data";
import type { Invoice, Customer, InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Download, Mail, Printer, CreditCard } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

interface InvoiceDetailPageProps {
  params: { id: string };
}

const getStatusBadgeClasses = (status: InvoiceStatus) => {
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
        return '';
    }
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const invoice = mockInvoices.find((inv) => inv.id === params.id) as Invoice | undefined;
  if (!invoice) {
    notFound();
  }

  const customer = mockCustomers.find(c => c.id === invoice.customerId) as Customer | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href="/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
          {invoice.status !== 'paid' && <Button><CreditCard className="mr-2 h-4 w-4" /> Process Payment</Button>}
        </div>
      </div>

      <Card className="w-full max-w-4xl mx-auto shadow-xl">
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
              <p className="text-foreground font-medium">{invoice.customerName}</p>
              {customer?.email && <p className="text-muted-foreground">{customer.email}</p>}
              {customer?.phone && <p className="text-muted-foreground">{customer.phone}</p>}
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Issue Date:</p>
              <p className="text-foreground">{format(new Date(invoice.issueDate), "MMMM d, yyyy")}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Due Date:</p>
              <p className="text-foreground">{format(new Date(invoice.dueDate), "MMMM d, yyyy")}</p>
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
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-foreground">{item.description}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{item.quantity}</TableCell>
                  <TableCell className="text-right text-muted-foreground">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium text-foreground">${item.total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator className="my-6" />
          <div className="flex justify-end">
            <div className="w-full md:w-1/3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="text-foreground">${invoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (0%):</span>
                <span className="text-foreground">$0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-foreground">Total Amount Due:</span>
                <span className="text-primary">${invoice.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Payment Status:</p>
            <Badge className={cn("text-lg capitalize px-3 py-1", getStatusBadgeClasses(invoice.status))}>
              {invoice.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground text-center md:text-right">
            Thank you for your business! <br/> Please make payments to Workplace Bank, Account #123456789.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
