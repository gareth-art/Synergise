import { useAuth } from "@/hooks/use-auth";
import { useGetOnboarding } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Calculator, BookOpen, BarChart2, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: onboarding, isLoading: isAuthLoading } = useGetOnboarding();

  useEffect(() => {
    if (!isAuthLoading && (!onboarding || !onboarding.onboardingCompletedAt)) {
      setLocation("/onboarding");
    }
  }, [onboarding, isAuthLoading, setLocation]);

  if (isAuthLoading || !onboarding) return null;

  const firstName = user?.fullName?.split(' ')[0] || "";
  const timeOfDay = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";

  const isTrial = user?.subscriptionTier === "Trial";
  const trialDaysRemaining = user?.trialStartDate 
    ? Math.max(0, 14 - Math.floor((new Date().getTime() - new Date(user.trialStartDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {isTrial && (
          <div className="bg-synergise-accent border border-synergise-primary-light/50 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-synergise-text font-medium">
              You have <span className="font-bold text-synergise-primary">{trialDaysRemaining} days</span> left in your trial.
            </p>
            <Button asChild size="sm" className="bg-synergise-primary hover:bg-synergise-primary-dark shrink-0">
              <Link href="/dashboard/settings">Upgrade to Professional</Link>
            </Button>
          </div>
        )}

        <div className="mb-8 border-b border-synergise-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight">Good {timeOfDay}, {firstName}.</h1>
          <p className="text-synergise-text-muted mt-2 text-lg">
            {onboarding.businessName} &middot; {onboarding.industry} &middot; {onboarding.region}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="flex flex-col hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-synergise-accent text-synergise-primary">
                <Calculator className="h-5 w-5" />
              </div>
              <CardTitle>Financial Modelling</CardTitle>
              <CardDescription>Industry-specific models to project your growth and unit economics.</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto pt-4">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/dashboard/modelling">
                  Open Module <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-synergise-accent text-synergise-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <CardTitle>Management Accounts</CardTitle>
              <CardDescription>Track monthly P&L, burn rate, and margins without complex accounting.</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto pt-4">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/dashboard/accounts">
                  Open Module <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="flex flex-col hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-synergise-accent text-synergise-primary">
                <BarChart2 className="h-5 w-5" />
              </div>
              <CardTitle>Comparables</CardTitle>
              <CardDescription>Benchmark your key metrics against peers in your industry and region.</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto pt-4">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/dashboard/comparables">
                  Open Module <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
