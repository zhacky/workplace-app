
// src/app/(app)/invoices/components/invoice-table.tsx
"use client";

import type { Invoice, InvoiceStatus, Customer } from "@/lib/types";
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
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface InvoiceTableProps {
  initialInvoices: Invoice[];
  customers: Customer[];
  onActionComplete: () => void; 
}

export function InvoiceTable({ initialInvoices, customers, onActionComplete }: InvoiceTableProps) {
  // Removed local invoices state, will rely on props passed from InvoicesPage
  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  const getStatusBadgeClasses = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200/80';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200/80';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200/80';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200/80'; // Using lighter shades for destructive for consistency
      case 'cancelled':
        return 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200/80 line-through';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'; // Default fallback
    }
  };


  const formatDateSafe = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const parsedDate = parseISO(dateString);
      if (isValid(parsedDate)) {
        return format(parsedDate, "MMM d, yyyy");
      }
    } catch (e) {
      console.error(`Error parsing date string "${dateString}":`, e);
    }
    return 'Invalid Date';
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
        {initialInvoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
            <TableCell>{customerMap.get(invoice.customerId) || invoice.customerName || 'N/A'}</TableCell>
            <TableCell>{formatDateSafe(invoice.issueDate)}</TableCell>
            <TableCell>{formatDateSafe(invoice.dueDate)}</TableCell>
            <TableCell className="text-right">₱{invoice.amount.toFixed(2)}</TableCell>
            <TableCell className="text-center">
              <Badge 
                variant={"outline"} // Using outline variant for consistent border application
                className={cn("capitalize px-2 py-0.5 text-xs", getStatusBadgeClasses(invoice.status))}
              >
                {invoice.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <InvoiceActions invoice={invoice} onActionComplete={onActionComplete} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
