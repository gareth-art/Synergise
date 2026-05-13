import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useGetModels,
  useCreateModel,
  useDeleteModel,
  getGetModelsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Calculator, Save, Lock, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// Mapping industries to specific inputs
const industryConfig: Record<string, { key: string; label: string; type: "number" | "percent" }[]> = {
  "Wellness & Lifestyle": [
    { key: "rooms", label: "Rooms / Spaces", type: "number" },
    { key: "occupancyRate", label: "Occupancy Rate %", type: "percent" },
    { key: "revenuePerGuest", label: "Revenue / Guest (SGD)", type: "number" },
    { key: "sessionsPerDay", label: "Sessions / Day", type: "number" },
    { key: "staffCost", label: "Staff Cost / Month (SGD)", type: "number" },
    { key: "fixedCosts", label: "Fixed Costs / Month (SGD)", type: "number" },
  ],
  "Consumer Products & Apparel": [
    { key: "avgSellingPrice", label: "Avg Selling Price (SGD)", type: "number" },
    { key: "unitsPerMonth", label: "Units / Month", type: "number" },
    { key: "cogsPerUnit", label: "COGS / Unit (SGD)", type: "number" },
    { key: "returnsPercent", label: "Returns %", type: "percent" },
    { key: "marketingSpend", label: "Marketing Spend (SGD)", type: "number" },
    { key: "fixedOverhead", label: "Fixed Overhead (SGD)", type: "number" },
  ],
  "Membership & Experiences": [
    { key: "activeMembers", label: "Active Members", type: "number" },
    { key: "monthlyFee", label: "Monthly Fee (SGD)", type: "number" },
    { key: "churnPercent", label: "Churn %", type: "percent" },
    { key: "cac", label: "CAC (SGD)", type: "number" },
    { key: "variableCostPerMember", label: "Variable Cost / Member", type: "number" },
    { key: "fixedCosts", label: "Fixed Costs (SGD)", type: "number" },
  ],
  "Professional Services": [
    { key: "billableStaff", label: "Billable Staff", type: "number" },
    { key: "billableRate", label: "Billable Rate / Hr (SGD)", type: "number" },
    { key: "utilisationPercent", label: "Utilisation %", type: "percent" },
    { key: "hoursPerMonth", label: "Hours / Month / Person", type: "number" },
    { key: "fixedOverhead", label: "Fixed Overhead (SGD)", type: "number" },
  ],
  "F&B & Hospitality": [
    { key: "seats", label: "Seats", type: "number" },
    { key: "coversPerDay", label: "Covers / Day", type: "number" },
    { key: "spendPerCover", label: "Spend / Cover (SGD)", type: "number" },
    { key: "foodCostPercent", label: "Food Cost %", type: "percent" },
    { key: "labourCostPercent", label: "Labour Cost %", type: "percent" },
    { key: "fixedCosts", label: "Fixed Costs (SGD)", type: "number" },
  ],
  "E-commerce & Retail": [
    { key: "monthlyVisitors", label: "Monthly Visitors", type: "number" },
    { key: "conversionPercent", label: "Conversion %", type: "percent" },
    { key: "aov", label: "AOV (SGD)", type: "number" },
    { key: "cogsPercent", label: "COGS %", type: "percent" },
    { key: "marketingSpend", label: "Marketing Spend (SGD)", type: "number" },
    { key: "fixedCosts", label: "Fixed Costs (SGD)", type: "number" },
  ],
  "Technology & SaaS": [
    { key: "payingCustomers", label: "Paying Customers", type: "number" },
    { key: "arpu", label: "ARPU / Month (SGD)", type: "number" },
    { key: "churnPercent", label: "Churn %", type: "percent" },
    { key: "cac", label: "CAC (SGD)", type: "number" },
    { key: "grossMarginPercent", label: "Gross Margin %", type: "percent" },
    { key: "fixedCosts", label: "Fixed Costs (SGD)", type: "number" },
  ],
  Other: [
    { key: "monthlyRevenue", label: "Monthly Revenue (SGD)", type: "number" },
    { key: "cogs", label: "COGS (SGD)", type: "number" },
    { key: "operatingExpenses", label: "Operating Expenses (SGD)", type: "number" },
  ],
};

