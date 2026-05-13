import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { financialModelsTable } from "./financial_models";

export const scenarioPlansTable = pgTable("scenario_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  financialModelId: integer("financial_model_id").notNull().references(() => financialModelsTable.id),
  scenarioName: text("scenario_name").notNull(),
  adjustments: jsonb("adjustments").notNull().default({}),
  outputs: jsonb("outputs").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScenarioPlanSchema = createInsertSchema(scenarioPlansTable).omit({
  id: true,
  createdAt: true,
});

export type InsertScenarioPlan = z.infer<typeof insertScenarioPlanSchema>;
export type ScenarioPlan = typeof scenarioPlansTable.$inferSelect;
