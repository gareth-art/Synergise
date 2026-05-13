import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CogsLineItem, CostBasis, makeDefaultCogsLine } from "./types";

interface Props {
  lines: CogsLineItem[];
  revenueLineNames: string[];
  onChange: (lines: CogsLineItem[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  maxLines: number;
}

function updateLine(lines: CogsLineItem[], id: string, patch: Partial<CogsLineItem>): CogsLineItem[] {
  return lines.map((l) => (l.id === id ? { ...l, ...patch } : l));
}

function valuePlaceholder(basis: CostBasis): string {
  if (basis === "% of linked revenue") return "e.g. 30";
  return "0";
}

function valueLabel(basis: CostBasis): string {
  if (basis === "% of linked revenue") return "Percentage (%)";
  if (basis === "Fixed per unit sold") return "Cost per unit (SGD)";
  return "Amount per month (SGD)";
}

export function CogsSection({ lines, revenueLineNames, onChange, isOpen, onToggle, maxLines }: Props) {
  const atMax = lines.length >= maxLines;

  const addLine = () => {
    if (atMax) return;
    onChange([...lines, makeDefaultCogsLine()]);
  };

  const removeLine = (id: string) => onChange(lines.filter((l) => l.id !== id));
  const patch = (id: string, p: Partial<CogsLineItem>) => onChange(updateLine(lines, id, p));

  const linkedOptions = ["All Revenue", ...revenueLineNames.filter(Boolean)];

  return (
    <Card className="border-synergise-border">
      <CardHeader className="py-4 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Section 2 — COGS / Variable Costs</CardTitle>
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
            <p className="text-sm text-synergise-text-muted py-2">No COGS lines yet. Add a line to track variable costs.</p>
          )}

          {lines.map((line, idx) => (
            <div key={line.id} className="rounded-lg border border-synergise-border bg-synergise-background p-4 space-y-3">
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
                    placeholder="e.g. Raw Materials"
                    value={line.name}
                    onChange={(e) => patch(line.id, { name: e.target.value })}
                    className="h-8 text-sm focus-visible:ring-synergise-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Cost Basis</Label>
                  <Select
                    value={line.costBasis}
                    onValueChange={(v) => patch(line.id, { costBasis: v as CostBasis })}
                  >
                    <SelectTrigger className="h-8 text-sm focus:ring-synergise-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="% of linked revenue">% of linked revenue</SelectItem>
                      <SelectItem value="Fixed per unit sold">Fixed per unit sold</SelectItem>
                      <SelectItem value="Fixed per month">Fixed per month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{valueLabel(line.costBasis)}</Label>
                  <Input
                    type="number"
                    min="0"
                    step={line.costBasis === "% of linked revenue" ? "0.5" : "100"}
                    placeholder={valuePlaceholder(line.costBasis)}
                    value={line.value || ""}
                    onChange={(e) => patch(line.id, { value: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-sm focus-visible:ring-synergise-primary"
                  />
                </div>

                {line.costBasis === "% of linked revenue" && (
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs">Linked Revenue Line</Label>
                    <Select
                      value={line.linkedRevenueLine}
                      onValueChange={(v) => patch(line.id, { linkedRevenueLine: v })}
                    >
                      <SelectTrigger className="h-8 text-sm focus:ring-synergise-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {linkedOptions.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
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
            Add COGS Line
            {atMax && <span className="ml-1.5 text-xs">(limit reached)</span>}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
