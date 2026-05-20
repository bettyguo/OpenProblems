import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";

import authConfig from "@/auth.config";
import { defaultLocale, locales } from "@/lib/i18n/routing";

/**
 * Composed middleware — Auth.js v5 wrapping next-intl per [ADR-0011 D-B]
 * (`localePrefix: "always"`) + [ADR-0012 D-C] (DB-backed sessions).
 *
 * Edge-runtime split (deploy hotfix): Vercel's middleware runs in the Edge
 * runtime, where the Drizzle/libsql adapter from `lib/auth/index.ts` cannot
 * initialize. We instantiate a slim `NextAuth(authConfig)` here using the
 * edge-safe config (`@/auth.config`) so the middleware bundle stays free
 * of `@libsql/client` and the DB connection. The full adapter + events
 * still ship from `lib/auth/index.ts` for Node-runtime server code.
 *
 * Composition rationale (Unit 9.5):
 *   - `auth()` populates `req.auth` from the session cookie so any
 *     future auth-aware redirect (e.g., `/login` → `/en/login`) sees a
 *     consistent surface. With db-strategy sessions the slim auth() in
 *     edge can't load the full session row from the DB — that requires
 *     the Node-runtime `auth()` from `lib/auth`.
 *   - The inner handler delegates to next-intl's `createMiddleware` which
 *     handles the locale prefix, the `NEXT_LOCALE` cookie (Unit 8.3
 *     config), and the bare-path → `/en/...` redirect.
 *
 * `localeCookie` config preserved from Unit 8.3 (`5e2b509`); same fields.
 */

const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
});

export default auth((req) => intlMiddleware(req));

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
