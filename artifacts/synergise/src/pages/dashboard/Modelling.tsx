import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  useGetOnboarding, 
  useGetModels, 
  useCreateModel, 
  useDeleteModel,
  getGetModelsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Calculator, Plus, Save } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Mapping industries to specific inputs
const industryConfig: Record<string, { key: string, label: string, type: 'number' | 'percent' }[]> = {
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
  "Other": [
    { key: "monthlyRevenue", label: "Monthly Revenue (SGD)", type: "number" },
    { key: "cogs", label: "COGS (SGD)", type: "number" },
    { key: "operatingExpenses", label: "Operating Expenses (SGD)", type: "number" },
  ]
};

// Math calculations
function calculateOutputs(industry: string, inputs: Record<string, number>): Record<string, number | string> {
  const out: Record<string, number | string> = {};
  
  if (industry === "Wellness & Lifestyle") {
    const { rooms = 0, occupancyRate = 0, revenuePerGuest = 0, sessionsPerDay = 0, staffCost = 0, fixedCosts = 0 } = inputs;
    const rev = rooms * (occupancyRate/100) * sessionsPerDay * 30 * revenuePerGuest;
    const gp = rev; // assuming no direct COGS for wellness in this simple model
    const ebitda = rev - staffCost - fixedCosts;
    const breakeven = rev > 0 ? ((staffCost + fixedCosts) / (sessionsPerDay * 30 * revenuePerGuest)) * 100 : 0;
    out["Monthly Revenue"] = rev;
    out["Gross Profit"] = gp;
    out["EBITDA"] = ebitda;
    out["Break-even occupancy %"] = breakeven;
  } else if (industry === "Consumer Products & Apparel") {
    const { avgSellingPrice = 0, unitsPerMonth = 0, cogsPerUnit = 0, returnsPercent = 0, marketingSpend = 0, fixedOverhead = 0 } = inputs;
    const validUnits = unitsPerMonth * (1 - returnsPercent/100);
    const rev = validUnits * avgSellingPrice;
    const cogsTotal = unitsPerMonth * cogsPerUnit; // still pay for returned items usually
    const gp = rev - cogsTotal;
    const gpMargin = rev > 0 ? (gp / rev) * 100 : 0;
    const net = gp - marketingSpend - fixedOverhead;
    const netMargin = rev > 0 ? (net / rev) * 100 : 0;
    const breakeven = (avgSellingPrice - cogsPerUnit) > 0 ? (marketingSpend + fixedOverhead) / (avgSellingPrice - cogsPerUnit) : 0;
    out["Monthly Revenue"] = rev;
    out["Gross Margin %"] = gpMargin;
    out["Net Margin %"] = netMargin;
    out["Break-even units"] = breakeven;
  } else if (industry === "Membership & Experiences") {
    const { activeMembers = 0, monthlyFee = 0, churnPercent = 0, cac = 0, variableCostPerMember = 0, fixedCosts = 0 } = inputs;
    const mrr = activeMembers * monthlyFee;
    const arr = mrr * 12;
    const marginPerUser = monthlyFee - variableCostPerMember;
    const lifetime = churnPercent > 0 ? 1 / (churnPercent/100) : 0;
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
    const rev = capacity * (utilisationPercent/100);
    const gp = rev - fixedOverhead; // Simplified GP
    const gpMargin = rev > 0 ? (gp / rev) * 100 : 0;
    const revPerFte = billableStaff > 0 ? rev / billableStaff : 0;
    out["Revenue capacity"] = capacity;
    out["Monthly Revenue"] = rev;
    out["Gross Margin %"] = gpMargin;
    out["Revenue per FTE"] = revPerFte;
  } else if (industry === "F&B & Hospitality") {
    const { seats = 0, coversPerDay = 0, spendPerCover = 0, foodCostPercent = 0, labourCostPercent = 0, fixedCosts = 0 } = inputs;
    const rev = coversPerDay * spendPerCover * 30;
    const gp = rev * (1 - foodCostPercent/100);
    const labour = rev * (labourCostPercent/100);
    const ebitda = gp - labour - fixedCosts;
    const breakevenRev = (gp/rev) > 0 ? (labour + fixedCosts) / (gp/rev) : 0;
    const breakevenCovers = spendPerCover > 0 ? (breakevenRev / 30) / spendPerCover : 0;
    out["Monthly Revenue"] = rev;
    out["Gross Profit"] = gp;
    out["EBITDA"] = ebitda;
    out["Break-even covers/day"] = breakevenCovers;
  } else if (industry === "E-commerce & Retail") {
    const { monthlyVisitors = 0, conversionPercent = 0, aov = 0, cogsPercent = 0, marketingSpend = 0, fixedCosts = 0 } = inputs;
    const orders = monthlyVisitors * (conversionPercent/100);
    const rev = orders * aov;
    const cogs = rev * (cogsPercent/100);
    const gp = rev - cogs;
    const gpMargin = rev > 0 ? (gp / rev) * 100 : 0;
    const cac = orders > 0 ? marketingSpend / orders : 0;
    const ebitda = gp - marketingSpend - fixedCosts;
    const breakevenOrders = (aov - (aov * cogsPercent/100)) > 0 ? (marketingSpend + fixedCosts) / (aov - (aov * cogsPercent/100)) : 0;
    out["Monthly Revenue"] = rev;
    out["Gross Margin %"] = gpMargin;
    out["CAC"] = cac;
    out["Break-even orders"] = breakevenOrders;
  } else if (industry === "Technology & SaaS") {
    const { payingCustomers = 0, arpu = 0, churnPercent = 0, cac = 0, grossMarginPercent = 0, fixedCosts = 0 } = inputs;
    const mrr = payingCustomers * arpu;
    const arr = mrr * 12;
    const lifetime = churnPercent > 0 ? 1 / (churnPercent/100) : 0;
    const marginPerUser = arpu * (grossMarginPercent/100);
    const ltv = marginPerUser * lifetime;
    const ltvCac = cac > 0 ? ltv / cac : 0;
    const ebitda = (mrr * (grossMarginPercent/100)) - fixedCosts; // Ignoring new CAC for ebitda in simple model
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

export default function Modelling() {
  const { data: onboarding } = useGetOnboarding();
  const { data: models, isLoading: isModelsLoading } = useGetModels();
  const createModelMutation = useCreateModel();
  const deleteModelMutation = useDeleteModel();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [outputs, setOutputs] = useState<Record<string, number | string>>({});

  const userIndustry = onboarding?.industry || "Other";
  const fields = industryConfig[userIndustry] || industryConfig["Other"];

  const handleInputChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newInputs = { ...inputs, [key]: numValue };
    setInputs(newInputs);
    setOutputs(calculateOutputs(userIndustry, newInputs));
  };

  const handleSave = () => {
    const modelName = `Model ${format(new Date(), "MMM dd, yyyy HH:mm")}`;
    createModelMutation.mutate({
      data: {
        industry: userIndustry,
        modelName,
        inputs: inputs as any,
        outputs: outputs as any
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetModelsQueryKey() });
        toast({ title: "Model saved successfully" });
      },
      onError: () => {
        toast({ title: "Failed to save model", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteModelMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetModelsQueryKey() });
        toast({ title: "Model deleted" });
      }
    });
  };

  const formatValue = (val: number | string, key: string) => {
    if (typeof val === 'string') return val;
    if (key.includes('%') || key.includes('margin') || key.includes('Rate') || key.includes('percent')) {
      return val.toFixed(1) + '%';
    }
    if (key.includes('CAC') || key.includes('LTV') || key.includes('Revenue') || key.includes('Profit') || key.includes('EBITDA') || key.includes('MRR') || key.includes('ARR')) {
      return '$' + val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Modelling</h1>
          <p className="text-synergise-text-muted mt-2">Custom models for {userIndustry} businesses.</p>
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
                    <div className="col-span-2 text-center py-8 text-white/70">
                      Enter values to see projections
                    </div>
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
                  <div className="text-center py-8 text-synergise-text-muted">
                    No models saved yet.
                  </div>
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
      </div>
    </DashboardLayout>
  );
}
