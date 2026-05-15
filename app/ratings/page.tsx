import Link from "next/link";
import { allRatingActions, diffRatingAction, type RatingAction } from "@/lib/content/load-ratings";
import { problems } from "#site/content";

export const metadata = {
  title: "Rating actions",
  description:
    "Public, append-only log of every rating action across LLM OpenProblems. Mirrors S&P / Moody's / Fitch rating-action conventions — prior → new, per dimension, with rationale.",
};

function titleOf(slug: string): string {
  return problems.find((p) => p.slug === slug)?.title ?? slug;
}

function formatDate(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return "";
}

function anchorIdFromActionId(actionId: string): string {
  const m = actionId.match(/^[^/]+\/(.+)$/);
  return m?.[1] ?? actionId;
}

export default function RatingsFeedPage() {
  const actions = allRatingActions();
  // For each action, find its chronological predecessor (within the same
  // problem) so the feed can render a delta summary alongside.
  const priorByActionId = new Map<string, RatingAction>();
  const byProblem = new Map<string, RatingAction[]>();
  for (const a of actions) {
    const arr = byProblem.get(a.problem_slug) ?? [];
    arr.push(a);
    byProblem.set(a.problem_slug, arr);
  }
  for (const arr of byProblem.values()) {
    // arr is newest-first within problem; iterate oldest-first to chain prior.
    const oldestFirst = arr.slice().reverse();
    for (let i = 1; i < oldestFirst.length; i++) {
      priorByActionId.set(oldestFirst[i]!.id, oldestFirst[i - 1]!);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Rating actions
        </h1>
        <p className="text-muted-foreground mt-3 max-w-prose text-sm">
          Public, append-only log of every rating action across LLM OpenProblems. Mirrors S&amp;P /
          Moody&apos;s / Fitch rating-action conventions — prior → new, per dimension, with
          rationale. Newest first.
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          Subscribe via{" "}
          <Link
            href="/api/v1/rss.xml"
            className="hover:text-foreground font-mono underline-offset-2 hover:underline"
          >
            RSS
          </Link>{" "}
          ·{" "}
          <Link
            href="/api/v1/ratings"
            className="hover:text-foreground font-mono underline-offset-2 hover:underline"
          >
            JSON
          </Link>
        </p>
      </header>

      {actions.length === 0 ? (
        <section
          aria-label="No actions"
          className="border-border mt-10 rounded border border-dashed p-6 text-center"
        >
          <p className="text-muted-foreground text-sm">
            No rating actions on disk yet. (Unreachable state — every problem ships with at least
            one initial action.)
          </p>
        </section>
      ) : (
        <ol className="mt-10 divide-y divide-[var(--border)]" aria-label="Rating actions feed">
          {actions.map((action) => {
            const prior = priorByActionId.get(action.id);
            const diff = diffRatingAction(action, prior);
            const primary = diff.deltas.find((d) => d.primary);
            const dateStr = formatDate(action.date);
            const anchor = anchorIdFromActionId(action.id);
            return (
              <li key={action.id} className="py-4">
                <article>
                  <p className="text-muted-foreground font-mono text-xs">
                    <time dateTime={dateStr}>{dateStr}</time> ·{" "}
                    <span className="text-foreground">{action.curator}</span> · v
                    {action.methodology_version}
                  </p>
                  <h2 className="mt-1 font-serif text-lg font-semibold">
                    <Link
                      href={`/problems/${action.problem_slug}/ratings#${anchor}`}
                      className="hover:text-accent underline-offset-2 hover:underline"
                    >
                      {titleOf(action.problem_slug)}
                    </Link>{" "}
                    <span className="text-muted-foreground text-sm font-normal">
                      — {prior ? "revision" : "initial action"}
                    </span>
                  </h2>
                  {primary ? (
                    <p className="mt-1">
                      <span className="inline-block rounded-full bg-[var(--color-chart-2)]/15 px-2 py-0.5 font-mono text-xs text-[var(--color-chart-2)]">
                        {primary.summary}
                      </span>
                    </p>
                  ) : !prior ? (
                    <p className="text-muted-foreground mt-1 text-xs italic">
                      Initial action — no prior to diff against.
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-1 text-xs italic">
                      Rationale-only refresh (no dimensional change).
                    </p>
                  )}
                  {diff.watchlistChanged ? (
                    <p className="mt-1">
                      <span className="inline-block rounded-full bg-[var(--color-chart-3)]/15 px-2 py-0.5 font-mono text-xs text-[var(--color-chart-3)]">
                        watchlist {String(diff.priorWatchlist)} → {String(diff.newWatchlist)}
                      </span>
                    </p>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
