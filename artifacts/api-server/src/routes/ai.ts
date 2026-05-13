import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth, requireTier, requireCredits, deductCredits } from "../middlewares/access-control";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getAnthropicClient(): Anthropic | null {
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseURL || !apiKey) return null;
  return new Anthropic({ baseURL, apiKey });
}

async function callClaude(
  client: Anthropic,
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });
  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

// POST /api/ai/analyse-model
router.post(
  "/ai/analyse-model",
  requireAuth,
  requireTier(["professional", "cfo-suite"]),
  requireCredits(5),
  async (req, res): Promise<void> => {
    const user = req.user as { id: number };
    const { inputs, outputs, industry } = req.body;

    const client = getAnthropicClient();
    if (!client) {
      res.json({ commentary: null, error: "AI analysis not available — API key not configured" });
      return;
    }

    try {
      const userContent = `Industry: ${industry}\n\nInputs: ${JSON.stringify(inputs, null, 2)}\n\nOutputs: ${JSON.stringify(outputs, null, 2)}`;
      const commentary = await callClaude(
        client,
        "You are a financial advisor specialising in Southeast Asian SMEs. Analyse this financial model and provide: 1) A 2-sentence assessment of financial health, 2) The single biggest risk in the numbers, 3) One specific actionable recommendation to improve profitability. Be direct and practical. Under 150 words.",
        userContent
      );
      const creditsRemaining = await deductCredits(user.id, 5);
      res.json({ commentary, creditsRemaining });
    } catch (err) {
      logger.error({ err }, "AI analyse-model failed");
      res.status(500).json({ error: "AI analysis failed" });
    }
  }
);

// POST /api/ai/cfo-commentary
router.post(
  "/ai/cfo-commentary",
  requireAuth,
  requireTier(["cfo-suite"]),
  requireCredits(10),
  async (req, res): Promise<void> => {
    const user = req.user as { id: number };
    const { metrics, period, industry } = req.body;

    const client = getAnthropicClient();
    if (!client) {
      res.json({ commentary: null, error: "AI analysis not available — API key not configured" });
      return;
    }

    try {
      const userContent = `Period: ${period}\nIndustry: ${industry}\n\nMetrics: ${JSON.stringify(metrics, null, 2)}`;
      const commentary = await callClaude(
        client,
        "You are a CFO advisor for a Southeast Asian founder-operated business. Review these financial metrics and provide: 1) One-sentence overall health assessment, 2) Top 2 metrics needing immediate attention and why, 3) One strategic recommendation for the next 90 days. Be specific. Under 200 words.",
        userContent
      );
      const creditsRemaining = await deductCredits(user.id, 10);
      res.json({ commentary, creditsRemaining });
    } catch (err) {
      logger.error({ err }, "AI cfo-commentary failed");
      res.status(500).json({ error: "AI commentary failed" });
    }
  }
);

// POST /api/ai/benchmark-insight
router.post(
  "/ai/benchmark-insight",
  requireAuth,
  requireTier(["professional", "cfo-suite"]),
  requireCredits(3),
  async (req, res): Promise<void> => {
    const user = req.user as { id: number };
    const { userMetrics, benchmarks, industry } = req.body;

    const client = getAnthropicClient();
    if (!client) {
      res.json({ commentary: null, error: "AI analysis not available — API key not configured" });
      return;
    }

    try {
      const userContent = `Industry: ${industry}\n\nUser Metrics: ${JSON.stringify(userMetrics, null, 2)}\n\nBenchmarks: ${JSON.stringify(benchmarks, null, 2)}`;
      const commentary = await callClaude(
        client,
        "You are a business analyst for Southeast Asian SMEs. Compare these business metrics to industry benchmarks. Identify the 2 metrics where they perform best and the 1 metric most needing improvement. Give one specific action for the weakest metric. Under 100 words.",
        userContent
      );
      const creditsRemaining = await deductCredits(user.id, 3);
      res.json({ commentary, creditsRemaining });
    } catch (err) {
      logger.error({ err }, "AI benchmark-insight failed");
      res.status(500).json({ error: "AI benchmark insight failed" });
    }
  }
);

export default router;
