import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const creditTopupsTable = pgTable("credit_topups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  creditsAdded: integer("credits_added").notNull(),
  amountPaid: numeric("amount_paid").notNull(),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCreditTopupSchema = createInsertSchema(creditTopupsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCreditTopup = z.infer<typeof insertCreditTopupSchema>;
export type CreditTopup = typeof creditTopupsTable.$inferSelect;
