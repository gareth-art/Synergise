import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, onboardingProfilesTable, adminSegmentsTable, usersTable } from "@workspace/db";
import { SaveOnboardingBody } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.get("/onboarding", requireAuth, async (req, res): Promise<void> => {
  const user = req.user as { id: number };

  const [profile] = await db
    .select()
    .from(onboardingProfilesTable)
    .where(eq(onboardingProfilesTable.userId, user.id));

  if (!profile) {
    res.status(404).json({ error: "Onboarding profile not found" });
    return;
  }

  res.json(profile);
});

router.post("/onboarding", requireAuth, async (req, res): Promise<void> => {
  const parsed = SaveOnboardingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = req.user as { id: number; subscriptionTier: string };

  const { businessName, industry, region, revenueStage } = parsed.data;

  // Check if profile already exists
  const [existing] = await db
    .select()
    .from(onboardingProfilesTable)
    .where(eq(onboardingProfilesTable.userId, user.id));

  let profile;
  if (existing) {
    [profile] = await db
      .update(onboardingProfilesTable)
      .set({ businessName, industry, region, revenueStage })
      .where(eq(onboardingProfilesTable.userId, user.id))
      .returning();
  } else {
    [profile] = await db
      .insert(onboardingProfilesTable)
      .values({
        userId: user.id,
        businessName,
        industry,
        region,
        revenueStage,
      })
      .returning();

    // Also save to admin_segments on first onboarding
    await db.insert(adminSegmentsTable).values({
      userId: user.id,
      industry,
      region,
      revenueStage,
      subscriptionTier: user.subscriptionTier,
    }).onConflictDoNothing();
  }

  res.status(201).json(profile);
});

export default router;
