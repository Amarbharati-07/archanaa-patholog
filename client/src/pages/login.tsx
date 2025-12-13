import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Mail, ArrowRight, FlaskConical, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, navigate] = useLocation();
  const { loginPatient } = useAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login-email", data);
      return res.json();
    },
    onSuccess: (data) => {
      loginPatient(data.patient, data.token);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Required Fields",
        description: "Please enter your email and password.",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
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
            <CardTitle className="text-2xl">Patient Login</CardTitle>
            <CardDescription>
              Enter your email and password to login
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              <div className="text-right">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                  data-testid="link-forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                New to Archana Pathology?{" "}
                <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
                  Register here
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
