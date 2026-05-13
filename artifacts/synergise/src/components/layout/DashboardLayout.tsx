import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Calculator,
  BookOpen,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
  children: ReactNode;
}

function useCredits(enabled: boolean) {
  return useQuery({
    queryKey: ["/api/credits"],
    queryFn: async () => {
      const res = await fetch("/api/credits", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch credits");
      return res.json() as Promise<{
        aiCreditsRemaining: number;
        aiCreditsMonthlyAllowance: number;
        creditsResetDate: string | null;
      }>;
    },
    enabled,
    staleTime: 30_000,
  });
}

function CreditsModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: { aiCreditsRemaining: number; aiCreditsMonthlyAllowance: number; creditsResetDate: string | null } | undefined;
}) {
  const handleTopUp = async () => {
    const res = await fetch("/api/credits/topup", { method: "POST", credentials: "include" });
    const json = await res.json();
    alert(json.message ?? "Something went wrong");
  };

  const resetDate = data?.creditsResetDate
    ? new Date(data.creditsResetDate).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-synergise-primary" />
            AI Credits
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-synergise-accent p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-synergise-text-muted">Credits remaining</span>
              <span className="font-bold text-synergise-text">
                {data?.aiCreditsRemaining ?? 0} of {data?.aiCreditsMonthlyAllowance ?? 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-synergise-text-muted">Resets on</span>
              <span className="font-medium text-synergise-text">{resetDate}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-synergise-text-muted tracking-wide">Credit costs</p>
            <div className="text-sm space-y-1 text-synergise-text">
              <div className="flex justify-between"><span>Analyse Model</span><span className="font-medium">5 credits</span></div>
              <div className="flex justify-between"><span>Benchmark Insight</span><span className="font-medium">3 credits</span></div>
              <div className="flex justify-between"><span>CFO Commentary</span><span className="font-medium">10 credits</span></div>
            </div>
          </div>
          <Separator />
          <Button className="w-full bg-synergise-primary hover:bg-synergise-primary-dark" onClick={handleTopUp}>
            Buy 50 credits — $10
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);

  const isPaidTier = user?.subscriptionTier === "professional" || user?.subscriptionTier === "cfo-suite";
  const { data: creditsData } = useCredits(isPaidTier);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/");
      },
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/modelling", label: "Modelling", icon: Calculator },
    { href: "/dashboard/accounts", label: "Accounts", icon: BookOpen },
    { href: "/dashboard/comparables", label: "Comparables", icon: BarChart2 },
    { href: "/dashboard/cfo-metrics", label: "CFO Metrics", icon: TrendingUp },
    { href: "/dashboard/unit-economics", label: "Unit Economics", icon: Calculator },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6 border-b border-synergise-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-synergise-primary">Synergise</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-4">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-synergise-primary/10 text-synergise-primary"
                      : "text-synergise-text hover:bg-synergise-background hover:text-synergise-primary"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-synergise-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-synergise-text">{user?.fullName}</p>
            <p className="truncate text-xs text-synergise-text-muted">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-synergise-text-muted hover:text-synergise-error"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-synergise-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-synergise-border bg-white md:block">
        <SidebarContent />
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-synergise-border bg-white px-4 md:px-6">
          {/* Mobile logo + menu */}
          <div className="flex items-center gap-3 md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <Link href="/">
              <span className="text-lg font-bold text-synergise-primary">Synergise</span>
            </Link>
          </div>

          {/* Desktop spacer */}
          <div className="hidden md:block" />

          {/* Credits display */}
          <div className="flex items-center gap-3">
            {isPaidTier && (
              <button
                onClick={() => setCreditsOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-synergise-accent px-3 py-1.5 text-sm font-medium text-synergise-primary hover:bg-synergise-primary/10 transition-colors"
              >
                <Zap className="h-3.5 w-3.5" />
                {creditsData?.aiCreditsRemaining ?? 0} credits
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <CreditsModal
        open={creditsOpen}
        onClose={() => setCreditsOpen(false)}
        data={creditsData}
      />
    </div>
  );
}
