export type RevenueType = "Recurring" | "One-time" | "Project-based";
export type CostBasis = "% of linked revenue" | "Fixed per unit sold" | "Fixed per month";

export interface RevenueLineItem {
  id: string;
  name: string;
  monthlyBase: number;
  growthRate: number;
  revenueType: RevenueType;
  seasonalityEnabled: boolean;
  monthlyMultipliers: number[]; // 12 values, Jan–Dec, default 1.0
}

export interface CogsLineItem {
  id: string;
  name: string;
  costBasis: CostBasis;
  value: number;
  linkedRevenueLine: string; // revenue line name or "All Revenue"
}

export interface OpexItem {
  key: string;
  label: string;
  customLabel: string;
  monthlyAmount: number;
  annualEscalation: number;
}

export interface FinancialModelState {
  modelName: string;
  revenueLines: RevenueLineItem[];
  cogsLines: CogsLineItem[];
  opexItems: OpexItem[];
}

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export const OPEX_DEFAULTS: Omit<OpexItem, "monthlyAmount" | "annualEscalation">[] = [
  { key: "rent",         label: "Rent / Office",                customLabel: "" },
  { key: "salaries",     label: "Salaries & Payroll",           customLabel: "" },
  { key: "marketing",    label: "Marketing & Advertising",      customLabel: "" },
  { key: "software",     label: "Software & Subscriptions",     customLabel: "" },
  { key: "professional", label: "Professional Fees",            customLabel: "" },
  { key: "loans",        label: "Loan Repayments / Interest",   customLabel: "" },
  { key: "other",        label: "Other",                        customLabel: "" },
];

export function makeDefaultOpexItems(): OpexItem[] {
  return OPEX_DEFAULTS.map((d) => ({ ...d, monthlyAmount: 0, annualEscalation: 0 }));
}

export function makeDefaultRevenueLine(): RevenueLineItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    monthlyBase: 0,
    growthRate: 0,
    revenueType: "Recurring",
    seasonalityEnabled: false,
    monthlyMultipliers: Array(12).fill(1.0),
  };
}

export function makeDefaultCogsLine(): CogsLineItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    costBasis: "Fixed per month",
    value: 0,
    linkedRevenueLine: "All Revenue",
  };
}

export function makeDefaultModel(): FinancialModelState {
  return {
    modelName: "",
    revenueLines: [],
    cogsLines: [],
    opexItems: makeDefaultOpexItems(),
  };
}
