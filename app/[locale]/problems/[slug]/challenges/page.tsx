import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { problems } from "#site/content";

import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getPublicChallengesByProblem } from "@/lib/rating-challenges";
import { cn } from "@/lib/utils";

/**
 * `/[locale]/problems/[slug]/challenges` — per-problem public listing
 * of community-submitted rating challenges (Unit 13.3; Q58 lean #2).
 *
 * **First read-side public page route** for USER-STATE content. Renders
 * unauthenticated; no auth gate. Per-status visibility enforced
 * server-side by `getPublicChallengesByProblem` (returns only
 * `submitted` + `under_review` + `accepted`; per Unit 13.0 D-3).
 *
 * Layout per Unit 13.0 D-5:
 * - Back-to-problem link.
 * - Page heading + description.
 * - Empty state OR dense list of public challenges (newest first).
 * - Per row: submitter `@githubLogin` + submitted-date + dimension +
 *   proposedValue + status pill + truncated rationale + (when accepted)
 *   acceptedActionId reference.
 *
 * `force-dynamic`: DB reads on every request; not SSG-able. Matches
 * Phase-12 curator dashboard SSR strategy.
 */

export const dynamic = "force-dynamic";

const RATIONALE_PREVIEW_CHARS = 200;

function truncateRationale(rationale: string): string {
  if (rationale.length <= RATIONALE_PREVIEW_CHARS) return rationale;
  return rationale.slice(0, RATIONALE_PREVIEW_CHARS).trimEnd() + "…";
}

interface ChallengesPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function PublicChallengesListPage({ params }: ChallengesPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const problem = problems.find((p) => p.slug === slug);
  if (!problem) notFound();

  const t = await getTranslations("public_challenges");
  const tRC = await getTranslations("rating_challenge");

  const rows = await getPublicChallengesByProblem(slug);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="mb-6">
        <Link
          href={`/problems/${slug}`}
          className="text-accent text-sm underline-offset-2 hover:underline"
        >
          {t("back_to_problem")}
        </Link>
      </nav>

      <header>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t("page_heading")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          <span className="font-mono">{problem.title}</span>
        </p>
        <p className="text-muted-foreground mt-3 text-sm">{t("page_description")}</p>
      </header>

      <section aria-label={t("aria_label")} className="mt-8">
        {rows.length === 0 ? (
          <div className="border-border mt-6 rounded border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">{t("empty_message")}</p>
            <Link
              href={`/problems/${slug}#rating-challenge`}
              className="text-accent mt-3 inline-block text-sm underline-offset-2 hover:underline"
            >
              {t("empty_cta")}
            </Link>
          </div>
        ) : (
          <ul className="border-border mt-6 divide-y divide-current/10 border-t border-b">
            {rows.map((row) => {
              const submittedDate = row.submittedAt.toISOString().slice(0, 10);
              return (
                <li key={row.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-muted-foreground text-xs">
                      {row.submitterLogin
                        ? t("submitter_label", { login: row.submitterLogin })
                        : t("submitter_unknown")}
                    </p>
                    <time
                      dateTime={submittedDate}
                      className="text-muted-foreground font-mono text-xs"
                    >
                      {submittedDate}
                    </time>
                  </div>
                  <p className="text-muted-foreground mt-1.5 text-xs">
                    <span className="font-medium">{tRC(`dim_${row.dimension}`)}</span>
                    <span className="mx-1.5" aria-hidden>
                      →
                    </span>
                    <span className="font-mono">{row.proposedValue}</span>
                    <span
                      className={cn(
                        "ml-2 rounded-full px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase",
                        row.status === "accepted"
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : row.status === "under_review"
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
                            : "bg-muted text-foreground",
                      )}
                    >
                      {t(`status_${row.status}`)}
                    </span>
                  </p>
                  <div className="mt-2">
                    <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                      {t("rationale_label")}
                    </p>
                    <p className="text-foreground/90 mt-1 text-sm whitespace-pre-wrap">
                      {truncateRationale(row.rationale)}
                    </p>
                  </div>
                  {row.status === "accepted" && row.acceptedActionId && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      <span>{t("action_attached_label")}</span>
                      <span className="ml-1.5 font-mono">{row.acceptedActionId}</span>
                    </p>
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
