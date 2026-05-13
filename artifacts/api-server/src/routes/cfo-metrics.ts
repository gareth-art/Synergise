import { Router, type IRouter } from "express";
import { eq, and, lt } from "drizzle-orm";
import { db, managementAccountsTable, cfoInputsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/access-control";

const router: IRouter = Router();

router.get("/cfo-metrics/:period", requireAuth, async (req, res): Promise<void> => {
  const user = req.user as { id: number; subscriptionTier: string };
  const period = Array.isArray(req.params.period) ? req.params.period[0] : req.params.period;

  const [account] = await db
    .select()
    .from(managementAccountsTable)
    .where(and(eq(managementAccountsTable.userId, user.id), eq(managementAccountsTable.period, period)));

  const [cfoInput] = await db
    .select()
    .from(cfoInputsTable)
    .where(and(eq(cfoInputsTable.userId, user.id), eq(cfoInputsTable.period, period)));

  // Calculate previous month for MoM growth
  const [year, month] = period.split("-").map(Number);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  const [prevAccount] = await db
    .select()
    .from(managementAccountsTable)
    .where(and(eq(managementAccountsTable.userId, user.id), eq(managementAccountsTable.period, prevPeriod)));

  const safe = (v: string | null | undefined) => (v != null ? Number(v) : null);

  const revenue = safe(account?.revenue);
  const cogs = safe(account?.cogs);
  const ebitda = safe(account?.ebitda);
  const grossMarginPct = safe(account?.grossMarginPct);

  const cashOnHand = safe(cfoInput?.cashOnHand);
  const totalCurrentAssets = safe(cfoInput?.totalCurrentAssets);
  const totalCurrentLiabilities = safe(cfoInput?.totalCurrentLiabilities);
  const totalInventory = safe(cfoInput?.totalInventory);
  const receivableDays = safe(cfoInput?.receivableDays);
  const payableDays = safe(cfoInput?.payableDays);
  const inventoryDays = safe(cfoInput?.inventoryDays);
  const totalDebt = safe(cfoInput?.totalDebt);
  const totalEquity = safe(cfoInput?.totalEquity);

  // Calculate opex sum from management account
  let sumOpex = 0;
  if (account?.operatingExpenses && typeof account.operatingExpenses === "object") {
    sumOpex = Object.values(account.operatingExpenses as Record<string, number>).reduce(
      (sum, v) => sum + (Number(v) || 0),
      0
    );
  }

  const calc = (fn: () => number | null): number | null => {
    try {
      return fn();
    } catch {
      return null;
    }
  };

  const burnRate = calc(() =>
    revenue != null && cogs != null ? sumOpex + cogs - revenue : null
  );
  const netBurn = calc(() =>
    revenue != null && cogs != null ? revenue - (sumOpex + cogs) : null
  );
  const cashRunway = calc(() =>
    cashOnHand != null && burnRate != null && burnRate > 0 ? cashOnHand / burnRate : null
  );
  const workingCapital = calc(() =>
    totalCurrentAssets != null && totalCurrentLiabilities != null
      ? totalCurrentAssets - totalCurrentLiabilities
      : null
  );
  const currentRatio = calc(() =>
    totalCurrentAssets != null && totalCurrentLiabilities != null && totalCurrentLiabilities > 0
      ? totalCurrentAssets / totalCurrentLiabilities
      : null
  );
  const quickRatio = calc(() =>
    totalCurrentAssets != null && totalInventory != null && totalCurrentLiabilities != null && totalCurrentLiabilities > 0
      ? (totalCurrentAssets - totalInventory) / totalCurrentLiabilities
      : null
  );
  const cashConversionCycle = calc(() =>
    receivableDays != null && inventoryDays != null && payableDays != null
      ? receivableDays + inventoryDays - payableDays
      : null
  );
  const gearingRatio = calc(() =>
    totalDebt != null && totalEquity != null && totalDebt + totalEquity > 0
      ? totalDebt / (totalDebt + totalEquity)
      : null
  );
  const debtToEbitda = calc(() =>
    totalDebt != null && ebitda != null && ebitda !== 0
      ? totalDebt / (ebitda * 12)
      : null
  );
  const ebitdaMarginPct = calc(() =>
    ebitda != null && revenue != null && revenue > 0 ? (ebitda / revenue) * 100 : null
  );
  const prevRevenue = safe(prevAccount?.revenue);
  const revenueMoMGrowth = calc(() =>
    revenue != null && prevRevenue != null && prevRevenue > 0
      ? ((revenue - prevRevenue) / prevRevenue) * 100
      : null
  );

  const tier = user.subscriptionTier;

  // Tier gating
  if (tier === "trial" || tier === "professional") {
    res.json({
      period,
      burnRate,
      workingCapital,
      grossMarginPct,
    });
    return;
  }

  // cfo-suite: all metrics
  res.json({
    period,
    burnRate,
    netBurn,
    cashRunway,
    workingCapital,
    currentRatio,
    quickRatio,
    cashConversionCycle,
    gearingRatio,
    debtToEbitda,
    grossMarginPct,
    ebitdaMarginPct,
    revenueMoMGrowth,
  });
});

export default router;
