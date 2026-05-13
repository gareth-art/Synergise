import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGetOnboarding } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Zap, PieChart, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UEModel {
  id: number;
  modelName: string;
  industry: string;
  revenuePerUnit: string;
  variableCostPerUnit: string;
  fixedCostsPerMonth: string;
  unitsPerMonth: string;
  contributionMargin: string;
  contributionMarginPct: string;
  breakEvenUnits: string;
  breakEvenRevenue: string;
  safetyMarginPct: string;
  monthlyProfit: string;
  createdAt: string;
}

const industryUnitLabels: Record<string, { revenue: string; units: string }> = {
  "Wellness & Lifestyle": { revenue: "Per guest", units: "Guests/month" },
  "E-commerce & Retail": { revenue: "Per order", units: "Orders/month" },
  "Membership & Experiences": { revenue: "Per member/month", units: "Members" },
  "Professional Services": { revenue: "Per project", units: "Projects/month" },
  "F&B & Hospitality": { revenue: "Per cover", units: "Covers/day" },
  "Consumer Products & Apparel": { revenue: "Per unit", units: "Units/month" },
  "Technology & SaaS": { revenue: "Per member/month", units: "Members" },
  "Other": { revenue: "Per unit", units: "Units/month" },
};

function fmt(n: string | number, opts?: { money?: boolean; pct?: boolean }) {
  const v = Number(n);
  if (isNaN(v)) return "—";
  if (opts?.pct) return `${v.toFixed(1)}%`;
  if (opts?.money) return `$${v.toLocaleString("en-SG", { maximumFractionDigits: 0 })}`;
  return v.toLocaleString("en-SG", { maximumFractionDigits: 1 });
}

