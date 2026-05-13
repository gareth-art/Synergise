import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, unitEconomicsModelsTable } from "@workspace/db";
import { requireAuth, requireTier } from "../middlewares/access-control";

const router: IRouter = Router();

const allowedTiers = ["professional", "cfo-suite"];

router.get("/unit-economics", requireAuth, requireTier(allowedTiers), async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const models = await db
    .select()
    .from(unitEconomicsModelsTable)
    .where(eq(unitEconomicsModelsTable.userId, user.id))
    .orderBy(unitEconomicsModelsTable.createdAt);
  res.json(models);
});

router.post("/unit-economics", requireAuth, requireTier(allowedTiers), async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const { modelName, industry, revenuePerUnit, variableCostPerUnit, fixedCostsPerMonth, unitsPerMonth } = req.body;

  if (!modelName || revenuePerUnit == null || variableCostPerUnit == null || fixedCostsPerMonth == null || unitsPerMonth == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const rev = Number(revenuePerUnit);
  const vc = Number(variableCostPerUnit);
  const fc = Number(fixedCostsPerMonth);
  const units = Number(unitsPerMonth);

  if (rev <= 0) {
    res.status(400).json({ error: "revenuePerUnit must be greater than 0" });
    return;
  }

  const contributionMargin = rev - vc;
  const contributionMarginPct = (contributionMargin / rev) * 100;
  const breakEvenUnits = contributionMargin > 0 ? fc / contributionMargin : 0;
  const breakEvenRevenue = breakEvenUnits * rev;
  const safetyMarginPct = units > 0 ? ((units - breakEvenUnits) / units) * 100 : 0;
  const monthlyProfit = contributionMargin * units - fc;

  const toStr = (v: number) => String(Math.round(v * 100) / 100);

  const [model] = await db
    .insert(unitEconomicsModelsTable)
    .values({
      userId: user.id,
      modelName,
      industry: industry || "Other",
      revenuePerUnit: toStr(rev),
      variableCostPerUnit: toStr(vc),
      fixedCostsPerMonth: toStr(fc),
      unitsPerMonth: toStr(units),
      contributionMargin: toStr(contributionMargin),
      contributionMarginPct: toStr(contributionMarginPct),
      breakEvenUnits: toStr(breakEvenUnits),
      breakEvenRevenue: toStr(breakEvenRevenue),
      safetyMarginPct: toStr(safetyMarginPct),
      monthlyProfit: toStr(monthlyProfit),
    })
    .returning();

  res.status(201).json(model);
});

router.delete("/unit-economics/:id", requireAuth, requireTier(allowedTiers), async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(unitEconomicsModelsTable)
    .where(and(eq(unitEconomicsModelsTable.id, id), eq(unitEconomicsModelsTable.userId, user.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  res.json({ message: "Model deleted" });
});

export default router;
