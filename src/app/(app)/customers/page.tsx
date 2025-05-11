import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CustomerTable } from "./components/customer-table";
import { mockCustomers } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddCustomerForm } from "./components/add-customer-form";

export default async function CustomersPage() {
  // In a real app, fetch customers here
  const customers = mockCustomers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer profiles and booking history.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Fill in the details below to add a new customer to The Workplace.
              </DialogDescription>
            </DialogHeader>
            <AddCustomerForm />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>Showing {customers.length} customers.</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <CustomerTable customers={customers} />
          ) : (
            <p className="text-muted-foreground text-center py-8">No customers found. Add your first customer!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
