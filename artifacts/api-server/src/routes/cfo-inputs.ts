import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cfoInputsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/access-control";

const router: IRouter = Router();

router.get("/cfo-inputs", requireAuth, async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const inputs = await db
    .select()
    .from(cfoInputsTable)
    .where(eq(cfoInputsTable.userId, user.id))
    .orderBy(cfoInputsTable.period);
  res.json(inputs);
});

router.get("/cfo-inputs/:period", requireAuth, async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const period = Array.isArray(req.params.period) ? req.params.period[0] : req.params.period;

  const [input] = await db
    .select()
    .from(cfoInputsTable)
    .where(and(eq(cfoInputsTable.userId, user.id), eq(cfoInputsTable.period, period)));

  if (!input) {
    res.status(404).json({ error: "CFO inputs not found for this period" });
    return;
  }
  res.json(input);
});

router.post("/cfo-inputs", requireAuth, async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const {
    period,
    cashOnHand,
    totalCurrentAssets,
    totalCurrentLiabilities,
    totalInventory,
    receivableDays,
    payableDays,
    inventoryDays,
    totalDebt,
    totalEquity,
  } = req.body;

  if (!period) {
    res.status(400).json({ error: "period is required" });
    return;
  }

  const toStr = (v: unknown) => String(v ?? 0);

  const values = {
    userId: user.id,
    period,
    cashOnHand: toStr(cashOnHand),
    totalCurrentAssets: toStr(totalCurrentAssets),
    totalCurrentLiabilities: toStr(totalCurrentLiabilities),
    totalInventory: toStr(totalInventory),
    receivableDays: toStr(receivableDays),
    payableDays: toStr(payableDays),
    inventoryDays: toStr(inventoryDays),
    totalDebt: toStr(totalDebt),
    totalEquity: toStr(totalEquity),
  };

  const [existing] = await db
    .select()
    .from(cfoInputsTable)
    .where(and(eq(cfoInputsTable.userId, user.id), eq(cfoInputsTable.period, period)));

  if (existing) {
    const [updated] = await db
      .update(cfoInputsTable)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(cfoInputsTable.userId, user.id), eq(cfoInputsTable.period, period)))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(cfoInputsTable).values(values).returning();
    res.status(201).json(created);
  }
});

export default router;
