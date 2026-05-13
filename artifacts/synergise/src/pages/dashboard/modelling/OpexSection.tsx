import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpexItem } from "./types";

interface Props {
  items: OpexItem[];
  onChange: (items: OpexItem[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  locked: boolean;
}

function patchItem(items: OpexItem[], key: string, patch: Partial<OpexItem>): OpexItem[] {
  return items.map((it) => (it.key === key ? { ...it, ...patch } : it));
}

function OpexRow({ item, onChange }: { item: OpexItem; onChange: (patch: Partial<OpexItem>) => void }) {
  const displayLabel = item.key === "other" && item.customLabel ? item.customLabel : item.label;
  return (
    <div className="grid gap-2 md:grid-cols-12 items-end py-2 border-b border-synergise-border last:border-0">
      <div className="md:col-span-5 space-y-1">
        <Label className="text-xs text-synergise-text-muted">
          {item.key === "other" ? "Custom label" : displayLabel}
        </Label>
        {item.key === "other" ? (
          <Input
            placeholder="Describe this expense…"
            value={item.customLabel}
            onChange={(e) => onChange({ customLabel: e.target.value })}
            className="h-8 text-sm focus-visible:ring-synergise-primary"
          />
        ) : (
          <div className="h-8 flex items-center text-sm font-medium text-synergise-text">{displayLabel}</div>
        )}
      </div>
      <div className="md:col-span-4 space-y-1">
        <Label className="text-xs text-synergise-text-muted">Monthly (SGD)</Label>
        <Input
          type="number"
          min="0"
          step="100"
          placeholder="0"
          value={item.monthlyAmount || ""}
          onChange={(e) => onChange({ monthlyAmount: parseFloat(e.target.value) || 0 })}
          className="h-8 text-sm focus-visible:ring-synergise-primary"
        />
      </div>
      <div className="md:col-span-3 space-y-1">
        <Label className="text-xs text-synergise-text-muted">Annual escalation %</Label>
        <Input
          type="number"
          min="0"
          max="50"
          step="0.5"
          placeholder="0"
          value={item.annualEscalation || ""}
          onChange={(e) => onChange({ annualEscalation: parseFloat(e.target.value) || 0 })}
          className="h-8 text-sm focus-visible:ring-synergise-primary"
        />
      </div>
    </div>
  );
}

export function OpexSection({ items, onChange, isOpen, onToggle, locked }: Props) {
  const totalMonthly = items.reduce((s, i) => s + i.monthlyAmount, 0);

  return (
    <Card className="border-synergise-border">
      <CardHeader className="py-4 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Section 3 — Fixed Operating Expenses</CardTitle>
            {locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">
                <Lock className="h-3 w-3" />Professional+
              </span>
            )}
            {!locked && totalMonthly > 0 && (
              <span className="text-xs text-synergise-text-muted font-medium">
                ${Math.round(totalMonthly).toLocaleString("en-SG")}/mo total
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-synergise-text-muted" /> : <ChevronDown className="h-4 w-4 text-synergise-text-muted" />}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0">
          {locked ? (
            <div className="relative">
              {/* Blurred preview */}
              <div className="pointer-events-none select-none blur-sm opacity-50 space-y-1">
                {items.map((it) => (
                  <div key={it.key} className="grid grid-cols-3 gap-4 py-2 border-b border-synergise-border">
                    <div className="h-8 rounded bg-synergise-background" />
                    <div className="h-8 rounded bg-synergise-background" />
                    <div className="h-8 rounded bg-synergise-background" />
                  </div>
                ))}
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl border border-synergise-border bg-white shadow-md px-6 py-5 text-center space-y-3 max-w-sm">
                  <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-synergise-accent text-synergise-primary">
                    <Lock className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-synergise-text">Upgrade to add detailed operating expenses</p>
                  <p className="text-xs text-synergise-text-muted">
                    Track rent, salaries, marketing and more with annual escalation — available on Professional and CFO Suite.
                  </p>
                  <Button asChild size="sm" className="bg-synergise-primary hover:bg-synergise-primary-dark">
                    <Link href="/dashboard/settings#subscription">Upgrade to Professional</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {items.map((item) => (
                <OpexRow
                  key={item.key}
                  item={item}
                  onChange={(patch) => onChange(patchItem(items, item.key, patch))}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
