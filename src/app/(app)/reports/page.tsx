import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SampleChart } from "./components/sample-chart";
import { DollarSign, Users, CalendarClock, TrendingUp } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Gain insights into your co-working space performance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
         <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">+235</div>
            <p className="text-xs text-muted-foreground">+10 since last week</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <CalendarClock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,234</div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">72%</div>
            <p className="text-xs text-muted-foreground">Average for this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue generated each month over the past 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <SampleChart title="Monthly Revenue" dataKey="revenue" />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Monthly Bookings</CardTitle>
            <CardDescription>Number of bookings each month over the past 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <SampleChart title="Monthly Bookings" dataKey="bookings" />
          </CardContent>
        </Card>
      </div>
       {/* Add more report sections as needed */}
      <Card>
        <CardHeader>
            <CardTitle>Customer Demographics</CardTitle>
            <CardDescription>Breakdown of customer types or industries.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground text-center py-6">Customer demographics chart will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
