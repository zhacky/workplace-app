import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, FileText, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const kpiData = [
    { title: "Active Customers", value: "120", icon: Users, color: "text-blue-500", href: "/customers" },
    { title: "Today's Bookings", value: "15", icon: Clock, color: "text-green-500", href: "/bookings" },
    { title: "Pending Invoices", value: "8", icon: FileText, color: "text-orange-500", href: "/invoices" },
    { title: "Monthly Revenue", value: "$12,500", icon: BarChart3, color: "text-purple-500", href: "/reports" },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to Workplace Studio</h1>
        <p className="text-muted-foreground">Manage your co-working space efficiently.</p>
      </div>

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
