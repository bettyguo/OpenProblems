import Link from "next/link";

/**
 * MoversBoard — Phase 3 catalog item 3 (§11).
 *
 * Bloomberg-style table of recent rating moves with sparkline columns.
 * Renders on the /trending page (Unit 3.7) over a date window (default
 * 90 days anchored at the most-recent action, per Unit 3.0 D-8).
 *
 * Designed as a presentational component — the consumer page (Unit 3.7's
 * trending route) does the data fetching, windowing, and per-row diff
 * computation, then hands a pre-shaped `MoverRow[]` to this component.
 */

export interface SparklinePoint {
  date: string;
  /** Numeric value when ceiling-defensible (0–100); null when N/A. */
  value: number | null;
  /** Qualitative band when value is null (ADR-0006); undefined for numeric points. */
  qualitative_band?: "low" | "medium" | "high";
}

export interface MoverRow {
  /** Stable id for the rating action this row represents. */
  actionId: string;
  /** Slug of the problem this action is on. */
  problemSlug: string;
  /** Display title of the problem. */
  problemTitle: string;
  /** ISO date (YYYY-MM-DD) of the action. */
  date: string;
  /** Curator who signed the action. */
  curator: string;
  /** "Headline" change one-liner from `diffRatingAction.deltas[primary]`. */
  primaryDeltaSummary?: string;
  /** When set, indicates the watchlist flipped on this action. */
  watchlistTransition?: { from: boolean; to: boolean };
  /** Full chronological saturation history for the problem (drives the sparkline column). */
  sparkline: SparklinePoint[];
}

export interface MoversBoardProps {
  rows: MoverRow[];
  ariaLabel?: string;
  /** Window the rows were filtered to, threaded into the empty-state copy. */
  windowDays?: number;
}

const BAND_TO_CENTER: Record<"low" | "medium" | "high", number> = {
  low: 20,
  medium: 50,
  high: 80,
};

const SPARK_W = 80;
const SPARK_H = 24;

function Sparkline({ points }: { points: SparklinePoint[] }) {
  if (points.length === 0) return null;
  const plotted = points.map((p) => {
    if (p.value !== null) return { date: p.date, value: p.value, isNa: false };
    const band = p.qualitative_band ?? "medium";
    return { date: p.date, value: BAND_TO_CENTER[band], isNa: true };
  });
  const xs = plotted.map((p) => new Date(p.date).getTime());
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const xPos = (ms: number): number => {
    if (maxX === minX) return SPARK_W / 2;
    return ((ms - minX) / (maxX - minX)) * (SPARK_W - 4) + 2;
  };
  const yPos = (v: number): number => SPARK_H - 2 - (v / 100) * (SPARK_H - 4);

  // Segment numeric runs into separate <path>s; qualitative points break the line.
  const segments: string[] = [];
  let run: typeof plotted = [];
  const flush = () => {
    if (run.length >= 2) {
      const d = run
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"} ${xPos(new Date(p.date).getTime()).toFixed(2)} ${yPos(p.value).toFixed(2)}`,
        )
        .join(" ");
      segments.push(d);
    }
    run = [];
  };
  for (const p of plotted) {
    if (p.isNa) flush();
    else run.push(p);
  }
  flush();

  return (
    <svg
      role="img"
      aria-label={`Saturation sparkline: ${plotted.length} action${plotted.length === 1 ? "" : "s"}`}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      width={SPARK_W}
      height={SPARK_H}
      className="block"
    >
      {segments.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="var(--color-chart-2)"
          strokeWidth={1.25}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {plotted.map((p, i) => (
        <circle
          key={i}
          cx={xPos(new Date(p.date).getTime())}
          cy={yPos(p.value)}
          r={p.isNa ? 2 : 1.75}
          fill={p.isNa ? "var(--color-background)" : "var(--color-chart-2)"}
          stroke="var(--color-chart-2)"
          strokeWidth={p.isNa ? 1 : 0.5}
        />
      ))}
    </svg>
  );
}

export function MoversBoard({
  rows,
  ariaLabel = "Recent rating moves",
  windowDays = 90,
}: MoversBoardProps) {
  if (rows.length === 0) {
    return (
      <section
        aria-label={ariaLabel}
        className="border-border rounded border border-dashed p-6 text-center"
      >
        <p className="text-muted-foreground text-sm">
          No rating moves in the last {windowDays} days.{" "}
          <span className="text-xs italic">
            (Window anchored at the most-recent action date, not today&apos;s wall-clock — per Unit
            3.0 D-8.)
          </span>
        </p>
      </section>
    );
  }

  return (
    <section aria-label={ariaLabel}>
      <div className="border-border overflow-x-auto rounded border">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Recent rating actions across all problems, newest first. Each row shows the headline
            change, the curator, and a saturation sparkline.
          </caption>
          <thead className="text-muted-foreground bg-muted text-xs">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Date</th>
              <th className="px-3 py-2 text-left font-medium">Problem</th>
              <th className="px-3 py-2 text-left font-medium">Change</th>
              <th className="px-3 py-2 text-left font-medium">Watchlist</th>
              <th className="px-3 py-2 text-left font-medium">Curator</th>
              <th className="px-3 py-2 text-left font-medium">Saturation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const anchor = row.actionId.replace(/^[^/]+\//, "");
              return (
                <tr key={row.actionId} className="border-border border-t">
                  <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                    <time dateTime={row.date}>{row.date}</time>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/problems/${row.problemSlug}/ratings#${anchor}`}
                      className="hover:text-accent underline-offset-2 hover:underline"
                    >
                      {row.problemTitle}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.primaryDeltaSummary ? (
                      <span className="inline-block rounded-full bg-[var(--color-chart-2)]/15 px-2 py-0.5 font-mono text-[var(--color-chart-2)]">
                        {row.primaryDeltaSummary}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {row.watchlistTransition ? (
                      <span className="inline-block rounded-full bg-[var(--color-chart-3)]/15 px-2 py-0.5 font-mono text-[var(--color-chart-3)]">
                        {String(row.watchlistTransition.from)} →{" "}
                        {String(row.watchlistTransition.to)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                    {row.curator}
                  </td>
                  <td className="px-3 py-2">
                    <Sparkline points={row.sparkline} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
