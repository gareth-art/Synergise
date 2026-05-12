import { Router, type IRouter } from "express";
import { db, adminSegmentsTable, usersTable } from "@workspace/db";
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
  // Get all segments joined with user data
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

  // Compute totals
  const total = segments.length;
  const byIndustry: Record<string, number> = {};
  const byRegion: Record<string, number> = {};
  const byTier: Record<string, number> = {};

  for (const seg of segments) {
    byIndustry[seg.industry] = (byIndustry[seg.industry] || 0) + 1;
    byRegion[seg.region] = (byRegion[seg.region] || 0) + 1;
    byTier[seg.subscriptionTier] = (byTier[seg.subscriptionTier] || 0) + 1;
  }

  res.json({
    segments,
    totals: { total, byIndustry, byRegion, byTier },
  });
});

export default router;
