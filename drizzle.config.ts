import type { Config } from "drizzle-kit";

/**
 * Drizzle-Kit configuration — schema source + migration output + driver
 * shape per [ADR-0013](./docs/adr/0013-db-choice.md) D-B.
 *
 * Local dev uses `file:./local.db` (gitignored) via the `dialect: "turso"`
 * libsql client (handles both `file:` and `libsql://` URLs).
 * Production uses Turso via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` env
 * vars.
 *
 * Migration discipline: `pnpm db:generate` writes a new file in
 * `lib/db/migrations/` for each schema change. Applied migrations are
 * immutable (mirrors ADR-0005's rating-action ethos); corrections land as
 * new migrations that supersede.
 */
const config: Config = {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
    ...(process.env.TURSO_AUTH_TOKEN ? { authToken: process.env.TURSO_AUTH_TOKEN } : {}),
  },
};

export default config;
