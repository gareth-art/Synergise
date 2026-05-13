import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { lte, and, isNotNull } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// Monthly credits reset — runs every 24 hours
setInterval(async () => {
  try {
    const now = new Date();
    const result = await db.execute(
      `UPDATE users
       SET ai_credits_remaining = ai_credits_monthly_allowance,
           credits_reset_date = NOW() + INTERVAL '30 days'
       WHERE credits_reset_date IS NOT NULL
         AND credits_reset_date <= NOW()
       RETURNING id`
    );
    const count = result.rows.length;
    if (count > 0) {
      logger.info({ count }, "Monthly credits reset for users");
    }
  } catch (err) {
    logger.error({ err }, "Credits reset interval failed");
  }
}, 24 * 60 * 60 * 1000);
