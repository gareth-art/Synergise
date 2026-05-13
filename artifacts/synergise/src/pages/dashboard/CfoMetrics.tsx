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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Minus, Lock, Loader2, Info, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { Link } from "wouter";

interface CfoInput {
  period: string;
  cashOnHand: string;
  totalCurrentAssets: string;
  totalCurrentLiabilities: string;
  totalInventory: string;
  receivableDays: string;
  payableDays: string;
  inventoryDays: string;
  totalDebt: string;
  totalEquity: string;
}

interface CfoMetricsData {
  period: string;
  burnRate: number | null;
  netBurn?: number | null;
  cashRunway?: number | null;
  workingCapital: number | null;
  currentRatio?: number | null;
  quickRatio?: number | null;
  cashConversionCycle?: number | null;
  gearingRatio?: number | null;
  debtToEbitda?: number | null;
  grossMarginPct: number | null;
  ebitdaMarginPct?: number | null;
  revenueMoMGrowth?: number | null;
}

const METRIC_META: Record<string, { label: string; unit: string; formula: string; healthy: string; isPercent?: boolean; isMoney?: boolean; isRatio?: boolean }> = {
  burnRate: { label: "Burn Rate", unit: "SGD/mo", formula: "Opex + COGS − Revenue", healthy: "Negative (cash flow positive)", isMoney: true },
  workingCapital: { label: "Working Capital", unit: "SGD", formula: "Current Assets − Current Liabilities", healthy: "> 0", isMoney: true },
  grossMarginPct: { label: "Gross Margin", unit: "%", formula: "(Revenue − COGS) / Revenue × 100", healthy: "> 40% for services, > 25% for products", isPercent: true },
  netBurn: { label: "Net Burn", unit: "SGD/mo", formula: "Revenue − (Opex + COGS)", healthy: "Positive", isMoney: true },
  cashRunway: { label: "Cash Runway", unit: "months", formula: "Cash on Hand / Monthly Burn Rate", healthy: "> 12 months" },
  currentRatio: { label: "Current Ratio", unit: "×", formula: "Current Assets / Current Liabilities", healthy: "> 1.5×", isRatio: true },
  quickRatio: { label: "Quick Ratio", unit: "×", formula: "(Current Assets − Inventory) / Current Liabilities", healthy: "> 1.0×", isRatio: true },
  cashConversionCycle: { label: "Cash Conversion Cycle", unit: "days", formula: "Receivable Days + Inventory Days − Payable Days", healthy: "< 30 days" },
  gearingRatio: { label: "Gearing Ratio", unit: "", formula: "Total Debt / (Debt + Equity)", healthy: "< 0.5", isRatio: true },
  debtToEbitda: { label: "Debt / EBITDA", unit: "×", formula: "Total Debt / (Annual EBITDA)", healthy: "< 3×", isRatio: true },
  ebitdaMarginPct: { label: "EBITDA Margin", unit: "%", formula: "EBITDA / Revenue × 100", healthy: "> 15%", isPercent: true },
  revenueMoMGrowth: { label: "Revenue Growth MoM", unit: "%", formula: "(This Month − Last Month) / Last Month × 100", healthy: "> 5%/mo for growth stage", isPercent: true },
};

const LOCKED_METRICS = ["currentRatio", "quickRatio", "cashRunway", "cashConversionCycle", "gearingRatio", "debtToEbitda", "revenueMoMGrowth", "ebitdaMarginPct", "netBurn"];

function formatMetricValue(key: string, value: number | null | undefined): string {
  if (value == null) return "—";
  const meta = METRIC_META[key];
  if (!meta) return String(value);
  if (meta.isPercent) return `${value.toFixed(1)}%`;
  if (meta.isMoney) return `$${Math.abs(value).toLocaleString("en-SG", { maximumFractionDigits: 0 })}`;
  if (meta.isRatio) return value.toFixed(2) + (meta.unit ? meta.unit : "");
  return `${value.toFixed(1)} ${meta.unit}`;
}

