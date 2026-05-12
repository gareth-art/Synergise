import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-synergise-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-synergise-primary">Synergise</span>
        </Link>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Button onClick={() => setLocation("/dashboard")} className="font-semibold">
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-synergise-primary hover:bg-synergise-primary-dark text-white font-medium">
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
