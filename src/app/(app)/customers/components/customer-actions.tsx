// src/app/(app)/customers/components/customer-actions.tsx
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
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Customer } from "@/lib/types";

interface CustomerActionsProps {
  customer: Customer;
}

export function CustomerActions({ customer }: CustomerActionsProps) {
  const handleDelete = () => {
    // Placeholder for delete logic
    alert(`Delete customer: ${customer.name}? (Not implemented)`);
  };

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
          <Link href={`/customers/${customer.id}`} className="flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert(`Edit customer: ${customer.name} (Not implemented)`)} className="flex items-center cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Customer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="flex items-center text-destructive hover:!text-destructive cursor-pointer">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Customer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
