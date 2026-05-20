import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

/**
 * Edge-safe NextAuth.js v5 config — shared between [middleware.ts](./middleware.ts)
 * (Edge runtime) and [lib/auth/index.ts](./lib/auth/index.ts) (Node runtime).
 *
 * Per Auth.js v5 docs (split-config pattern), Vercel runs `middleware.ts`
 * in the Edge runtime where the Drizzle/libsql adapter cannot initialize
 * (the default `@libsql/client` import uses Node-only APIs; the file:
 * fallback in `lib/db/index.ts` has no writable FS on Vercel). Loading
 * `lib/auth/index.ts` from middleware therefore throws at cold start →
 * `MIDDLEWARE_INVOCATION_FAILED`.
 *
 * This module contains ONLY the edge-safe surface: providers + `trustHost`.
 * The full adapter + `session.strategy: "database"` + `events.linkAccount`
 * live in `lib/auth/index.ts` and spread `...authConfig` on top.
 *
 * Order matters: GitHub first preserves Phase-9 user expectation +
 * `PROVIDER_IDS` iteration order in `link-account.ts` / `<AuthControl>`.
 */
export default {
  providers: [GitHub, Google],
  trustHost: true,
} satisfies NextAuthConfig;
