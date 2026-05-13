import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, BookOpen, BarChart2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface OnboardingProfile {
  businessName: string;
  industry: string;
  region: string;
  onboardingCompletedAt: string | null;
}

async function fetchOnboardingProfile(): Promise<OnboardingProfile | null> {
  const res = await fetch("/api/onboarding", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

const MODULES = [
  {
    href: "/dashboard/modelling",
    icon: Calculator,
    title: "Financial Modelling",
    description: "Industry-specific models to project your growth and unit economics.",
  },
  {
    href: "/dashboard/accounts",
    icon: BookOpen,
    title: "Management Accounts",
    description: "Track monthly P&L, burn rate, and margins without complex accounting.",
  },
  {
    href: "/dashboard/comparables",
    icon: BarChart2,
    title: "Comparables",
    description: "Benchmark your key metrics against peers in your industry and region.",
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  const { data: onboarding, isLoading: isOnboardingLoading } = useQuery<OnboardingProfile | null>({
    queryKey: ["onboarding-profile"],
    queryFn: fetchOnboardingProfile,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const firstName = user?.fullName?.split(" ")[0] ?? "";
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const isTrial = user?.subscriptionTier === "trial";
  const trialDaysRemaining = user?.trialStartDate
    ? Math.max(
        0,
        14 -
          Math.floor(
            (Date.now() - new Date(user.trialStartDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
      )
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {isTrial && (
          <div className="bg-synergise-accent border border-synergise-primary-light/50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-synergise-text font-medium">
              You have{" "}
              <span className="font-bold text-synergise-primary">
                {trialDaysRemaining} days
              </span>{" "}
              left in your trial.
            </p>
            <Button
              asChild
              size="sm"
              className="bg-synergise-primary hover:bg-synergise-primary-dark shrink-0"
            >
              <Link href="/dashboard/settings">Upgrade to Professional</Link>
            </Button>
          </div>
        )}

        <div className="mb-8 border-b border-synergise-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Good {timeOfDay}, {firstName}.
          </h1>
          {isOnboardingLoading ? (
            <Skeleton className="mt-3 h-5 w-72" />
          ) : (
            <p className="text-synergise-text-muted mt-2 text-lg">
              {onboarding?.businessName} &middot; {onboarding?.industry} &middot;{" "}
              {onboarding?.region}
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {MODULES.map(({ href, icon: Icon, title, description }) => (
            <Card key={href} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-synergise-accent text-synergise-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto pt-4">
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href={href}>
                    Open Module <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
