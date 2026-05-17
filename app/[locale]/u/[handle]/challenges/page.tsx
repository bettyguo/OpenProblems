import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { problems } from "#site/content";

import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { renderRationaleMarkdown } from "@/lib/markdown";
import { getPublicChallengesByUser } from "@/lib/rating-challenges";
import { getPublicProfileByHandle } from "@/lib/users";
import { cn } from "@/lib/utils";

/**
 * `/[locale]/u/[handle]/challenges` — per-user public listing of
 * rating challenges (Unit 14.4; **Q58 lean #3 closure** deferred from
 * Phase 13).
 *
 * Mirrors Phase-13 Unit 13.3's per-problem listing rotated by submitter
 * axis. Same row shape (`PublicChallengeRow`), same status-partition
 * filter (`PUBLIC_CHALLENGE_STATUSES` per ADR-0015 D-A + Phase-13 Unit
 * 13.0 D-3), same sort (`createdAt DESC`), same 200-char rationale
 * truncation precedent. Differs only on the column rendered alongside
 * the row (per-problem listing rendered submitter `@login`; this
 * per-user listing renders the problem title instead).
 *
 * Per ADR-0015 D-B: handle is matched case-insensitively via
 * `getPublicProfileByHandle`; URL `[handle]` segment is the link-time
 * choice (case preserved). 404 on no-match.
 *
 * `force-dynamic` per Unit 14.0 D-11: DB-backed read on every request.
 */

export const dynamic = "force-dynamic";

/**
 * Phase-27: shared prose-styling classes for markdown-rendered
 * rationale. Listing pages use `line-clamp-3` (visual truncation;
 * source-truncation incompatible with markdown — mid-tag truncation
 * risks breaking formatting per Phase-18 reviewNotes precedent).
 * Detail page uses the same classes WITHOUT `line-clamp-3` for full
 * render.
 */
const RATIONALE_PROSE_CLASSES = cn(
  "text-foreground/90 mt-1 text-sm",
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
);

interface PublicChallengesByUserPageProps {
  params: Promise<{ locale: string; handle: string }>;
}

export default async function PublicChallengesByUserPage({
  params,
}: PublicChallengesByUserPageProps) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const profile = await getPublicProfileByHandle(handle);
  if (!profile) notFound();

  const tPP = await getTranslations("public_profile");
  const tPC = await getTranslations("public_challenges");
  const tRC = await getTranslations("rating_challenge");

  const rows = await getPublicChallengesByUser(profile.userId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav className="mb-6">
        <Link
          href={`/u/${profile.githubLogin}`}
          className="text-accent text-sm underline-offset-2 hover:underline"
        >
          ← @{profile.githubLogin}
        </Link>
      </nav>

      <header>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          {tPP("challenges_page_title", { login: profile.githubLogin })}
        </h1>
      </header>

      <section
        aria-label={tPP("challenges_page_title", { login: profile.githubLogin })}
        className="mt-8"
      >
        {rows.length === 0 ? (
          <div className="border-border mt-6 rounded border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {tPP("challenges_empty_message", { login: profile.githubLogin })}
            </p>
            <Link
              href="/problems"
              className="text-accent mt-3 inline-block text-sm underline-offset-2 hover:underline"
            >
              {tPP("challenges_empty_cta")}
            </Link>
          </div>
        ) : (
          <ul className="border-border mt-6 divide-y divide-current/10 border-t border-b">
            {rows.map((row) => {
              const submittedDate = row.submittedAt.toISOString().slice(0, 10);
              const problem = problems.find((p) => p.slug === row.problemSlug);
              return (
                <li key={row.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <Link
                      href={`/problems/${row.problemSlug}`}
                      className="hover:text-accent font-serif text-base font-medium underline-offset-2 hover:underline"
                    >
                      {problem?.title ?? row.problemSlug}
                    </Link>
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
                      {tPC(`status_${row.status}`)}
                    </span>
                  </p>
                  <div className="mt-2">
                    <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                      {tPC("rationale_label")}
                    </p>
                    <div
                      className={cn(RATIONALE_PROSE_CLASSES, "line-clamp-3")}
                      dangerouslySetInnerHTML={{
                        __html: renderRationaleMarkdown(row.rationale),
                      }}
                    />
                  </div>
                  {row.status === "accepted" && row.acceptedActionId && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      <span>{tPC("action_attached_label")}</span>
                      <span className="ml-1.5 font-mono">{row.acceptedActionId}</span>
                    </p>
                  )}
                  <div className="mt-2">
                    <Link
                      href={`/u/${profile.githubLogin}/challenges/${row.id}`}
                      className="text-accent text-sm underline-offset-2 hover:underline"
                    >
                      {tPC("view_details")}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
