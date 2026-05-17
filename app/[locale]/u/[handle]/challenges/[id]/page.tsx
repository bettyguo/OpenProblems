import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { problems } from "#site/content";

import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { renderRationaleMarkdown, renderReviewNotesMarkdown } from "@/lib/markdown";
import { getPublicChallengeDetailById } from "@/lib/rating-challenges";
import { getPublicProfileByHandle } from "@/lib/users";
import { cn } from "@/lib/utils";

/**
 * `/[locale]/u/[handle]/challenges/[id]` — per-challenge detail page
 * (Phase-26 Unit 26.1; closes Phase-11 + Phase-13 carryover).
 *
 * **First user-facing UX since Phase 18** = 8 phases of curator/server-
 * only work; breaks the Phase 20-25 operational-script-keystone rhythm.
 *
 * Renders full rationale + (when accepted) reviewer info + reviewNotes
 * markdown + acceptedActionId filename. Public visibility per Phase-13
 * Unit 13.0 D-3: only `submitted` / `under_review` / `accepted` reach
 * unauthenticated viewers; rejected / withdrawn return 404 (privacy
 * preservation on editorial decisions + submitter change-of-mind).
 *
 * Server-side filters (in `getPublicChallengeDetailById`):
 *   1. challenge.id matches.
 *   2. challenge.userId === resolved profile.userId (prevents handle/id
 *      enumeration shopping).
 *   3. challenge.status ∈ PUBLIC_CHALLENGE_STATUSES.
 * Returns null on any filter miss → 404.
 *
 * Reviewer info (`reviewerLogin` / `reviewedAt` / `reviewNotes` /
 * `acceptedActionId`) shown ONLY when status === "accepted" per
 * `shouldShowReviewerInfo`. For `submitted` / `under_review`, the
 * helper returns null for those fields regardless of underlying DB
 * state (defense-in-depth vs UI filtering).
 *
 * `force-dynamic` per Unit 14.0 D-11: DB-backed read on every request.
 */

export const dynamic = "force-dynamic";

interface PublicChallengeDetailPageProps {
  params: Promise<{ locale: string; handle: string; id: string }>;
}

