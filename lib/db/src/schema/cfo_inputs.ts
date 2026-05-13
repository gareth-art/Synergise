import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const cfoInputsTable = pgTable("cfo_inputs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  period: text("period").notNull(),
  cashOnHand: numeric("cash_on_hand").notNull().default("0"),
  totalCurrentAssets: numeric("total_current_assets").notNull().default("0"),
  totalCurrentLiabilities: numeric("total_current_liabilities").notNull().default("0"),
  totalInventory: numeric("total_inventory").notNull().default("0"),
  receivableDays: numeric("receivable_days").notNull().default("0"),
  payableDays: numeric("payable_days").notNull().default("0"),
  inventoryDays: numeric("inventory_days").notNull().default("0"),
  totalDebt: numeric("total_debt").notNull().default("0"),
  totalEquity: numeric("total_equity").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCfoInputSchema = createInsertSchema(cfoInputsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCfoInput = z.infer<typeof insertCfoInputSchema>;
export type CfoInput = typeof cfoInputsTable.$inferSelect;
