"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isLocale, locales, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

interface ToggleTarget {
  currentLocale: Locale;
  targetLocale: Locale;
  targetHref: string;
}

/**
 * Pure helper: given a URL pathname, decide whether to render the toggle
 * and where it should navigate.
 *
 * Returns `null` for bare paths (no locale prefix) — the toggle hides on
 * routes that don't yet have a `/[locale]/` shadow (intermediate state
 * until Unit 7.3a's middleware lands). Returns `{ currentLocale,
 * targetLocale, targetHref }` for locale-prefixed paths.
 *
 * Pure function, exported for unit-testing.
 */
export function computeToggle(pathname: string): ToggleTarget | null {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first === undefined || !isLocale(first)) return null;

  const currentIdx = locales.indexOf(first);
  const targetLocale = locales[(currentIdx + 1) % locales.length] as Locale;
  const rest = segments.slice(1).join("/");
  const targetHref = rest.length > 0 ? `/${targetLocale}/${rest}` : `/${targetLocale}`;

  return { currentLocale: first, targetLocale, targetHref };
}

// Aria-labels are written in the *target* language (the next-action's
// language) so a reader can scan the next destination. Visible button
// label is the *current* locale code (mirrors ThemeToggle's pattern of
// showing the active state). Hardcoded rather than via useTranslations
// because SiteHeader currently renders above NextIntlClientProvider
// (will revisit when Unit 7.3a moves it under the [locale] layout).
const ARIA_LABEL: Record<Locale, string> = {
  en: "Passer au français",
  fr: "Switch to English",
};

const DISPLAY_LABEL: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
};

/**
 * Cycling locale-switcher button (ADR-0011 D-F). Renders next to
 * `ThemeToggle` in the SiteHeader. Hidden on bare paths during the
 * intermediate state where most routes lack a `/[locale]/` shadow;
 * becomes universally visible after Unit 7.3a.
 */
export function LocaleToggle({ className }: { className?: string }) {
  const pathname = usePathname();
  const target = computeToggle(pathname);
  if (target === null) return null;

  return (
    <Link
      href={target.targetHref}
      aria-label={ARIA_LABEL[target.currentLocale]}
      title={ARIA_LABEL[target.currentLocale]}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md",
        "border-border bg-background text-foreground border",
        "hover:bg-muted",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        "text-xs font-medium transition-colors",
        className,
      )}
    >
      {DISPLAY_LABEL[target.currentLocale]}
    </Link>
  );
}
