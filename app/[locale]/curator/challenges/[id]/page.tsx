import { getTranslations, setRequestLocale } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { problems } from "#site/content";

import { auth } from "@/lib/auth";
import { isCurator } from "@/lib/auth/curator";
import { getLoginById } from "@/lib/auth/login";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import {
  attachAcceptedAction,
  getChallengeById,
  isAllowedReviewTransition,
  reviewChallenge,
  validateReviewNotes,
  type ChallengeStatus,
  type ReviewAction,
} from "@/lib/rating-challenges";
import { getCoIStatus } from "@/lib/rating-challenges/coi";
import { cn } from "@/lib/utils";

/**
 * `/[locale]/curator/challenges/[id]` — curator dashboard detail view (Unit 12.4).
 *
 * Per [ADR-0014](../../../../../../docs/adr/0014-curator-review-pipeline.md):
 * - Full rationale (not truncated; D-F).
 * - COI surface from `getCoIStatus` (D-C); hard-block disables buttons.
 * - Review form via inline server-actions ("use server"); each action
 *   re-validates session + curator-authz + transition + COI before invoking
 *   `reviewChallenge`. Mirrors Phase-11 `RatingChallengeForm`'s
 *   redirect-with-search-param error reporting pattern (zero client JS).
 * - "Attach action YAML" form (post-acceptance manual emission step 5,
 *   per D-D). Server-side validates the YAML file exists under
 *   `content/problems/<slug>/ratings/<filename>` before persisting.
 */

export const dynamic = "force-dynamic";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

interface CuratorChallengeDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<SearchParamsRecord>;
}

function pickString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function knownActionFilename(problemSlug: string, filename: string): boolean {
  // Defensive: only allow file names that match the project's
  // YYYY-MM-DD-<slug>.yaml shape. Server-side join to `#site/content` is
  // out of scope here; the file may not yet be picked up by Velite if it
  // was just committed. We accept any well-shaped filename; downstream
  // RSS / problem detail pages will reflect the file once Velite re-runs.
  if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.yaml$/i.test(filename)) return false;
  return Boolean(problems.find((p) => p.slug === problemSlug));
}

