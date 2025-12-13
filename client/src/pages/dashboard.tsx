import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { User, Phone, Mail, Calendar, FileText, Clock, Download, MapPin, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import type { Booking, Report, Test } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "bg-warning text-warning-foreground",
  collected: "bg-info text-info-foreground",
  processing: "bg-info text-info-foreground",
  report_ready: "bg-success text-success-foreground",
  delivered: "bg-success text-success-foreground",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  collected: "Sample Collected",
  processing: "Processing",
  report_ready: "Report Ready",
  delivered: "Delivered",
};

export default function Dashboard() {
  const { patient } = useAuth();

  const { data: bookings, isLoading: bookingsLoading } = useQuery<(Booking & { tests: Test[] })[]>({
    queryKey: ["/api/patient/bookings"],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchIntervalInBackground: true,
    enabled: !!patient,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery<(Report & { test: Test })[]>({
    queryKey: ["/api/patient/reports"],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchIntervalInBackground: true,
    enabled: !!patient,
  });

  if (!patient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Login Required</h2>
              <p className="text-muted-foreground mb-4">Please login to access your dashboard</p>
              <Link href="/login">
                <Button data-testid="button-login">Login Now</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-background py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-welcome">
              Welcome, {patient.name}
            </h1>
            <p className="text-muted-foreground">
              Manage your bookings and access your reports
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">{patient.patientId.slice(-4)}</span>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Patient ID</div>
                      <div className="font-medium" data-testid="text-patient-id">{patient.patientId}</div>
                    </div>
                  </div>

                  {patient.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-phone">{patient.phone}</span>
                    </div>
                  )}

                  {patient.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-email">{patient.email}</span>
                    </div>
                  )}

                  {patient.gender && (
                    <div className="flex items-center gap-3 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{patient.gender}</span>
                    </div>
                  )}

                  {patient.address && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{patient.address}</span>
                    </div>
                  )}
                </div>

                <Link href="/book">
                  <Button className="w-full gap-2" data-testid="button-book-new">
                    Book New Test
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <Tabs defaultValue="bookings" className="w-full">
                <CardHeader>
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="bookings" data-testid="tab-bookings">
                      <Calendar className="h-4 w-4 mr-2" />
                      Bookings
                    </TabsTrigger>
                    <TabsTrigger value="reports" data-testid="tab-reports">
                      <FileText className="h-4 w-4 mr-2" />
                      Reports
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="bookings" className="mt-0">
                    {bookingsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : bookings && bookings.length > 0 ? (
                      <div className="space-y-4">
                        {bookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border"
                            data-testid={`booking-${booking.id}`}
                          >
                            <div className="space-y-1">
                              <div className="font-medium">
                                {booking.tests?.map((t) => t.name).join(", ") || "Test Booking"}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(booking.slot), "PPP")}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(booking.slot), "p")}
                                </div>
                                <Badge variant="outline">
                                  {booking.type === "pickup" ? "Home Collection" : "Walk-in"}
                                </Badge>
                              </div>
                            </div>
                            <Badge className={statusColors[booking.status] || "bg-muted"}>
                              {statusLabels[booking.status] || booking.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-medium mb-2">No Bookings Yet</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Book your first diagnostic test today
                        </p>
                        <Link href="/book">
                          <Button variant="outline" data-testid="button-book-first">
                            Book a Test
                          </Button>
                        </Link>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="reports" className="mt-0">
                    {reportsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : reports && reports.length > 0 ? (
                      <div className="space-y-4">
                        {reports.map((report) => (
                          <div
                            key={report.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border"
                            data-testid={`report-${report.id}`}
                          >
                            <div className="space-y-1">
                              <div className="font-medium">{report.test?.name || "Test Report"}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(report.generatedAt), "PPP")}
                              </div>
                            </div>
                            <a
                              href={`/api/reports/download/${report.secureDownloadToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="outline" size="sm" className="gap-2" data-testid={`button-download-${report.id}`}>
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-medium mb-2">No Reports Yet</h3>
                        <p className="text-muted-foreground text-sm">
                          Your test reports will appear here once ready
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
