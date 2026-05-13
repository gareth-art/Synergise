import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";

interface GuardResult {
  needsOnboarding: boolean;
}

// Returns a guaranteed defined value so TanStack Query never sees `undefined`
// (which would put the query in a permanent error state and cause an infinite spinner).
// Per spec: only redirect to /onboarding on a definitive 404. Treat every other status
// (200, 401, 5xx, network error) as "do not redirect" so the user can reach the dashboard.
async function checkOnboardingStatus(): Promise<GuardResult> {
  try {
    const res = await fetch("/api/onboarding", { credentials: "include" });
    return { needsOnboarding: res.status === 404 };
  } catch {
    return { needsOnboarding: false };
  }
}

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<GuardResult>({
    queryKey: ["onboarding-guard"],
    queryFn: checkOnboardingStatus,
    staleTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && data?.needsOnboarding) {
      setLocation("/onboarding");
    }
  }, [isLoading, data, setLocation]);

  if (isLoading) return <LoadingSpinner message="Loading your dashboard..." />;
  if (data?.needsOnboarding) return <LoadingSpinner message="Redirecting..." />;
  return <>{children}</>;
}
