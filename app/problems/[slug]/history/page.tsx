import Link from "next/link";
import { notFound } from "next/navigation";
import { papers } from "#site/content";
import { allProblemSlugs, loadProblem } from "@/lib/content/load-problem";
import { ratingActionsForProblem } from "@/lib/content/load-ratings";
import { SaturationCurve } from "@/components/viz/SaturationCurve";
import { RatingHistoryStream } from "@/components/viz/RatingHistoryStream";

interface HistoryPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allProblemSlugs().map((slug) => ({ slug }));
}

function toDateString(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return "";
}

interface TimelineEntry {
  date: string; // YYYY-MM-DD for sort; YYYY for paper years.
  sortKey: string; // ISO-comparable.
  kind: "paper" | "rating";
  label: string;
  href?: string;
}

function buildTimeline(slug: string): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // Papers contributing to this problem, dated by year.
  for (const p of papers) {
    const contributes = p.contributions.some((c) => c.problem_slug === slug);
    if (!contributes) continue;
    entries.push({
      date: String(p.year),
      sortKey: `${p.year}-01-01`,
      kind: "paper",
      label: p.title,
      href: `/papers/${p.id}`,
    });
  }

  // Rating actions on this problem.
  const actions = ratingActionsForProblem(slug);
  for (const a of actions) {
    const date = toDateString(a.date);
    entries.push({
      date,
      sortKey: date,
      kind: "rating",
      label: a.prior_action ? "Rating revision" : "Initial rating action",
      href: `/problems/${slug}/ratings#${a.id.replace(/^[^/]+\//, "")}`,
    });
  }

  // Sort ascending (oldest first) for a left-to-right timeline reading.
  entries.sort((x, y) => (x.sortKey < y.sortKey ? -1 : x.sortKey > y.sortKey ? 1 : 0));
  return entries;
}

export default async function HistoryPage({ params }: HistoryPageProps) {
  const { slug } = await params;
  const loaded = loadProblem(slug);
  if (!loaded) notFound();

  const { problem } = loaded;
  // Loader returns newest-first; reverse to chronological for the vizes.
  const actions = ratingActionsForProblem(slug).slice().reverse();
  const timeline = buildTimeline(slug);

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
        <span>History</span>
      </nav>

      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {problem.title} — history
      </h1>
      <p className="text-muted-foreground mt-3 max-w-prose text-sm">
        Three views on the rating history for this problem: a chronological ribbon of papers and
        rating actions, a saturation curve, and a stacked stream of all five rating dimensions over
        time. Per Unit 3.0 D-7, the three sections are stacked (not tabbed) so a top-to-bottom scan
        is the natural reading.
      </p>

      <p className="text-muted-foreground mt-3 text-xs">
        Jump:{" "}
        <a href="#timeline" className="hover:text-foreground underline-offset-2 hover:underline">
          Timeline
        </a>{" "}
        ·{" "}
        <a href="#saturation" className="hover:text-foreground underline-offset-2 hover:underline">
          Saturation
        </a>{" "}
        ·{" "}
        <a href="#dimensions" className="hover:text-foreground underline-offset-2 hover:underline">
          Dimensions
        </a>
      </p>

      <section id="timeline" aria-labelledby="timeline-heading" className="mt-12 scroll-mt-20">
        <h2 id="timeline-heading" className="font-serif text-xl font-semibold tracking-tight">
          Timeline
        </h2>
        <p className="text-muted-foreground mt-2 text-xs">
          Papers and rating actions interleaved, oldest first. The full force-graph TimelineRibbon
          viz (§11 catalog item 5) lands in Phase 4; this Phase-3 version is a compact chronological
          list.
        </p>
        {timeline.length === 0 ? (
          <p className="text-muted-foreground mt-4 text-sm italic">No timeline entries.</p>
        ) : (
          <ol className="mt-4 space-y-2 text-sm" aria-label="Chronological timeline">
            {timeline.map((e, i) => (
              <li key={`${e.sortKey}-${i}`} className="flex gap-4">
                <time
                  dateTime={e.sortKey}
                  className="text-muted-foreground w-20 shrink-0 font-mono text-xs"
                >
                  {e.date}
                </time>
                <span>
                  <span
                    className={
                      e.kind === "rating"
                        ? "text-muted-foreground mr-2 inline-block rounded-full bg-[var(--color-chart-2)]/15 px-2 py-0.5 font-mono text-xs text-[var(--color-chart-2)]"
                        : "text-muted-foreground mr-2 inline-block rounded-full bg-[var(--color-chart-4)]/15 px-2 py-0.5 font-mono text-xs text-[var(--color-chart-4)]"
                    }
                  >
                    {e.kind === "rating" ? "rating" : "paper"}
                  </span>
                  {e.href ? (
                    <Link
                      href={e.href}
                      className="hover:text-accent underline-offset-2 hover:underline"
                    >
                      {e.label}
                    </Link>
                  ) : (
                    e.label
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section id="saturation" aria-labelledby="saturation-heading" className="mt-12 scroll-mt-20">
        <h2 id="saturation-heading" className="font-serif text-xl font-semibold tracking-tight">
          Saturation curve
        </h2>
        <p className="text-muted-foreground mt-2 text-xs">
          Saturation value over time, against the §8.2 ceiling. Dashed line at 100 marks the upper
          bound (human-expert or theoretical). When no ceiling is defensible, saturation is plotted
          as a hollow N/A marker at the qualitative band's center-of-bucket (ADR-0006).
        </p>
        <div className="mt-4 overflow-x-auto">
          <SaturationCurve actions={actions} problemTitle={problem.title} width={520} />
        </div>
      </section>

      <section id="dimensions" aria-labelledby="dimensions-heading" className="mt-12 scroll-mt-20">
        <h2 id="dimensions-heading" className="font-serif text-xl font-semibold tracking-tight">
          Rating dimensions over time
        </h2>
        <p className="text-muted-foreground mt-2 text-xs">
          Stepped center-baseline stacked area of the five rating dimensions. Band thickness is each
          dimension's normalized [0, 5] value at the corresponding action date.
        </p>
        <div className="mt-4 overflow-x-auto">
          <RatingHistoryStream actions={actions} problemTitle={problem.title} width={560} />
        </div>
      </section>

      <p className="text-muted-foreground mt-16 text-xs">
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
