import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, type Locale } from "./routing";

/**
 * next-intl's per-request config callback (ADR-0011 D-A). Resolves the
 * requested locale, falling back to `defaultLocale` for unknown locales
 * (ADR-0011 D-D — graceful fallback rather than hard-404). Loads the
 * `messages/<locale>.json` catalogue via dynamic import; subsequent units
 * (Unit 7.3+) consume the result via `useTranslations` / `getTranslations`.
 *
 * Not unit-tested directly (would require mocking Next.js's request context);
 * validated end-to-end by Unit 7.4's FR-pilot e2e smoke.
 */
async function loadMessages(locale: Locale) {
  switch (locale) {
    case "en":
      return (await import("../../messages/en.json")).default;
    case "fr":
      return (await import("../../messages/fr.json")).default;
  }
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : defaultLocale;
  const messages = await loadMessages(locale);
  return { locale, messages };
});
