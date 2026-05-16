/**
 * Single source of truth for the project's locale set + default. Library-
 * agnostic (no next-intl import here) so middleware / route segments /
 * loaders all share one definition.
 *
 * Per ADR-0011 D-B: default locale = `en`; sub-path routing in Unit 7.3.
 */

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string | null | undefined): value is Locale {
  if (typeof value !== "string") return false;
  return (locales as readonly string[]).includes(value);
}
