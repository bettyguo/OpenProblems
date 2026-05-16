import createMiddleware from "next-intl/middleware";

import { defaultLocale, locales } from "@/lib/i18n/routing";

/**
 * Locale-detection middleware (next-intl). Per ADR-0011 D-B every URL
 * carries a locale prefix; per ADR-0011 D-F a `NEXT_LOCALE` cookie holds
 * the first-visit Accept-Language hint so future bare-URL hits route to
 * the user's last-chosen locale rather than the default.
 *
 * Unit 8.3 pins the cookie configuration explicitly (was relying on
 * next-intl defaults pre-`defb122`):
 *   - name:     `NEXT_LOCALE` (next-intl default; spelled here for clarity)
 *   - maxAge:   1 year — long enough that returning visitors keep their
 *               choice; not so long that stale browser state outlasts a
 *               reasonable curator turnaround.
 *   - sameSite: `lax` — required for top-level navigation cookies; the
 *               LocaleToggle navigates within-origin only.
 *   - path:     `/` — cookie applies site-wide, not per-segment.
 *   - secure:   production-only — `localhost` dev and `pnpm start` smoke
 *               tests need the cookie over HTTP. CI Lighthouse + previews
 *               run under HTTPS.
 *
 * `httpOnly` is intentionally left at its next-intl default (false). The
 * cookie is read by middleware (server-side) on every request; no client
 * JS reads it today. Setting `httpOnly: true` would harden against XSS
 * but blocks future client-side personalization (e.g., LocaleToggle
 * reading the cookie to surface "remember this choice" UX).
 */
export default createMiddleware({
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

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
