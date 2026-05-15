import Link from "next/link";
import { notFound } from "next/navigation";
import { allProblemSlugs, loadProblem } from "@/lib/content/load-problem";
import {
  diffRatingAction,
  ratingActionsForProblem,
  type RatingAction,
  type RatingActionDelta,
} from "@/lib/content/load-ratings";

interface RatingsPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allProblemSlugs().map((slug) => ({ slug }));
}

function formatDate(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return "";
}

function anchorIdFromActionId(actionId: string): string {
  // id is "<slug>/<filename-without-extension>" — anchor strips the leading slug.
  const m = actionId.match(/^[^/]+\/(.+)$/);
  return m?.[1] ?? actionId;
}

export default async function RatingsPage({ params }: RatingsPageProps) {
  const { slug } = await params;
  const loaded = loadProblem(slug);
  if (!loaded) notFound();

  const { problem } = loaded;
  // ratingActionsForProblem returns newest-first; pair each with its prior
  // (chronological predecessor) for diff computation.
  const actions = ratingActionsForProblem(slug);
  const oldestFirst = actions.slice().reverse();
  const priorById = new Map<string, RatingAction>();
  for (let i = 1; i < oldestFirst.length; i++) {
    priorById.set(oldestFirst[i]!.id, oldestFirst[i - 1]!);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3 text-xs">
        <Link href="/problems" className="hover:text-foreground underline-offset-2 hover:underline">
          Problems
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={`/problems/${slug}`}
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          {problem.title}
        </Link>
        <span aria-hidden> / </span>
        <span>Rating actions</span>
      </nav>

      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {problem.title} — rating actions
      </h1>
      <p className="text-muted-foreground mt-3 max-w-prose text-sm">
        Append-only history of every rating action on this problem (§8.5; ADR-0005). Each action is
        a complete snapshot of all five dimensions, dated, signed, and immutable. Earlier actions
        are not silently re-graded under newer methodology versions.
      </p>

      {actions.length === 0 ? (
        <section
          aria-label="No actions"
          className="border-border mt-10 rounded border border-dashed p-6 text-center"
        >
          <p className="text-muted-foreground text-sm">
            No rating actions on disk yet — every problem ships with at least an initial action, so
            this state should be unreachable. If you see it, the problem.yaml exists but the
            ratings/ directory is empty (a Phase-1 seeding gap).
          </p>
        </section>
      ) : (
        <ol className="mt-10 space-y-12" aria-label="Rating actions, newest first">
          {actions.map((action) => {
            const prior = priorById.get(action.id);
            const diff = diffRatingAction(action, prior);
            const anchor = anchorIdFromActionId(action.id);
            return (
              <li key={action.id} id={anchor} className="scroll-mt-20">
                <ActionCard action={action} diff={diff} prior={prior} />
              </li>
            );
          })}
        </ol>
      )}

      <p className="text-muted-foreground mt-12 text-xs">
        <Link
          href={`/problems/${slug}`}
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          ← back to {problem.title}
        </Link>
      </p>
    </main>
  );
}

function ActionCard({
  action,
  diff,
  prior,
}: {
  action: RatingAction;
  diff: ReturnType<typeof diffRatingAction>;
  prior: RatingAction | undefined;
}) {
  const date = formatDate(action.date);
  return (
    <article aria-labelledby={`heading-${anchorIdFromActionId(action.id)}`}>
      <header className="border-border border-b pb-3">
        <h2
          id={`heading-${anchorIdFromActionId(action.id)}`}
          className="font-serif text-xl font-semibold tracking-tight"
        >
          <time dateTime={date} className="font-mono">
            {date}
          </time>{" "}
          — {prior ? "Revision" : "Initial action"}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Curator <span className="text-foreground font-mono">{action.curator}</span> · methodology{" "}
          <span className="text-foreground font-mono">v{action.methodology_version}</span>
          {action.watchlist ? (
            <>
              {" "}
              ·{" "}
              <span className="inline-flex items-center rounded-full bg-[var(--color-chart-3)]/15 px-2 py-0.5 font-mono text-[var(--color-chart-3)]">
                WATCH
              </span>
            </>
          ) : null}
        </p>
      </header>

      {prior && diff.deltas.length > 0 ? (
        <DiffSummary deltas={diff.deltas} />
      ) : prior ? (
        <p className="text-muted-foreground mt-3 text-xs italic">
          No dimensional change vs. the prior action (rationale-only refresh).
        </p>
      ) : null}

      {diff.watchlistChanged ? (
        <p className="mt-2 text-xs">
          <span className="font-mono">
            watchlist {String(diff.priorWatchlist)} → {String(diff.newWatchlist)}
          </span>
        </p>
      ) : null}

      <DimensionsBlock action={action} />

      {action.signals_considered && action.signals_considered.length > 0 ? (
        <section aria-label="Signals considered" className="mt-4">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Signals considered
          </h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
            {action.signals_considered.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function DiffSummary({ deltas }: { deltas: RatingActionDelta[] }) {
  return (
    <section aria-label="Changes vs. prior action" className="mt-3">
      <ul className="space-y-1">
        {deltas.map((d, i) => (
          <li key={i} className="text-sm">
            <span
              className={
                d.primary
                  ? "rounded-full bg-[var(--color-chart-2)]/15 px-2 py-0.5 font-mono text-[var(--color-chart-2)]"
                  : "text-muted-foreground font-mono"
              }
            >
              {d.summary}
            </span>
            {d.confidenceDelta !== 0 && !d.summary.includes("confidence") ? (
              <span className="text-muted-foreground ml-2 font-mono text-xs">
                (Δ confidence {d.confidenceDelta > 0 ? "+" : ""}
                {d.confidenceDelta.toFixed(2)})
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DimensionsBlock({ action }: { action: RatingAction }) {
  const { difficulty, saturation, urgency, value, industry_call } = action.dimensions;
  return (
    <dl className="mt-6 grid gap-4 sm:grid-cols-2">
      <DimensionCard
        label="Difficulty"
        head={difficulty.grade}
        confidence={difficulty.confidence}
        rationale={difficulty.rationale}
      />
      <DimensionCard
        label="Saturation"
        head={String(saturation.value)}
        confidence={saturation.confidence}
        rationale={saturation.rationale}
      />
      <DimensionCard
        label="Urgency"
        head={`${"★".repeat(urgency.stars)}${"☆".repeat(5 - urgency.stars)}`}
        confidence={urgency.confidence}
        rationale={urgency.rationale}
      />
      <DimensionCard
        label="Value"
        head={`${"★".repeat(value.stars)}${"☆".repeat(5 - value.stars)}`}
        confidence={value.confidence}
        rationale={value.rationale}
      />
      <DimensionCard
        label="Industry call"
        head={`${"★".repeat(industry_call.stars)}${"☆".repeat(5 - industry_call.stars)}`}
        confidence={industry_call.confidence}
        rationale={industry_call.rationale}
      />
    </dl>
  );
}

function DimensionCard({
  label,
  head,
  confidence,
  rationale,
}: {
  label: string;
  head: string;
  confidence: number;
  rationale: string;
}) {
  return (
    <div className="border-border rounded border p-3">
      <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-2xl tracking-tight">{head}</span>
          <span className="text-muted-foreground font-mono text-xs">
            conf {confidence.toFixed(2)}
          </span>
        </div>
        <p className="mt-2 text-xs whitespace-pre-line">{rationale}</p>
      </dd>
    </div>
  );
}
