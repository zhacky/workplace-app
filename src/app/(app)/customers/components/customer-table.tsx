
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
import { cn } from "@/lib/utils";

interface CustomerTableProps {
  customers: Customer[];
}

const defaultAvatarUrl = "https://placehold.co/100x100.png";

const getAvatarHint = (customer: Customer): string => {
  if (customer.profilePictureUrl && customer.profilePictureUrl !== defaultAvatarUrl) {
    return "profile photo"; // Custom image uploaded
  }
  switch (customer.gender) {
    case "male":
      return "male avatar";
    case "female":
      return "female avatar";
    case "unknown":
    default:
      return "profile avatar";
  }
};

export function CustomerTable({ customers }: CustomerTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Avatar</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="hidden sm:table-cell">Gender</TableHead>
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
                <AvatarImage 
                  src={customer.profilePictureUrl || defaultAvatarUrl} 
                  alt={customer.name} 
                  data-ai-hint={getAvatarHint(customer)}
                />
                <AvatarFallback>{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </TableCell>
            <TableCell className="font-medium">{customer.name}</TableCell>
            <TableCell>{customer.email}</TableCell>
            <TableCell>{customer.company || "-"}</TableCell>
            <TableCell className="hidden sm:table-cell capitalize">{customer.gender}</TableCell>
            <TableCell className="hidden md:table-cell">₱{customer.hourlyRate.toFixed(2)}</TableCell>
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
