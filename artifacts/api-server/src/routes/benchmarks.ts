import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, kpiBenchmarksTable } from "@workspace/db";
import { GetBenchmarksQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/benchmarks", async (req, res): Promise<void> => {
  const parsed = GetBenchmarksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { industry, region } = parsed.data;

  const conditions = [eq(kpiBenchmarksTable.industry, industry)];
  if (region) {
    conditions.push(eq(kpiBenchmarksTable.region, region));
  }

  const benchmarks = await db
    .select()
    .from(kpiBenchmarksTable)
    .where(conditions.length === 1 ? conditions[0] : and(...conditions));

  // If no region-specific data, fall back to all benchmarks for that industry
  if (benchmarks.length === 0 && region) {
    const fallback = await db
      .select()
      .from(kpiBenchmarksTable)
      .where(eq(kpiBenchmarksTable.industry, industry));
    res.json(fallback);
    return;
  }

  res.json(benchmarks);
});

export default router;
