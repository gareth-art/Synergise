import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Calculator, 
  BookOpen, 
  BarChart2, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/");
      }
    });
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/modelling", label: "Modelling", icon: Calculator },
    { href: "/dashboard/accounts", label: "Accounts", icon: BookOpen },
    { href: "/dashboard/comparables", label: "Comparables", icon: BarChart2 },
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
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-synergise-text-muted hover:text-synergise-error">
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
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-synergise-border bg-white px-4 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-synergise-primary">Synergise</span>
          </Link>
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
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
