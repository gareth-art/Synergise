import { Router, type IRouter } from "express";
import { db, adminSegmentsTable, usersTable, adminConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function requireAdmin(req: any, res: any, next: any): void {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = req.headers["x-admin-password"] as string | undefined;

  if (!adminPassword || authHeader !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.get("/admin/segments", requireAdmin, async (req, res): Promise<void> => {
  const segments = await db
    .select({
      id: adminSegmentsTable.id,
      userId: adminSegmentsTable.userId,
      industry: adminSegmentsTable.industry,
      region: adminSegmentsTable.region,
      revenueStage: adminSegmentsTable.revenueStage,
      subscriptionTier: adminSegmentsTable.subscriptionTier,
      signupDate: adminSegmentsTable.signupDate,
      fullName: usersTable.fullName,
      email: usersTable.email,
    })
    .from(adminSegmentsTable)
    .leftJoin(usersTable, eq(adminSegmentsTable.userId, usersTable.id))
    .orderBy(adminSegmentsTable.signupDate);

  const total = segments.length;
  const byIndustry: Record<string, number> = {};
  const byRegion: Record<string, number> = {};
  const byTier: Record<string, number> = {};

  for (const seg of segments) {
    byIndustry[seg.industry] = (byIndustry[seg.industry] || 0) + 1;
    byRegion[seg.region] = (byRegion[seg.region] || 0) + 1;
    byTier[seg.subscriptionTier] = (byTier[seg.subscriptionTier] || 0) + 1;
  }

  res.json({ segments, totals: { total, byIndustry, byRegion, byTier } });
});

router.get("/admin/config", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db.select().from(adminConfigTable).orderBy(adminConfigTable.key);
  res.json(rows);
});

router.patch("/admin/config/:key", requireAdmin, async (req, res): Promise<void> => {
  const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
  const { value } = req.body;

  if (typeof value !== "string" || value.trim() === "") {
    res.status(400).json({ error: "value is required" });
    return;
  }

  const [updated] = await db
    .update(adminConfigTable)
    .set({ value: value.trim(), updatedAt: new Date() })
    .where(eq(adminConfigTable.key, key))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Config key not found" });
    return;
  }

  res.json(updated);
});

export default router;
