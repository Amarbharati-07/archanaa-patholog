import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Calendar, FlaskConical, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminLayout } from "@/components/admin-layout";

interface DashboardStats {
  totalPatients: number;
  totalReports: number;
  pendingBookings: number;
  totalTests: number;
  recentBookings: number;
  todayReports: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  const statCards = [
    { 
      title: "Total Patients", 
      value: stats?.totalPatients || 0, 
      icon: Users,
      description: "Registered patients"
    },
    { 
      title: "Total Reports", 
      value: stats?.totalReports || 0, 
      icon: FileText,
      description: "Generated reports"
    },
    { 
      title: "Pending Bookings", 
      value: stats?.pendingBookings || 0, 
      icon: Calendar,
      description: "Awaiting collection"
    },
    { 
      title: "Available Tests", 
      value: stats?.totalTests || 0, 
      icon: FlaskConical,
      description: "Test catalog"
    },
    { 
      title: "Today's Reports", 
      value: stats?.todayReports || 0, 
      icon: TrendingUp,
      description: "Generated today"
    },
    { 
      title: "Recent Bookings", 
      value: stats?.recentBookings || 0, 
      icon: Clock,
      description: "Last 7 days"
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-muted-foreground">Overview of lab operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} data-testid={`card-stat-${stat.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold">{stat.value.toLocaleString()}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a 
                href="/admin/create-report" 
                className="block p-4 rounded-lg border hover-elevate transition-colors"
                data-testid="link-quick-create-report"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Create New Report</div>
                    <div className="text-sm text-muted-foreground">Enter test results and generate PDF</div>
                  </div>
                </div>
              </a>
              <a 
                href="/admin/patients" 
                className="block p-4 rounded-lg border hover-elevate transition-colors"
                data-testid="link-quick-patients"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Search Patients</div>
                    <div className="text-sm text-muted-foreground">Find patient by ID, name, or phone</div>
                  </div>
                </div>
              </a>
              <a 
                href="/admin/bookings" 
                className="block p-4 rounded-lg border hover-elevate transition-colors"
                data-testid="link-quick-bookings"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">View Bookings</div>
                    <div className="text-sm text-muted-foreground">Manage pending sample collections</div>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Activity log will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
