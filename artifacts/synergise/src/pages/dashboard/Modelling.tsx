import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Trash2, FolderOpen, Lock } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

import { RevenueSection } from "./modelling/RevenueSection";
import { CogsSection } from "./modelling/CogsSection";
import { OpexSection } from "./modelling/OpexSection";
import { OutputsSection } from "./modelling/OutputsSection";
import {
  FinancialModelState,
  makeDefaultModel,
  makeDefaultOpexItems,
} from "./modelling/types";
import { buildProjections, findBreakevenMonth, fmtSGD, fmtPct } from "./modelling/calculations";

interface SavedModel {
  id: number;
  modelName: string;
  industry: string;
  inputs: unknown;
  outputs: unknown;
  createdAt: string;
}

interface OnboardingProfile {
  industry: string;
}

async function fetchOnboarding(): Promise<OnboardingProfile | null> {
  const res = await fetch("/api/onboarding", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export default function Modelling() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: onboarding } = useQuery<OnboardingProfile | null>({
    queryKey: ["onboarding-profile"],
    queryFn: fetchOnboarding,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: savedModels, isLoading: savedLoading } = useQuery<SavedModel[]>({
    queryKey: ["/api/financial-model/list"],
    queryFn: async () => {
      const res = await fetch("/api/financial-model/list", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const tier = user?.subscriptionTier ?? "trial";
  const isTrial = tier === "trial";
  const isPaid = tier === "professional" || tier === "cfo-suite";
  const isCfo = tier === "cfo-suite";
  const aiModelLabel = isCfo ? "Opus" : "Haiku";

  const maxRevenueLines = isTrial ? 2 : Infinity;
  const maxCogsLines = isTrial ? 2 : Infinity;
  const canSeasonality = !isTrial;
  const opexLocked = isTrial;

  const [model, setModel] = useState<FinancialModelState>(makeDefaultModel);
  const [sectionOpen, setSectionOpen] = useState({
    revenue: true,
    cogs: true,
    opex: true,
    outputs: true,
    save: true,
  });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const toggle = (key: keyof typeof sectionOpen) =>
    setSectionOpen((s) => ({ ...s, [key]: !s[key] }));

  const projections = useMemo(
    () => buildProjections(model.revenueLines, model.cogsLines, model.opexItems),
    [model.revenueLines, model.cogsLines, model.opexItems]
  );

  const breakevenMonth = useMemo(() => findBreakevenMonth(projections), [projections]);

  const handleSave = async () => {
    if (!model.modelName.trim()) {
      toast({ title: "Please enter a model name before saving", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const p0 = projections[0];
      const outputSnapshot = {
        ebitda: p0.ebitda,
        grossProfit: p0.grossProfit,
        grossMarginPct: p0.revenue > 0 ? (p0.grossProfit / p0.revenue) * 100 : 0,
        netMarginPct: p0.revenue > 0 ? (p0.ebitda / p0.revenue) * 100 : 0,
      };
      const res = await fetch("/api/financial-model/save", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelName: model.modelName.trim(),
          industry: onboarding?.industry ?? "Other",
          modelData: {
            revenueLines: model.revenueLines,
            cogsLines: model.cogsLines,
            opexItems: model.opexItems,
          },
          outputSnapshot,
        }),
      });
      if (!res.ok) {
        toast({ title: "Failed to save model", variant: "destructive" });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/financial-model/list"] });
      toast({ title: `"${model.modelName}" saved successfully` });
    } catch {
      toast({ title: "Failed to save model", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLoadModel = (saved: SavedModel) => {
    const data = saved.inputs as any;
    setModel({
      modelName: saved.modelName,
      revenueLines: data?.revenueLines ?? [],
      cogsLines: data?.cogsLines ?? [],
      opexItems: data?.opexItems ?? makeDefaultOpexItems(),
    });
    setAiInsight(null);
    toast({ title: `Loaded "${saved.modelName}"` });
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteModel = async (id: number, name: string) => {
    const res = await fetch(`/api/financial-model/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-model/list"] });
      toast({ title: `"${name}" deleted` });
    } else {
      toast({ title: "Failed to delete model", variant: "destructive" });
    }
  };

  const handleAiInsight = async () => {
    setAiLoading(true);
    setAiInsight(null);
    try {
      const res = await fetch("/api/ai/analyse-financial-model", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: onboarding?.industry ?? "Other",
          summary: {
            monthlyRevenue: projections[0].revenue,
            grossMarginPct:
              projections[0].revenue > 0
                ? (projections[0].grossProfit / projections[0].revenue) * 100
                : 0,
            ebitda: projections[0].ebitda,
            cashBurn: projections[0].ebitda < 0 ? -projections[0].ebitda : 0,
            breakevenMonth,
          },
          projections,
        }),
      });
      const json = await res.json();
      if (json.error) {
        toast({ title: json.error, variant: "destructive" });
        return;
      }
      setAiInsight(json.insight);
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch {
      toast({ title: "AI insight failed", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const revenueLineNames = model.revenueLines.map((l) => l.name).filter(Boolean);

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-4xl">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-sm text-synergise-text-muted">
          <Link href="/dashboard" className="hover:text-synergise-primary">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-synergise-text font-medium">Financial Modelling</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Modelling</h1>
            <p className="text-synergise-text-muted mt-1">
              Build a structured revenue, cost and expense model for{" "}
              {onboarding?.industry ?? "your business"} — outputs update live as you type.
            </p>
          </div>
          {isTrial && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 shrink-0">
              <Lock className="h-4 w-4 shrink-0" />
              <div>
                <span className="font-medium">Trial limits apply</span>
                <span className="mx-1">·</span>
                <Link href="/dashboard/settings#subscription" className="underline">Upgrade</Link>
              </div>
            </div>
          )}
        </div>

        {/* Model name field (always visible at top for context) */}
        <div className="flex items-center gap-3 rounded-lg border border-synergise-border bg-white px-4 py-3">
          <Label className="text-sm font-medium shrink-0 text-synergise-text-muted">Model name</Label>
          <Input
            placeholder='e.g. "Base Case Q3 2026"'
            value={model.modelName}
            onChange={(e) => setModel((m) => ({ ...m, modelName: e.target.value }))}
            className="border-0 shadow-none focus-visible:ring-0 h-8 text-sm font-medium"
          />
        </div>

        {/* Section 1 — Revenue */}
        <RevenueSection
          lines={model.revenueLines}
          onChange={(revenueLines) => setModel((m) => ({ ...m, revenueLines }))}
          isOpen={sectionOpen.revenue}
          onToggle={() => toggle("revenue")}
          maxLines={maxRevenueLines}
          canSeasonality={canSeasonality}
        />

        {/* Section 2 — COGS */}
        <CogsSection
          lines={model.cogsLines}
          revenueLineNames={revenueLineNames}
          onChange={(cogsLines) => setModel((m) => ({ ...m, cogsLines }))}
          isOpen={sectionOpen.cogs}
          onToggle={() => toggle("cogs")}
          maxLines={maxCogsLines}
        />

        {/* Section 3 — Fixed Opex */}
        <OpexSection
          items={model.opexItems}
          onChange={(opexItems) => setModel((m) => ({ ...m, opexItems }))}
          isOpen={sectionOpen.opex}
          onToggle={() => toggle("opex")}
          locked={opexLocked}
        />

        {/* Section 4 — Outputs */}
        <OutputsSection
          projections={projections}
          tier={tier}
          isOpen={sectionOpen.outputs}
          onToggle={() => toggle("outputs")}
          breakevenMonth={breakevenMonth}
          onAiInsight={handleAiInsight}
          aiLoading={aiLoading}
          aiInsight={aiInsight}
          credits={user?.aiCreditsRemaining ?? 0}
          aiModelLabel={aiModelLabel}
        />

        {/* Section 5 — Save */}
        <Card className="border-synergise-border">
          <CardHeader className="py-4 cursor-pointer select-none" onClick={() => toggle("save")}>
            <CardTitle className="text-base">Section 5 — Save & Load Models</CardTitle>
          </CardHeader>
          {sectionOpen.save && (
            <CardContent className="space-y-5 pt-0">
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-synergise-text-muted">Model name</Label>
                  <Input
                    placeholder='e.g. "Base Case Q3 2026"'
                    value={model.modelName}
                    onChange={(e) => setModel((m) => ({ ...m, modelName: e.target.value }))}
                    className="focus-visible:ring-synergise-primary"
                  />
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-synergise-primary hover:bg-synergise-primary-dark shrink-0"
                >
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" />Save Model</>
                  )}
                </Button>
              </div>

              {/* Saved models list */}
              {savedLoading && (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 rounded-lg bg-synergise-background animate-pulse" />
                  ))}
                </div>
              )}

              {savedModels && savedModels.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-synergise-text-muted">Saved Models</p>
                  {savedModels.map((sm) => {
                    const snap = sm.outputs as any;
                    const ebitda = snap?.ebitda ?? null;
                    return (
                      <div
                        key={sm.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-synergise-border bg-white px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-synergise-text truncate">{sm.modelName}</p>
                          <p className="text-xs text-synergise-text-muted">
                            {format(new Date(sm.createdAt), "d MMM yyyy")}
                            {ebitda !== null && (
                              <span className={`ml-3 font-medium ${ebitda >= 0 ? "text-green-600" : "text-red-600"}`}>
                                EBITDA: {fmtSGD(ebitda)}/mo
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLoadModel(sm)}
                            className="text-synergise-primary hover:bg-synergise-accent h-8 px-2"
                          >
                            <FolderOpen className="h-3.5 w-3.5 mr-1" />
                            Load
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-synergise-text-muted hover:text-red-500"
                            onClick={() => handleDeleteModel(sm.id, sm.modelName)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {savedModels && savedModels.length === 0 && !savedLoading && (
                <p className="text-sm text-synergise-text-muted py-1">
                  No saved models yet. Fill in the sections above and click Save Model.
                </p>
              )}

              {/* Scenario Planning — existing locked state (CFO Suite) */}
              <div className="rounded-lg border border-synergise-border bg-white px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-synergise-accent text-synergise-primary shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-synergise-text">Scenario Planning</p>
                  <p className="text-xs text-synergise-text-muted mt-0.5">
                    Compare what-if scenarios side-by-side against your base model. Available on CFO Suite.
                  </p>
                </div>
                {tier !== "cfo-suite" && (
                  <Button asChild size="sm" className="bg-synergise-primary hover:bg-synergise-primary-dark shrink-0">
                    <Link href="/dashboard/settings#subscription">Upgrade</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
