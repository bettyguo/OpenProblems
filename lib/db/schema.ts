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
