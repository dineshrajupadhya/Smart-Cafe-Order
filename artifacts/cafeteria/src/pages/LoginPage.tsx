import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChefHat } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setToken } = useAuth();
  const [, navigate] = useLocation();
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          navigate("/");
        },
        onError: (err: any) => {
          setError(err?.data?.error ?? "Login failed. Please try again.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:flex-1 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <ChefHat className="h-20 w-20 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">Welcome back to CafeteriaHub</h2>
          <p className="text-primary-foreground/80 text-lg">Order your favorite meals, track your orders, and enjoy hassle-free dining.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <ChefHat className="h-7 w-7 text-primary lg:hidden" />
              <span className="font-bold text-xl lg:hidden text-primary">CafeteriaHub</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Sign in to your account</h1>
            <p className="text-muted-foreground mt-1">Enter your credentials to continue</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">Create one</Link>
          </p>
          <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            Demo admin: <strong>admin@cafeteria.com</strong> / <strong>admin123</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
