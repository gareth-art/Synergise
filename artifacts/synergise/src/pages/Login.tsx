import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useGetOnboarding, getGetMeQueryKey } from "@workspace/api-client-react";
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

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setErrorMsg(null);
    loginMutation.mutate({ data: values }, {
      onSuccess: async () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        // Check onboarding status
        try {
          // We can't use the hook directly here in a callback easily without another request,
          // so we navigate to a routing component or just fetch directly.
          // For simplicity, we just fetch it via standard fetch or assume we navigate to a resolver.
          // Let's navigate to dashboard, and dashboard will redirect to onboarding if needed.
          setLocation("/dashboard");
        } catch (e) {
          setLocation("/dashboard");
        }
      },
      onError: () => {
        setErrorMsg("Incorrect email or password");
      }
    });
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-synergise-text">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@company.com" {...field} className="border-synergise-border focus-visible:ring-synergise-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-synergise-text">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="border-synergise-border focus-visible:ring-synergise-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-synergise-primary hover:bg-synergise-primary-dark text-white font-semibold mt-6" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-synergise-border pt-6">
          <p className="text-sm text-synergise-text-muted">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-synergise-primary hover:underline">
              Start free trial
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
