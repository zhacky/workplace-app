
// src/app/(app)/dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, FileText, BarChart3, AlertTriangle } from "lucide-react";
import Link from "next/link";
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { format, startOfMonth, endOfMonth, isValid } from 'date-fns';

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
      console.error("Failed to initialize Firebase Admin SDK in Dashboard:", e);
    }
  } else {
    app = admin.app();
  }

  if (app) {
    try {
      db = admin.firestore(app);
    } catch (e) {
      console.error("Failed to get Firestore instance in Dashboard:", e);
    }
  }
} else {
  console.warn(
    "Firebase Admin SDK environment variables are not fully set for Dashboard. Firebase features will be limited."
  );
}

async function getDashboardData() {
  if (!db) {
    return {
      activeCustomers: 0,
      todaysBookings: 0,
      pendingInvoices: 0,
      monthlyRevenue: 0,
      error: "Database not configured. Please check server logs.",
    };
  }

  try {
    const customersSnapshot = await db.collection('customers').count().get();
    const activeCustomers = customersSnapshot.data().count;

    const todayString = format(new Date(), "yyyy-MM-dd");
    const todaysBookingsSnapshot = await db.collection('bookings').where('bookingDate', '==', todayString).count().get();
    const todaysBookings = todaysBookingsSnapshot.data().count;

    const pendingInvoicesSnapshot = await db.collection('invoices').where('status', 'in', ['sent', 'overdue']).count().get();
    const pendingInvoices = pendingInvoicesSnapshot.data().count;

    const now = new Date();
    const currentMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
    const currentMonthEnd = format(endOfMonth(now), "yyyy-MM-dd");
    
    const monthlyRevenueSnapshot = await db.collection('invoices')
      .where('status', '==', 'paid')
      .where('issueDate', '>=', currentMonthStart)
      .where('issueDate', '<=', currentMonthEnd)
      .get();
    
    let monthlyRevenue = 0;
    monthlyRevenueSnapshot.forEach(doc => {
      monthlyRevenue += doc.data().amount || 0;
    });

    return { activeCustomers, todaysBookings, pendingInvoices, monthlyRevenue, error: null };
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return { 
        activeCustomers: 0, 
        todaysBookings: 0, 
        pendingInvoices: 0, 
        monthlyRevenue: 0, 
        error: error.message || "An unexpected error occurred while fetching data." 
    };
  }
}


export default async function DashboardPage() {
  const { 
    activeCustomers, 
    todaysBookings, 
    pendingInvoices, 
    monthlyRevenue,
    error 
  } = await getDashboardData();

  const kpiData = [
    { title: "Active Customers", value: activeCustomers.toString(), icon: Users, color: "text-blue-500", href: "/customers" },
    { title: "Today's Bookings", value: todaysBookings.toString(), icon: Clock, color: "text-green-500", href: "/bookings" },
    { title: "Pending Invoices", value: pendingInvoices.toString(), icon: FileText, color: "text-orange-500", href: "/invoices" },
    { title: "Monthly Revenue", value: `₱${monthlyRevenue.toFixed(2)}`, icon: BarChart3, color: "text-purple-500", href: "/reports" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to Workplace Studio</h1>
        <p className="text-muted-foreground">Manage your co-working space efficiently.</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Link href={kpi.href} key={kpi.title} legacyBehavior>
            <a className="block hover:shadow-lg transition-shadow duration-200 rounded-lg">
              <Card className="hover:border-primary transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">
                    View Details
                  </p>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Recent activities will be shown here. (e.g., new bookings, customer registrations)</p>
            {/* Placeholder for recent activity list */}
            <ul className="mt-4 space-y-2">
                <li className="text-sm text-foreground">Alice Wonderland booked 3 hours.</li>
                <li className="text-sm text-foreground">New customer: Bob The Builder registered.</li>
                <li className="text-sm text-foreground">Invoice #INV-2024-001 paid.</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             <Link href="/bookings" className="block text-primary hover:underline">Create New Booking</Link>
             <Link href="/customers" className="block text-primary hover:underline">Add New Customer</Link>
             <Link href="/reports" className="block text-primary hover:underline">View Reports</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
