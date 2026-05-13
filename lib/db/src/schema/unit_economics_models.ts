import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const unitEconomicsModelsTable = pgTable("unit_economics_models", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  modelName: text("model_name").notNull(),
  industry: text("industry").notNull(),
  revenuePerUnit: numeric("revenue_per_unit").notNull(),
  variableCostPerUnit: numeric("variable_cost_per_unit").notNull(),
  fixedCostsPerMonth: numeric("fixed_costs_per_month").notNull(),
  unitsPerMonth: numeric("units_per_month").notNull(),
  contributionMargin: numeric("contribution_margin").notNull(),
  contributionMarginPct: numeric("contribution_margin_pct").notNull(),
  breakEvenUnits: numeric("break_even_units").notNull(),
  breakEvenRevenue: numeric("break_even_revenue").notNull(),
  safetyMarginPct: numeric("safety_margin_pct").notNull(),
  monthlyProfit: numeric("monthly_profit").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUnitEconomicsModelSchema = createInsertSchema(unitEconomicsModelsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertUnitEconomicsModel = z.infer<typeof insertUnitEconomicsModelSchema>;
export type UnitEconomicsModel = typeof unitEconomicsModelsTable.$inferSelect;
