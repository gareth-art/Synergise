import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import connectPg from "connect-pg-simple";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";

const PgStore = connectPg(session);

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
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      tableName: "session",
      ttl: 30 * 24 * 60 * 60, // 30 days in seconds
    }),
    cookie: {
      secure: false, // Replit uses HTTP internally even when public URL is HTTPS
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", router);

export default app;
