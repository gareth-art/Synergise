import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useSetAuth } from "@/hooks/use-auth";
import { setSessionToken } from "@/lib/session-token";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Signup() {
  const [, setLocation] = useLocation();
  const setAuth = useSetAuth();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error ?? "Signup failed. Please try again.");
        return;
      }

      // Persist session ID for cookie-independent auth in cross-site iframe contexts
      const sessionId = res.headers.get("x-session-id");
      if (sessionId) setSessionToken(sessionId);

      // Populate auth cache — server returns the user object directly
      setAuth(data);
      // Clear ALL onboarding-related caches so RequireOnboarding and
      // useGetOnboarding() both start completely fresh for this new user.
      queryClient.removeQueries({ queryKey: ["onboarding-guard"] });
      queryClient.removeQueries({ queryKey: ["/api/onboarding"] });
      // Navigate straight to onboarding — never to login
      setLocation("/onboarding");
    } catch {
      setServerError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // NO useEffect, NO auth check on mount — always render the form
  return (
    <div className="flex min-h-screen items-center justify-center bg-synergise-background p-4 font-sans">
      <Card className="w-full max-w-md shadow-lg border-synergise-border">
        <CardHeader className="space-y-2 text-center pb-6">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-bold text-synergise-primary">Synergise</span>
          </Link>
          <CardTitle className="text-2xl font-semibold text-synergise-text">Create an Account</CardTitle>
          <CardDescription className="text-synergise-text-muted">Start your 14-day free trial</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {serverError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <Label htmlFor="fullName" className="text-synergise-text">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Jane Lim"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-synergise-border focus-visible:ring-synergise-primary"
                autoComplete="name"
              />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-synergise-text">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-synergise-border focus-visible:ring-synergise-primary"
                autoComplete="email"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-synergise-text">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-synergise-border focus-visible:ring-synergise-primary"
                autoComplete="new-password"
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-synergise-text">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-synergise-border focus-visible:ring-synergise-primary"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-synergise-primary hover:bg-synergise-primary-dark text-white font-semibold mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account…</>
              ) : (
                "Create My Account & Start Free Trial"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-synergise-border pt-6">
          <p className="text-sm text-synergise-text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-synergise-primary hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
