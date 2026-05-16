import createMiddleware from "next-intl/middleware";

import { auth } from "@/lib/auth";
import { defaultLocale, locales } from "@/lib/i18n/routing";

/**
 * Composed middleware — Auth.js v5 wrapping next-intl per [ADR-0011 D-B]
 * (`localePrefix: "always"`) + [ADR-0012 D-C] (DB-backed sessions).
 *
 * Composition rationale (Unit 9.5):
 *   - `auth()` from `lib/auth` is the v5 middleware wrapper; it loads the
 *     session from the Drizzle-adapter-backed `sessions` table (if a
 *     valid `NEXT_AUTH` cookie is present) and exposes `req.auth` to the
 *     inner handler.
 *   - The inner handler delegates to next-intl's `createMiddleware` which
 *     handles the locale prefix, the `NEXT_LOCALE` cookie (Unit 8.3
 *     config), and the bare-path → `/en/...` redirect.
 *
 * Order matters: auth-wrap-outer lets next-intl's redirect happen with
 * session context already populated, so any future auth-aware redirects
 * (e.g., `/login` → `/en/login`) work uniformly.
 *
 * `localeCookie` config preserved from Unit 8.3 (`5e2b509`); same fields.
 */

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