function calculateOutputs(industry: string, inputs: Record<string, number>): Record<string, number | string> {
  const out: Record<string, number | string> = {};
  if (industry === "Wellness & Lifestyle") {
    const { rooms = 0, occupancyRate = 0, revenuePerGuest = 0, sessionsPerDay = 0, staffCost = 0, fixedCosts = 0 } = inputs;
    const rev = rooms * (occupancyRate / 100) * sessionsPerDay * 30 * revenuePerGuest;
    const ebitda = rev - staffCost - fixedCosts;
    const breakeven = rev > 0 ? ((staffCost + fixedCosts) / (sessionsPerDay * 30 * revenuePerGuest)) * 100 : 0;
    out["Monthly Revenue"] = rev;
    out["Gross Profit"] = rev;
    out["EBITDA"] = ebitda;
    out["Break-even occupancy %"] = breakeven;
  } else if (industry === "Consumer Products & Apparel") {
    const { avgSellingPrice = 0, unitsPerMonth = 0, cogsPerUnit = 0, returnsPercent = 0, marketingSpend = 0, fixedOverhead = 0 } = inputs;
    const validUnits = unitsPerMonth * (1 - returnsPercent / 100);
    const rev = validUnits * avgSellingPrice;
    const cogsTotal = unitsPerMonth * cogsPerUnit;
    const gp = rev - cogsTotal;
    const gpMargin = rev > 0 ? (gp / rev) * 100 : 0;
    const net = gp - marketingSpend - fixedOverhead;
    const netMargin = rev > 0 ? (net / rev) * 100 : 0;
    const breakeven = avgSellingPrice - cogsPerUnit > 0 ? (marketingSpend + fixedOverhead) / (avgSellingPrice - cogsPerUnit) : 0;
    out["Monthly Revenue"] = rev;
    out["Gross Margin %"] = gpMargin;
    out["Net Margin %"] = netMargin;
    out["Break-even units"] = breakeven;
  } else if (industry === "Membership & Experiences") {
    const { activeMembers = 0, monthlyFee = 0, churnPercent = 0, cac = 0, variableCostPerMember = 0, fixedCosts = 0 } = inputs;
    const mrr = activeMembers * monthlyFee;
    const arr = mrr * 12;
    const marginPerUser = monthlyFee - variableCostPerMember;
    const lifetime = churnPercent > 0 ? 1 / (churnPercent / 100) : 0;
    const ltv = marginPerUser * lifetime;
    const ltvCac = cac > 0 ? ltv / cac : 0;
    const breakeven = marginPerUser > 0 ? fixedCosts / marginPerUser : 0;
    out["MRR"] = mrr;
    out["ARR"] = arr;
    out["LTV"] = ltv;
    out["LTV/CAC"] = ltvCac;
    out["Break-even members"] = breakeven;
  } else if (industry === "Professional Services") {
    const { billableStaff = 0, billableRate = 0, utilisationPercent = 0, hoursPerMonth = 0, fixedOverhead = 0 } = inputs;
    const capacity = billableStaff * hoursPerMonth * billableRate;
    const rev = capacity * (utilisationPercent / 100);
    const gp = rev - fixedOverhead;
    const gpMargin = rev > 0 ? (gp / rev) * 100 : 0;
    const revPerFte = billableStaff > 0 ? rev / billableStaff : 0;
    out["Revenue capacity"] = capacity;
    out["Monthly Revenue"] = rev;
    out["Gross Margin %"] = gpMargin;
    out["Revenue per FTE"] = revPerFte;
  } else if (industry === "F&B & Hospitality") {
    const { coversPerDay = 0, spendPerCover = 0, foodCostPercent = 0, labourCostPercent = 0, fixedCosts = 0 } = inputs;
    const rev = coversPerDay * spendPerCover * 30;
    const gp = rev * (1 - foodCostPercent / 100);
    const labour = rev * (labourCostPercent / 100);
    const ebitda = gp - labour - fixedCosts;
    const breakevenRev = gp / rev > 0 ? (labour + fixedCosts) / (gp / rev) : 0;
    const breakevenCovers = spendPerCover > 0 ? breakevenRev / 30 / spendPerCover : 0;
    out["Monthly Revenue"] = rev;
    out["Gross Profit"] = gp;
    out["EBITDA"] = ebitda;
    out["Break-even covers/day"] = breakevenCovers;
  } else if (industry === "E-commerce & Retail") {
    const { monthlyVisitors = 0, conversionPercent = 0, aov = 0, cogsPercent = 0, marketingSpend = 0, fixedCosts = 0 } = inputs;
    const orders = monthlyVisitors * (conversionPercent / 100);
    const rev = orders * aov;
    const cogs = rev * (cogsPercent / 100);
    const gp = rev - cogs;
    const gpMargin = rev > 0 ? (gp / rev) * 100 : 0;
    const cac = orders > 0 ? marketingSpend / orders : 0;
    const ebitda = gp - marketingSpend - fixedCosts;
    const breakevenOrders = aov - aov * (cogsPercent / 100) > 0 ? (marketingSpend + fixedCosts) / (aov - aov * (cogsPercent / 100)) : 0;
    out["Monthly Revenue"] = rev;
    out["Gross Margin %"] = gpMargin;
    out["CAC"] = cac;
    out["Break-even orders"] = breakevenOrders;
  } else if (industry === "Technology & SaaS") {
    const { payingCustomers = 0, arpu = 0, churnPercent = 0, cac = 0, grossMarginPercent = 0, fixedCosts = 0 } = inputs;
    const mrr = payingCustomers * arpu;
    const arr = mrr * 12;
    const lifetime = churnPercent > 0 ? 1 / (churnPercent / 100) : 0;
    const marginPerUser = arpu * (grossMarginPercent / 100);
    const ltv = marginPerUser * lifetime;
    const ltvCac = cac > 0 ? ltv / cac : 0;
    const monthsToBreakeven = marginPerUser > 0 ? cac / marginPerUser : 0;
    out["MRR"] = mrr;
    out["ARR"] = arr;
    out["LTV"] = ltv;
    out["LTV/CAC"] = ltvCac;
    out["Months to break even"] = monthsToBreakeven;
  } else {
    const { monthlyRevenue = 0, cogs = 0, operatingExpenses = 0 } = inputs;
    const gp = monthlyRevenue - cogs;
    const gpMargin = monthlyRevenue > 0 ? (gp / monthlyRevenue) * 100 : 0;
    const ebitda = gp - operatingExpenses;
    const netMargin = monthlyRevenue > 0 ? (ebitda / monthlyRevenue) * 100 : 0;
    out["Gross Profit"] = gp;
    out["Gross Margin %"] = gpMargin;
    out["EBITDA"] = ebitda;
    out["Net Margin %"] = netMargin;
  }
  return out;
}

