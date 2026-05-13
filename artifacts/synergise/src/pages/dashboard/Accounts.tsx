import { useState } from "react";
import { format } from "date-fns";
import { 
  useGetAccounts, 
  useSaveAccount, 
  useDeleteAccount,
  getGetAccountsQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, TrendingUp, TrendingDown, DollarSign, Loader2, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

export default function Accounts() {
  const { data: accounts, isLoading } = useGetAccounts();
  const saveAccountMutation = useSaveAccount();
  const deleteAccountMutation = useDeleteAccount();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));
  const [revenue, setRevenue] = useState("");
  const [cogs, setCogs] = useState("");
  const [salaries, setSalaries] = useState("");
  const [marketing, setMarketing] = useState("");
  const [rent, setRent] = useState("");
  const [otherOpex, setOtherOpex] = useState("");

  const numRev = parseFloat(revenue) || 0;
  const numCogs = parseFloat(cogs) || 0;
  const numSalaries = parseFloat(salaries) || 0;
  const numMarketing = parseFloat(marketing) || 0;
  const numRent = parseFloat(rent) || 0;
  const numOtherOpex = parseFloat(otherOpex) || 0;

  const grossProfit = numRev - numCogs;
  const grossMargin = numRev > 0 ? (grossProfit / numRev) * 100 : 0;
  const totalOpex = numSalaries + numMarketing + numRent + numOtherOpex;
  const ebitda = grossProfit - totalOpex;
  const ebitdaMargin = numRev > 0 ? (ebitda / numRev) * 100 : 0;

  const handleSave = () => {
    if (!period) return;
    
    saveAccountMutation.mutate({
      data: {
        period,
        revenue: numRev,
        cogs: numCogs,
        operatingExpenses: {
          salaries: numSalaries,
          marketing: numMarketing,
          rent: numRent,
          other: numOtherOpex
        }
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
        toast({ title: "Account entry saved" });
        // Optional: clear form
      },
      onError: () => {
        toast({ title: "Failed to save entry", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteAccountMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAccountsQueryKey() });
        toast({ title: "Entry deleted" });
      }
    });
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', maximumFractionDigits: 0 }).format(num || 0);
  };

  const formatPercent = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `${(num || 0).toFixed(1)}%`;
  };

  // Prepare chart data (sort chronological)
  const chartData = [...(accounts || [])].sort((a, b) => a.period.localeCompare(b.period)).map(acc => ({
    name: acc.period,
    Revenue: parseFloat(acc.revenue),
    "Gross Profit": parseFloat(acc.grossProfit),
    EBITDA: parseFloat(acc.ebitda)
  }));

  const latestAcc = accounts && accounts.length > 0 ? accounts[0] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-sm text-synergise-text-muted">
          <Link href="/dashboard" className="hover:text-synergise-primary">Dashboard</Link>
          <span className="mx-2">/</span>
          <span className="text-synergise-text font-medium">Management Accounts</span>
        </nav>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Management Accounts</h1>
          <p className="text-synergise-text-muted mt-2">
            Enter monthly revenue, COGS and operating expenses — we calculate gross profit, EBITDA and trends automatically.
          </p>
        </div>

        {/* Latest Summary Cards */}
        {latestAcc && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-synergise-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-synergise-text-muted">Latest Revenue ({latestAcc.period})</CardTitle>
                <DollarSign className="h-4 w-4 text-synergise-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-synergise-text">{formatCurrency(latestAcc.revenue)}</div>
              </CardContent>
            </Card>
            <Card className="border-synergise-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-synergise-text-muted">Gross Margin</CardTitle>
                <TrendingUp className="h-4 w-4 text-synergise-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-synergise-text">{formatPercent(latestAcc.grossMarginPct)}</div>
              </CardContent>
            </Card>
            <Card className="border-synergise-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-synergise-text-muted">EBITDA</CardTitle>
                <TrendingDown className="h-4 w-4 text-synergise-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-synergise-text">{formatCurrency(latestAcc.ebitda)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-12">
          {/* Input Form */}
          <Card className="md:col-span-4 border-synergise-border h-fit">
            <CardHeader>
              <CardTitle className="text-xl">Add Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Period (YYYY-MM)</Label>
                <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
              </div>
              
              <div className="pt-4 border-t border-synergise-border">
                <h4 className="font-semibold text-sm mb-3">Revenue & Direct Costs</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Revenue (SGD)</Label>
                    <Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">COGS (SGD)</Label>
                    <Input type="number" value={cogs} onChange={(e) => setCogs(e.target.value)} />
                  </div>
                  <div className="flex justify-between text-sm py-2 px-3 bg-synergise-background rounded">
                    <span>GP: <span className="font-semibold">{formatCurrency(grossProfit)}</span></span>
                    <span>Margin: <span className="font-semibold">{grossMargin.toFixed(1)}%</span></span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-synergise-border">
                <h4 className="font-semibold text-sm mb-3">Operating Expenses</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Salaries</Label>
                    <Input type="number" value={salaries} onChange={(e) => setSalaries(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Marketing</Label>
                    <Input type="number" value={marketing} onChange={(e) => setMarketing(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rent/Facilities</Label>
                    <Input type="number" value={rent} onChange={(e) => setRent(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Other</Label>
                    <Input type="number" value={otherOpex} onChange={(e) => setOtherOpex(e.target.value)} />
                  </div>
                  <div className="flex justify-between text-sm py-2 px-3 bg-synergise-background rounded">
                    <span>EBITDA: <span className="font-semibold">{formatCurrency(ebitda)}</span></span>
                    <span>Margin: <span className="font-semibold">{ebitdaMargin.toFixed(1)}%</span></span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-synergise-primary hover:bg-synergise-primary-dark text-white mt-4"
                disabled={saveAccountMutation.isPending}
              >
                {saveAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saveAccountMutation.isPending ? "Saving…" : "Save Month"}
              </Button>
            </CardContent>
          </Card>

          {/* Chart and Table */}
          <div className="md:col-span-8 space-y-6">
            <Card className="border-synergise-border">
              <CardHeader>
                <CardTitle className="text-xl">Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                          tickFormatter={(val) => `$${val/1000}k`}
                        />
                        <RechartsTooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line type="monotone" dataKey="Revenue" stroke="#0D7377" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Gross Profit" stroke="#14FFEC" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="EBITDA" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-synergise-accent text-synergise-primary">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-synergise-primary">Add data to see trends</p>
                      <p className="text-xs text-synergise-text-muted">Save at least one month to plot revenue, GP and EBITDA.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-synergise-border">
              <CardHeader>
                <CardTitle className="text-xl">History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2 py-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">GP %</TableHead>
                          <TableHead className="text-right">EBITDA</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts?.map((acc) => (
                          <TableRow key={acc.id}>
                            <TableCell className="font-medium">{acc.period}</TableCell>
                            <TableCell className="text-right">{formatCurrency(acc.revenue)}</TableCell>
                            <TableCell className="text-right">{formatPercent(acc.grossMarginPct)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(acc.ebitda)}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(acc.id)}
                                className="text-synergise-text-muted hover:text-synergise-error"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!accounts || accounts.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="py-10">
                              <div className="flex flex-col items-center gap-2 text-center">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-synergise-accent text-synergise-primary">
                                  <BookOpen className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-medium text-synergise-primary">No entries yet</p>
                                <p className="text-xs text-synergise-text-muted">
                                  Add your first month using the form on the left to start tracking trends.
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
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