export default async function PublicChallengeDetailPage({
  params,
}: PublicChallengeDetailPageProps) {
  const { locale, handle, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const profile = await getPublicProfileByHandle(handle);
  if (!profile) notFound();

  const challenge = await getPublicChallengeDetailById({ id, profileUserId: profile.userId });
  if (!challenge) notFound();

  const t = await getTranslations("public_challenge_detail");
  const tPC = await getTranslations("public_challenges");
  const tRC = await getTranslations("rating_challenge");

  const submittedDate = challenge.submittedAt.toISOString().slice(0, 10);
  const reviewedDate = challenge.reviewedAt
    ? challenge.reviewedAt.toISOString().slice(0, 10)
    : null;
  const problem = problems.find((p) => p.slug === challenge.problemSlug);
  const rationaleHtml = renderRationaleMarkdown(challenge.rationale);
  const reviewNotesHtml = renderReviewNotesMarkdown(challenge.reviewNotes);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="mb-6">
        <Link
          href={`/u/${profile.githubLogin}/challenges`}
          className="text-accent text-sm underline-offset-2 hover:underline"
        >
          {t("back_to_challenges")}
        </Link>
      </nav>

      <header>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t("page_title")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          <span>{t("submitter_label")}</span>{" "}
          <Link
            href={`/u/${profile.githubLogin}`}
            className="text-accent underline-offset-2 hover:underline"
          >
            @{profile.githubLogin}
          </Link>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          <span>{t("submitted_at_label")}</span>{" "}
          <time dateTime={submittedDate} className="font-mono text-xs">
            {submittedDate}
          </time>
          <span
            className={cn(
              "ml-3 rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase",
              challenge.status === "accepted"
                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
                : challenge.status === "under_review"
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                  : "bg-muted text-foreground",
            )}
          >
            {tPC(`status_${challenge.status}`)}
          </span>
        </p>
      </header>

      <section aria-label={t("page_title")} className="mt-8 space-y-6">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6 sm:gap-y-3">
          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase sm:pt-1">
            {t("problem_label")}
          </dt>
          <dd>
            <Link
              href={`/problems/${challenge.problemSlug}`}
              className="hover:text-accent font-serif text-base font-medium underline-offset-2 hover:underline"
            >
              {problem?.title ?? challenge.problemSlug}
            </Link>
          </dd>

          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase sm:pt-1">
            {t("dimension_label")}
          </dt>
          <dd>{tRC(`dim_${challenge.dimension}`)}</dd>

          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase sm:pt-1">
            {t("proposed_value_label")}
          </dt>
          <dd className="font-mono">{challenge.proposedValue}</dd>
        </dl>

        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t("rationale_label")}
          </p>
          <div
            className={cn(
              "text-foreground/90 mt-2 text-sm",
              "[&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:underline",
              "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs",
              "[&_pre]:bg-muted [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:p-3",
              "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
              "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
              "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
              "[&_blockquote]:border-border [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic",
              "[&_hr]:border-border [&_hr]:my-3",
              "[&_p+p]:mt-2",
              "[&_h3]:mt-3 [&_h3]:font-serif [&_h3]:text-base [&_h3]:font-semibold",
              "[&_h4]:mt-2 [&_h4]:font-serif [&_h4]:text-sm [&_h4]:font-semibold",
              "[&_h5]:mt-2 [&_h5]:font-serif [&_h5]:text-sm [&_h5]:font-medium",
              "[&_h6]:mt-2 [&_h6]:font-serif [&_h6]:text-sm [&_h6]:font-medium",
            )}
            dangerouslySetInnerHTML={{ __html: rationaleHtml }}
          />
        </div>

        {challenge.status === "accepted" && (
          <div className="border-border space-y-4 border-t pt-6">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6 sm:gap-y-3">
              {challenge.reviewerLogin && (
                <>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase sm:pt-1">
                    {t("reviewer_label")}
                  </dt>
                  <dd>
                    <Link
                      href={`/u/${challenge.reviewerLogin}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      @{challenge.reviewerLogin}
                    </Link>
                  </dd>
                </>
              )}

              {reviewedDate && (
                <>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase sm:pt-1">
                    {t("reviewed_at_label")}
                  </dt>
                  <dd>
                    <time dateTime={reviewedDate} className="font-mono text-xs">
                      {reviewedDate}
                    </time>
                  </dd>
                </>
              )}

              {challenge.acceptedActionId && (
                <>
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase sm:pt-1">
                    {t("action_attached_label")}
                  </dt>
                  <dd className="font-mono text-xs">{challenge.acceptedActionId}</dd>
                </>
              )}
            </dl>

            {reviewNotesHtml && (
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("review_notes_label")}
                </p>
                <div
                  className={cn(
                    "mt-2 text-sm",
                    "[&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:underline",
                    "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs",
                    "[&_pre]:bg-muted [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:p-3",
                    "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
                    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
                    "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
                    "[&_blockquote]:border-border [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic",
                    "[&_hr]:border-border [&_hr]:my-3",
                    "[&_p+p]:mt-2",
                    "[&_h3]:mt-3 [&_h3]:font-serif [&_h3]:text-base [&_h3]:font-semibold",
                    "[&_h4]:mt-2 [&_h4]:font-serif [&_h4]:text-sm [&_h4]:font-semibold",
                    "[&_h5]:mt-2 [&_h5]:font-serif [&_h5]:text-sm [&_h5]:font-medium",
                    "[&_h6]:mt-2 [&_h6]:font-serif [&_h6]:text-sm [&_h6]:font-medium",
                  )}
                  dangerouslySetInnerHTML={{ __html: reviewNotesHtml }}
                />
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
