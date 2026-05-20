import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";

import authConfig from "@/auth.config";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";

import { extractGithubLogin } from "./link-account";

/**
 * NextAuth.js v5 (Auth.js) wrapper — single source of truth for the
 * project's auth surface per [ADR-0012](../../docs/adr/0012-auth-provider.md)
 * + [ADR-0020](../../docs/adr/0020-multi-provider-oauth.md).
 *
 * Re-exports: `{ auth, handlers, signIn, signOut }`.
 *   - `auth()` — server-side session/user accessor.
 *   - `handlers` — `{ GET, POST }` for the `app/api/auth/[...nextauth]/route.ts` re-export.
 *   - `signIn` / `signOut` — server-action helpers for the sign-in/out flow.
 *
 * Per ADR-0012 D-A: `next-auth` is the only auth runtime; other libraries
 * (Clerk SDK, Lucia, Iron Session) forbidden.
 * Per ADR-0012 D-B (**lifted by ADR-0020**): GitHub OAuth was the only
 * initial provider; Phase 28 adds Google as the second provider.
 * Per ADR-0020 D-B: provider count is exactly 2 at Phase 28 close
 * (GitHub first, Google second); third+ requires ADR-0020 amendment.
 * Per ADR-0012 D-C: DB-backed sessions via the Drizzle adapter (no JWT
 * sessions); revocable + auditable.
 *
 * Per ADR-0020 D-D the curator-of-record gate remains GitHub-only.
 * The `events.linkAccount` callback (Unit 9.6) populates `githubLogin`
 * on first sign-in **only when `account.provider === "github"`** via
 * the {@link extractGithubLogin} helper (Phase-28 Unit 28.2 refactor
 * extracted the pure logic out for unit testability). Joins file-system
 * `editorial.primary_curator` to DB user identity via a stable GitHub
 * handle. Google sign-ins leave `users.githubLogin` NULL — non-GitHub
 * users cannot be a curator-of-record per ADR-0020 D-D (Q74 architectural
 * candidate for Phase 29+).
 *
 * Per ADR-0020 D-E account-linking strategy = Auth.js default
 * `allowDangerousEmailAccountLinking: false`: same-email-different-provider
 * yields two separate `users.id` rows. Phase 29+ account-merge UI
 * candidate if curator demand surfaces.
 *
 * Operational gates:
 *   - **Q54** (`AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET`; GitHub OAuth app
 *     registration). When unset, the GitHub provider treats clientId /
 *     clientSecret as undefined; the sign-in flow surfaces an OAuth-
 *     configuration error.
 *   - **Q73** (`AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`; Google OAuth app
 *     registration via Google Cloud Console; Phase 28 new). Same
 *     graceful-degradation posture as Q54.
 *
 * Unit 9.5's auth-aware UI + SiteHeader's `safeAuth()` together handle
 * both gates gracefully — when either provider is unconfigured, the
 * signed-out branch still renders (the affected provider's button just
 * surfaces an error on click).
 */
// `authConfig` (edge-safe) carries `providers` (GitHub + Google in that
// order; Auth.js v5 auto-detects `AUTH_<PROVIDER>_ID` + `_SECRET`) and
// `trustHost`. The full config below spreads it and layers the Node-only
// DrizzleAdapter + db-session strategy + linkAccount event.
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  events: {
    async linkAccount({ user, account, profile }) {
      const extracted = extractGithubLogin(account, profile, user);
      if (!extracted) return;
      await db
        .update(users)
        .set({ githubLogin: extracted.githubLogin })
        .where(eq(users.id, extracted.userId));
    },
  },
});
