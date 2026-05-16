/**
 * Sibling-file naming pattern (ADR-0011 D-C).
 *
 *   foo.mdx           — EN canonical (default locale; no infix)
 *   foo.fr.mdx        — FR translation of `foo.mdx`
 *   problem.yaml      — EN canonical
 *   problem.fr.yaml   — FR translation of `problem.yaml`
 *
 * Given a slug-like string (Velite's `s.path()` strips file extensions, so
 * the input typically looks like `methodology/v1` or `methodology/v1.fr` or
 * `problems/x/problem.fr`), detect the trailing `.<locale>` infix when the
 * locale is one of the known {@link locales}. EN-canonical paths return
 * `{ lang: defaultLocale, canonicalSlug: input }` unchanged.
 *
 * Pure string parsing. Library-agnostic. Used by:
 * - `velite.config.ts` transforms (inline-regex duplicate; kept in sync).
 * - The locale-aware content loader (Unit 7.5+).
 */

import { defaultLocale, locales, type Locale } from "./routing";

const LOCALE_INFIX_REGEX = new RegExp(`\\.(${locales.join("|")})$`);

export interface ParsedLocaleSlug {
  lang: Locale;
  canonicalSlug: string;
}

export function parseLocaleFromPath(slugLike: string): ParsedLocaleSlug {
  const match = LOCALE_INFIX_REGEX.exec(slugLike);
  if (match) {
    return {
      lang: match[1] as Locale,
      canonicalSlug: slugLike.slice(0, -match[0].length),
    };
  }
  return { lang: defaultLocale, canonicalSlug: slugLike };
}
