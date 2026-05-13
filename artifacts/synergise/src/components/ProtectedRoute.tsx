import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function Spinner({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-synergise-background">
      <Loader2 className="h-8 w-8 animate-spin text-synergise-primary mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * ProtectedRoute — requires an authenticated session.
 * Shows spinner while loading; redirects to /login only once loading is
 * complete and the user is confirmed null.  Never redirects prematurely.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <Spinner message="Loading…" />;

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return <>{children}</>;
}

/**
 * RequireOnboarding — wraps dashboard routes.
 * Redirects to /onboarding when no profile exists; renders children only
 * after confirming the profile is present.
 */
export function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: profile, isLoading } = useQuery<object | null>({
    queryKey: ["/api/onboarding"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) return null; // any non-404 error: do not redirect to onboarding
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: isAuthenticated,
  });

  if (isLoading) return <Spinner message="Loading your dashboard…" />;

  if (!profile) {
    setLocation("/onboarding");
    return null;
  }

  return <>{children}</>;
}
