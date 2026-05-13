import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/access-control";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/credits", requireAuth, async (req, res): Promise<void> => {
  const user = req.user as { id: number; aiCreditsRemaining: number; aiCreditsMonthlyAllowance: number; creditsResetDate: Date | null };
  res.json({
    aiCreditsRemaining: user.aiCreditsRemaining ?? 0,
    aiCreditsMonthlyAllowance: user.aiCreditsMonthlyAllowance ?? 0,
    creditsResetDate: user.creditsResetDate ?? null,
  });
});

router.post("/credits/topup", requireAuth, async (req, res): Promise<void> => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    res.json({ message: "Payment system coming soon" });
    return;
  }
  res.json({ message: "Stripe integration pending" });
});

export default router;
