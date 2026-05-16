import { eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { problems } from "#site/content";

import { StatusPill } from "@/components/ui/status-pill";
import { WatchlistToggle } from "@/components/watchlist-toggle";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getUserChallenges } from "@/lib/rating-challenges";
import { cn } from "@/lib/utils";
import { getWatchedSlugs } from "@/lib/watchlist";

const RATIONALE_PREVIEW_CHARS = 200;

function truncateRationale(rationale: string): string {
  if (rationale.length <= RATIONALE_PREVIEW_CHARS) return rationale;
  return rationale.slice(0, RATIONALE_PREVIEW_CHARS).trimEnd() + "…";
}

/**
 * `/[locale]/profile` — the first protected route in the project
 * ([Unit 10.2](../../../../docs/thinking/10.0-phase-10-prep.md) D-1 + D-4).
 *
 * Protection strategy = **server-component check + redirect** (per
 * Unit 10.0 D-4): page calls `auth()` at the top; if no session, calls
 * `redirect("/api/auth/signin/github?callbackUrl=...")`. Locally scoped
 * — no middleware change; middleware-based protection deferred until
 * 2+ protected routes exist.
 *
 * Marked `dynamic = "force-dynamic"` because the page reads `auth()` +
 * a per-user DB row + the user's watchlist on every request. SSG-ing
 * this page would serve stale or empty data; force-dynamic ensures the
 * request-time render.
 *
 * Watchlist surface: dense list reusing `<WatchlistToggle>` per Unit
 * 10.0 D-7 (visual consistency with problem detail pages; the
 * redundant `isWatched()` re-check inside the toggle is acceptable
 * given the small list size + indexed SQL lookup).
 *
 * Display fields: GitHub avatar (`session.user.image`; rendered as
 * bare `<img>` per Unit 10.0 D-10 to avoid `next/image` remotePatterns
 * config surface for one avatar URL pattern), display name (chain:
 * `name → githubLogin → email → translated fallback`), GitHub login
 * pill (mono-font; pulled from `users.githubLogin` via a separate
 * Drizzle query since the column isn't in the default Auth.js session
 * shape).
 *
 * Sign-out = inline server-action `<form action={...}>` mirroring
 * [`AuthControl`](../../../../components/auth-control/index.tsx)'s
 * signed-in branch; `redirectTo: "/"` per Unit 10.0 D-11.
 */

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) redirect("/en/profile");
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/api/auth/signin/github?callbackUrl=/${locale}/profile`);
  }

  const t = await getTranslations("profile");
  const userId = session.user.id;

  const [userRow] = await db
    .select({ githubLogin: users.githubLogin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const githubLogin = userRow?.githubLogin ?? null;

  const watchedSlugs = await getWatchedSlugs(userId);
  const watched = watchedSlugs
    .map((slug) => problems.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const challenges = await getUserChallenges(userId);
  const tRC = await getTranslations("rating_challenge");

  const displayName =
    session.user.name ?? githubLogin ?? session.user.email ?? t("display_name_fallback");

  return (
    <main className="mx-auto max-w-prose px-6 py-12">
      <header className="flex items-center gap-4">
        {session.user.image && (
          <img
            src={session.user.image}
            alt=""
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-full"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">{displayName}</h1>
          {githubLogin && (
            <p className="text-muted-foreground mt-1 font-mono text-sm">@{githubLogin}</p>
          )}
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="shrink-0"
        >
          <button
            type="submit"
            className={cn(
              "border-border bg-background text-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium",
              "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              "transition-colors",
            )}
          >
            {t("sign_out")}
          </button>
        </form>
      </header>

      <section aria-label={t("watching_aria_label")} className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">{t("watching_heading")}</h2>

        {watched.length === 0 ? (
          <div className="border-border mt-6 rounded border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">{t("empty_message")}</p>
            <Link
              href="/problems"
              className="text-accent mt-3 inline-block text-sm underline-offset-2 hover:underline"
            >
              {t("empty_cta")}
            </Link>
          </div>
        ) : (
          <ul className="border-border mt-6 divide-y divide-current/10 border-t border-b">
            {watched.map((problem) => (
              <li key={problem.slug} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/problems/${problem.slug}`}
                    className="hover:text-accent font-serif text-base underline-offset-2 hover:underline"
                  >
                    {problem.title}
                  </Link>
                  <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                    {problem.domain} / {problem.subdomain}
                  </p>
                </div>
                <StatusPill status={problem.status} className="shrink-0" />
                <WatchlistToggle slug={problem.slug} className="shrink-0" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label={t("challenges_aria_label")} className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          {t("challenges_heading")}
        </h2>

        {challenges.length === 0 ? (
          <div className="border-border mt-6 rounded border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">{t("challenges_empty_message")}</p>
            <Link
              href="/problems"
              className="text-accent mt-3 inline-block text-sm underline-offset-2 hover:underline"
            >
              {t("challenges_empty_cta")}
            </Link>
          </div>
        ) : (
          <ul className="border-border mt-6 divide-y divide-current/10 border-t border-b">
            {challenges.map((challenge) => {
              const problem = problems.find((p) => p.slug === challenge.problemSlug);
              const submittedDate = challenge.createdAt.toISOString().slice(0, 10);
              return (
                <li key={challenge.id} className="py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <Link
                      href={`/problems/${challenge.problemSlug}`}
                      className="hover:text-accent font-serif text-base font-medium underline-offset-2 hover:underline"
                    >
                      {problem?.title ?? challenge.problemSlug}
                    </Link>
                    <time
                      dateTime={submittedDate}
                      className="text-muted-foreground font-mono text-xs"
                    >
                      {submittedDate}
                    </time>
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    <span className="font-medium">{tRC(`dim_${challenge.dimension}`)}</span>
                    <span className="mx-1.5" aria-hidden>
                      →
                    </span>
                    <span className="font-mono">{challenge.proposedValue}</span>
                    <span className="bg-muted text-foreground ml-2 rounded-full px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase">
                      {t(`challenges_status_${challenge.status}`)}
                    </span>
                  </p>
                  <p className="text-foreground/90 mt-2 text-sm">
                    {truncateRationale(challenge.rationale)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
