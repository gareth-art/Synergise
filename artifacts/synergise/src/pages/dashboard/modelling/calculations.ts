import { RevenueLineItem, CogsLineItem, OpexItem } from "./types";

export interface MonthlyProjection {
  month: number; // 1–12
  revenue: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  ebitda: number;
  netProfit: number;
}

export function calcRevenueForMonth(line: RevenueLineItem, monthIndex: number): number {
  if (line.revenueType === "One-time" && monthIndex > 0) return 0;
  const growth = Math.pow(1 + line.growthRate / 100, monthIndex);
  const seasonality = line.seasonalityEnabled ? (line.monthlyMultipliers[monthIndex] ?? 1.0) : 1.0;
  return line.monthlyBase * growth * seasonality;
}

export function calcTotalRevenue(lines: RevenueLineItem[], monthIndex: number): number {
  return lines.reduce((sum, l) => sum + calcRevenueForMonth(l, monthIndex), 0);
}

export function calcCogs(
  cogsLines: CogsLineItem[],
  revenueLines: RevenueLineItem[],
  monthIndex: number
): number {
  return cogsLines.reduce((sum, c) => {
    if (c.costBasis === "% of linked revenue") {
      let linkedRev: number;
      if (c.linkedRevenueLine === "All Revenue") {
        linkedRev = calcTotalRevenue(revenueLines, monthIndex);
      } else {
        const linked = revenueLines.find((r) => r.name === c.linkedRevenueLine);
        linkedRev = linked ? calcRevenueForMonth(linked, monthIndex) : 0;
      }
      return sum + (c.value / 100) * linkedRev;
    }
    // Fixed per unit sold OR Fixed per month → flat monthly SGD
    return sum + c.value;
  }, 0);
}

export function calcOpex(opexItems: OpexItem[], monthIndex: number): number {
  return opexItems.reduce((sum, o) => {
    const escalation = Math.pow(1 + o.annualEscalation / 100, monthIndex / 12);
    return sum + o.monthlyAmount * escalation;
  }, 0);
}

export function buildProjections(
  revenueLines: RevenueLineItem[],
  cogsLines: CogsLineItem[],
  opexItems: OpexItem[]
): MonthlyProjection[] {
  return Array.from({ length: 12 }, (_, m) => {
    const revenue = calcTotalRevenue(revenueLines, m);
    const cogs = calcCogs(cogsLines, revenueLines, m);
    const grossProfit = revenue - cogs;
    const opex = calcOpex(opexItems, m);
    const ebitda = grossProfit - opex;
    return { month: m + 1, revenue, cogs, grossProfit, opex, ebitda, netProfit: ebitda };
  });
}

export function findBreakevenMonth(projections: MonthlyProjection[]): number | null {
  const idx = projections.findIndex((p) => p.ebitda >= 0);
  return idx >= 0 ? idx + 1 : null;
}

export function fmtSGD(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-SG");
}

export function fmtPct(n: number): string {
  return n.toFixed(1) + "%";
}
