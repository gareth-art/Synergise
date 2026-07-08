import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useSetAuth } from "@/hooks/use-auth";
import { setSessionToken } from "@/lib/session-token";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const sessionExpired = new URLSearchParams(search).get("reason") === "session-expired";
  const setAuth = useSetAuth();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setError(loginData.error ?? "Incorrect email or password. Please try again.");
        return;
      }

      // Persist session ID for cookie-independent auth in cross-site iframe contexts
      const sessionId = loginRes.headers.get("x-session-id");
      if (sessionId) setSessionToken(sessionId);

      // Step 2: Set auth state — server returns user directly
      setAuth(loginData);

      // Step 3: Check onboarding status
      const onboardingRes = await fetch("/api/onboarding", { credentials: "include" });

      // Step 4: Prime the cache and navigate
      queryClient.removeQueries({ queryKey: ["onboarding-profile"] });

      if (onboardingRes.ok) {
        const profile = await onboardingRes.json();
        queryClient.setQueryData(["onboarding-profile"], profile);
        setLocation("/dashboard");
      } else if (onboardingRes.status === 404) {
        setLocation("/onboarding");
      } else {
        // Any other status (401, 5xx, network) — default to dashboard
        setLocation("/dashboard");
      }
    } catch {
      setError("Connection error. Please try again.");
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
          <CardTitle className="text-2xl font-semibold text-synergise-text">Sign In</CardTitle>
          <CardDescription className="text-synergise-text-muted">Enter your details to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionExpired && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
              Your session expired. Please sign in again.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-synergise-primary hover:bg-synergise-primary-dark text-white font-semibold mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-synergise-border pt-6">
          <p className="text-sm text-synergise-text-muted">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-synergise-primary hover:underline">Start free trial</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
