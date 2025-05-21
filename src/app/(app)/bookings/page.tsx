import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingForm } from "./components/booking-form";
import { BookingsTable } from "./components/bookings-table";

export default function BookingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Hourly Bookings</h1>
        <p className="text-muted-foreground">
          Create new hourly bookings for customers at The Workplace.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>New Booking</CardTitle>
          <CardDescription>
            Select a customer, date, and time to calculate the invoice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BookingForm />
        </CardContent>
      </Card>

      <BookingsTable />
    </div>
  );
}
