import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Home, Phone, Search, CreditCard, CheckCircle, AlertCircle, Banknote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Booking, Patient, Test, BookingStatus } from "@shared/schema";

interface BookingWithDetails extends Booking {
  patient?: Patient;
  tests: Test[];
}

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

const paymentStatusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  paid_unverified: "bg-warning text-warning-foreground",
  verified: "bg-success text-success-foreground",
  cash_on_delivery: "bg-info text-info-foreground",
  pay_at_lab: "bg-info text-info-foreground",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Payment Pending",
  paid_unverified: "Verification Pending",
  verified: "Payment Verified",
  cash_on_delivery: "Cash on Delivery",
  pay_at_lab: "Pay at Lab",
};

const paymentMethodLabels: Record<string, string> = {
  upi: "UPI",
  debit_card: "Debit Card",
  credit_card: "Credit Card",
  net_banking: "Net Banking",
  wallet: "Wallet",
  bank_transfer: "Bank Transfer",
  cash_on_delivery: "Cash on Delivery",
  pay_at_lab: "Pay at Lab",
};

const statusOptions: BookingStatus[] = ["pending", "collected", "processing", "report_ready", "delivered"];

export default function AdminBookings() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data: bookings, isLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/admin/bookings"],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/admin/bookings/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Booking status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Unable to update status.",
        variant: "destructive",
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/bookings/${id}/verify-payment`, {});
    },
    onSuccess: () => {
      toast({
        title: "Payment Verified",
        description: "Payment has been verified successfully. The patient can now access their reports.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/patient/reports"] });
      setVerifyDialogOpen(false);
      setSelectedBookingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Unable to verify payment.",
        variant: "destructive",
      });
    },
  });

  const handleVerifyClick = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setVerifyDialogOpen(true);
  };

  const confirmVerifyPayment = () => {
    if (selectedBookingId) {
      verifyPaymentMutation.mutate(selectedBookingId);
    }
  };

  const filteredBookings = bookings?.filter((b) => {
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || b.paymentStatus === paymentFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      b.patient?.patientId?.toLowerCase().includes(query) ||
      b.patient?.name?.toLowerCase().includes(query) ||
      b.guestName?.toLowerCase().includes(query) ||
      b.phone?.toLowerCase().includes(query);
    return matchesStatus && matchesPayment && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Bookings</h1>
          <p className="text-muted-foreground">Manage test appointments, sample collection, and payment verification</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, patient ID, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-bookings"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-payment-filter">
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Payment Pending</SelectItem>
                  <SelectItem value="paid_unverified">Verification Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                  <SelectItem value="pay_at_lab">Pay at Lab</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBookings && filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} data-testid={`card-booking-${booking.id}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          {booking.type === "pickup" ? (
                            <Home className="h-6 w-6 text-primary" />
                          ) : (
                            <MapPin className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold">
                              {booking.patient?.name || booking.guestName || "Guest"}
                            </span>
                            {booking.patient?.patientId && (
                              <Badge variant="secondary">{booking.patient.patientId}</Badge>
                            )}
                            <Badge variant="outline">
                              {booking.type === "pickup" ? "Home Collection" : "Walk-in"}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {booking.tests?.map((t) => t.name).join(", ") || "Test Booking"}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(booking.slot), "PPP")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(booking.slot), "p")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {booking.phone}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 lg:shrink-0">
                        <Badge className={statusColors[booking.status] || "bg-muted"}>
                          {statusLabels[booking.status] || booking.status}
                        </Badge>
                        <Select
                          value={booking.status}
                          onValueChange={(status) => updateStatusMutation.mutate({ id: booking.id, status })}
                        >
                          <SelectTrigger className="w-40" data-testid={`select-status-${booking.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {statusLabels[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Payment Details Section */}
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Payment Information</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge 
                            className={paymentStatusColors[booking.paymentStatus || 'pending'] || "bg-muted"}
                            data-testid={`payment-status-${booking.id}`}
                          >
                            {booking.paymentStatus === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {booking.paymentStatus === 'paid_unverified' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {(booking.paymentStatus === 'cash_on_delivery' || booking.paymentStatus === 'pay_at_lab') && <Banknote className="h-3 w-3 mr-1" />}
                            {paymentStatusLabels[booking.paymentStatus || 'pending'] || 'Payment Pending'}
                          </Badge>
                        </div>
                        {booking.paymentMethod && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Method:</span>
                            <span>{paymentMethodLabels[booking.paymentMethod] || booking.paymentMethod}</span>
                          </div>
                        )}
                        {booking.amountPaid && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium">Rs. {booking.amountPaid}</span>
                          </div>
                        )}
                        {booking.transactionId && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Transaction ID:</span>
                            <span className="font-mono text-xs">{booking.transactionId}</span>
                          </div>
                        )}
                        {booking.paymentDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Payment Date:</span>
                            <span>{format(new Date(booking.paymentDate), "PPp")}</span>
                          </div>
                        )}
                        {booking.paymentVerifiedAt && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Verified At:</span>
                            <span>{format(new Date(booking.paymentVerifiedAt), "PPp")}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Verify Payment Button */}
                      {booking.paymentStatus === 'paid_unverified' && (
                        <div className="mt-3">
                          <Button
                            onClick={() => handleVerifyClick(booking.id)}
                            className="gap-2"
                            data-testid={`button-verify-payment-${booking.id}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Verify Payment
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">
                {searchQuery || statusFilter !== "all" || paymentFilter !== "all" ? "No Bookings Found" : "No Bookings Yet"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery || statusFilter !== "all" || paymentFilter !== "all"
                  ? "Try adjusting your search or filter"
                  : "Patient bookings will appear here"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify this payment? Once verified, the patient will be able to access their test reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-verify">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmVerifyPayment}
              disabled={verifyPaymentMutation.isPending}
              data-testid="button-confirm-verify"
            >
              {verifyPaymentMutation.isPending ? "Verifying..." : "Verify Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
