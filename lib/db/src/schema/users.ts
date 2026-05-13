import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  subscriptionTier: text("subscription_tier").notNull().default("trial"),
  trialStartDate: timestamp("trial_start_date", { withTimezone: true }).defaultNow(),
  aiCreditsRemaining: integer("ai_credits_remaining").notNull().default(0),
  aiCreditsMonthlyAllowance: integer("ai_credits_monthly_allowance").notNull().default(0),
  creditsResetDate: timestamp("credits_reset_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  trialStartDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
