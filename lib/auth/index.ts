import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";

/**
 * NextAuth.js v5 (Auth.js) wrapper — single source of truth for the
 * project's auth surface per [ADR-0012](../../docs/adr/0012-auth-provider.md).
 *
 * Re-exports: `{ auth, handlers, signIn, signOut }`.
 *   - `auth()` — server-side session/user accessor.
 *   - `handlers` — `{ GET, POST }` for the `app/api/auth/[...nextauth]/route.ts` re-export.
 *   - `signIn` / `signOut` — server-action helpers for the sign-in/out flow.
 *
 * Per ADR-0012 D-A: `next-auth` is the only auth runtime; other libraries
 * (Clerk SDK, Lucia, Iron Session) forbidden.
 * Per ADR-0012 D-B: GitHub OAuth is the only provider initially.
 * Per ADR-0012 D-C: DB-backed sessions via the Drizzle adapter (no JWT
 * sessions); revocable + auditable.
 *
 * The `events.linkAccount` callback (Unit 9.6) populates `githubLogin` on
 * first sign-in from the GitHub OAuth profile's `login` field (per
 * ADR-0012 D-E). Joins file-system `editorial.primary_curator` to DB user
 * identity via a stable GitHub handle. `linkAccount` is the right hook
 * because `createUser` doesn't expose `profile`; we need `profile.login`
 * which only `linkAccount({ user, account, profile })` provides.
 *
 * Operational gate: Q54 (`GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` env
 * vars; OAuth app registration under the project's GitHub org). When env
 * vars are unset, the GitHub provider treats `clientId`/`clientSecret` as
 * undefined; the sign-in flow surfaces an OAuth-configuration error to the
 * user. Unit 9.5's auth-aware UI handles this gracefully.
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // GitHub provider invoked without args; Auth.js v5 auto-detects
  // `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` env vars per the canonical
  // convention. Q54 operational gate names these vars + the OAuth app
  // registration required to populate them.
  providers: [GitHub],
  session: { strategy: "database" },
  trustHost: true,
  events: {
    async linkAccount({ user, account, profile }) {
      if (account.provider !== "github") return;
      // Auth.js v5 types `profile` as `User | AdapterUser` which loses the
      // provider-specific shape; GitHub's profile carries `login` (the
      // `@handle` we need to join file-system `editorial.primary_curator`
      // per ADR-0012 D-E). Narrow via a structural unknown cast.
      const providerProfile = profile as Record<string, unknown>;
      const rawLogin = providerProfile.login;
      const login = typeof rawLogin === "string" ? rawLogin : null;
      if (!login || !user.id) return;
      await db.update(users).set({ githubLogin: login }).where(eq(users.id, user.id));
    },
  },
});