interface ScenarioPlan {
  id: number;
  scenarioName: string;
  adjustments: Record<string, number>;
  outputs: Record<string, number | string>;
  createdAt: string;
}

function formatValue(val: number | string, key: string) {
  if (typeof val === "string") return val;
  if (key.includes("%") || key.includes("margin") || key.includes("Rate") || key.includes("percent")) {
    return val.toFixed(1) + "%";
  }
  if (key.includes("CAC") || key.includes("LTV") || key.includes("Revenue") || key.includes("Profit") || key.includes("EBITDA") || key.includes("MRR") || key.includes("ARR")) {
    return "$" + val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function ScenarioSection({ modelId, baseInputs, baseOutputs, industry, userTier }: {
  modelId: number | null;
  baseInputs: Record<string, number>;
  baseOutputs: Record<string, number | string>;
  industry: string;
  userTier: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioInputs, setScenarioInputs] = useState<Record<string, number>>(baseInputs);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fields = industryConfig[industry] || industryConfig["Other"];

  const { data: scenarios } = useQuery<ScenarioPlan[]>({
    queryKey: ["/api/scenarios", modelId],
    queryFn: async () => {
      const res = await fetch(`/api/scenarios?modelId=${modelId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!modelId && userTier === "cfo-suite",
  });

  const handleSaveScenario = async () => {
    if (!modelId) return;
    setSaving(true);
    const outputs = calculateOutputs(industry, scenarioInputs);
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          financialModelId: modelId,
          scenarioName: scenarioName || `Scenario ${new Date().toLocaleDateString()}`,
          adjustments: scenarioInputs,
          outputs,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios", modelId] });
      toast({ title: "Scenario saved" });
      setShowForm(false);
      setScenarioName("");
    } catch {
      toast({ title: "Failed to save scenario", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/scenarios/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios", modelId] });
      toast({ title: "Scenario deleted" });
    }
  };

  if (userTier !== "cfo-suite") {
    return (
      <Card className="border-synergise-border">
        <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-synergise-accent text-synergise-primary shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-synergise-text">Scenario Planning</h3>
            <p className="text-sm text-synergise-text-muted mt-1">
              Compare what-if scenarios side by side. See how price changes, cost reductions, or volume shifts affect your bottom line.
            </p>
            <p className="text-xs text-synergise-text-muted mt-1 font-medium">Available on CFO Suite</p>
          </div>
          <Button asChild size="sm" className="bg-synergise-primary hover:bg-synergise-primary-dark shrink-0">
            <Link href="/dashboard/settings#subscription">Upgrade</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const allScenarios = scenarios ?? [];
  const outputKeys = Object.keys(baseOutputs);

  // Find scenario with best profit/EBITDA
  const profitKey = outputKeys.find((k) => k.includes("Profit") || k.includes("EBITDA") || k.includes("MRR"));
  const bestScenarioId = allScenarios.reduce<number | null>((best, s) => {
    if (!profitKey) return best;
    const v = Number((s.outputs as any)[profitKey] ?? 0);
    const bestV = best ? Number((allScenarios.find((x) => x.id === best)?.outputs as any)?.[profitKey] ?? 0) : -Infinity;
    return v > bestV ? s.id : best;
  }, null);

  return (
    <Card className="border-synergise-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Scenario Planning</CardTitle>
            <CardDescription>Compare what-if scenarios against your base model</CardDescription>
          </div>
          {modelId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowForm(!showForm); setScenarioInputs({ ...baseInputs }); }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Scenario
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!modelId && (
          <p className="text-sm text-synergise-text-muted">Save a model above to start creating scenarios.</p>
        )}

        {/* Add scenario form */}
        {showForm && modelId && (
          <Card className="border-dashed border-synergise-border">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Scenario Name</Label>
                <Input
                  placeholder="e.g. Price increase 15%"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  className="focus-visible:ring-synergise-primary"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      type="number"
                      value={scenarioInputs[field.key] ?? ""}
                      onChange={(e) =>
                        setScenarioInputs((prev) => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))
                      }
                      className="focus-visible:ring-synergise-primary h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveScenario}
                  disabled={saving}
                  className="bg-synergise-primary hover:bg-synergise-primary-dark"
                >
                  {saving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  Save Scenario
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scenarios comparison table */}
        {allScenarios.length > 0 && outputKeys.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  {outputKeys.map((k) => <TableHead key={k} className="text-right">{k}</TableHead>)}
                  {profitKey && <TableHead className="text-right">vs Base</TableHead>}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Base model row */}
                <TableRow className="bg-synergise-background">
                  <TableCell className="font-medium text-synergise-text-muted">Base Model</TableCell>
                  {outputKeys.map((k) => (
                    <TableCell key={k} className="text-right text-synergise-text-muted">
                      {formatValue(baseOutputs[k] ?? 0, k)}
                    </TableCell>
                  ))}
                  {profitKey && <TableCell className="text-right text-synergise-text-muted">—</TableCell>}
                  <TableCell />
                </TableRow>
                {allScenarios.map((s) => {
                  const isBest = s.id === bestScenarioId && allScenarios.length > 0;
                  const baseProfit = profitKey ? Number(baseOutputs[profitKey] ?? 0) : 0;
                  const scenProfit = profitKey ? Number((s.outputs as any)[profitKey] ?? 0) : 0;
                  const diffPct = baseProfit !== 0 ? ((scenProfit - baseProfit) / Math.abs(baseProfit)) * 100 : 0;
                  return (
                    <TableRow key={s.id} className={isBest ? "border-l-2 border-l-green-500" : ""}>
                      <TableCell className="font-medium">{s.scenarioName}</TableCell>
                      {outputKeys.map((k) => (
                        <TableCell key={k} className="text-right">
                          {formatValue((s.outputs as any)[k] ?? 0, k)}
                        </TableCell>
                      ))}
                      {profitKey && (
                        <TableCell className={`text-right font-medium ${diffPct >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {diffPct >= 0 ? "+" : ""}{diffPct.toFixed(1)}%
                        </TableCell>
                      )}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                          className="text-synergise-text-muted hover:text-synergise-error h-8 w-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface OnboardingProfile { industry: string }

async function fetchOnboardingProfile(): Promise<OnboardingProfile | null> {
  const res = await fetch("/api/onboarding", { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export default function Modelling() {
  const { user } = useAuth();
  const { data: onboarding } = useQuery<OnboardingProfile | null>({
    queryKey: ["onboarding-profile"],
    queryFn: fetchOnboardingProfile,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const { data: models, isLoading: isModelsLoading } = useGetModels();
  const createModelMutation = useCreateModel();
  const deleteModelMutation = useDeleteModel();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [outputs, setOutputs] = useState<Record<string, number | string>>({});
  const [lastSavedModelId, setLastSavedModelId] = useState<number | null>(null);

  const userIndustry = onboarding?.industry || "Other";
  const fields = industryConfig[userIndustry] || industryConfig["Other"];
  const userTier = user?.subscriptionTier ?? "trial";

  const handleInputChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newInputs = { ...inputs, [key]: numValue };
    setInputs(newInputs);
    setOutputs(calculateOutputs(userIndustry, newInputs));
  };

  const handleSave = () => {
    const modelName = `Model ${format(new Date(), "MMM dd, yyyy HH:mm")}`;
    createModelMutation.mutate(
      { data: { industry: userIndustry, modelName, inputs: inputs as any, outputs: outputs as any } },
      {
        onSuccess: (model) => {
          queryClient.invalidateQueries({ queryKey: getGetModelsQueryKey() });
          setLastSavedModelId((model as any).id ?? null);
          toast({ title: "Model saved successfully" });
        },
        onError: () => {
          toast({ title: "Failed to save model", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteModelMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetModelsQueryKey() });
          if (lastSavedModelId === id) setLastSavedModelId(null);
          toast({ title: "Model deleted" });
        },
      }
    );
  };

  // Use the most recently saved model's id for scenario planning
  const activeModelId = lastSavedModelId ?? (models && models.length > 0 ? models[models.length - 1].id : null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-sm text-synergise-text-muted">
          <Link href="/dashboard" className="hover:text-synergise-primary">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-synergise-text font-medium">Financial Modelling</span>
        </nav>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Modelling</h1>
          <p className="text-synergise-text-muted mt-2">Custom models tailored for {userIndustry} businesses — see revenue, margins and break-even update as you type.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Inputs */}
          <Card className="md:col-span-5 border-synergise-border">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calculator className="h-5 w-5 text-synergise-primary" />
                Inputs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-synergise-text">{field.label}</Label>
                  <Input
                    id={field.key}
                    type="number"
                    value={inputs[field.key] || ""}
                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                    className="focus-visible:ring-synergise-primary"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Outputs */}
          <div className="md:col-span-7 space-y-6">
            <Card className="border-synergise-border bg-synergise-primary text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Projections</CardTitle>
                <CardDescription className="text-synergise-primary-light">Real-time calculated outputs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(outputs).length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-white/70">Enter values to see projections</div>
                  ) : (
                    Object.entries(outputs).map(([key, val]) => (
                      <div key={key} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <p className="text-sm font-medium text-white/80">{key}</p>
                        <p className="text-2xl font-bold mt-1">{formatValue(val, key)}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  onClick={handleSave}
                  disabled={Object.keys(outputs).length === 0 || createModelMutation.isPending}
                  className="w-full bg-white text-synergise-primary hover:bg-gray-100 font-semibold"
                >
                  <Save className="mr-2 h-4 w-4" /> Save Model
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-synergise-border">
              <CardHeader>
                <CardTitle className="text-xl">Saved Models</CardTitle>
              </CardHeader>
              <CardContent>
                {isModelsLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : !models || models.length === 0 ? (
                  <div className="text-center py-8 text-synergise-text-muted">No models saved yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {models.map((model) => (
                          <TableRow key={model.id}>
                            <TableCell className="text-synergise-text-muted">
                              {model.createdAt ? format(new Date(model.createdAt), "MMM dd, yyyy") : ""}
                            </TableCell>
                            <TableCell className="font-medium">{model.modelName}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(model.id)}
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
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Scenario Planning Section */}
        <ScenarioSection
          modelId={activeModelId}
          baseInputs={inputs}
          baseOutputs={outputs}
          industry={userIndustry}
          userTier={userTier}
        />
      </div>
    </DashboardLayout>
  );
}
