// src/app/(app)/customers/components/customer-table.tsx
"use client";

import type { Customer } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CustomerActions } from "./customer-actions";
import { format } from "date-fns";

interface CustomerTableProps {
  customers: Customer[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Avatar</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="hidden md:table-cell">Hourly Rate</TableHead>
          <TableHead className="hidden lg:table-cell">Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell>
              <Avatar className="h-10 w-10">
                <AvatarImage src={customer.profilePictureUrl} alt={customer.name} data-ai-hint="profile avatar" />
                <AvatarFallback>{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </TableCell>
            <TableCell className="font-medium">{customer.name}</TableCell>
            <TableCell>{customer.email}</TableCell>
            <TableCell>{customer.company || "-"}</TableCell>
            <TableCell className="hidden md:table-cell">${customer.hourlyRate.toFixed(2)}</TableCell>
            <TableCell className="hidden lg:table-cell">{format(new Date(customer.createdAt), "MMM d, yyyy")}</TableCell>
            <TableCell className="text-right">
              <CustomerActions customer={customer} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
