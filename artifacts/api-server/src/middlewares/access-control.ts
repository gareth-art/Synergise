import { db } from "@workspace/db";

export function requireAuth(req: any, res: any, next: any): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireTier(allowedTiers: string[]) {
  return (req: any, res: any, next: any): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const tier = req.user?.subscriptionTier;
    if (!tier || !allowedTiers.includes(tier)) {
      res.status(403).json({
        error: "Upgrade required",
        requiredTiers: allowedTiers,
        currentTier: tier,
        upgradeUrl: "/dashboard/settings#subscription",
      });
      return;
    }
    next();
  };
}

export function requireCredits(creditsNeeded: number) {
  return (req: any, res: any, next: any): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = req.user;
    if ((user.aiCreditsRemaining ?? 0) < creditsNeeded) {
      res.status(402).json({
        error: "Insufficient credits",
        creditsNeeded,
        creditsRemaining: user.aiCreditsRemaining ?? 0,
        topUpUrl: "/dashboard/settings#credits",
      });
      return;
    }
    next();
  };
}

export async function deductCredits(userId: number, amount: number): Promise<number> {
  const result = await db.execute(
    `UPDATE users SET ai_credits_remaining = GREATEST(0, ai_credits_remaining - ${amount}) WHERE id = ${userId} RETURNING ai_credits_remaining`
  );
  return Number((result.rows[0] as any).ai_credits_remaining);
}
