import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const DRAFT_KEY = "onboarding_draft";

function useOnboardingStatus() {
  return useQuery({
    queryKey: ["onboarding-profile"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: existingProfile, isLoading: isCheckingStatus } = useOnboardingStatus();

  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [region, setRegion] = useState("");
  const [revenueStage, setRevenueStage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiredInline, setSessionExpiredInline] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const firstName = user?.fullName?.split(" ")[0] || "there";

  // Fix D: Restore draft from sessionStorage on mount
  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d.businessName) setBusinessName(d.businessName);
      if (d.industry) setIndustry(d.industry);
      if (d.region) setRegion(d.region);
      if (d.revenueStage) setRevenueStage(d.revenueStage);
      if (d.step && d.step > 1) setStep(d.step);
    } catch {}
  }, []);

  // Fix D: Save draft to sessionStorage on every field change
  useEffect(() => {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ businessName, industry, region, revenueStage, step })
    );
  }, [businessName, industry, region, revenueStage, step]);

  // Fix B: Keepalive ping every 4 minutes to prevent session expiry
  useEffect(() => {
    const ping = setInterval(() => {
      fetch("/api/auth/me", { credentials: "include" }).catch(() => {});
    }, 4 * 60 * 1000);
    return () => clearInterval(ping);
  }, []);

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9F9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0D7377] mb-3" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  // Already completed → go to dashboard
  if (existingProfile) {
    setLocation("/dashboard");
    return null;
  }

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!businessName.trim()) e.businessName = "Business name is required";
    if (!industry) e.industry = "Please select an industry";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!region) e.region = "Please select a region";
    if (!revenueStage) e.revenueStage = "Please select a revenue stage";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  // Fix C: Graceful 401 — retry once, then show inline message
  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    setSessionExpiredInline(false);

    const attemptSave = async (): Promise<Response> => {
      return fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessName, industry, region, revenueStage }),
      });
    };

    try {
      let response = await attemptSave();

      // Fix C: On 401, silently check if session is still valid before giving up
      if (response.status === 401) {
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (meRes.ok) {
          // Session is valid — transient error, retry once
          response = await attemptSave();
        } else {
          // Session genuinely expired — show inline message, do NOT redirect
          setSessionExpiredInline(true);
          setIsSubmitting(false);
          return;
        }
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Failed to save your details. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Success — clear draft, refresh caches, navigate
      sessionStorage.removeItem(DRAFT_KEY);
      queryClient.invalidateQueries({ queryKey: ["onboarding-profile"] });
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      setLocation("/dashboard");
    } catch {
      setError("Connection error. Please check your internet and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9F9] px-4 py-12">
      {/* Progress bar — above card */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center flex-nowrap">
          {STEPS.map((s, index) => (
            <div key={s.number} className="flex items-center flex-1 min-w-0">
              {/* Step item */}
              <div className="flex flex-col items-center shrink-0">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  step > s.number
                    ? "bg-[#0D7377] text-white"
                    : step === s.number
                      ? "bg-[#0D7377] text-white"
                      : "bg-gray-100 text-gray-400"
                )}>
                  {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span className={cn(
                  "mt-1 text-xs font-medium hidden sm:block transition-colors whitespace-nowrap",
                  step >= s.number ? "text-[#0D7377]" : "text-gray-400"
                )}>
                  {s.label}
                </span>
              </div>
              {/* Connector */}
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-2 transition-colors",
                  step > s.number ? "bg-[#0D7377]" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-md p-6 sm:p-10">

        {/* Step 1 — Welcome */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Synergise, {firstName}! 👋</h2>
            <p className="text-base text-gray-500 mb-8">Let's personalise your experience. It takes 60 seconds.</p>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-[#0D7377] hover:bg-[#0a5e62] text-white rounded-lg py-3 text-sm font-semibold transition-colors"
            >
              Let's go →
            </button>
          </div>
        )}

        {/* Step 2 — Business info */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your business</h2>
            <p className="text-base text-gray-500 mb-8">We'll use this to personalise your financial models.</p>
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Business Name</Label>
                <Input
                  placeholder="Acme Corp"
                  value={businessName}
                  onChange={(e) => { setBusinessName(e.target.value); setFieldErrors((p) => ({ ...p, businessName: "" })); }}
                  className="w-full border-gray-200 rounded-lg px-4 py-3 text-sm focus-visible:ring-2 focus-visible:ring-[#0D7377]/30 focus-visible:border-[#0D7377]"
                />
                {fieldErrors.businessName && <p className="mt-1 text-sm text-red-500">{fieldErrors.businessName}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Industry</Label>
                <Select value={industry} onValueChange={(v) => { setIndustry(v); setFieldErrors((p) => ({ ...p, industry: "" })); }}>
                  <SelectTrigger className="w-full border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377]">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldErrors.industry && <p className="mt-1 text-sm text-red-500">{fieldErrors.industry}</p>}
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => { if (validateStep2()) setStep(3); }}
                className="flex-1 bg-[#0D7377] hover:bg-[#0a5e62] text-white rounded-lg py-3 text-sm font-semibold transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Region & Scale */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Where are you based?</h2>
            <p className="text-base text-gray-500 mb-8">We'll tailor benchmarks to your region and stage.</p>
            <div className="flex flex-col gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Region</Label>
                <Select value={region} onValueChange={(v) => { setRegion(v); setFieldErrors((p) => ({ ...p, region: "" })); }}>
                  <SelectTrigger className="w-full border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377]">
                    <SelectValue placeholder="Select your primary region" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldErrors.region && <p className="mt-1 text-sm text-red-500">{fieldErrors.region}</p>}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">Revenue Stage (Annual)</Label>
                <Select value={revenueStage} onValueChange={(v) => { setRevenueStage(v); setFieldErrors((p) => ({ ...p, revenueStage: "" })); }}>
                  <SelectTrigger className="w-full border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#0D7377]/30 focus:border-[#0D7377]">
                    <SelectValue placeholder="Select revenue stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVENUE_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {fieldErrors.revenueStage && <p className="mt-1 text-sm text-red-500">{fieldErrors.revenueStage}</p>}
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => { if (validateStep3()) setStep(4); }}
                className="flex-1 bg-[#0D7377] hover:bg-[#0a5e62] text-white rounded-lg py-3 text-sm font-semibold transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set, {firstName}! 🎉</h2>
            <p className="text-base text-gray-500 mb-8">
              Your dashboard is personalised for <strong className="text-gray-700">{industry}</strong> businesses in <strong className="text-gray-700">{region}</strong>.
            </p>

            {/* Fix C: Inline session-expired message — never redirect */}
            {sessionExpiredInline ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-4">
                <strong>Your session expired</strong> while you were filling in the form. Your answers have been saved.{" "}
                <button
                  onClick={() => setLocation("/login?prefill=true")}
                  className="underline ml-1 font-medium"
                >
                  Sign in again to continue
                </button>{" "}
                — you won't need to redo this step.
              </div>
            ) : null}

            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="w-full bg-[#0D7377] hover:bg-[#0a5e62] disabled:opacity-70 text-white rounded-lg py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Setting up your dashboard…</>
              ) : (
                "Go to Dashboard →"
              )}
            </button>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
