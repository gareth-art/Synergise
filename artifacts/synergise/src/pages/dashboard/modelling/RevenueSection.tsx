import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevenueLineItem, RevenueType, MONTHS, makeDefaultRevenueLine } from "./types";

interface Props {
  lines: RevenueLineItem[];
  onChange: (lines: RevenueLineItem[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  maxLines: number;
  canSeasonality: boolean;
}

function updateLine(lines: RevenueLineItem[], id: string, patch: Partial<RevenueLineItem>): RevenueLineItem[] {
  return lines.map((l) => (l.id === id ? { ...l, ...patch } : l));
}

export function RevenueSection({ lines, onChange, isOpen, onToggle, maxLines, canSeasonality }: Props) {
  const atMax = lines.length >= maxLines;

  const addLine = () => {
    if (atMax) return;
    onChange([...lines, makeDefaultRevenueLine()]);
  };

  const removeLine = (id: string) => {
    onChange(lines.filter((l) => l.id !== id));
  };

  const patch = (id: string, p: Partial<RevenueLineItem>) => onChange(updateLine(lines, id, p));

  const setMultiplier = (id: string, monthIdx: number, val: number) => {
    const line = lines.find((l) => l.id === id);
    if (!line) return;
    const updated = [...line.monthlyMultipliers];
    updated[monthIdx] = Math.round(val * 10) / 10;
    patch(id, { monthlyMultipliers: updated });
  };

  return (
    <Card className="border-synergise-border">
      <CardHeader className="py-4 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Section 1 — Revenue Builder</CardTitle>
            <Badge variant="outline" className="text-xs text-synergise-primary border-synergise-primary/30">
              {lines.length} line{lines.length !== 1 ? "s" : ""}
            </Badge>
            {maxLines < Infinity && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                {maxLines - lines.length} remaining
              </Badge>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-synergise-text-muted" /> : <ChevronDown className="h-4 w-4 text-synergise-text-muted" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-5 pt-0">
          {lines.length === 0 && (
            <p className="text-sm text-synergise-text-muted py-2">
              No revenue lines yet. Add a line to start modelling.
            </p>
          )}

          {lines.map((line, idx) => (
            <div key={line.id} className="rounded-lg border border-synergise-border bg-synergise-background p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-synergise-text-muted">Line {idx + 1}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-synergise-text-muted hover:text-red-500"
                  onClick={() => removeLine(line.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    placeholder="e.g. Retainer Clients"
                    value={line.name}
                    onChange={(e) => patch(line.id, { name: e.target.value })}
                    className="h-8 text-sm focus-visible:ring-synergise-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly Base Amount (SGD)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="0"
                    value={line.monthlyBase || ""}
                    onChange={(e) => patch(line.id, { monthlyBase: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-sm focus-visible:ring-synergise-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly Growth Rate %</Label>
                  <Input
                    type="number"
                    min="-50"
                    max="100"
                    step="0.5"
                    placeholder="0"
                    value={line.growthRate || ""}
                    onChange={(e) => patch(line.id, { growthRate: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-sm focus-visible:ring-synergise-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Revenue Type</Label>
                  <Select
                    value={line.revenueType}
                    onValueChange={(v) => patch(line.id, { revenueType: v as RevenueType })}
                  >
                    <SelectTrigger className="h-8 text-sm focus:ring-synergise-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Recurring">Recurring</SelectItem>
                      <SelectItem value="One-time">One-time</SelectItem>
                      <SelectItem value="Project-based">Project-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {canSeasonality && (
                  <div className="flex items-center gap-2 self-end pb-1">
                    <input
                      type="checkbox"
                      id={`season-${line.id}`}
                      checked={line.seasonalityEnabled}
                      onChange={(e) => patch(line.id, { seasonalityEnabled: e.target.checked })}
                      className="accent-synergise-primary h-4 w-4 cursor-pointer"
                    />
                    <Label htmlFor={`season-${line.id}`} className="text-xs cursor-pointer">
                      Enable seasonality
                    </Label>
                  </div>
                )}

                {!canSeasonality && (
                  <div className="flex items-center gap-2 self-end pb-1 opacity-50">
                    <input type="checkbox" disabled className="h-4 w-4" />
                    <Label className="text-xs text-synergise-text-muted">Seasonality (Professional+)</Label>
                  </div>
                )}
              </div>

              {line.seasonalityEnabled && canSeasonality && (
                <div className="space-y-2">
                  <Label className="text-xs text-synergise-text-muted">Monthly Multipliers (1.0 = no change)</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-x-3 gap-y-3">
                    {MONTHS.map((mo, mi) => (
                      <div key={mo} className="space-y-1">
                        <div className="flex justify-between text-[10px] text-synergise-text-muted">
                          <span>{mo}</span>
                          <span className="font-medium text-synergise-primary">{line.monthlyMultipliers[mi].toFixed(1)}×</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={line.monthlyMultipliers[mi]}
                          onChange={(e) => setMultiplier(line.id, mi, parseFloat(e.target.value))}
                          className="w-full h-1.5 accent-synergise-primary cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addLine}
            disabled={atMax}
            className="border-synergise-primary text-synergise-primary hover:bg-synergise-accent disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Revenue Line
            {atMax && <span className="ml-1.5 text-xs">(limit reached)</span>}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
