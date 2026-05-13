import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setErrorMsg(null);
    setStatusMsg(null);
    setIsSubmitting(true);
    try {
      // 1. Log in
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        setErrorMsg(loginData.error ?? "Incorrect email or password");
        return;
      }

      // 2. Set auth state immediately
      queryClient.setQueryData(getGetMeQueryKey(), loginData);
      setStatusMsg("Signing you in…");

      // 3. Check onboarding status to decide where to navigate
      try {
        const onboardingRes = await fetch("/api/onboarding", { credentials: "include" });
        if (onboardingRes.ok) {
          setLocation("/dashboard");
        } else {
          setLocation("/onboarding");
        }
      } catch {
        setLocation("/onboarding");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (statusMsg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-synergise-background">
        <Loader2 className="h-8 w-8 animate-spin text-synergise-primary mb-3" />
        <p className="text-sm text-synergise-text-muted">{statusMsg}</p>
      </div>
    );
  }

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {errorMsg && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600">
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-synergise-text">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@company.com" {...field} className="border-synergise-border focus-visible:ring-synergise-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-synergise-text">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="border-synergise-border focus-visible:ring-synergise-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button
                type="submit"
                className="w-full bg-synergise-primary hover:bg-synergise-primary-dark text-white font-semibold mt-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
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
