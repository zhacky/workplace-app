
// src/app/(app)/invoices/components/invoice-table.tsx
"use client";

import type { Invoice, InvoiceStatus } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvoiceActions } from "./invoice-actions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { mockInvoices } from "@/lib/mock-data"; // Import mock data for initial state

interface InvoiceTableProps {
  initialInvoices: Invoice[]; // Prop for initial data, can be fetched server-side
}

export function InvoiceTable({ initialInvoices }: InvoiceTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);

  useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);


  const getStatusBadgeVariant = (status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return "default"; // Will use primary color (red) if not overridden
      case "sent":
        return "secondary"; // Will use secondary color (light gray)
      case "draft":
        return "outline";
      case "overdue":
        return "destructive";
      case "cancelled":
        return "outline"; // Or a specific greyed out style
      default:
        return "default";
    }
  };

  const getStatusBadgeClasses = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30'; // Custom green for "paid"
      case 'sent':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30 hover:bg-gray-500/30';
      case 'overdue':
        return 'bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30';
      case 'cancelled':
        return 'bg-gray-400/20 text-gray-600 border-gray-400/30 hover:bg-gray-400/30 line-through';
      default:
        return '';
    }
  };

  const handleStatusChange = (invoiceId: string, newStatus: InvoiceStatus) => {
    setInvoices(prevInvoices => 
      prevInvoices.map(inv => 
        inv.id === invoiceId ? { ...inv, status: newStatus } : inv
      )
    );
  };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Issue Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
            <TableCell>{invoice.customerName}</TableCell>
            <TableCell>{format(new Date(invoice.issueDate), "MMM d, yyyy")}</TableCell>
            <TableCell>{format(new Date(invoice.dueDate), "MMM d, yyyy")}</TableCell>
            <TableCell className="text-right">₱{invoice.amount.toFixed(2)}</TableCell>
            <TableCell className="text-center">
              <Badge 
                variant={getStatusBadgeVariant(invoice.status)} 
                className={cn("capitalize", getStatusBadgeClasses(invoice.status))}
              >
                {invoice.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <InvoiceActions invoice={invoice} onStatusChange={handleStatusChange} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
