# Synergise

Financial clarity platform for founder-operators in Southeast Asia. Model your business, track performance, and benchmark against your peers — without needing a CFO.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/synergise run dev` — run the web frontend (dynamic port via $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter (routing) + TanStack Query + shadcn/ui + Tailwind v4
- API: Express 5 + Passport.js (local strategy) + express-session + MemoryStore + bcrypt
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/synergise/` — React+Vite web frontend (previewPath `/`)
- `artifacts/api-server/` — Express 5 API server (previewPath `/api`)
- `lib/db/` — Drizzle ORM schema + DB connection (`@workspace/db`)
- `lib/api-spec/openapi.yaml` — Source of truth for API contract (OpenAPI 3.1)
- `lib/api-client-react/` — Generated TanStack Query hooks (`@workspace/api-client-react`)
- `lib/api-zod/` — Generated Zod schemas (`@workspace/api-zod`)
- `artifacts/api-server/src/routes/` — Express route handlers

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives both client hooks and server Zod validation via Orval codegen. Run codegen after any spec change.
- **Synergise brand colors** are defined as CSS custom properties in `index.css` (`:root`) and registered in the `@theme inline` block so Tailwind v4 can use them as utilities (`bg-synergise-primary`, `text-synergise-text`, etc.).
- **Session auth**: Passport.js local strategy with express-session + MemoryStore (not redis-backed — swap for prod). `SESSION_SECRET` env var required.
- **Admin panel** uses a simple `x-admin-password` header check against `ADMIN_PASSWORD` env var — not tied to regular user sessions.
- **Benchmarks industry names** must exactly match what the onboarding frontend sends (e.g. `Wellness & Lifestyle`, `Technology & SaaS`, `Singapore`). The DB is seeded with these exact strings.

## Product

- **Landing page** — marketing hero, features, social proof, footer. Unauthenticated.
- **Auth** — signup (email+password+fullName), login, logout. Session-based.
- **Onboarding** — 4-step wizard (welcome → business info → region/stage → done). Saves profile and admin segment.
- **Dashboard** — home (module cards + trial banner), Financial Modelling (industry-specific inputs + outputs + save), Management Accounts (P&L entry + recharts trend), Comparables/Benchmarking (opt-in consent + percentile bars), Settings (account info + subscription).
- **Admin** — password-protected panel at `/admin` showing user segments table and totals.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Dark mode CSS placeholders (`red` values) have been replaced with a teal-dark palette in `index.css`.
- After changing the OpenAPI spec, always run codegen: `pnpm --filter @workspace/api-spec run codegen`
- After schema changes, run: `pnpm --filter @workspace/db run push`
- Benchmark data was reseeded via psql with the correct full industry names (not short codes).
- `bg-synergise-primary` and related Tailwind utilities only work because `--color-synergise-*` are registered in `@theme inline` in `index.css`.
- Never import from `@workspace/api-client-react/src/...` — always import from the package root.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
