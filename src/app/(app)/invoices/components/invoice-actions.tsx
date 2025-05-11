// src/app/(app)/invoices/components/invoice-actions.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, CheckCircle, Download } from "lucide-react";
import Link from "next/link";
import type { Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface InvoiceActionsProps {
  invoice: Invoice;
  onStatusChange?: (invoiceId: string, status: Invoice['status']) => void;
}

export function InvoiceActions({ invoice, onStatusChange }: InvoiceActionsProps) {
  const { toast } = useToast();

  const handleMarkAsPaid = () => {
    console.log(`Marking invoice ${invoice.invoiceNumber} as paid.`);
    onStatusChange?.(invoice.id, "paid");
    toast({ title: "Invoice Updated", description: `${invoice.invoiceNumber} marked as paid.` });
  };

  const handleDelete = () => {
    alert(`Delete invoice: ${invoice.invoiceNumber}? (Not implemented)`);
  };
  
  const handleDownload = () => {
    alert(`Download invoice: ${invoice.invoiceNumber}? (Not implemented)`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/invoices/${invoice.id}`} className="flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            View Invoice
          </Link>
        </DropdownMenuItem>
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <DropdownMenuItem onClick={handleMarkAsPaid} className="flex items-center cursor-pointer">
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Paid
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => alert(`Edit invoice: ${invoice.invoiceNumber} (Not implemented)`)} className="flex items-center cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload} className="flex items-center cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="flex items-center text-destructive hover:!text-destructive cursor-pointer">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Invoice
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
