import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getCuratorOfRecordSlugs, getProfileActivity, getPublicProfileByHandle } from "@/lib/users";
import { cn } from "@/lib/utils";

/**
 * `/[locale]/u/[handle]` — public profile route (Unit 14.3) per
 * [ADR-0015](../../../../docs/adr/0015-per-user-privacy-model.md).
 *
 * **First per-USER read-side public surface**. Renders unauthenticated;
 * no auth gate. Handle resolution + 404 per ADR-0015 D-B; field
 * partition per D-A; curator-of-record badge per D-E; "Edit your
 * profile" CTA per D-F (only when `session.user.id === profile.userId`).
 *
 * Per ADR-0015 D-B: URL `[handle]` segment is matched case-insensitively
 * via `LOWER(githubLogin) = LOWER(?)` inside `getPublicProfileByHandle`;
 * NO redirect on case mismatch. The profile body always renders the
 * **canonical case** from `users.githubLogin`.
 *
 * Per ADR-0015 D-A: public fields = `name` + `image` + `githubLogin` +
 * `createdAt` + 3 activity counts (`watchedCount` + `pendingChallengeCount`
 *  + `acceptedChallengeCount`) + curator-of-record badge if matches.
 * `email` never surfaces; `rejected` / `withdrawn` counts never surface
 * here (Phase-13 Unit 13.0 D-3 + Q58 lean #3 closure).
 *
 * `force-dynamic` per Unit 14.0 D-11: DB-backed reads on every request
 * (handle lookup + 3 COUNT queries); aggressively cacheable in principle
 * but conservative Phase-14 default. Phase 15+ may add `revalidate: 60`
 * once usage observability informs.
 */

export const dynamic = "force-dynamic";

interface PublicProfilePageProps {
  params: Promise<{ locale: string; handle: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const profile = await getPublicProfileByHandle(handle);
  if (!profile) notFound();

  const t = await getTranslations("public_profile");

  // Parallel fetch: activity counts (DB) + curator-of-record scan (file).
  // Pass canonical `githubLogin` to the curator-of-record helper per
  // ADR-0015 D-E (case-sensitive comparison against YAML literal).
  const [activity, session] = await Promise.all([getProfileActivity(profile.userId), auth()]);
  const curatedSlugs = getCuratorOfRecordSlugs(profile.githubLogin);

  const isOwnProfile = session?.user?.id === profile.userId;
  // ADR-0016 D-E fallback chain: displayName → name → githubLogin → translated fallback.
  // Email never surfaces on public profile per ADR-0015 D-A invariant.
  const displayName =
    profile.displayName ?? profile.name ?? profile.githubLogin ?? t("display_name_fallback");
  // ADR-0017 D-E public-surface image fallback chain: imageOverride →
  // image (GitHub-derived) → null. Fallback initials placeholder
  // (when both are null) stays Phase-9/15 behavior — omit the <img>.
  const currentAvatar = profile.imageOverride ?? profile.image ?? null;
  const joinedDate = profile.createdAt.toISOString().slice(0, 10);
  const totalActivity =
    activity.watchedCount + activity.pendingChallengeCount + activity.acceptedChallengeCount;

  return (
    <main
      className="mx-auto max-w-prose px-6 py-12"
      aria-label={t("aria_label", { login: profile.githubLogin })}
    >
      <header className="flex items-start gap-4">
        {currentAvatar && (
          <img
            src={currentAvatar}
            alt=""
            width={64}
            height={64}
            className="size-16 shrink-0 rounded-full object-cover"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">{displayName}</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">@{profile.githubLogin}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            <time dateTime={joinedDate}>{t("member_since_label", { date: joinedDate })}</time>
          </p>
          {curatedSlugs.length > 0 && (
            <p className="mt-2">
              <span
                className={cn(
                  "border-accent/30 bg-accent/10 text-accent inline-flex items-center rounded-full border px-2 py-0.5",
                  "font-mono text-[10px] tracking-wide uppercase",
                )}
                title={curatedSlugs.join(", ")}
              >
                {t("curator_of_record_label", { count: curatedSlugs.length })}
              </span>
            </p>
          )}
        </div>
        {isOwnProfile && (
          <Link
            href="/profile"
            className={cn(
              "border-border bg-background text-foreground inline-flex h-9 shrink-0 items-center justify-center rounded-md border px-3 text-xs font-medium",
              "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              "transition-colors",
            )}
          >
            {t("edit_profile_cta")}
          </Link>
        )}
      </header>

      {profile.bio && (
        <section className="mt-8" aria-label={t("bio_aria_label")}>
          <p className="text-foreground/90 text-sm whitespace-pre-wrap">{profile.bio}</p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">{t("activity_heading")}</h2>

        {totalActivity === 0 ? (
          <div className="border-border mt-6 rounded border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {t("empty_activity_message", { login: profile.githubLogin })}
            </p>
          </div>
        ) : (
          <ul className="border-border mt-6 divide-y divide-current/10 border-t border-b text-sm">
            <li className="text-foreground/90 py-3">
              {t("watching_count", { count: activity.watchedCount })}
            </li>
            <li className="text-foreground/90 py-3">
              {t("pending_challenges_count", { count: activity.pendingChallengeCount })}
              <span className="text-muted-foreground mx-1.5" aria-hidden>
                ·
              </span>
              <span className="text-foreground/90">
                {t("accepted_challenges_count", { count: activity.acceptedChallengeCount })}
              </span>
            </li>
            {activity.pendingChallengeCount + activity.acceptedChallengeCount > 0 && (
              <li className="py-3">
                <Link
                  href={`/u/${profile.githubLogin}/challenges`}
                  className="text-accent text-sm underline-offset-2 hover:underline"
                >
                  {t("view_all_challenges_link")}
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>
    </main>
  );
}
