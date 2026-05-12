import { pgTable, text, serial, integer, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const managementAccountsTable = pgTable("management_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  period: text("period").notNull(),
  revenue: numeric("revenue").notNull(),
  cogs: numeric("cogs").notNull(),
  grossProfit: numeric("gross_profit").notNull(),
  grossMarginPct: numeric("gross_margin_pct").notNull(),
  operatingExpenses: jsonb("operating_expenses").notNull().default({}),
  ebitda: numeric("ebitda").notNull(),
  netProfit: numeric("net_profit").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertManagementAccountSchema = createInsertSchema(managementAccountsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertManagementAccount = z.infer<typeof insertManagementAccountSchema>;
export type ManagementAccount = typeof managementAccountsTable.$inferSelect;
