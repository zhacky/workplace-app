
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockCustomers, mockBookings } from "@/lib/mock-data";
import type { Customer, Booking } from "@/lib/types";
import { CalendarDays, Clock, DollarSign, Edit, Mail, Phone, Briefcase, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

interface CustomerProfilePageProps {
  params: { id: string };
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const defaultAvatarUrl = "https://placehold.co/100x100.png";

const getAvatarHint = (customer: Customer): string => {
  if (customer.profilePictureUrl && customer.profilePictureUrl !== defaultAvatarUrl && !customer.profilePictureUrl.startsWith('https://picsum.photos')) { // picsum is also a placeholder
    return "profile photo";
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


export default async function CustomerProfilePage({ params }: CustomerProfilePageProps) {
  // TODO: Replace with actual API call when backend is ready for individual customer fetch
  const customer = mockCustomers.find((c) => c.id === params.id); 
  
  if (!customer) {
    // Try fetching from API if mock data fails (e.g. if mock data is out of sync)
    // This is a temporary fallback until a dedicated /api/customers/[id] endpoint exists
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/customers`);
        if (!res.ok) throw new Error('Failed to fetch customers');
        const customers: Customer[] = await res.json();
        const foundCustomer = customers.find(c => c.id === params.id);
        if (foundCustomer) {
            // customer = foundCustomer; // This line would reassign, but we can't reassign a const.
            // For now, we'll proceed with the notFound if not in mock.
            // Ideally, this whole block would be replaced by a single API call to /api/customers/[id]
             notFound(); // Keeping this simple for now.
        } else {
            notFound();
        }
    } catch (error) {
        console.error("Error fetching customer for profile page:", error);
        notFound();
    }
  }


  const customerBookings = mockBookings.filter(b => b.customerId === customer.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage 
              src={customer.profilePictureUrl || defaultAvatarUrl} 
              alt={customer.name} 
              data-ai-hint={getAvatarHint(customer)}
            />
            <AvatarFallback className="text-2xl">{getInitials(customer.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{customer.name}</h1>
            <p className="text-muted-foreground">{customer.company || "Individual Client"}</p>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </div>

      <Separator />

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="text-foreground">{customer.phone}</span>
              </div>
            )}
            {customer.company && (
                <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <span className="text-foreground">{customer.company}</span>
                </div>
            )}
             <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground capitalize">{customer.gender}</span>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">Hourly Rate: ₱{customer.hourlyRate.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">Joined: {format(new Date(customer.createdAt), "MMMM d, yyyy")}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Booking History</CardTitle>
            <CardDescription>
              Total Bookings: {customerBookings.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customerBookings.length > 0 ? (
              <ul className="space-y-4">
                {customerBookings.map((booking) => (
                  <li key={booking.id} className="p-4 border rounded-lg shadow-sm bg-background hover:bg-secondary/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-foreground">
                          {format(new Date(booking.startTime), "MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.startTime), "h:mm a")} - {format(new Date(booking.endTime), "h:mm a")} ({booking.hours} hrs)
                        </p>
                      </div>
                      <Badge variant={booking.totalAmount > 0 ? "default" : "secondary" } className="bg-primary/10 text-primary border-primary/20">
                        ₱{booking.totalAmount.toFixed(2)}
                      </Badge>
                    </div>
                    {booking.notes && <p className="mt-2 text-sm text-muted-foreground italic">Notes: {booking.notes}</p>}
                     <Link href={`/invoices?bookingId=${booking.id}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                        View Invoice(s)
                     </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-6">No bookings found for this customer.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
