import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, financialModelsTable } from "@workspace/db";
import { CreateModelBody, DeleteModelParams } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.get("/models", requireAuth, async (req, res): Promise<void> => {
  const user = req.user as { id: number };

  const models = await db
    .select()
    .from(financialModelsTable)
    .where(eq(financialModelsTable.userId, user.id))
    .orderBy(financialModelsTable.createdAt);

  res.json(models);
});

router.post("/models", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateModelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.user as { id: number };

  const [model] = await db
    .insert(financialModelsTable)
    .values({
      userId: user.id,
      industry: parsed.data.industry,
      modelName: parsed.data.modelName,
      inputs: parsed.data.inputs,
      outputs: parsed.data.outputs,
    })
    .returning();

  res.status(201).json(model);
});

router.delete("/models/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteModelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const user = req.user as { id: number };

  const [deleted] = await db
    .delete(financialModelsTable)
    .where(
      and(
        eq(financialModelsTable.id, params.data.id),
        eq(financialModelsTable.userId, user.id)
      )
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Model not found" });
    return;
  }

  res.json({ message: "Model deleted" });
});

// ─── New financial-model routes (structured multi-section builder) ────────────

router.get("/financial-model/list", requireAuth, async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const models = await db
    .select()
    .from(financialModelsTable)
    .where(eq(financialModelsTable.userId, user.id))
    .orderBy(desc(financialModelsTable.createdAt));
  res.json(models);
});

router.post("/financial-model/save", requireAuth, async (req, res): Promise<void> => {
  const user = req.user as { id: number };
  const { modelName, industry, modelData, outputSnapshot } = req.body;

  if (!modelName || typeof modelName !== "string" || !modelData) {
    res.status(400).json({ error: "modelName and modelData are required" });
    return;
  }

  const [model] = await db
    .insert(financialModelsTable)
    .values({
      userId: user.id,
      industry: typeof industry === "string" ? industry : "Other",
      modelName: modelName.trim(),
      inputs: modelData,
      outputs: outputSnapshot ?? {},
    })
    .returning();

  res.status(201).json(model);
});

router.delete("/financial-model/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const user = req.user as { id: number };

  const [deleted] = await db
    .delete(financialModelsTable)
    .where(
      and(
        eq(financialModelsTable.id, id),
        eq(financialModelsTable.userId, user.id)
      )
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ message: "Deleted" });
});

export default router;
