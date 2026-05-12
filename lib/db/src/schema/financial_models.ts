import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const financialModelsTable = pgTable("financial_models", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  industry: text("industry").notNull(),
  modelName: text("model_name").notNull(),
  inputs: jsonb("inputs").notNull().default({}),
  outputs: jsonb("outputs").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertFinancialModelSchema = createInsertSchema(financialModelsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFinancialModel = z.infer<typeof insertFinancialModelSchema>;
export type FinancialModel = typeof financialModelsTable.$inferSelect;