function MetricTile({ metricKey, value }: { metricKey: string; value: number | null | undefined }) {
  const meta = METRIC_META[metricKey];
  if (!meta) return null;

  const formattedValue = formatMetricValue(metricKey, value);
  const isNull = value == null;

  // Runway colour coding
  let runwayColor = "";
  if (metricKey === "cashRunway" && value != null) {
    runwayColor = value >= 12 ? "text-green-600" : value >= 6 ? "text-amber-600" : "text-red-600";
  }

  // Burn rate badge
  let burnBadge = null;
  if (metricKey === "burnRate" && value != null) {
    burnBadge = value > 0 ? (
      <Badge variant="destructive" className="text-xs">Burning cash</Badge>
    ) : (
      <Badge className="text-xs bg-green-100 text-green-700 border border-green-200">Cash flow positive</Badge>
    );
  }

  return (
    <Card className="border-synergise-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-1">
          <p className="text-sm font-medium text-synergise-text-muted">{meta.label}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-synergise-text-muted cursor-help shrink-0" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs space-y-1">
              <p><span className="font-semibold">Formula:</span> {meta.formula}</p>
              <p><span className="font-semibold">Healthy range:</span> {meta.healthy}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        {isNull ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-2xl font-bold text-synergise-text-muted cursor-help">—</p>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Add inputs above to see this metric</TooltipContent>
          </Tooltip>
        ) : (
          <p className={`text-2xl font-bold text-synergise-text ${runwayColor}`}>{formattedValue}</p>
        )}
        {burnBadge && <div className="mt-2">{burnBadge}</div>}
      </CardContent>
    </Card>
  );
}

