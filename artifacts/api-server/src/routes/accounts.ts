import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, managementAccountsTable } from "@workspace/db";
import { SaveAccountBody, DeleteAccountParams } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.get("/accounts", requireAuth, async (req, res): Promise<void> => {
  const user = req.user as { id: number };

  const accounts = await db
    .select()
    .from(managementAccountsTable)
    .where(eq(managementAccountsTable.userId, user.id))
    .orderBy(managementAccountsTable.period);

  res.json(accounts);
});

router.post("/accounts", requireAuth, async (req, res): Promise<void> => {
  const parsed = SaveAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.user as { id: number };
  const { period, revenue, cogs, operatingExpenses } = parsed.data;

  const grossProfit = revenue - cogs;
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const opex = operatingExpenses as Record<string, number>;
  const totalOpex = Object.values(opex).reduce((sum: number, v: number) => sum + (Number(v) || 0), 0);
  const ebitda = grossProfit - totalOpex;
  const netProfit = ebitda;

  const [account] = await db
    .insert(managementAccountsTable)
    .values({
      userId: user.id,
      period,
      revenue: String(revenue),
      cogs: String(cogs),
      grossProfit: String(grossProfit),
      grossMarginPct: String(Math.round(grossMarginPct * 100) / 100),
      operatingExpenses,
      ebitda: String(ebitda),
      netProfit: String(netProfit),
    })
    .returning();

  res.status(201).json(account);
});

router.delete("/accounts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = req.user as { id: number };

  const [deleted] = await db
    .delete(managementAccountsTable)
    .where(
      and(
        eq(managementAccountsTable.id, params.data.id),
        eq(managementAccountsTable.userId, user.id)
      )
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Account entry not found" });
    return;
  }

  res.json({ message: "Account entry deleted" });
});

export default router;
