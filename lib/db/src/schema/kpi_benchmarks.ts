import { pgTable, text, serial, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kpiBenchmarksTable = pgTable("kpi_benchmarks", {
  id: serial("id").primaryKey(),
  industry: text("industry").notNull(),
  region: text("region").notNull(),
  metric: text("metric").notNull(),
  p10: numeric("p10"),
  p25: numeric("p25"),
  p50: numeric("p50"),
  p75: numeric("p75"),
  p90: numeric("p90"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKpiBenchmarkSchema = createInsertSchema(kpiBenchmarksTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertKpiBenchmark = z.infer<typeof insertKpiBenchmarkSchema>;
export type KpiBenchmark = typeof kpiBenchmarksTable.$inferSelect;
