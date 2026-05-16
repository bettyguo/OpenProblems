import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { problems } from "#site/content";

import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { addToWatchlist, isWatched, removeFromWatchlist } from "@/lib/watchlist";

/**
 * Per-problem watchlist toggle (Unit 9.6). Server component; three render
 * branches:
 *   1. Signed out — sign-in prompt linking to `/api/auth/signin/github`
 *      (Auth.js v5's canonical entry per ADR-0012 D-D).
 *   2. Signed in + not-watched — outlined "Watch" button + hollow star.
 *   3. Signed in + watched — filled "Watching" button + filled star.
 *
 * Server actions read the slug from the form's hidden input + re-validate
 * the session inside the action (rather than closing over a userId from
 * the rendering pass). Pattern protects against stale-action replay
 * across sign-in/out cycles.
 *
 * Per [ADR-0013](../../docs/adr/0013-db-choice.md) D-F: `problemSlug` is a
 * plain text column with no FK; this component guards against unknown
 * slugs in two places (the page would already have `notFound()`'d on an
 * unknown slug before rendering this component; the server-action checks
 * are belt-and-suspenders parity with the API route).
 *
 * Defensive `auth()` + `isWatched()` mirror Unit 9.5's `safeAuth()`
 * pattern: SSG builds with no DB / no migrations succeed by falling back
 * to the signed-out branch.
 */

async function safeAuth() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

async function safeIsWatched(userId: string, slug: string): Promise<boolean> {
  try {
    return await isWatched(userId, slug);
  } catch {
    return false;
  }
}

function knownSlug(slug: string): boolean {
  return problems.some((p) => p.slug === slug);
}

async function watchAction(formData: FormData): Promise<void> {
  "use server";
  const slug = String(formData.get("slug") ?? "");
  if (!slug || !knownSlug(slug)) return;
  const session = await auth();
  if (!session?.user?.id) return;
  await addToWatchlist(session.user.id, slug);
  revalidatePath("/[locale]/problems/[slug]", "page");
}

async function unwatchAction(formData: FormData): Promise<void> {
  "use server";
  const slug = String(formData.get("slug") ?? "");
  if (!slug || !knownSlug(slug)) return;
  const session = await auth();
  if (!session?.user?.id) return;
  await removeFromWatchlist(session.user.id, slug);
  revalidatePath("/[locale]/problems/[slug]", "page");
}

interface WatchlistToggleProps {
  slug: string;
  className?: string;
}

const baseButton =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none";

export async function WatchlistToggle({ slug, className }: WatchlistToggleProps) {
  const t = await getTranslations("watchlist");
  const session = await safeAuth();

  if (!session?.user?.id) {
    return (
      <a
        href="/api/auth/signin/github"
        className={cn(
          baseButton,
          "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted",
          className,
        )}
        aria-label={t("aria_label")}
      >
        <span aria-hidden>☆</span>
        {t("sign_in_prompt")}
      </a>
    );
  }

  const watched = await safeIsWatched(session.user.id, slug);

  if (watched) {
    return (
      <form action={unwatchAction} className={cn("inline-flex", className)}>
        <input type="hidden" name="slug" value={slug} />
        <button
          type="submit"
          aria-label={t("aria_label")}
          aria-pressed="true"
          className={cn(baseButton, "border-accent bg-accent/10 text-accent hover:bg-accent/20")}
        >
          <span aria-hidden>★</span>
          {t("watching")}
        </button>
      </form>
    );
  }

  return (
    <form action={watchAction} className={cn("inline-flex", className)}>
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        aria-label={t("aria_label")}
        aria-pressed="false"
        className={cn(baseButton, "border-border bg-background text-foreground hover:bg-muted")}
      >
        <span aria-hidden>☆</span>
        {t("watch")}
      </button>
    </form>
  );
}
