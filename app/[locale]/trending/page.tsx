import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { problems } from "#site/content";
import {
  allRatingActions,
  diffRatingAction,
  ratingActionsForProblem,
  recentRatingActions,
  type RatingAction,
} from "@/lib/content/load-ratings";
import { MoversBoard, type MoverRow, type SparklinePoint } from "@/components/viz/MoversBoard";
import { isLocale } from "@/lib/i18n/routing";

export const metadata = {
  title: "Trending",
  description:
    "Top rating moves over the last 90 days. Window is anchored at the most-recent action date (Unit 3.0 D-8); the time-cursor is the data, not the wall-clock.",
};

const DEFAULT_WINDOW_DAYS = 90;

function titleOf(slug: string): string {
  return problems.find((p) => p.slug === slug)?.title ?? slug;
}

function toDateString(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return "";
}

function sparklineFor(slug: string): SparklinePoint[] {
  const own = ratingActionsForProblem(slug).slice().reverse();
  return own.map((a) => {
    const s = a.dimensions.saturation;
    if (s.value !== null) {
      return { date: toDateString(a.date), value: s.value };
    }
    const band = s.qualitative_band ?? "medium";
    return { date: toDateString(a.date), value: null, qualitative_band: band };
  });
}

function rowFor(action: RatingAction, prior: RatingAction | undefined): MoverRow {
  const diff = diffRatingAction(action, prior);
  const primary = diff.deltas.find((d) => d.primary);
  const row: MoverRow = {
    actionId: action.id,
    problemSlug: action.problem_slug,
    problemTitle: titleOf(action.problem_slug),
    date: toDateString(action.date),
    curator: action.curator,
    sparkline: sparklineFor(action.problem_slug),
  };
  if (primary) row.primaryDeltaSummary = primary.summary;
  if (diff.watchlistChanged && diff.priorWatchlist !== undefined) {
    row.watchlistTransition = { from: diff.priorWatchlist, to: diff.newWatchlist };
  }
  return row;
}

interface TrendingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TrendingPage({ params }: TrendingPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const windowed = recentRatingActions(DEFAULT_WINDOW_DAYS);

  const allByProblem = new Map<string, RatingAction[]>();
  for (const a of allRatingActions()) {
    const arr = allByProblem.get(a.problem_slug) ?? [];
    arr.push(a);
    allByProblem.set(a.problem_slug, arr);
  }
  const priorByActionId = new Map<string, RatingAction>();
  for (const arr of allByProblem.values()) {
    const oldestFirst = arr.slice().reverse();
    for (let i = 1; i < oldestFirst.length; i++) {
      priorByActionId.set(oldestFirst[i]!.id, oldestFirst[i - 1]!);
    }
  }

  const rows: MoverRow[] = windowed.map((a) => rowFor(a, priorByActionId.get(a.id)));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Trending</h1>
        <p className="text-muted-foreground mt-3 max-w-prose text-sm">
          Recent rating moves across all open problems, newest first. The window covers the last{" "}
          <span className="text-foreground font-mono">{DEFAULT_WINDOW_DAYS} days</span> anchored at
          the most-recent action date in the corpus (not today&apos;s wall-clock — per Unit 3.0 D-8,
          so the page stays useful as simulated histories drift forward).
        </p>
      </header>

      <section className="mt-10">
        <MoversBoard rows={rows} windowDays={DEFAULT_WINDOW_DAYS} ariaLabel="Recent rating moves" />
      </section>
    </main>
  );
}
