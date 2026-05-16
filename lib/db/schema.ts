import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

/**
 * Drizzle schema — NextAuth.js v5 canonical tables ([ADR-0012](../../docs/adr/0012-auth-provider.md) D-C)
 * plus per-project `githubLogin` column on `users` (D-E joins to file-system
 * `editorial.primary_curator`).
 *
 * Engine: libSQL (Turso) / SQLite-compatible per [ADR-0013](../../docs/adr/0013-db-choice.md) D-A.
 * Migration discipline: every schema change ships as a NEW migration file
 * (`pnpm db:generate`); never edit applied migrations. Mirrors ADR-0005's
 * rating-action-immutability ethos.
 *
 * The first migration (`0001_initial_auth`) lands in Unit 9.3; the watchlist
 * table (`0002_watchlist`) lands separately in Unit 9.6 per ADR-0013 D-E.
 */

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  // Per ADR-0012 D-E: joins to file-system `editorial.primary_curator` (text
  // match; no FK constraint — file-system content stays source of truth).
  // Populated on first sign-in from the GitHub OAuth profile's `login` field.
  githubLogin: text("githubLogin").unique(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

/**
 * Per-user watchlist of problem slugs (Unit 9.6). Resolves
 * [Q56](../../OPEN_QUESTIONS.md#q56-watchlist-table-key-shape) lean:
 * composite primary key on `(userId, problemSlug)`; FK on `userId`
 * with `ON DELETE cascade`; **no FK on `problemSlug`** — the column is
 * plain text referencing the file-system slug at
 * `content/problems/<slug>/problem.yaml`. Preserves ADR-0004 file-first
 * for content; orphan rows (slug pointing at a deleted problem.yaml)
 * tolerated until a cleanup script lands (deferred follow-on per
 * [ADR-0013](../../docs/adr/0013-db-choice.md) D-F).
 *
 * §5.7 trigger (a) — "we need write paths (submissions)" — FIRES on
 * this table's first INSERT. Deferred 5 phases running (Units 4.12 /
 * 5.10 / 6.0 / 7.0 / 8.0 D-2); Phase-4 "no user accounts" pact broken
 * here per the announced consequence.
 */
export const watchlist = sqliteTable(
  "watchlist",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemSlug: text("problemSlug").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.problemSlug] }),
  }),
);

/**
 * Per-user rating challenges (Unit 11.1) — the project's **second
 * write-path** (first was [`watchlist`](#watchlist) in Phase 9 Unit 9.6).
 *
 * Closes the §8.6 + §3.1 "ratings are revisable" architectural concern:
 * any signed-in user can challenge any existing rating dimension by
 * submitting a `dimension` / `proposedValue` / `rationale` triple.
 * Phase 11 ships submission only; curator review pipeline (status
 * transitions; rating-action YAML emission) is Phase 12+ or
 * curator-track per Q57.
 *
 * Schema decisions per Unit 11.0 D-3:
 * - **UUID PK** (matches `users.id` strategy via `crypto.randomUUID()`).
 * - **userId FK** with `ON DELETE cascade` (matches `watchlist` precedent).
 * - **problemSlug** plain text, no FK (matches Q56 lean +
 *   `watchlist` precedent; orphan rows tolerated per ADR-0013 D-F).
 * - **dimension** TEXT (no SQLite enum; app-level enum validation
 *   against the 5 `RatingActionSchema.dimensions` keys: difficulty,
 *   saturation, urgency, value, industry_call).
 * - **proposedValue** TEXT (per-dimension format varies; app-level
 *   interpretation — letter grade for difficulty, 0-100 / N/A for
 *   saturation, 0-5 for stars-based).
 * - **rationale** required TEXT (app-level validation: min 50 chars,
 *   max 2000 chars; plain text, no formatting).
 * - **status** TEXT default `"submitted"` — Phase 11 ships only this
 *   value; future values (`under_review`, `accepted`, `rejected`,
 *   `withdrawn`) land in Phase 12+ alongside curator-review columns
 *   (`reviewedAt`, `reviewerId`, `reviewNotes`, `acceptedActionId`).
 * - **createdAt** timestamp_ms default (matches `users.createdAt` +
 *   `watchlist.createdAt` precedent).
 * - **NO composite PK** (unlike `watchlist`): users may submit
 *   multiple challenges per problem (one per dimension, or multiple
 *   per dimension over time as their thinking evolves). Single UUID
 *   PK is the right shape.
 *
 * Anti-patterns rejected per Unit 11.0 D-3 + D-6:
 * - 5 typed columns (`proposedGrade`, `proposedSaturation`, etc.) —
 *   sparse + brittle; only 1 populated per row.
 * - JSON column for `proposedValue` — SQLite lacks JSONB; adds
 *   parse/serialize overhead with no win over plain TEXT.
 * - Speculative curator-review columns now — ADR-0005's
 *   immutability-and-explicit-evolution ethos prefers landing them
 *   when the surface lands.
 */
export const ratingChallenges = sqliteTable("ratingChallenge", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  problemSlug: text("problemSlug").notNull(),
  dimension: text("dimension").notNull(),
  proposedValue: text("proposedValue").notNull(),
  rationale: text("rationale").notNull(),
  status: text("status").notNull().default("submitted"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});
