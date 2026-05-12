import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const onboardingProfilesTable = pgTable("onboarding_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  businessName: text("business_name").notNull(),
  industry: text("industry").notNull(),
  region: text("region").notNull(),
  revenueStage: text("revenue_stage").notNull(),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }).defaultNow(),
});

export const insertOnboardingProfileSchema = createInsertSchema(onboardingProfilesTable).omit({
  id: true,
  onboardingCompletedAt: true,
});

export type InsertOnboardingProfile = z.infer<typeof insertOnboardingProfileSchema>;
export type OnboardingProfile = typeof onboardingProfilesTable.$inferSelect;
