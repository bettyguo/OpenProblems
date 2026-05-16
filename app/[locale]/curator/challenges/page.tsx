import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { problems } from "#site/content";

import { auth } from "@/lib/auth";
import { isCurator } from "@/lib/auth/curator";
import { getLoginById } from "@/lib/auth/login";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { getPendingChallenges } from "@/lib/rating-challenges";

/**
 * `/[locale]/curator/challenges` — curator dashboard list view (Unit 12.4).
 *
 * Per [ADR-0014](../../../../../docs/adr/0014-curator-review-pipeline.md)
 * D-F:
 * - **Second protected page route** in the project (after Phase-10
 *   `/[locale]/profile`).
 * - **Page-local auth check** (mirrors profile-page pattern); middleware-
 *   based protection deferred until 3+ protected page routes per
 *   Phase-9 Class B item 12.
 * - **Curator-authz gate**: `isCurator(session.user.githubLogin)` per
 *   ADR-0014 D-B. Non-curators redirect to `/`.
 * - **Default filter**: `status ∈ {submitted, under_review}` (pending
 *   review queue; via `getPendingChallenges`).
 * - **Default sort**: `createdAt ASC` (fairness queue — oldest pending
 *   first). Client-side re-sort deferred to Phase 13+ via URL search params.
 */

export const dynamic = "force-dynamic";

interface CuratorChallengesPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CuratorChallengesPage({ params }: CuratorChallengesPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) redirect("/en/curator/challenges");
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/api/auth/signin/github?callbackUrl=/${locale}/curator/challenges`);
  }
  const callerLogin = await getLoginById(session.user.id);
  if (!isCurator(callerLogin)) {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("curator");
  const tRC = await getTranslations("rating_challenge");

  const pending = await getPendingChallenges();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{t("heading")}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{t("description")}</p>
      </header>

      <section aria-label={t("queue_aria_label")} className="mt-8">
        <h2 className="font-serif text-lg font-semibold tracking-tight">
          {t("queue_heading", { count: pending.length })}
        </h2>

        {pending.length === 0 ? (
          <div className="border-border mt-6 rounded border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">{t("empty_message")}</p>
          </div>
        ) : (
          <ul className="border-border mt-6 divide-y divide-current/10 border-t border-b">
            {pending.map((challenge) => {
              const problem = problems.find((p) => p.slug === challenge.problemSlug);
              const submittedDate = challenge.createdAt.toISOString().slice(0, 10);
              return (
                <li key={challenge.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <Link
                      href={`/curator/challenges/${challenge.id}`}
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
                  <p className="text-muted-foreground mt-1 text-xs">
                    <span className="font-medium">{tRC(`dim_${challenge.dimension}`)}</span>
                    <span className="mx-1.5" aria-hidden>
                      →
                    </span>
                    <span className="font-mono">{challenge.proposedValue}</span>
                    <span className="bg-muted text-foreground ml-2 rounded-full px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase">
                      {t(`status_${challenge.status}`)}
                    </span>
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
