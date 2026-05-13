import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db, adminConfigTable } from "@workspace/db";
import { requireAuth, requireTier, requireCredits, deductCredits } from "../middlewares/access-control";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getAnthropicClient(): Anthropic | null {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseURL || !apiKey) return null;
  return new Anthropic({ baseURL, apiKey });
}

async function getModelForTier(tier: string): Promise<string> {
  const configKey = tier === "cfo-suite" ? "ai_model_cfo_suite" : "ai_model_professional";
  const rows = await db.select().from(adminConfigTable).where(eq(adminConfigTable.key, configKey)).limit(1);
  return rows[0]?.value ?? "claude-haiku-4-5";
}

async function callClaude(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const message = await client.messages.create({
    model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

// POST /api/ai/analyse-model — professional + cfo-suite, costs 5 credits
router.post(
  "/ai/analyse-model",
  requireAuth,
  requireTier(["professional", "cfo-suite"]),
  requireCredits(5),
  async (req, res): Promise<void> => {
    const user = req.user as { id: number; subscriptionTier: string };
    const { inputs, outputs, industry } = req.body;

    const client = getAnthropicClient();
    if (!client) {
      res.json({ commentary: null, error: "AI analysis unavailable — contact support" });
      return;
    }

    try {
      const model = await getModelForTier(user.subscriptionTier);
      const userContent = `Industry: ${industry}\n\nInputs: ${JSON.stringify(inputs, null, 2)}\n\nOutputs: ${JSON.stringify(outputs, null, 2)}`;
      const commentary = await callClaude(
        client,
        model,
        "You are a financial advisor specialising in Southeast Asian SMEs. Analyse this financial model and provide: 1) A 2-sentence assessment of financial health, 2) The single biggest risk in the numbers, 3) One specific actionable recommendation to improve profitability. Be direct and practical. Under 150 words.",
        userContent
      );
      const creditsRemaining = await deductCredits(user.id, 5);
      res.json({ commentary, creditsRemaining, model });
    } catch (err) {
      logger.error({ err }, "AI analyse-model failed");
      res.status(500).json({ error: "AI analysis failed" });
    }
  }
);

// POST /api/ai/cfo-commentary — cfo-suite only, costs 10 credits
router.post(
  "/ai/cfo-commentary",
  requireAuth,
  requireTier(["cfo-suite"]),
  requireCredits(10),
  async (req, res): Promise<void> => {
    const user = req.user as { id: number; subscriptionTier: string };
    const { metrics, period, industry } = req.body;

    const client = getAnthropicClient();
    if (!client) {
      res.json({ commentary: null, error: "AI analysis unavailable — contact support" });
      return;
    }

    try {
      const model = await getModelForTier(user.subscriptionTier);
      const userContent = `Period: ${period}\nIndustry: ${industry}\n\nMetrics: ${JSON.stringify(metrics, null, 2)}`;
      const commentary = await callClaude(
        client,
        model,
        "You are a CFO advisor for a Southeast Asian founder-operated business. Review these financial metrics and provide: 1) One-sentence overall health assessment, 2) Top 2 metrics needing immediate attention and why, 3) One strategic recommendation for the next 90 days. Be specific. Under 200 words.",
        userContent
      );
      const creditsRemaining = await deductCredits(user.id, 10);
      res.json({ commentary, creditsRemaining, model });
    } catch (err) {
      logger.error({ err }, "AI cfo-commentary failed");
      res.status(500).json({ error: "AI commentary failed" });
    }
  }
);

// POST /api/ai/benchmark-insight — professional + cfo-suite, costs 3 credits
router.post(
  "/ai/benchmark-insight",
  requireAuth,
  requireTier(["professional", "cfo-suite"]),
  requireCredits(3),
  async (req, res): Promise<void> => {
    const user = req.user as { id: number; subscriptionTier: string };
    const { userMetrics, benchmarks, industry } = req.body;

    const client = getAnthropicClient();
    if (!client) {
      res.json({ commentary: null, error: "AI analysis unavailable — contact support" });
      return;
    }

    try {
      const model = await getModelForTier(user.subscriptionTier);
      const userContent = `Industry: ${industry}\n\nUser Metrics: ${JSON.stringify(userMetrics, null, 2)}\n\nBenchmarks: ${JSON.stringify(benchmarks, null, 2)}`;
      const commentary = await callClaude(
        client,
        model,
        "You are a business analyst for Southeast Asian SMEs. Compare these business metrics to industry benchmarks. Identify the 2 metrics where they perform best and the 1 metric most needing improvement. Give one specific action for the weakest metric. Under 100 words.",
        userContent
      );
      const creditsRemaining = await deductCredits(user.id, 3);
      res.json({ commentary, creditsRemaining, model });
    } catch (err) {
      logger.error({ err }, "AI benchmark-insight failed");
      res.status(500).json({ error: "AI benchmark insight failed" });
    }
  }
);

// POST /api/ai/analyse-financial-model — cfo-suite only, costs 1 credit
router.post(
  "/ai/analyse-financial-model",
  requireAuth,
  requireTier(["cfo-suite"]),
  requireCredits(1),
  async (req, res): Promise<void> => {
    const user = req.user as { id: number; subscriptionTier: string };
    const { industry, summary, projections } = req.body;

    const client = getAnthropicClient();
    if (!client) {
      res.json({ insight: null, error: "AI analysis unavailable — contact support" });
      return;
    }

    try {
      const model = await getModelForTier("cfo-suite");
      const userContent = [
        `Industry: ${industry}`,
        `Month 1 Summary: ${JSON.stringify(summary, null, 2)}`,
        projections ? `12-Month Projections (EBITDA): ${(projections as any[]).map((p: any) => `M${p.month}: ${Math.round(p.ebitda)}`).join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const insight = await callClaude(
        client,
        model,
        `You are a CFO advisor for Southeast Asian founder-operated businesses. Analyse this financial model and provide exactly 3 specific insights:
1. Break-even trajectory — when and how the business reaches EBITDA break-even (or why it may not within 12 months)
2. Biggest cost driver vs. revenue — identify the cost structure risk most likely to compress margins
3. One lever the founder can pull to improve EBITDA margin — be specific to their industry

Reference the user's industry. Be direct and quantitative where possible. Under 220 words.`,
        userContent
      );

      const creditsRemaining = await deductCredits(user.id, 1);
      res.json({ insight, creditsRemaining, model });
    } catch (err) {
      logger.error({ err }, "AI analyse-financial-model failed");
      res.status(500).json({ error: "AI analysis failed" });
    }
  }
);

export default router;
