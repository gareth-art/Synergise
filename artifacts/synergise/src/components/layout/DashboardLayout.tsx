import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Calculator,
  BookOpen,
  BarChart2,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  TrendingUp,
  Zap,
  Sparkles,
  PieChart,
  ChevronDown,
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

const TIER_LABELS: Record<string, string> = {
  trial: "Trial",
  professional: "Professional",
  "cfo-suite": "CFO Suite",
};

const TIER_STYLES: Record<string, string> = {
  trial: "bg-amber-50 text-amber-700 border-amber-200",
  professional: "bg-synergise-accent text-synergise-primary border-synergise-primary/20",
  "cfo-suite": "bg-synergise-primary text-white border-synergise-primary",
};

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "Home", icon: LayoutDashboard }],
  },
  {
    label: "Financial Tools",
    items: [
      { href: "/dashboard/modelling", label: "Modelling", icon: Calculator },
      { href: "/dashboard/accounts", label: "Accounts", icon: BookOpen },
      { href: "/dashboard/unit-economics", label: "Unit Economics", icon: PieChart },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/dashboard/cfo-metrics", label: "CFO Metrics", icon: TrendingUp },
      { href: "/dashboard/comparables", label: "Comparables", icon: BarChart2 },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: SettingsIcon }],
  },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);

  const tier = user?.subscriptionTier ?? "trial";
  const tierLabel = TIER_LABELS[tier] ?? tier;
  const tierStyles = TIER_STYLES[tier] ?? TIER_STYLES.trial;

  // We always have credit numbers from the auth/me payload, so we can render the pill
  // for every tier without an extra request. The modal still uses useCredits for fresher data.
  const creditsRemaining = user?.aiCreditsRemaining ?? 0;
  const creditsAllowance = user?.aiCreditsMonthlyAllowance ?? 0;
  const creditsPct = creditsAllowance > 0 ? Math.max(0, Math.min(100, (creditsRemaining / creditsAllowance) * 100)) : 0;
  const { data: creditsData } = useCredits(!!user);

  // Keepalive ping every 4 minutes to prevent session expiry during use
  useEffect(() => {
    const ping = setInterval(() => {
      fetch("/api/auth/me", { credentials: "include" }).catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(ping);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(["auth-user"], null);
        setLocation("/");
      },
    });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6 border-b border-synergise-border">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-synergise-primary">Synergise</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-6 px-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="space-y-1">
              {group.label && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-synergise-text-muted">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-synergise-accent text-synergise-primary"
                          : "text-synergise-text hover:bg-synergise-background hover:text-synergise-primary"
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-synergise-primary"
                        />
                      )}
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
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

          {/* Tier badge + credits pill + user menu */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard/settings#subscription">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-90 cursor-pointer ${tierStyles}`}
                title={`Current plan: ${tierLabel}`}
              >
                <Sparkles className="h-3 w-3" />
                {tierLabel}
              </span>
            </Link>

            <button
              onClick={() => setCreditsOpen(true)}
              className="group flex items-center gap-2 rounded-full bg-synergise-accent px-3 py-1.5 text-xs font-medium text-synergise-primary hover:bg-synergise-primary/10 transition-colors"
              title={`${creditsRemaining} of ${creditsAllowance} credits remaining`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="font-semibold">{creditsRemaining}</span>
              <span className="text-synergise-text-muted hidden sm:inline">credits</span>
              {creditsAllowance > 0 && (
                <span
                  className="hidden sm:inline-block h-1.5 w-12 overflow-hidden rounded-full bg-synergise-primary/15"
                  aria-hidden="true"
                >
                  <span
                    className="block h-full bg-synergise-primary transition-all"
                    style={{ width: `${creditsPct}%` }}
                  />
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-full border border-synergise-border bg-white px-3 py-1.5 text-xs font-medium text-synergise-text hover:bg-synergise-background transition-colors">
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {user?.fullName ?? user?.email ?? "Account"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-synergise-text-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-synergise-text truncate">{user?.fullName}</p>
                  <p className="text-xs text-synergise-text-muted truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <span className="flex items-center gap-2 cursor-pointer">
                      <SettingsIcon className="h-4 w-4" />
                      Settings
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-synergise-error focus:text-synergise-error focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
