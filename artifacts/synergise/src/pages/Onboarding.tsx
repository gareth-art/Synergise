import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Welcome" },
  { number: 2, label: "Your Business" },
  { number: 3, label: "Scale & Region" },
  { number: 4, label: "Ready" },
];

const INDUSTRIES = [
  "Wellness & Lifestyle",
  "Consumer Products & Apparel",
  "Membership & Experiences",
  "Professional Services",
  "F&B & Hospitality",
  "E-commerce & Retail",
  "Technology & SaaS",
  "Other",
];

const REGIONS = ["Singapore", "Southeast Asia", "Asia Pacific", "Global", "North America", "Europe"];

const REVENUE_STAGES = ["Pre-revenue", "Under SGD 500k", "SGD 500k–2M", "Over SGD 2M"];

function useOnboardingStatus() {
  return useQuery({
    queryKey: ["/api/onboarding"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch onboarding status");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Onboarding guard — redirect to dashboard if already completed
  const { data: existingProfile, isLoading: isCheckingStatus } = useOnboardingStatus();

  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [revenueStage, setRevenueStage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation errors per step
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const firstName = user?.fullName?.split(" ")[0] || "there";

  // Show loading while checking if onboarding is already complete
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-synergise-background">
        <Loader2 className="h-8 w-8 animate-spin text-synergise-primary mb-3" />
        <p className="text-sm text-synergise-text-muted">Loading…</p>
      </div>
    );
  }

  // Already completed → go to dashboard
  if (existingProfile) {
    setLocation("/dashboard");
    return null;
  }

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (!businessName.trim()) errors.businessName = "Business name is required";
    if (!industry) errors.industry = "Please select an industry";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    if (!region) errors.region = "Please select a region";
    if (!revenueStage) errors.revenueStage = "Please select a revenue stage";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessName, industry, region, revenueStage }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save onboarding");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-synergise-background p-4">
      <Card className="w-full max-w-lg border-synergise-border shadow-lg">

        {/* Step progress indicator */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-center">
            {STEPS.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  step >= s.number
                    ? "bg-synergise-primary text-white"
                    : "bg-gray-100 text-gray-400"
                )}>
                  {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span className={cn(
                  "ml-2 text-sm font-medium hidden sm:block transition-colors",
                  step >= s.number ? "text-synergise-primary" : "text-gray-400"
                )}>
                  {s.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "w-8 sm:w-12 h-0.5 mx-2 sm:mx-3 transition-colors",
                    step > s.number ? "bg-synergise-primary" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <>
            <CardHeader className="text-center pt-6 pb-4">
              <CardTitle className="text-2xl font-bold">Welcome to Synergise, {firstName}!</CardTitle>
              <CardDescription className="text-base mt-2">
                Let's personalise your experience. It takes 60 seconds.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center pt-4 pb-8">
              <Button
                size="lg"
                className="bg-synergise-primary hover:bg-synergise-primary-dark w-full max-w-xs"
                onClick={() => setStep(2)}
              >
                Let's go →
              </Button>
            </CardFooter>
          </>
        )}

        {/* Step 2 — Business info */}
        {step === 2 && (
          <>
            <CardHeader className="pt-6">
              <CardTitle>Tell us about your business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Business Name</Label>
                <Input
                  placeholder="Acme Corp"
                  value={businessName}
                  onChange={(e) => { setBusinessName(e.target.value); setFieldErrors((p) => ({ ...p, businessName: "" })); }}
                  className="focus-visible:ring-synergise-primary"
                />
                {fieldErrors.businessName && <p className="text-sm text-red-500">{fieldErrors.businessName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Select value={industry} onValueChange={(v) => { setIndustry(v); setFieldErrors((p) => ({ ...p, industry: "" })); }}>
                  <SelectTrigger className="focus:ring-synergise-primary">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldErrors.industry && <p className="text-sm text-red-500">{fieldErrors.industry}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                className="bg-synergise-primary hover:bg-synergise-primary-dark"
                onClick={() => { if (validateStep2()) setStep(3); }}
              >
                Next →
              </Button>
            </CardFooter>
          </>
        )}

        {/* Step 3 — Region & Scale */}
        {step === 3 && (
          <>
            <CardHeader className="pt-6">
              <CardTitle>Region & Scale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Select value={region} onValueChange={(v) => { setRegion(v); setFieldErrors((p) => ({ ...p, region: "" })); }}>
                  <SelectTrigger className="focus:ring-synergise-primary">
                    <SelectValue placeholder="Select primary region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldErrors.region && <p className="text-sm text-red-500">{fieldErrors.region}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Revenue Stage (Annual)</Label>
                <Select value={revenueStage} onValueChange={(v) => { setRevenueStage(v); setFieldErrors((p) => ({ ...p, revenueStage: "" })); }}>
                  <SelectTrigger className="focus:ring-synergise-primary">
                    <SelectValue placeholder="Select revenue stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVENUE_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldErrors.revenueStage && <p className="text-sm text-red-500">{fieldErrors.revenueStage}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button
                className="bg-synergise-primary hover:bg-synergise-primary-dark"
                onClick={() => { if (validateStep3()) setStep(4); }}
              >
                Next →
              </Button>
            </CardFooter>
          </>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <>
            <CardHeader className="text-center pt-6">
              <CardTitle className="text-2xl font-bold">You're all set, {firstName}!</CardTitle>
              <CardDescription className="text-base mt-2">
                Your dashboard is personalised for <strong>{industry}</strong> businesses in <strong>{region}</strong>.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col items-center gap-3 pt-4 pb-8">
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                size="lg"
                className="w-full max-w-xs bg-synergise-primary hover:bg-synergise-primary-dark"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up your dashboard…</>
                ) : (
                  "Go to Dashboard →"
                )}
              </Button>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