export default async function CuratorChallengeDetailPage({
  params,
  searchParams,
}: CuratorChallengeDetailPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) redirect("/en/curator/challenges");
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/api/auth/signin/github?callbackUrl=/${locale}/curator/challenges/${id}`);
  }
  const reviewerLogin = await getLoginById(session.user.id);
  if (!isCurator(reviewerLogin)) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("curator");
  const tRC = await getTranslations("rating_challenge");

  const challenge = await getChallengeById(id);
  if (!challenge) notFound();

  const problem = problems.find((p) => p.slug === challenge.problemSlug);
  const submitterLogin = await getLoginById(challenge.userId);

  const coi = getCoIStatus(reviewerLogin ?? "", challenge.problemSlug, submitterLogin);
  const submittedDate = challenge.createdAt.toISOString().slice(0, 10);
  const reviewedDate = challenge.reviewedAt
    ? challenge.reviewedAt.toISOString().slice(0, 10)
    : null;
  const currentStatus = challenge.status as ChallengeStatus;

  const params2: SearchParamsRecord = (await searchParams) ?? {};
  const reviewError = pickString(params2["review_error"]);
  const attachError = pickString(params2["attach_error"]);

  const submitReview = async (formData: FormData) => {
    "use server";
    const actionSession = await auth();
    if (!actionSession?.user?.id) {
      redirect(`/api/auth/signin/github?callbackUrl=/${locale}/curator/challenges/${id}`);
    }
    const actionReviewerLogin = await getLoginById(actionSession.user.id);
    if (!isCurator(actionReviewerLogin)) {
      redirect(`/${locale}/curator/challenges/${id}?review_error=forbidden`);
    }
    const action = formData.get("action");
    const notes = String(formData.get("notes") ?? "");
    if (action !== "start_review" && action !== "accept" && action !== "reject") {
      redirect(`/${locale}/curator/challenges/${id}?review_error=invalid_action`);
    }
    const reviewAction = action as ReviewAction;

    const current = await getChallengeById(id);
    if (!current) {
      redirect(`/${locale}/curator/challenges/${id}?review_error=not_found`);
    }
    const status = current.status as ChallengeStatus;
    if (!isAllowedReviewTransition(status, reviewAction)) {
      redirect(`/${locale}/curator/challenges/${id}?review_error=illegal_transition`);
    }
    const submitterLogin2 = await getLoginById(current.userId);
    const coi2 = getCoIStatus(actionReviewerLogin ?? "", current.problemSlug, submitterLogin2);
    if (coi2.blocked) {
      redirect(`/${locale}/curator/challenges/${id}?review_error=coi_blocked`);
    }
    const notesError = validateReviewNotes(notes, reviewAction);
    if (notesError) {
      redirect(`/${locale}/curator/challenges/${id}?review_error=notes_${reviewAction}`);
    }
    await reviewChallenge({
      challengeId: id,
      reviewerId: actionSession.user.id,
      action: reviewAction,
      notes,
    });
    revalidatePath(`/[locale]/curator/challenges/[id]`, "page");
    redirect(`/${locale}/curator/challenges/${id}`);
  };

  const attachActionYaml = async (formData: FormData) => {
    "use server";
    const actionSession = await auth();
    if (!actionSession?.user?.id) {
      redirect(`/api/auth/signin/github?callbackUrl=/${locale}/curator/challenges/${id}`);
    }
    const actionReviewerLogin = await getLoginById(actionSession.user.id);
    if (!isCurator(actionReviewerLogin)) {
      redirect(`/${locale}/curator/challenges/${id}?attach_error=forbidden`);
    }
    const filename = String(formData.get("filename") ?? "").trim();
    const current = await getChallengeById(id);
    if (!current) {
      redirect(`/${locale}/curator/challenges/${id}?attach_error=not_found`);
    }
    if (current.status !== "accepted") {
      redirect(`/${locale}/curator/challenges/${id}?attach_error=not_accepted`);
    }
    if (!filename || !knownActionFilename(current.problemSlug, filename)) {
      redirect(`/${locale}/curator/challenges/${id}?attach_error=invalid_filename`);
    }
    await attachAcceptedAction(id, filename);
    revalidatePath(`/[locale]/curator/challenges/[id]`, "page");
    redirect(`/${locale}/curator/challenges/${id}`);
  };

  const isTerminal =
    currentStatus === "accepted" || currentStatus === "rejected" || currentStatus === "withdrawn";
  const canStartReview = isAllowedReviewTransition(currentStatus, "start_review");
  const canAccept = isAllowedReviewTransition(currentStatus, "accept");
  const canReject = isAllowedReviewTransition(currentStatus, "reject");
  const reviewDisabled = coi.blocked || isTerminal;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="mb-6">
        <Link
          href="/curator/challenges"
          className="text-accent text-sm underline-offset-2 hover:underline"
        >
          {t("back_to_queue")}
        </Link>
      </nav>

      <header>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          {problem?.title ?? challenge.problemSlug}
        </h1>
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          {t("submitted_by", { login: submitterLogin ?? "unknown" })} · {submittedDate}
        </p>
      </header>

      <section aria-label={t("challenge_details_aria_label")} className="mt-8 space-y-3">
        <dl className="text-sm">
          <div className="flex gap-3">
            <dt className="text-muted-foreground w-32 shrink-0">{tRC("dimension_label")}</dt>
            <dd className="font-medium">{tRC(`dim_${challenge.dimension}`)}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="text-muted-foreground w-32 shrink-0">{tRC("proposed_value_label")}</dt>
            <dd className="font-mono">{challenge.proposedValue}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="text-muted-foreground w-32 shrink-0">{t("status_label")}</dt>
            <dd>
              <span className="bg-muted text-foreground rounded-full px-2 py-0.5 font-mono text-xs tracking-wide uppercase">
                {t(`status_${currentStatus}`)}
              </span>
            </dd>
          </div>
          {reviewedDate && (
            <div className="flex gap-3">
              <dt className="text-muted-foreground w-32 shrink-0">{t("reviewed_at")}</dt>
              <dd className="font-mono text-xs">{reviewedDate}</dd>
            </div>
          )}
        </dl>

        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {tRC("rationale_label")}
          </p>
          <p className="mt-2 text-sm whitespace-pre-wrap">{challenge.rationale}</p>
        </div>

        {challenge.reviewNotes && (
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {t("review_notes_label")}
            </p>
            <p className="mt-2 text-sm whitespace-pre-wrap">{challenge.reviewNotes}</p>
          </div>
        )}
      </section>

      {coi.warning && (
        <div
          role={coi.blocked ? "alert" : "status"}
          className={cn(
            "border-border mt-8 rounded border p-4 text-sm",
            coi.blocked ? "bg-red-50 dark:bg-red-950/30" : "bg-amber-50 dark:bg-amber-950/30",
          )}
        >
          <p className="font-medium">
            {coi.blocked ? t("coi_blocked_heading") : t("coi_warning_heading")}
          </p>
          <p className="text-muted-foreground mt-1">{coi.warning}</p>
        </div>
      )}

      {reviewError && (
        <div
          role="alert"
          className="border-border mt-6 rounded border bg-red-50 p-4 text-sm dark:bg-red-950/30"
        >
          <p className="font-medium">{t(`review_error_${reviewError}`)}</p>
        </div>
      )}

      {!isTerminal && (
        <form action={submitReview} className="mt-8 space-y-4">
          <h2 className="font-serif text-lg font-semibold tracking-tight">
            {t("review_form_heading")}
          </h2>
          <div>
            <label htmlFor="notes" className="text-sm font-medium">
              {t("notes_label")}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={6}
              maxLength={4000}
              className="border-border bg-background mt-1 w-full rounded border p-2 text-sm"
              placeholder={t("notes_placeholder")}
              disabled={reviewDisabled}
            />
            <p className="text-muted-foreground mt-1 text-xs">{t("notes_hint")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canStartReview && (
              <button
                type="submit"
                name="action"
                value="start_review"
                disabled={reviewDisabled}
                className={cn(
                  "border-border bg-background text-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium",
                  "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  "disabled:opacity-50",
                  "transition-colors",
                )}
              >
                {t("action_start_review")}
              </button>
            )}
            {canAccept && (
              <button
                type="submit"
                name="action"
                value="accept"
                disabled={reviewDisabled}
                className={cn(
                  "bg-accent text-accent-foreground inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-medium",
                  "hover:bg-accent/90 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  "disabled:opacity-50",
                  "transition-colors",
                )}
              >
                {t("action_accept")}
              </button>
            )}
            {canReject && (
              <button
                type="submit"
                name="action"
                value="reject"
                disabled={reviewDisabled}
                className={cn(
                  "border-border bg-background text-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium",
                  "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  "disabled:opacity-50",
                  "transition-colors",
                )}
              >
                {t("action_reject")}
              </button>
            )}
          </div>
        </form>
      )}

      {currentStatus === "accepted" && (
        <section aria-label={t("attach_action_aria_label")} className="mt-8">
          <h2 className="font-serif text-lg font-semibold tracking-tight">
            {t("attach_action_heading")}
          </h2>
          {challenge.acceptedActionId ? (
            <div className="border-border mt-4 rounded border p-4 text-sm">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {t("attach_action_attached_label")}
              </p>
              <p className="mt-1 font-mono">{challenge.acceptedActionId}</p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mt-2 text-sm">{t("attach_action_description")}</p>
              {attachError && (
                <div
                  role="alert"
                  className="border-border mt-4 rounded border bg-red-50 p-3 text-sm dark:bg-red-950/30"
                >
                  <p>{t(`attach_error_${attachError}`)}</p>
                </div>
              )}
              <form action={attachActionYaml} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="filename" className="text-sm font-medium">
                    {t("attach_action_filename_label")}
                  </label>
                  <input
                    id="filename"
                    name="filename"
                    type="text"
                    required
                    placeholder="2026-06-01-rating-update.yaml"
                    className="border-border bg-background mt-1 w-full rounded border p-2 font-mono text-sm"
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t("attach_action_filename_hint")}
                  </p>
                </div>
                <button
                  type="submit"
                  className={cn(
                    "border-border bg-background text-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium",
                    "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                    "transition-colors",
                  )}
                >
                  {t("attach_action_submit")}
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </main>
  );
}
