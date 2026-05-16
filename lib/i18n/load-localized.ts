/**
 * Generic locale resolver for Velite collections that carry sibling-file
 * locale variants (ADR-0011 D-C + D-D).
 *
 *   resolveLocalized(methodology, "fr", (m) => m.version === "1.0.0")
 *     → if FR + EN both present     → { record: <FR>, didFallback: false }
 *     → if only EN present          → { record: <EN>, didFallback: true }
 *     → if requested locale = "en"  → { record: <EN>, didFallback: false }
 *     → if neither present          → null   (caller calls notFound())
 *
 * `didFallback` lets the route render the locale-switch hint per ADR-0011 D-D
 * ("This page is not yet translated to French; reading the English original.").
 *
 * Pure function. Library-agnostic. No next-intl import.
 */

import { defaultLocale, type Locale } from "./routing";

export interface ResolvedLocalized<T> {
  record: T;
  didFallback: boolean;
}

export function resolveLocalized<T extends { lang: Locale }>(
  records: readonly T[],
  locale: Locale,
  matches: (record: T) => boolean,
): ResolvedLocalized<T> | null {
  const candidates = records.filter(matches);
  if (candidates.length === 0) return null;

  const requested = candidates.find((r) => r.lang === locale);
  if (requested) {
    return { record: requested, didFallback: false };
  }

  const fallback = candidates.find((r) => r.lang === defaultLocale);
  if (fallback) {
    return { record: fallback, didFallback: locale !== defaultLocale };
  }

  return null;
}
