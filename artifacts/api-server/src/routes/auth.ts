import { Router, type IRouter } from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { SignupBody } from "@workspace/api-zod";
import { sessionTokens } from "../session-tokens";

const router: IRouter = Router();

router.get("/auth/me", (req, res): void => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = req.user as typeof usersTable.$inferSelect;
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fullName, email, password, confirmPassword } = parsed.data;

  if (password !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }

  // Check if email already exists
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()));

  if (existing) {
    res.status(400).json({ error: "An account with this email already exists" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const normalizedEmail = email.toLowerCase().trim();
  const [user] = await db
    .insert(usersTable)
    .values({
      username: normalizedEmail,
      email: normalizedEmail,
      password: hashedPassword,
      fullName,
      subscriptionTier: "trial",
    })
    .returning();

  req.login(user, (loginErr) => {
    if (loginErr) {
      res.status(500).json({ error: "Login failed after signup" });
      return;
    }
    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({ error: "Session save failed" });
        return;
      }
      sessionTokens.set(req.session.id, user.id);
      res.setHeader("X-Session-ID", req.session.id);
      const { password: _pw, ...safeUser } = user;
      res.status(201).json(safeUser);
    });
  });
});

router.post("/auth/login", (req, res, next): void => {
  passport.authenticate(
    "local",
    (err: Error | null, user: typeof usersTable.$inferSelect | false, info: { message: string } | undefined) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        res.status(401).json({ error: info?.message ?? "Incorrect email or password" });
        return;
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          next(loginErr);
          return;
        }
        req.session.save((saveErr) => {
          if (saveErr) {
            next(saveErr);
            return;
          }
          sessionTokens.set(req.session.id, user.id);
          res.setHeader("X-Session-ID", req.session.id);
          const { password: _pw, ...safeUser } = user;
          res.json(safeUser);
        });
      });
    }
  )(req, res, next);
});

router.post("/auth/logout", (req, res): void => {
  const sid = req.session.id;
  req.logout((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    sessionTokens.delete(sid);
    res.json({ message: "Logged out successfully" });
  });
});

export default router;
