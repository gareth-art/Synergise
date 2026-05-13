import { ChevronDown, ChevronUp, Loader2, Zap, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MonthlyProjection, fmtSGD, fmtPct } from "./calculations";
import { MONTHS } from "./types";

interface Props {
  projections: MonthlyProjection[];
  tier: string;
  isOpen: boolean;
  onToggle: () => void;
  breakevenMonth: number | null;
  onAiInsight: () => void;
  aiLoading: boolean;
  aiInsight: string | null;
  credits: number;
  aiModelLabel: string;
}

function SummaryCard({
  label,
  value,
  sub,
  variant,
}: {
  label: string;
  value: string;
  sub?: string;
  variant?: "positive" | "negative" | "neutral";
}) {
  const textColor =
    variant === "positive" ? "text-green-600" : variant === "negative" ? "text-red-600" : "text-synergise-text";

  return (
    <div className="rounded-lg border border-synergise-border bg-white p-4">
      <p className="text-xs text-synergise-text-muted mb-1">{label}</p>
      <p className={`text-xl font-bold ${textColor}`}>{value}</p>
      {sub && <p className="text-xs text-synergise-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export function OutputsSection({
  projections,
  tier,
  isOpen,
  onToggle,
  breakevenMonth,
  onAiInsight,
  aiLoading,
  aiInsight,
  credits,
  aiModelLabel,
}: Props) {
  const isPaid = tier === "professional" || tier === "cfo-suite";
  const isCfo = tier === "cfo-suite";
  const m0 = projections[0];

  const grossMarginPct = m0.revenue > 0 ? (m0.grossProfit / m0.revenue) * 100 : 0;
  const netMarginPct = m0.revenue > 0 ? (m0.ebitda / m0.revenue) * 100 : 0;
  const cashBurn = m0.ebitda < 0 ? -m0.ebitda : 0;

  const chartData = projections.map((p, i) => ({
    month: MONTHS[i],
    Revenue: Math.round(p.revenue),
    EBITDA: Math.round(p.ebitda),
  }));

  return (
    <Card className="border-synergise-border">
      <CardHeader className="py-4 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Section 4 — Real-Time Outputs</CardTitle>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
              m0.ebitda >= 0
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              {m0.ebitda >= 0 ? "Profitable" : "Loss-making"} Month 1
            </span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-synergise-text-muted" /> : <ChevronDown className="h-4 w-4 text-synergise-text-muted" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-6 pt-0">
          {/* All-tier summary cards */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-synergise-text-muted mb-3">Month 1 Snapshot</p>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
              <SummaryCard label="Revenue" value={fmtSGD(m0.revenue)} />
              <SummaryCard
                label="Gross Profit"
                value={fmtSGD(m0.grossProfit)}
                variant={m0.grossProfit >= 0 ? "positive" : "negative"}
              />
              <SummaryCard
                label="Gross Margin %"
                value={fmtPct(grossMarginPct)}
                variant={grossMarginPct >= 0 ? "positive" : "negative"}
              />
              <SummaryCard
                label="EBITDA"
                value={fmtSGD(m0.ebitda)}
                variant={m0.ebitda >= 0 ? "positive" : "negative"}
              />
              <SummaryCard
                label="Net Margin %"
                value={fmtPct(netMarginPct)}
                sub={cashBurn > 0 ? `Burn: ${fmtSGD(cashBurn)}/mo` : undefined}
                variant={netMarginPct >= 0 ? "positive" : "negative"}
              />
            </div>
          </div>

          {/* Professional+ — P&L table + break-even */}
          {isPaid && (
            <>
              {/* Break-even banner */}
              {breakevenMonth !== null ? (
                <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <p className="text-sm text-green-700 font-medium">
                    Your model reaches EBITDA break-even in Month {breakevenMonth}{" "}
                    <span className="font-normal text-green-600">({MONTHS[breakevenMonth - 1]})</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-700 font-medium">
                    Model does not reach break-even within 12 months — review cost structure
                  </p>
                </div>
              )}

              {/* 12-month P&L table */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-synergise-text-muted mb-3">
                  12-Month Projected P&L
                </p>
                <div className="overflow-x-auto rounded-lg border border-synergise-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-synergise-background">
                        <TableHead className="text-xs font-semibold">Month</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Revenue</TableHead>
                        <TableHead className="text-xs font-semibold text-right">COGS</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Gross Profit</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Opex</TableHead>
                        <TableHead className="text-xs font-semibold text-right">EBITDA</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Net Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projections.map((p, i) => (
                        <TableRow
                          key={p.month}
                          className={
                            breakevenMonth === p.month
                              ? "bg-green-50 border-l-2 border-l-green-500"
                              : p.ebitda < 0
                              ? "bg-red-50/30"
                              : ""
                          }
                        >
                          <TableCell className="text-xs font-medium">
                            {MONTHS[i]}
                            {breakevenMonth === p.month && (
                              <span className="ml-1.5 text-[10px] text-green-600 font-semibold">BEP</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-right">{fmtSGD(p.revenue)}</TableCell>
                          <TableCell className="text-xs text-right text-red-600">{fmtSGD(p.cogs)}</TableCell>
                          <TableCell className={`text-xs text-right font-medium ${p.grossProfit >= 0 ? "text-green-700" : "text-red-600"}`}>
                            {fmtSGD(p.grossProfit)}
                          </TableCell>
                          <TableCell className="text-xs text-right text-red-600">{fmtSGD(p.opex)}</TableCell>
                          <TableCell className={`text-xs text-right font-bold ${p.ebitda >= 0 ? "text-green-700" : "text-red-600"}`}>
                            {fmtSGD(p.ebitda)}
                          </TableCell>
                          <TableCell className={`text-xs text-right font-medium ${p.netProfit >= 0 ? "text-green-700" : "text-red-600"}`}>
                            {fmtSGD(p.netProfit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {/* CFO Suite — chart + AI insight */}
          {isCfo && (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-synergise-text-muted mb-3">
                  Revenue vs EBITDA (12 months)
                </p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) =>
                          Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`
                        }
                      />
                      <Tooltip
                        formatter={(v: number, name: string) => [fmtSGD(v), name]}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="Revenue" stroke="#0D7377" strokeWidth={2} dot={{ r: 3 }} />
                      <Line
                        type="monotone"
                        dataKey="EBITDA"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        strokeDasharray={projections.some((p) => p.ebitda < 0) ? "5 3" : undefined}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Insight */}
              <div className="rounded-lg border border-synergise-border p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-synergise-primary" />
                      <h3 className="text-sm font-semibold">AI Financial Insight</h3>
                    </div>
                    <p className="text-xs text-synergise-text-muted mt-0.5">
                      Break-even trajectory · biggest cost driver · one lever to improve EBITDA · powered by Claude {aiModelLabel} · 1 credit
                    </p>
                  </div>
                  {credits >= 1 ? (
                    <Button
                      size="sm"
                      onClick={onAiInsight}
                      disabled={aiLoading}
                      className="bg-synergise-primary hover:bg-synergise-primary-dark shrink-0"
                    >
                      {aiLoading ? (
                        <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Analysing…</>
                      ) : (
                        <><Zap className="mr-2 h-3.5 w-3.5" />Generate Insight (1 credit)</>
                      )}
                    </Button>
                  ) : (
                    <p className="text-xs text-amber-600 shrink-0">
                      No credits —{" "}
                      <Link href="/dashboard/settings#credits" className="underline">Top up</Link>
                    </p>
                  )}
                </div>
                {aiInsight && (
                  <div className="rounded-lg bg-synergise-accent/60 border border-synergise-primary/15 p-4 text-sm text-synergise-text whitespace-pre-line leading-relaxed">
                    {aiInsight}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Non-paid upgrade prompts for P&L table */}
          {!isPaid && (
            <div className="rounded-lg border border-synergise-border bg-synergise-background p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-synergise-text">12-month P&L table & break-even analysis</p>
                <p className="text-xs text-synergise-text-muted mt-0.5">Upgrade to Professional to unlock month-by-month projections and break-even tracking.</p>
              </div>
              <Button asChild size="sm" className="bg-synergise-primary hover:bg-synergise-primary-dark shrink-0">
                <Link href="/dashboard/settings#subscription">Upgrade</Link>
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
