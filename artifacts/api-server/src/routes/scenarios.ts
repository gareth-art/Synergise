import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, scenarioPlansTable } from "@workspace/db";
import { requireAuth, requireTier } from "../middlewares/access-control";

const router: IRouter = Router();

router.get("/scenarios", requireAuth, requireTier(["cfo-suite"]), async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const modelIdRaw = req.query.modelId;
  const modelId = modelIdRaw ? parseInt(String(modelIdRaw), 10) : undefined;

  const conditions = [eq(scenarioPlansTable.userId, user.id)];
  if (modelId && !isNaN(modelId)) {
    conditions.push(eq(scenarioPlansTable.financialModelId, modelId));
  }

  const scenarios = await db
    .select()
    .from(scenarioPlansTable)
    .where(and(...conditions))
    .orderBy(scenarioPlansTable.createdAt);

  res.json(scenarios);
});

router.post("/scenarios", requireAuth, requireTier(["cfo-suite"]), async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const { financialModelId, scenarioName, adjustments, outputs } = req.body;

  if (!financialModelId || !scenarioName) {
    res.status(400).json({ error: "financialModelId and scenarioName are required" });
    return;
  }

  const [scenario] = await db
    .insert(scenarioPlansTable)
    .values({
      userId: user.id,
      financialModelId: Number(financialModelId),
      scenarioName,
      adjustments: adjustments ?? {},
      outputs: outputs ?? {},
    })
    .returning();

  res.status(201).json(scenario);
});

router.delete("/scenarios/:id", requireAuth, requireTier(["cfo-suite"]), async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(scenarioPlansTable)
    .where(and(eq(scenarioPlansTable.id, id), eq(scenarioPlansTable.userId, user.id)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Scenario not found" });
    return;
  }

  res.json({ message: "Scenario deleted" });
});

export default router;
