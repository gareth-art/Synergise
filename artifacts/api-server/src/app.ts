import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import MemoryStore from "memorystore";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";
import { sessionTokens } from "./session-tokens";

const MemoryStoreSession = MemoryStore(session);

// Passport local strategy
passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email.toLowerCase().trim()));

      if (!user) {
        return done(null, false, { message: "Incorrect email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return done(null, false, { message: "Incorrect email or password" });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: number }).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

const app: Express = express();

// Trust the Replit proxy so req.protocol reflects the original HTTPS scheme.
app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ["X-Session-ID"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

// The app is embedded in a cross-site iframe in the Replit workspace, so cookies
// must have SameSite=None; Secure to be sent by the browser in that context.
// express-session only emits Set-Cookie when it sees X-Forwarded-Proto: https,
// but the Replit proxy doesn't forward that header internally. In development we
// inject it ourselves so the security check passes without loosening cookie policy.
const isProd = process.env.NODE_ENV === "production";

if (!isProd) {
  app.use((_req, _res, next) => {
    _req.headers["x-forwarded-proto"] = "https";
    next();
  });
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: new MemoryStoreSession({
      checkPeriod: 86400000,
    }),
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Cookie-independent session restore for cross-site iframe environments (e.g. Replit canvas).
// If the browser can't send the session cookie (SameSite restrictions), the client falls back
// to sending the session ID in the X-Session-ID header. We look it up in sessionTokens and
// hydrate req.user so all downstream isAuthenticated() checks pass normally.
app.use(async (req: Request, _res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) return next();

  const sessionId = req.headers["x-session-id"] as string | undefined;
  if (!sessionId) return next();

  const userId = sessionTokens.get(sessionId);
  if (!userId) return next();

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (user) req.user = user;
  } catch { /* ignore */ }
  next();
});

app.use("/api", router);

export default app;
