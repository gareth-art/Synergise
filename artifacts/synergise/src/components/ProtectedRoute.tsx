import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  // While loading: show spinner — never redirect prematurely
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-synergise-background">
        <Loader2 className="h-8 w-8 animate-spin text-synergise-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
