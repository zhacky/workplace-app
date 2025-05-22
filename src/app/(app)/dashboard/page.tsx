
// src/app/(app)/dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, FileText, BarChart3, AlertTriangle, ListChecks, UserPlus, Receipt } from "lucide-react";
import Link from "next/link";
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { format, startOfMonth, endOfMonth, isValid, parseISO } from 'date-fns';
import type { Customer, Booking, Invoice } from "@/lib/types";

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

interface ActivityItem {
  type: 'booking' | 'customer' | 'invoice';
  timestamp: Date;
  description: string;
  icon: React.ElementType;
  href?: string;
}

const serializeTimestamp = (timestamp: admin.firestore.Timestamp | string | undefined): string => {
  if (timestamp instanceof admin.firestore.Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date(0).toISOString(); // Fallback for undefined or invalid
};


async function getDashboardData() {
  if (!db) {
    return {
      activeCustomers: 0,
      todaysBookings: 0,
      pendingInvoices: 0,
      monthlyRevenue: 0,
      recentActivities: [],
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

    // Fetch all customers for name mapping
    const allCustomersSnapshot = await db.collection('customers').get();
    const customerMap = new Map<string, string>();
    allCustomersSnapshot.forEach(doc => {
      customerMap.set(doc.id, doc.data().name || 'Unknown Customer');
    });

    // Recent Activities
    let activities: ActivityItem[] = [];

    // Recent Bookings
    const recentBookingsSnapshot = await db.collection('bookings').orderBy('createdAt', 'desc').limit(3).get();
    recentBookingsSnapshot.forEach(doc => {
      const booking = doc.data() as Booking;
      const customerName = customerMap.get(booking.customerId) || 'Unknown Customer';
      activities.push({
        type: 'booking',
        timestamp: parseISO(serializeTimestamp(booking.createdAt)),
        description: `${customerName} booked a session for ${format(parseISO(booking.bookingDate), 'MMM d')}.`,
        icon: Clock,
        href: `/bookings` // Or link to specific booking if detail page exists: `/bookings/${doc.id}`
      });
    });

    // Recent Customers
    const recentCustomersSnapshot = await db.collection('customers').orderBy('createdAt', 'desc').limit(3).get();
    recentCustomersSnapshot.forEach(doc => {
      const customer = doc.data() as Customer;
      activities.push({
        type: 'customer',
        timestamp: parseISO(serializeTimestamp(customer.createdAt)),
        description: `New customer registered: ${customer.name}.`,
        icon: UserPlus,
        href: `/customers/${doc.id}`
      });
    });

    // Recent Paid Invoices
    const recentPaidInvoicesSnapshot = await db.collection('invoices')
      .where('status', '==', 'paid')
      .orderBy('updatedAt', 'desc') // Assuming updatedAt is set when status changes to paid
      .limit(3).get();
      
    recentPaidInvoicesSnapshot.forEach(doc => {
      const invoice = doc.data() as Invoice;
      const customerName = customerMap.get(invoice.customerId) || invoice.customerName || 'Unknown Customer';
      activities.push({
        type: 'invoice',
        timestamp: parseISO(serializeTimestamp(invoice.updatedAt)), // Use updatedAt for paid status change
        description: `Invoice ${invoice.invoiceNumber} for ${customerName} was paid.`,
        icon: Receipt,
        href: `/invoices/${doc.id}`
      });
    });

    // Sort all activities by timestamp descending
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const recentActivities = activities.slice(0, 5); // Display top 5 recent activities overall


    return { 
      activeCustomers, 
      todaysBookings, 
      pendingInvoices, 
      monthlyRevenue, 
      recentActivities,
      error: null 
    };
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return { 
        activeCustomers: 0, 
        todaysBookings: 0, 
        pendingInvoices: 0, 
        monthlyRevenue: 0,
        recentActivities: [], 
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
    recentActivities,
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
             <CardDescription>Latest updates from your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <ul className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <activity.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm text-foreground leading-tight">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                            {format(activity.timestamp, "MMM d, yyyy 'at' p")}
                        </p>
                         {activity.href && (
                            <Link href={activity.href} className="text-xs text-primary hover:underline">
                                View Details
                            </Link>
                        )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent activities to display.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
             <Link href="/bookings" className="block text-primary hover:underline">Create New Booking</Link>
             <Link href="/customers" className="block text-primary hover:underline">Add New Customer</Link>
             <Link href="/invoices" className="block text-primary hover:underline">Create New Invoice</Link>
             <Link href="/reports" className="block text-primary hover:underline">View Full Reports</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    