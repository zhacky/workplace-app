
// src/app/(app)/invoices/components/invoice-actions.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Eye, Edit, Trash2, CheckCircle, Download, Send } from "lucide-react";
import Link from "next/link";
import type { Invoice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { InvoiceForm } from "./invoice-form"; // To be created

interface InvoiceActionsProps {
  invoice: Invoice;
  onActionComplete: () => void; // Callback to refresh data
}

export function InvoiceActions({ invoice, onActionComplete }: InvoiceActionsProps) {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpdateStatus = async (newStatus: Invoice['status']) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoice.id, status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update status to ${newStatus}`);
      }
      toast({ title: "Invoice Updated", description: `${invoice.invoiceNumber} status changed to ${newStatus}.` });
      onActionComplete();
    } catch (error: any) {
      toast({
        title: "Status Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = () => setIsDeleteDialogOpen(true);

  const confirmDelete = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoice.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete invoice");
      }
      toast({ title: "Invoice Deleted", description: `${invoice.invoiceNumber} has been successfully deleted.` });
      onActionComplete();
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onActionComplete();
  };

  const handleDownload = () => {
    // In a real app, this would trigger a PDF generation and download
    window.open(`/invoices/${invoice.id}`, '_blank'); // Open detail page for now
    toast({ title: "Download Initiated", description: `PDF for invoice ${invoice.invoiceNumber} would be generated here.`});
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isProcessing}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/invoices/${invoice.id}`} className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
           <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="flex items-center cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            Edit Invoice
          </DropdownMenuItem>
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus("paid")} className="flex items-center cursor-pointer">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark as Paid
            </DropdownMenuItem>
          )}
          {invoice.status === 'draft' && (
            <DropdownMenuItem onClick={() => handleUpdateStatus("sent")} className="flex items-center cursor-pointer">
              <Send className="mr-2 h-4 w-4" />
              Mark as Sent
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDownload} className="flex items-center cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {invoice.status !== 'paid' && ( // Typically cannot delete paid invoices easily
            <DropdownMenuItem onClick={handleDeleteClick} className="flex items-center text-destructive hover:!text-destructive cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Invoice
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Invoice: {invoice.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Update the details for this invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <InvoiceForm initialData={invoice} onSuccess={handleEditSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete invoice {invoice.invoiceNumber}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
