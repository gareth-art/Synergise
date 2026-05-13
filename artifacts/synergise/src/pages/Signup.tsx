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

const signupSchema = z.object({
  fullName: z.string().min(1, { message: "Full name is required" }),
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Signup() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Failed to create account. Please try again.");
        return;
      }
      queryClient.setQueryData(getGetMeQueryKey(), data);
      setLocation("/onboarding");
    } catch {
      setErrorMsg("Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {errorMsg && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600">
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-synergise-text">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Lim" {...field} className="border-synergise-border focus-visible:ring-synergise-primary" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
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
              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-synergise-text">Confirm Password</FormLabel>
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
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account…</>
                ) : (
                  "Create My Account & Start Free Trial"
                )}
              </Button>
            </form>
          </Form>
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
