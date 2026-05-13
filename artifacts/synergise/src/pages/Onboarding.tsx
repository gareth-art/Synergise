import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

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

const REGIONS = [
  "Singapore",
  "Southeast Asia",
  "Asia Pacific",
  "North America",
  "Europe",
  "Global",
];

const REVENUE_STAGES = [
  "Pre-revenue",
  "Under SGD 500k",
  "SGD 500k – 2M",
  "Over SGD 2M",
];

const DRAFT_KEY = "onboarding_draft";

const fieldClass =
  "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377] bg-white";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [revenueStage, setRevenueStage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) {
        const p = JSON.parse(draft);
        if (p.businessName) setBusinessName(p.businessName);
        if (p.industry) setIndustry(p.industry);
        if (p.region) setRegion(p.region);
        if (p.revenueStage) setRevenueStage(p.revenueStage);
      }
    } catch {}
  }, []);

  // Save draft on every change
  useEffect(() => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ businessName, industry, region, revenueStage })
    );
  }, [businessName, industry, region, revenueStage]);

  // Keepalive ping every 3 minutes
  useEffect(() => {
    const ping = setInterval(() => {
      fetch("/api/auth/me", { credentials: "include" }).catch(() => {});
    }, 3 * 60 * 1000);
    return () => clearInterval(ping);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!businessName.trim()) newErrors.businessName = "This field is required";
    if (!industry) newErrors.industry = "This field is required";
    if (!region) newErrors.region = "This field is required";
    if (!revenueStage) newErrors.revenueStage = "This field is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessName, industry, region, revenueStage }),
      });

      if (response.status === 401) {
        setSubmitError("Your session expired. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setSubmitError((data as { error?: string }).error ?? "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success
      sessionStorage.removeItem(DRAFT_KEY);
      queryClient.removeQueries({ queryKey: ["onboarding-profile"] });
      setLocation("/dashboard");
    } catch {
      setSubmitError("Connection error. Please check your internet and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F9] px-4 py-12">
      <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xl font-bold text-[#0D7377] mb-6">Synergise</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome to Synergise, {firstName}! 👋
          </h1>
          <p className="text-sm text-gray-500">
            Tell us about your business so we can personalise your experience.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-5">

            {/* Business Name */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                Business Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={businessName}
                onChange={(e) => { setBusinessName(e.target.value); setErrors((p) => ({ ...p, businessName: "" })); }}
                placeholder="e.g. Ayurvana Wellness"
                className={fieldClass}
              />
              {errors.businessName && (
                <p className="mt-1 text-xs text-red-500">{errors.businessName}</p>
              )}
            </div>

            {/* Industry */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                Industry <span className="text-red-400">*</span>
              </Label>
              <Select
                value={industry}
                onValueChange={(v) => { setIndustry(v); setErrors((p) => ({ ...p, industry: "" })); }}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select your industry..." />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="mt-1 text-xs text-red-500">{errors.industry}</p>
              )}
            </div>

            {/* Region */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                Primary Region <span className="text-red-400">*</span>
              </Label>
              <Select
                value={region}
                onValueChange={(v) => { setRegion(v); setErrors((p) => ({ ...p, region: "" })); }}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select your region..." />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="mt-1 text-xs text-red-500">{errors.region}</p>
              )}
            </div>

            {/* Revenue Stage */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 block">
                Annual Revenue <span className="text-red-400">*</span>
              </Label>
              <Select
                value={revenueStage}
                onValueChange={(v) => { setRevenueStage(v); setErrors((p) => ({ ...p, revenueStage: "" })); }}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select revenue stage..." />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.revenueStage && (
                <p className="mt-1 text-xs text-red-500">{errors.revenueStage}</p>
              )}
            </div>
          </div>

          {/* Submit error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mt-4">
              {submitError}
              {submitError.includes("session") && (
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="underline ml-1 font-medium"
                >
                  Sign in again
                </button>
              )}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full bg-[#0D7377] hover:bg-[#0a5e62] disabled:opacity-70 text-white rounded-lg py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Setting up…</>
            ) : (
              "Set Up My Dashboard →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
