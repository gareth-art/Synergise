import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";

async function fetchOnboarding() {
  const res = await fetch("/api/onboarding", { credentials: "include" });
  if (res.status === 404) return null;
  if (res.status === 401) return undefined; // not authenticated yet — don't redirect to onboarding
  if (!res.ok) return null;
  return res.json();
}

export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["onboarding-profile"],
    queryFn: fetchOnboarding,
    staleTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && profile === null) {
      setLocation("/onboarding");
    }
  }, [isLoading, profile]);

  if (isLoading) return <LoadingSpinner message="Loading your dashboard..." />;
  if (!profile) return <LoadingSpinner message="Redirecting..." />;
  return <>{children}</>;
}
