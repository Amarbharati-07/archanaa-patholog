import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Home as HomeIcon, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Test } from "@shared/schema";

const timeSlots = [
  "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

export default function Book() {
  const searchParams = useSearch();
  const preselectedTest = new URLSearchParams(searchParams).get("test");
  const [, navigate] = useLocation();
  const { patient } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedTests, setSelectedTests] = useState<string[]>(preselectedTest ? [preselectedTest] : []);
  const [collectionType, setCollectionType] = useState<"pickup" | "walkin">("walkin");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState({
    name: patient?.name || "",
    phone: patient?.phone || "",
    email: patient?.email || "",
    address: patient?.address || "",
  });

  const { data: tests, isLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: {
      patientId?: string;
      guestName?: string;
      phone: string;
      email?: string;
      testIds: string[];
      type: string;
      slot: string;
    }) => {
      return apiRequest("POST", "/api/bookings", data);
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "Your test booking has been successfully created. You will receive a confirmation shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Unable to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || "",
        phone: patient.phone || "",
        email: patient.email || "",
        address: patient.address || "",
      });
    }
  }, [patient]);

  const selectedTestDetails = tests?.filter((t) => selectedTests.includes(t.id)) || [];
  const totalPrice = selectedTestDetails.reduce((sum, t) => sum + Number(t.price), 0);

  const toggleTest = (testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Select Date & Time",
        description: "Please select a date and time for your appointment.",
        variant: "destructive",
      });
      return;
    }

    const slotDate = new Date(selectedDate);
    const [time, period] = selectedTime.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    slotDate.setHours(hours, minutes, 0, 0);

    bookingMutation.mutate({
      patientId: patient?.id,
      guestName: !patient ? formData.name : undefined,
      phone: formData.phone,
      email: formData.email || undefined,
      testIds: selectedTests,
      type: collectionType,
      slot: slotDate.toISOString(),
    });
  };

  const canProceedStep1 = selectedTests.length > 0;
  const canProceedStep2 = formData.name && formData.phone;
  const canProceedStep3 = selectedDate && selectedTime;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-background py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-page-title">
              Book a Test
            </h1>
            <p className="text-muted-foreground">
              Select tests, provide your details, and choose a convenient time slot
            </p>
          </div>

          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`step-indicator-${s}`}
                >
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                <span className={`ml-2 hidden sm:block ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                  {s === 1 ? "Select Tests" : s === 2 ? "Your Details" : "Schedule"}
                </span>
                {s < 3 && <div className={`w-16 md:w-24 h-1 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Tests</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tests?.map((test) => (
                      <label
                        key={test.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedTests.includes(test.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                        data-testid={`label-test-${test.code}`}
                      >
                        <Checkbox
                          checked={selectedTests.includes(test.id)}
                          onCheckedChange={() => toggleTest(test.id)}
                          data-testid={`checkbox-test-${test.code}`}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{test.name}</div>
                          <div className="text-sm text-muted-foreground">{test.category} - {test.duration}</div>
                        </div>
                        <div className="flex items-center font-semibold text-primary">
                          <IndianRupee className="h-4 w-4" />
                          {Number(test.price).toFixed(0)}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {selectedTests.length > 0 && (
                  <div className="mt-6 p-4 bg-muted rounded-lg flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">{selectedTests.length} test(s) selected</div>
                      <div className="font-semibold text-lg flex items-center gap-1">
                        Total: <IndianRupee className="h-4 w-4" />{totalPrice.toFixed(0)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="gap-2"
                  data-testid="button-next-step"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (for report delivery)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-3 pt-4">
                  <Label>Collection Type</Label>
                  <RadioGroup
                    value={collectionType}
                    onValueChange={(v) => setCollectionType(v as "pickup" | "walkin")}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <label
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer ${
                        collectionType === "walkin" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <RadioGroupItem value="walkin" data-testid="radio-walkin" />
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Walk-in</div>
                        <div className="text-sm text-muted-foreground">Visit our lab center</div>
                      </div>
                    </label>
                    <label
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer ${
                        collectionType === "pickup" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <RadioGroupItem value="pickup" data-testid="radio-pickup" />
                      <HomeIcon className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Home Collection</div>
                        <div className="text-sm text-muted-foreground">Free sample pickup</div>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {collectionType === "pickup" && (
                  <div className="space-y-2">
                    <Label htmlFor="address">Pickup Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter your complete address"
                      data-testid="input-address"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-between gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2" data-testid="button-back">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="gap-2"
                  data-testid="button-next-step"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-date-picker"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Time Slot</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(slot)}
                          data-testid={`button-time-${slot.replace(/[:\s]/g, "-")}`}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h4 className="font-semibold">Booking Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tests:</span>
                      <span>{selectedTestDetails.map((t) => t.name).join(", ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collection:</span>
                      <span>{collectionType === "pickup" ? "Home Collection" : "Walk-in"}</span>
                    </div>
                    {selectedDate && selectedTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Appointment:</span>
                        <span>{format(selectedDate, "PPP")} at {selectedTime}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total Amount:</span>
                      <span className="flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />{totalPrice.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between gap-4">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2" data-testid="button-back">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canProceedStep3 || bookingMutation.isPending}
                  className="gap-2"
                  data-testid="button-confirm-booking"
                >
                  {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
