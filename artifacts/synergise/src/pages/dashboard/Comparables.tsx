import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetBenchmarks } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch as ToggleSwitch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, BarChart2, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface OnboardingProfile { industry: string; region: string }

async function fetchOnboardingProfile(): Promise<OnboardingProfile | null> {
  const res = await fetch("/api/onboarding", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export default function Comparables() {
  const { data: onboarding } = useQuery<OnboardingProfile | null>({
    queryKey: ["onboarding-profile"],
    queryFn: fetchOnboardingProfile,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [consent, setConsent] = useState(false);
  const [industry, setIndustry] = useState(onboarding?.industry || "Technology & SaaS");
  const [region, setRegion] = useState(onboarding?.region || "Southeast Asia");
  const [hasApplied, setHasApplied] = useState(false);

  const { data: benchmarks, isLoading } = useGetBenchmarks({
    industry,
    region
  }, {
    query: {
      queryKey: [`/api/benchmarks`, { industry, region }],
      enabled: hasApplied && consent
    }
  });

  const handleApply = () => {
    setHasApplied(true);
  };

  const renderPercentileBar = (bm: any) => {
    // simplified visual representation
    return (
      <div className="mt-4">
        <div className="flex justify-between text-xs text-synergise-text-muted mb-1">
          <span>P10: {bm.p10}</span>
          <span>P50: {bm.p50}</span>
          <span>P90: {bm.p90}</span>
        </div>
        <div className="relative h-4 w-full bg-synergise-background rounded-full overflow-hidden flex">
          <div className="h-full bg-synergise-error/20 w-1/4" title={`P10: ${bm.p10}`}></div>
          <div className="h-full bg-synergise-warning/30 w-1/4" title={`P25: ${bm.p25}`}></div>
          <div className="h-full bg-synergise-primary/40 w-1/4" title={`P50: ${bm.p50}`}></div>
          <div className="h-full bg-synergise-success/50 w-1/4" title={`P75: ${bm.p75} - P90: ${bm.p90}`}></div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-sm text-synergise-text-muted">
          <Link href="/dashboard" className="hover:text-synergise-primary">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-synergise-text font-medium">Comparables</span>
        </nav>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comparables & Benchmarking</h1>
          <p className="text-synergise-text-muted mt-2">See how your business stacks up against anonymised peers in your industry and region.</p>
        </div>

        {!consent ? (
          <Card className="border-synergise-border max-w-2xl mx-auto mt-12">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto bg-synergise-accent p-3 rounded-full w-fit mb-4">
                <Lock className="h-6 w-6 text-synergise-primary" />
              </div>
              <CardTitle className="text-2xl">Opt-in to Benchmarking</CardTitle>
              <CardDescription className="text-base mt-2">
                To view aggregate benchmarks for your industry, opt-in to anonymous data sharing.
                Your financial data is aggregated with peers and cannot be traced back to your business.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-4 pb-8 space-y-4">
              <div className="flex items-center gap-3 bg-synergise-accent p-4 rounded-lg border border-synergise-primary/20 w-full">
                <ToggleSwitch id="consent" checked={consent} onCheckedChange={setConsent} />
                <Label htmlFor="consent" className="text-sm font-medium cursor-pointer">
                  I consent to anonymous data sharing for benchmarking purposes
                </Label>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-synergise-text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-synergise-primary" />
                Data is aggregated across at least 5 businesses before being shown to anyone.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-synergise-border">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="space-y-2 w-full md:w-1/3">
                    <Label>Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Wellness & Lifestyle">Wellness & Lifestyle</SelectItem>
                        <SelectItem value="Consumer Products & Apparel">Consumer Products & Apparel</SelectItem>
                        <SelectItem value="Technology & SaaS">Technology & SaaS</SelectItem>
                        <SelectItem value="F&B & Hospitality">F&B & Hospitality</SelectItem>
                        <SelectItem value="E-commerce & Retail">E-commerce & Retail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 w-full md:w-1/3">
                    <Label>Region</Label>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Singapore">Singapore</SelectItem>
                        <SelectItem value="Southeast Asia">Southeast Asia</SelectItem>
                        <SelectItem value="Global">Global</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleApply} className="w-full md:w-auto bg-synergise-primary hover:bg-synergise-primary-dark">
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {hasApplied && (
              <div className="grid gap-6 md:grid-cols-2">
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="border-synergise-border">
                        <CardHeader className="pb-2">
                          <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-4 w-full rounded-full" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : benchmarks && benchmarks.length > 0 ? (
                  benchmarks.map((bm) => (
                    <Card key={bm.id} className="border-synergise-border hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between">
                          {bm.metric}
                          <BarChart2 className="h-5 w-5 text-synergise-primary opacity-50" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderPercentileBar(bm)}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 py-12 flex flex-col items-center gap-2 text-center">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-synergise-accent text-synergise-primary">
                      <BarChart2 className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-synergise-primary">No benchmarks for this cohort yet</p>
                    <p className="text-xs text-synergise-text-muted">Try a broader region or a more common industry.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
