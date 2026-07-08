import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";

interface GuardResult {
  needsOnboarding: boolean;
}

async function checkOnboardingStatus(): Promise<GuardResult> {
  try {
    const res = await fetch("/api/onboarding", { credentials: "include" });
    return { needsOnboarding: res.status === 404 };
  } catch {
    return { needsOnboarding: false };
  }
}

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data, isLoading: guardLoading } = useQuery<GuardResult>({
    queryKey: ["onboarding-guard"],
    queryFn: checkOnboardingStatus,
    staleTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    // Wait for auth to fully resolve before running — prevents the race where
    // isAuthenticated is false while /api/auth/me is still in-flight, which
    // would leave enabled=false and let users bypass the guard entirely.
    enabled: !authLoading && isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !guardLoading && data?.needsOnboarding) {
      setLocation("/onboarding");
    }
  }, [authLoading, guardLoading, data, setLocation]);

  if (authLoading || guardLoading) return <LoadingSpinner message="Loading your dashboard..." />;
  if (data?.needsOnboarding) return <LoadingSpinner message="Redirecting..." />;
  return <>{children}</>;
}
