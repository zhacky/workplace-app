
// src/app/(app)/reports/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SampleChart } from "./components/sample-chart";
import { DollarSign, Users, CalendarClock, TrendingUp, AlertTriangle } from "lucide-react";
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { format, startOfMonth, endOfMonth, subMonths, getDaysInMonth, parseISO, isValid } from 'date-fns';
import type { ChartConfig } from "@/components/ui/chart";

// Firebase Admin SDK Initialization
let app: App | undefined = undefined;
let db: admin.firestore.Firestore | undefined = undefined;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (projectId && clientEmail && privateKey) {
  if (!admin.apps.length) {
    try {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } catch (e) {
      console.error("Failed to initialize Firebase Admin SDK in Reports:", e);
    }
  } else {
    app = admin.app();
  }

  if (app) {
    try {
      db = admin.firestore(app);
    } catch (e) {
      console.error("Failed to get Firestore instance in Reports:", e);
    }
  }
} else {
  console.warn(
    "Firebase Admin SDK environment variables are not fully set for Reports. Firebase features will be limited."
  );
}

interface MonthlyData {
  month: string;
  revenue: number;
  bookings: number;
}

async function getReportsData() {
  if (!db) {
    return {
      totalRevenue: 0,
      activeCustomers: 0,
      totalBookings: 0,
      occupancyRate: 0,
      lastSixMonthsPerformance: [],
      error: "Database not configured. Please check server logs.",
    };
  }

  try {
    // Total Revenue (all-time paid invoices)
    const paidInvoicesSnapshot = await db.collection('invoices').where('status', '==', 'paid').get();
    let totalRevenue = 0;
    paidInvoicesSnapshot.forEach(doc => {
      totalRevenue += doc.data().amount || 0;
    });

    // Active Customers
    const customersSnapshot = await db.collection('customers').count().get();
    const activeCustomers = customersSnapshot.data().count;

    // Total Bookings (all-time)
    const bookingsSnapshot = await db.collection('bookings').count().get();
    const totalBookings = bookingsSnapshot.data().count;

    // Occupancy Rate for current month
    const now = new Date();
    const currentMonthStartStr = format(startOfMonth(now), "yyyy-MM-dd");
    const currentMonthEndStr = format(endOfMonth(now), "yyyy-MM-dd");
    const daysInCurrentMonth = getDaysInMonth(now);
    const potentialTotalHours = daysInCurrentMonth * 200;

    const currentMonthBookingsSnapshot = await db.collection('bookings')
      .where('bookingDate', '>=', currentMonthStartStr)
      .where('bookingDate', '<=', currentMonthEndStr)
      .get();
    
    let currentMonthBookedHours = 0;
    currentMonthBookingsSnapshot.forEach(doc => {
      currentMonthBookedHours += doc.data().hours || 0;
    });
    const occupancyRate = potentialTotalHours > 0 ? (currentMonthBookedHours / potentialTotalHours) * 100 : 0;

    // Data for charts (last 6 months)
    const lastSixMonthsPerformance: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonthDate = subMonths(now, i);
      const monthName = format(targetMonthDate, 'MMMM');
      const monthStartStr = format(startOfMonth(targetMonthDate), "yyyy-MM-dd");
      const monthEndStr = format(endOfMonth(targetMonthDate), "yyyy-MM-dd");

      // Revenue for the month
      const monthRevenueSnapshot = await db.collection('invoices')
        .where('status', '==', 'paid')
        .where('issueDate', '>=', monthStartStr)
        .where('issueDate', '<=', monthEndStr)
        .get();
      let monthRevenue = 0;
      monthRevenueSnapshot.forEach(doc => monthRevenue += doc.data().amount || 0);
      
      // Bookings for the month
      const monthBookingsSnapshot = await db.collection('bookings')
        .where('bookingDate', '>=', monthStartStr)
        .where('bookingDate', '<=', monthEndStr)
        .count().get();
      const monthBookingsCount = monthBookingsSnapshot.data().count;
      
      lastSixMonthsPerformance.push({ month: monthName, revenue: monthRevenue, bookings: monthBookingsCount });
    }
    
    return { 
      totalRevenue, 
      activeCustomers, 
      totalBookings, 
      occupancyRate, 
      lastSixMonthsPerformance,
      error: null 
    };

  } catch (error: any) {
    console.error("Error fetching reports data:", error);
    return {
      totalRevenue: 0,
      activeCustomers: 0,
      totalBookings: 0,
      occupancyRate: 0,
      lastSixMonthsPerformance: [],
      error: error.message || "An unexpected error occurred while fetching report data."
    };
  }
}

const revenueChartConfig = {
  revenue: {
    label: "Revenue (₱)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const bookingsChartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


export default async function ReportsPage() {
  const {
    totalRevenue,
    activeCustomers,
    totalBookings,
    occupancyRate,
    lastSixMonthsPerformance,
    error
  } = await getReportsData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Gain insights into your co-working space performance.
        </p>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive text-lg">Data Fetching Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error} Some data might be unavailable.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₱{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All-time paid invoices</p>
          </CardContent>
        </Card>
         <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">Total registered customers</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            <CalendarClock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">All-time bookings made</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Current month ({format(new Date(), "MMMM")})</p>
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
            <SampleChart 
              chartData={lastSixMonthsPerformance} 
              chartConfig={revenueChartConfig}
              dataKey="revenue" 
            />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Monthly Bookings</CardTitle>
            <CardDescription>Number of bookings each month over the past 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <SampleChart 
              chartData={lastSixMonthsPerformance} 
              chartConfig={bookingsChartConfig}
              dataKey="bookings"
            />
          </CardContent>
        </Card>
      </div>
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