export default function CfoMetrics() {
  const { user } = useAuth();
  const { data: onboarding } = useGetOnboarding();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isCfoSuite = user?.subscriptionTier === "cfo-suite";
  const [inputsOpen, setInputsOpen] = useState(false);
  const [savingInputs, setSavingInputs] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCommentary, setAiCommentary] = useState<string | null>(null);

  // Load all CFO input periods to get list of periods
  const { data: allInputs } = useQuery<CfoInput[]>({
    queryKey: ["/api/cfo-inputs"],
    queryFn: async () => {
      const res = await fetch("/api/cfo-inputs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isCfoSuite,
  });

  const periods = allInputs?.map((i) => i.period).sort().reverse() ?? [];
  const latestPeriod = periods[0] ?? new Date().toISOString().slice(0, 7);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const effectivePeriod = selectedPeriod || latestPeriod;

  // CFO inputs form state
  const existingInput = allInputs?.find((i) => i.period === effectivePeriod);
  const [form, setForm] = useState({
    period: effectivePeriod,
    cashOnHand: "",
    totalCurrentAssets: "",
    totalCurrentLiabilities: "",
    totalInventory: "",
    receivableDays: "",
    payableDays: "",
    inventoryDays: "",
    totalDebt: "",
    totalEquity: "",
  });

  const { data: metrics, refetch: refetchMetrics } = useQuery<CfoMetricsData>({
    queryKey: ["/api/cfo-metrics", effectivePeriod],
    queryFn: async () => {
      const res = await fetch(`/api/cfo-metrics/${effectivePeriod}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!effectivePeriod,
  });

  const handleSaveInputs = async () => {
    setSavingInputs(true);
    try {
      const payload = {
        period: form.period || effectivePeriod,
        cashOnHand: Number(form.cashOnHand) || 0,
        totalCurrentAssets: Number(form.totalCurrentAssets) || 0,
        totalCurrentLiabilities: Number(form.totalCurrentLiabilities) || 0,
        totalInventory: Number(form.totalInventory) || 0,
        receivableDays: Number(form.receivableDays) || 0,
        payableDays: Number(form.payableDays) || 0,
        inventoryDays: Number(form.inventoryDays) || 0,
        totalDebt: Number(form.totalDebt) || 0,
        totalEquity: Number(form.totalEquity) || 0,
      };
      const res = await fetch("/api/cfo-inputs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      await queryClient.invalidateQueries({ queryKey: ["/api/cfo-inputs"] });
      await refetchMetrics();
      toast({ title: "Inputs saved" });
      setInputsOpen(false);
    } catch {
      toast({ title: "Failed to save inputs", variant: "destructive" });
    } finally {
      setSavingInputs(false);
    }
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiCommentary(null);
    try {
      const res = await fetch("/api/ai/cfo-commentary", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics, period: effectivePeriod, industry: onboarding?.industry }),
      });
      const json = await res.json();
      if (json.error) {
        toast({ title: json.error, variant: "destructive" });
        return;
      }
      setAiCommentary(json.commentary);
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
    } catch {
      toast({ title: "AI analysis failed", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const isTrial = user?.subscriptionTier === "trial";
  const isProfessional = user?.subscriptionTier === "professional";
  const credits = user?.aiCreditsRemaining ?? 0;

  if (isTrial || isProfessional) {
    // Show limited view
    const visibleMetrics: (keyof CfoMetricsData)[] = ["burnRate", "workingCapital", "grossMarginPct"];

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CFO Metrics</h1>
            <p className="text-synergise-text-muted mt-2">Key financial health indicators.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {visibleMetrics.map((k) => (
              <MetricTile key={k} metricKey={k} value={metrics?.[k] as number | null} />
            ))}
          </div>

          {/* Locked section */}
          <div className="relative">
            <div className="grid gap-4 md:grid-cols-3 opacity-40 select-none pointer-events-none blur-[1px]">
              {LOCKED_METRICS.map((k) => (
                <Card key={k} className="border-synergise-border">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-synergise-text-muted">{METRIC_META[k]?.label ?? k}</p>
                    <p className="text-2xl font-bold text-synergise-text mt-1">$12,345</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="w-full max-w-md shadow-lg border-synergise-primary/20">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-synergise-accent text-synergise-primary mx-auto">
                    <Lock className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Unlock the Full CFO Dashboard</h3>
                  <p className="text-synergise-text-muted text-sm">
                    Get all 12 CFO metrics with CFO Suite — $149/month
                  </p>
                  <Button asChild className="bg-synergise-primary hover:bg-synergise-primary-dark">
                    <Link href="/dashboard/settings#subscription">Upgrade to CFO Suite</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // CFO Suite full view
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">CFO Metrics</h1>
            <p className="text-synergise-text-muted mt-1">Full financial health dashboard — CFO Suite</p>
          </div>
          {periods.length > 0 && (
            <select
              className="rounded-md border border-synergise-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-synergise-primary"
              value={selectedPeriod || latestPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {periods.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
        </div>

        {/* Balance Sheet Inputs */}
        <Card className="border-synergise-border">
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setInputsOpen(!inputsOpen)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Balance Sheet Inputs</CardTitle>
              {inputsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            <CardDescription>Enter balance sheet data to calculate all metrics</CardDescription>
          </CardHeader>
          {inputsOpen && (
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { key: "period", label: "Period (YYYY-MM)", placeholder: "2026-01", type: "text" },
                  { key: "cashOnHand", label: "Cash on Hand (SGD)" },
                  { key: "totalCurrentAssets", label: "Total Current Assets (SGD)" },
                  { key: "totalCurrentLiabilities", label: "Total Current Liabilities (SGD)" },
                  { key: "totalInventory", label: "Total Inventory (SGD)" },
                  { key: "receivableDays", label: "Receivable Days" },
                  { key: "payableDays", label: "Payable Days" },
                  { key: "inventoryDays", label: "Inventory Days" },
                  { key: "totalDebt", label: "Total Debt (SGD)" },
                  { key: "totalEquity", label: "Total Equity (SGD)" },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-sm">{label}</Label>
                    <Input
                      type={type ?? "number"}
                      placeholder={placeholder ?? "0"}
                      value={(form as any)[key] || (existingInput ? (existingInput as any)[key] : "")}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="focus-visible:ring-synergise-primary"
                    />
                  </div>
                ))}
              </div>
              <Button
                onClick={handleSaveInputs}
                disabled={savingInputs}
                className="bg-synergise-primary hover:bg-synergise-primary-dark"
              >
                {savingInputs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Inputs
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Metrics grid — all 12 */}
        <div className="grid gap-4 md:grid-cols-3">
          {Object.keys(METRIC_META).map((k) => (
            <MetricTile key={k} metricKey={k} value={metrics ? (metrics as any)[k] : undefined} />
          ))}
        </div>

        {/* AI Commentary */}
        <Card className="border-synergise-border">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">AI CFO Commentary</h3>
                <p className="text-xs text-synergise-text-muted">Powered by Claude Opus · 10 credits</p>
              </div>
              <Button
                onClick={handleAiAnalysis}
                disabled={aiLoading || credits < 10}
                className="bg-synergise-primary hover:bg-synergise-primary-dark shrink-0"
              >
                {aiLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analysing…</>
                ) : (
                  <><Zap className="mr-2 h-4 w-4" />Get AI Analysis (10 credits)</>
                )}
              </Button>
            </div>
            {credits < 10 && !aiLoading && (
              <p className="text-sm text-amber-600">
                Insufficient credits.{" "}
                <Link href="/dashboard/settings#credits" className="underline">Top up</Link>
              </p>
            )}
            {aiCommentary && (
              <div className="rounded-lg bg-synergise-accent p-4 text-sm text-synergise-text whitespace-pre-line">
                {aiCommentary}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
