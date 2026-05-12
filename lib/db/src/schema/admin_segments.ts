import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminSegmentsTable = pgTable("admin_segments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  industry: text("industry").notNull(),
  region: text("region").notNull(),
  revenueStage: text("revenue_stage").notNull(),
  subscriptionTier: text("subscription_tier").notNull(),
  signupDate: timestamp("signup_date", { withTimezone: true }).defaultNow(),
});

export const insertAdminSegmentSchema = createInsertSchema(adminSegmentsTable).omit({
  id: true,
  signupDate: true,
});

export type InsertAdminSegment = z.infer<typeof insertAdminSegmentSchema>;
export type AdminSegment = typeof adminSegmentsTable.$inferSelect;
