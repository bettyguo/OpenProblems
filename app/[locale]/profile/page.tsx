import { eq } from "drizzle-orm";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { problems } from "#site/content";

import { ProfileImageUploadField } from "@/components/profile-image-upload-field";
import { StatusPill } from "@/components/ui/status-pill";
import { WatchlistToggle } from "@/components/watchlist-toggle";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import {
  getUserChallenges,
  isAllowedWithdrawal,
  withdrawChallenge,
  type ChallengeStatus,
} from "@/lib/rating-challenges";
import {
  clearProfileImage,
  MAX_BIO_CHARS,
  MAX_DISPLAY_NAME_CHARS,
  updateProfile,
  updateProfileImage,
} from "@/lib/users";
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
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) redirect("/en/profile");
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/api/auth/signin/github?callbackUrl=/${locale}/profile`);
  }

  const t = await getTranslations("profile");
  const tE = await getTranslations("profile_edit");
  const userId = session.user.id;
  const sp = await searchParams;
  const editSaved = sp.saved === "1";
  const imageSaved = sp.saved === "image";
  const imageCleared = sp.saved === "image-cleared";
  const editError = typeof sp.error === "string" ? sp.error : null;

  const [userRow] = await db
    .select({
      githubLogin: users.githubLogin,
      displayName: users.displayName,
      bio: users.bio,
      imageOverride: users.imageOverride,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const githubLogin = userRow?.githubLogin ?? null;
  const currentDisplayName = userRow?.displayName ?? "";
  const currentBio = userRow?.bio ?? "";
  // ADR-0017 D-E own-surface image fallback chain: imageOverride →
  // GitHub-derived session.user.image → null (placeholder rendered
  // inside the field component when null).
  const currentAvatar = userRow?.imageOverride ?? session.user.image ?? null;

  const watchedSlugs = await getWatchedSlugs(userId);
  const watched = watchedSlugs
    .map((slug) => problems.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const challenges = await getUserChallenges(userId);
  const tRC = await getTranslations("rating_challenge");

  const updateProfileAction = async (formData: FormData) => {
    "use server";
    const actionSession = await auth();
    if (!actionSession?.user?.id) {
      redirect(`/api/auth/signin/github?callbackUrl=/${locale}/profile`);
    }
    const displayNameRaw = String(formData.get("displayName") ?? "");
    const bioRaw = String(formData.get("bio") ?? "");
    const err = await updateProfile(actionSession.user.id, {
      displayName: displayNameRaw,
      bio: bioRaw,
    });
    revalidatePath(`/[locale]/profile`, "page");
    if (err) {
      redirect(`/${locale}/profile?error=${encodeURIComponent(err)}`);
    }
    redirect(`/${locale}/profile?saved=1`);
  };

  const updateProfileImageAction = async (formData: FormData) => {
    "use server";
    const actionSession = await auth();
    if (!actionSession?.user?.id) {
      redirect(`/api/auth/signin/github?callbackUrl=/${locale}/profile`);
    }
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      revalidatePath(`/[locale]/profile`, "page");
      redirect(
        `/${locale}/profile?error=${encodeURIComponent("Please select an image to upload.")}`,
      );
    }
    const err = await updateProfileImage(actionSession.user.id, file);
    revalidatePath(`/[locale]/profile`, "page");
    if (err) {
      redirect(`/${locale}/profile?error=${encodeURIComponent(err)}`);
    }
    redirect(`/${locale}/profile?saved=image`);
  };

  const clearProfileImageAction = async () => {
    "use server";
    const actionSession = await auth();
    if (!actionSession?.user?.id) {
      redirect(`/api/auth/signin/github?callbackUrl=/${locale}/profile`);
    }
    await clearProfileImage(actionSession.user.id);
    revalidatePath(`/[locale]/profile`, "page");
    redirect(`/${locale}/profile?saved=image-cleared`);
  };

  const withdrawChallengeAction = async (formData: FormData) => {
    "use server";
    const actionSession = await auth();
    if (!actionSession?.user?.id) {
      redirect(`/api/auth/signin/github?callbackUrl=/${locale}/profile`);
    }
    const challengeId = String(formData.get("challengeId") ?? "");
    if (!challengeId) {
      redirect(`/${locale}/profile`);
    }
    try {
      await withdrawChallenge(challengeId, actionSession.user.id);
    } catch {
      // Swallow — concurrent withdrawal / terminal state / not-your-challenge
      // surface as no-op; re-render will reflect the actual state.
    }
    revalidatePath(`/[locale]/profile`, "page");
    redirect(`/${locale}/profile`);
  };

  // ADR-0016 D-E fallback chain for the signed-in own surface. Extends
  // Phase-10's original `name → githubLogin → email` chain with the
  // user-controlled `displayName` override at the top. Email surfaces
  // only here (own pill) — ADR-0015 D-A invariant preserved on public
  // surfaces.
  const displayName =
    userRow?.displayName ??
    session.user.name ??
    githubLogin ??
    session.user.email ??
    t("display_name_fallback");

  return (
    <main className="mx-auto max-w-prose px-6 py-12">
      <header className="flex items-center gap-4">
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

      <section aria-label={tE("aria_label")} className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">{tE("heading")}</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {tE("description", { login: githubLogin ?? "you" })}
        </p>

        {editSaved && (
          <p
            role="status"
            className="mt-4 rounded border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-100"
          >
            {tE("success_message")}
          </p>
        )}
        {imageSaved && (
          <p
            role="status"
            className="mt-4 rounded border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-100"
          >
            {tE("image_success_message")}
          </p>
        )}
        {imageCleared && (
          <p
            role="status"
            className="mt-4 rounded border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-100"
          >
            {tE("image_remove_success_message")}
          </p>
        )}
        {editError && (
          <p
            role="alert"
            className="mt-4 rounded border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-700/40 dark:bg-red-900/20 dark:text-red-100"
          >
            <span className="font-medium">{tE("error_label")}:</span> {editError}
          </p>
        )}

        <form action={updateProfileAction} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-foreground text-sm font-medium">{tE("display_name_label")}</span>
            <input
              name="displayName"
              type="text"
              defaultValue={currentDisplayName}
              maxLength={MAX_DISPLAY_NAME_CHARS}
              placeholder={tE("display_name_placeholder")}
              className="border-border bg-background focus-visible:ring-ring mt-1.5 block w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
            <span className="text-muted-foreground mt-1 block text-xs">
              {tE("display_name_hint")}
            </span>
          </label>

          <label className="block">
            <span className="text-foreground text-sm font-medium">{tE("bio_label")}</span>
            <textarea
              name="bio"
              defaultValue={currentBio}
              maxLength={MAX_BIO_CHARS}
              rows={4}
              placeholder={tE("bio_placeholder")}
              className="border-border bg-background focus-visible:ring-ring mt-1.5 block w-full resize-y rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
            <span className="text-muted-foreground mt-1 block text-xs">{tE("bio_hint")}</span>
          </label>

          <button
            type="submit"
            className={cn(
              "border-border bg-foreground text-background inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium",
              "hover:bg-foreground/90 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              "transition-colors",
            )}
          >
            {tE("save_button")}
          </button>
        </form>
      </section>

      <section aria-label={tE("image_aria_label")} className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">{tE("image_heading")}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{tE("image_description")}</p>

        <form
          action={updateProfileImageAction}
          encType="multipart/form-data"
          className="mt-6 space-y-4"
        >
          <ProfileImageUploadField
            name="image"
            currentSrc={currentAvatar}
            accept="image/jpeg,image/png,image/webp"
            labels={{
              field: tE("image_label"),
              hint: tE("image_hint"),
              currentImage: tE("image_current_label"),
            }}
          />
          <button
            type="submit"
            className={cn(
              "border-border bg-foreground text-background inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium",
              "hover:bg-foreground/90 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
              "transition-colors",
            )}
          >
            {tE("image_upload_button")}
          </button>
        </form>

        {userRow?.imageOverride && (
          <form action={clearProfileImageAction} className="mt-3">
            <button
              type="submit"
              aria-label={tE("image_remove_aria_label")}
              className={cn(
                "border-border bg-background text-muted-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium",
                "hover:text-foreground hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                "transition-colors",
              )}
            >
              {tE("image_remove_button")}
            </button>
          </form>
        )}
      </section>

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
              const reviewedDate = challenge.reviewedAt
                ? challenge.reviewedAt.toISOString().slice(0, 10)
                : null;
              const status = challenge.status as ChallengeStatus;
              const canWithdraw = isAllowedWithdrawal(status);
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
                    <span
                      className={cn(
                        "ml-2 rounded-full px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase",
                        status === "accepted"
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : status === "rejected"
                            ? "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200"
                            : status === "withdrawn"
                              ? "bg-muted/60 text-muted-foreground"
                              : "bg-muted text-foreground",
                      )}
                    >
                      {t(`challenges_status_${challenge.status}`)}
                    </span>
                  </p>
                  <p className="text-foreground/90 mt-2 text-sm">
                    {truncateRationale(challenge.rationale)}
                  </p>
                  {challenge.reviewNotes && (status === "accepted" || status === "rejected") && (
                    <div className="border-border bg-muted/40 mt-3 rounded border p-3">
                      <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                        {t("challenges_curator_notes_label")}
                        {reviewedDate && (
                          <>
                            <span className="mx-1.5" aria-hidden>
                              ·
                            </span>
                            <time dateTime={reviewedDate} className="font-mono">
                              {reviewedDate}
                            </time>
                          </>
                        )}
                      </p>
                      <p className="text-foreground/90 mt-1 text-sm whitespace-pre-wrap">
                        {truncateRationale(challenge.reviewNotes)}
                      </p>
                    </div>
                  )}
                  {status === "accepted" && challenge.acceptedActionId && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      <span>{t("challenges_action_attached_label")}</span>
                      <span className="ml-1.5 font-mono">{challenge.acceptedActionId}</span>
                    </p>
                  )}
                  {canWithdraw && (
                    <form action={withdrawChallengeAction} className="mt-3">
                      <input type="hidden" name="challengeId" value={challenge.id} />
                      <button
                        type="submit"
                        className={cn(
                          "border-border bg-background text-muted-foreground inline-flex h-7 items-center justify-center rounded-md border px-2 text-[11px] font-medium",
                          "hover:text-foreground hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                          "transition-colors",
                        )}
                        aria-label={t("challenges_withdraw_aria_label")}
                      >
                        {t("challenges_withdraw")}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