function BreakEvenChart({ model }: { model: UEModel }) {
  const rev = Number(model.revenuePerUnit);
  const vc = Number(model.variableCostPerUnit);
  const fc = Number(model.fixedCostsPerMonth);
  const currentUnits = Number(model.unitsPerMonth);
  const breakEven = Number(model.breakEvenUnits);
  const maxUnits = Math.max(currentUnits * 2, breakEven * 1.5, 10);

  const points = 20;
  const data = Array.from({ length: points + 1 }, (_, i) => {
    const units = Math.round((maxUnits / points) * i);
    return {
      units,
      "Total Revenue": units * rev,
      "Total Costs": fc + units * vc,
    };
  });

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="units" tick={{ fontSize: 11 }} label={{ value: "Units", position: "insideBottomRight", offset: -5, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => `$${v.toLocaleString("en-SG", { maximumFractionDigits: 0 })}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine
            x={Math.round(breakEven)}
            stroke="#ef4444"
            strokeDasharray="6 3"
            label={{ value: "Break-even", position: "top", fontSize: 11, fill: "#ef4444" }}
          />
          <Line type="monotone" dataKey="Total Revenue" stroke="#0D7377" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="Total Costs" stroke="#94a3b8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function UnitEconomics() {
  const { user } = useAuth();
  const { data: onboarding } = useGetOnboarding();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    modelName: "",
    revenuePerUnit: "",
    variableCostPerUnit: "",
    fixedCostsPerMonth: "",
    unitsPerMonth: "",
  });
  const [saving, setSaving] = useState(false);
  const [lastResult, setLastResult] = useState<UEModel | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCommentary, setAiCommentary] = useState<string | null>(null);

  const industry = onboarding?.industry ?? "Other";
  const labels = industryUnitLabels[industry] ?? industryUnitLabels["Other"];

  const isTrial = user?.subscriptionTier === "trial";
  const isPaidTier = user?.subscriptionTier === "professional" || user?.subscriptionTier === "cfo-suite";
  const isCfoSuite = user?.subscriptionTier === "cfo-suite";
  const credits = user?.aiCreditsRemaining ?? 0;
  const aiModelLabel = isCfoSuite ? "Opus" : "Haiku";

  const { data: models, isLoading: modelsLoading } = useQuery<UEModel[]>({
    queryKey: ["/api/unit-economics"],
    queryFn: async () => {
      const res = await fetch("/api/unit-economics", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isPaidTier,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/unit-economics", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelName: form.modelName || `Model ${new Date().toLocaleDateString("en-SG")}`,
          industry,
          revenuePerUnit: Number(form.revenuePerUnit),
          variableCostPerUnit: Number(form.variableCostPerUnit),
          fixedCostsPerMonth: Number(form.fixedCostsPerMonth),
          unitsPerMonth: Number(form.unitsPerMonth),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: err.error ?? "Failed to save", variant: "destructive" });
        return;
      }
      const json: UEModel = await res.json();
      setLastResult(json);
      setAiCommentary(null);
      queryClient.invalidateQueries({ queryKey: ["/api/unit-economics"] });
      toast({ title: "Model saved" });
    } catch {
      toast({ title: "Failed to save model", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/unit-economics/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["/api/unit-economics"] });
      if (lastResult?.id === id) setLastResult(null);
      toast({ title: "Model deleted" });
    }
  };

  const handleAiAnalysis = async () => {
    if (!lastResult) return;
    setAiLoading(true);
    setAiCommentary(null);
    try {
      const res = await fetch("/api/ai/analyse-model", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          inputs: {
            revenuePerUnit: lastResult.revenuePerUnit,
            variableCostPerUnit: lastResult.variableCostPerUnit,
            fixedCostsPerMonth: lastResult.fixedCostsPerMonth,
            unitsPerMonth: lastResult.unitsPerMonth,
          },
          outputs: {
            contributionMargin: lastResult.contributionMargin,
            contributionMarginPct: lastResult.contributionMarginPct,
            breakEvenUnits: lastResult.breakEvenUnits,
            monthlyProfit: lastResult.monthlyProfit,
          },
        }),
      });
      const json = await res.json();
      if (json.error) { toast({ title: json.error, variant: "destructive" }); return; }
      setAiCommentary(json.commentary);
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
    } catch {
      toast({ title: "AI analysis failed", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  if (isTrial) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <nav aria-label="Breadcrumb" className="text-sm text-synergise-text-muted">
            <Link href="/dashboard" className="hover:text-synergise-primary">Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-synergise-text font-medium">Unit Economics</span>
          </nav>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unit Economics</h1>
            <p className="text-synergise-text-muted mt-1">Understand the profitability of every unit you sell</p>
          </div>

          <div className="relative">
            {/* Blurred preview */}
            <div className="pointer-events-none select-none blur-sm opacity-60 space-y-4">
              <Card className="border-synergise-border">
                <CardHeader>
                  <CardTitle>Calculate Unit Economics</CardTitle>
                  <CardDescription>Industry: {industry}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="h-4 w-24 rounded bg-synergise-background" />
                        <div className="h-9 rounded bg-synergise-background" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="grid gap-4 md:grid-cols-3">
                {["Contribution Margin", "Break-even Units", "Monthly Profit"].map((label) => (
                  <Card key={label} className="border-synergise-border">
                    <CardContent className="p-5">
                      <p className="text-sm text-synergise-text-muted">{label}</p>
                      <p className="text-2xl font-bold mt-1 text-synergise-text">$ —</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Upgrade overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="border-synergise-border max-w-md mx-4 shadow-lg">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-synergise-accent text-synergise-primary">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Unlock Unit Economics</h2>
                    <p className="text-sm text-synergise-text-muted mt-2">
                      Calculate contribution margin, break-even and safety margin for every product or service line.
                      Available on Professional and CFO Suite.
                    </p>
                  </div>
                  <Button asChild className="bg-synergise-primary hover:bg-synergise-primary-dark w-full">
                    <Link href="/dashboard/settings#subscription">Upgrade to Professional — $49/month</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-sm text-synergise-text-muted">
          <Link href="/dashboard" className="hover:text-synergise-primary">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-synergise-text font-medium">Unit Economics</span>
        </nav>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Unit Economics</h1>
          <p className="text-synergise-text-muted mt-1">Calculate contribution margin, break-even and safety margin for any product or service line.</p>
        </div>

        {/* Input Form */}
        <Card className="border-synergise-border">
          <CardHeader>
            <CardTitle>Calculate Unit Economics</CardTitle>
            <CardDescription>Industry: {industry}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 space-y-1.5">
                  <Label>Model Name</Label>
                  <Input
                    placeholder="e.g. Current pricing model"
                    value={form.modelName}
                    onChange={(e) => setForm((f) => ({ ...f, modelName: e.target.value }))}
                    className="focus-visible:ring-synergise-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{labels.revenue} (SGD)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.revenuePerUnit}
                    onChange={(e) => setForm((f) => ({ ...f, revenuePerUnit: e.target.value }))}
                    className="focus-visible:ring-synergise-primary"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Variable cost per unit (SGD)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.variableCostPerUnit}
                    onChange={(e) => setForm((f) => ({ ...f, variableCostPerUnit: e.target.value }))}
                    className="focus-visible:ring-synergise-primary"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fixed costs per month (SGD)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.fixedCostsPerMonth}
                    onChange={(e) => setForm((f) => ({ ...f, fixedCostsPerMonth: e.target.value }))}
                    className="focus-visible:ring-synergise-primary"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{labels.units}</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.unitsPerMonth}
                    onChange={(e) => setForm((f) => ({ ...f, unitsPerMonth: e.target.value }))}
                    className="focus-visible:ring-synergise-primary"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving} className="bg-synergise-primary hover:bg-synergise-primary-dark">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Calculate & Save
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {lastResult && (
          <div className="rounded-xl border border-synergise-primary/20 bg-synergise-accent/40 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-synergise-primary" />
              <h2 className="text-lg font-semibold text-synergise-text">{lastResult.modelName} — Results</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Contribution Margin", value: fmt(lastResult.contributionMargin, { money: true }) },
                { label: "Contribution Margin %", value: fmt(lastResult.contributionMarginPct, { pct: true }) },
                { label: "Break-even Units", value: fmt(lastResult.breakEvenUnits) },
                { label: "Break-even Revenue", value: fmt(lastResult.breakEvenRevenue, { money: true }) },
                { label: "Safety Margin %", value: fmt(lastResult.safetyMarginPct, { pct: true }) },
                {
                  label: "Monthly Profit",
                  value: fmt(lastResult.monthlyProfit, { money: true }),
                  profit: Number(lastResult.monthlyProfit),
                },
              ].map(({ label, value, profit }) => (
                <Card key={label} className="border-synergise-border">
                  <CardContent className="p-5">
                    <p className="text-sm text-synergise-text-muted">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      profit != null ? (profit >= 0 ? "text-green-600" : "text-red-600") : "text-synergise-text"
                    }`}>
                      {profit != null && profit < 0 ? `−${value.replace("$", "")}` : value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Break-even chart */}
            <Card className="border-synergise-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Break-even Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <BreakEvenChart model={lastResult} />
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card className="border-synergise-border">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">AI Analysis</h3>
                    <p className="text-xs text-synergise-text-muted">
                      Powered by Claude {aiModelLabel} · 5 credits
                    </p>
                  </div>
                  {credits >= 5 ? (
                    <Button
                      onClick={handleAiAnalysis}
                      disabled={aiLoading}
                      className="bg-synergise-primary hover:bg-synergise-primary-dark shrink-0"
                    >
                      {aiLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analysing…</>
                      ) : (
                        <><Zap className="mr-2 h-4 w-4" />Analyse with AI (5 credits · {aiModelLabel})</>
                      )}
                    </Button>
                  ) : (
                    <p className="text-sm text-amber-600">
                      No credits —{" "}
                      <Link href="/dashboard/settings#credits" className="underline">Top up</Link>
                    </p>
                  )}
                </div>
                {aiCommentary && (
                  <div className="rounded-lg bg-synergise-accent p-4 text-sm text-synergise-text whitespace-pre-line">
                    {aiCommentary}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Saved models list */}
        {models && models.length > 0 && (
          <Card className="border-synergise-border">
            <CardHeader>
              <CardTitle className="text-base">Saved Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">CM %</TableHead>
                      <TableHead className="text-right">Break-even Units</TableHead>
                      <TableHead className="text-right">Monthly Profit</TableHead>
                      <TableHead className="text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {models.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.modelName}</TableCell>
                        <TableCell className="text-right">{fmt(m.contributionMarginPct, { pct: true })}</TableCell>
                        <TableCell className="text-right">{fmt(m.breakEvenUnits)}</TableCell>
                        <TableCell className={`text-right font-medium ${Number(m.monthlyProfit) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {Number(m.monthlyProfit) < 0 ? "−" : ""}{fmt(Math.abs(Number(m.monthlyProfit)), { money: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(m.id)}
                            className="text-synergise-text-muted hover:text-synergise-error"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {modelsLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
