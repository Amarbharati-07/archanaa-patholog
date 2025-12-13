import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Mail, ArrowRight, FlaskConical, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const requestOtpMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return res.json();
    },
    onSuccess: (data) => {
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "If this email is registered, you will receive a password reset code.",
      });
      if (data.debug_otp) {
        console.log("Debug OTP:", data.debug_otp);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP.",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "You can now login with your new password.",
      });
      navigate("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Invalid OTP or password reset failed.",
        variant: "destructive",
      });
    },
  });

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Required Field",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    requestOtpMutation.mutate({ email });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setStep("reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwords.newPassword || !passwords.confirmPassword) {
      toast({
        title: "Required Fields",
        description: "Please enter and confirm your new password.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({
      email,
      otp,
      newPassword: passwords.newPassword,
    });
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              {step === "email" && "Enter your email to receive a reset code"}
              {step === "otp" && "Enter the 6-digit code sent to your email"}
              {step === "reset" && "Create your new password"}
            </CardDescription>
          </CardHeader>

          {step === "email" && (
            <form onSubmit={handleRequestOtp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      data-testid="input-email"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={requestOtpMutation.isPending}
                  data-testid="button-send-otp"
                >
                  {requestOtpMutation.isPending ? "Sending..." : "Send Reset Code"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-login">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </CardFooter>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Label className="text-center block">Enter OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
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
                    Sent to: {email}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  data-testid="button-verify-otp"
                >
                  Verify Code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                  }}
                  data-testid="button-back"
                >
                  Change Email
                </Button>
              </CardFooter>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="pl-10 pr-10"
                      data-testid="input-new-password"
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
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
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
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-reset-password"
                >
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStep("otp");
                    setPasswords({ newPassword: "", confirmPassword: "" });
                  }}
                  data-testid="button-back-otp"
                >
                  Back
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
