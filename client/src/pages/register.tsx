import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { User, Phone, Mail, ArrowRight, FlaskConical, Calendar, Lock, Eye, EyeOff, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Register() {
  const [, navigate] = useLocation();
  const { loginPatient } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"register" | "verify">("register");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dob: "",
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; password: string; gender: string; dob: string }) => {
      const res = await apiRequest("POST", "/api/auth/register-email", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresVerification) {
        setStep("verify");
        toast({
          title: "Verification Required",
          description: "Please check your email for the OTP code.",
        });
      } else {
        loginPatient(data.patient, data.token);
        toast({
          title: "Registration Successful",
          description: "Welcome to Archana Pathology Lab!",
        });
        navigate("/dashboard");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const res = await apiRequest("POST", "/api/auth/verify-email", data);
      return res.json();
    },
    onSuccess: (data) => {
      loginPatient(data.patient, data.token);
      toast({
        title: "Email Verified",
        description: "Welcome to Archana Pathology Lab!",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Resend",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      gender: formData.gender,
      dob: formData.dob,
    });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    verifyMutation.mutate({
      email: formData.email,
      otp,
    });
  };

  const handleResend = () => {
    resendMutation.mutate(formData.email);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          <span className="font-semibold">Archana Pathology</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {step === "register" ? (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>
                Register to book tests and access your reports
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      data-testid="input-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                      data-testid="input-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10"
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 pr-10"
                      data-testid="input-confirm-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(v) => setFormData({ ...formData, gender: v })}
                    >
                      <SelectTrigger data-testid="select-gender">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="pl-10"
                        data-testid="input-dob"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
                    Login here
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Verify Your Email</CardTitle>
              <CardDescription>
                We sent a 6-digit code to <span className="font-medium">{formData.email}</span>
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleVerify}>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    data-testid="input-otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive the code?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto"
                    onClick={handleResend}
                    disabled={resendMutation.isPending}
                    data-testid="button-resend-otp"
                  >
                    {resendMutation.isPending ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      "Resend OTP"
                    )}
                  </Button>
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={verifyMutation.isPending || otp.length !== 6}
                  data-testid="button-verify-otp"
                >
                  {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("register")}
                  data-testid="button-back-to-register"
                >
                  Back to Registration
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </main>
    </div>
  );
}
