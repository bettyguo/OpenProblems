# MoversBoard

Phase 3 catalog item 3 (§11). Bloomberg-style table of recent rating moves with saturation sparkline columns. Renders on `/trending` (Unit 3.7).

## Data shape

```ts
interface MoverRow {
  actionId: string; // "<slug>/<filename-without-extension>"
  problemSlug: string;
  problemTitle: string;
  date: string; // ISO YYYY-MM-DD
  curator: string;
  primaryDeltaSummary?: string; // from diffRatingAction's primary delta
  watchlistTransition?: { from: boolean; to: boolean };
  sparkline: SparklinePoint[]; // full chronological saturation history
}

interface SparklinePoint {
  date: string;
  value: number | null;
  qualitative_band?: "low" | "medium" | "high"; // when value is null (ADR-0006)
}
```

The component is **presentational** — the consumer page (Unit 3.7's `/trending` route) does the window filtering, diff computation, and row shaping, then hands `MoverRow[]` to the component.

## Output

- Empty state: dashed-border section with copy citing the window length and Unit 3.0 D-8 ("Window anchored at the most-recent action date, not today's wall-clock").
- Non-empty: scrollable bordered table with header row + one `<tr>` per `MoverRow`.
- Columns: Date · Problem · Change · Watchlist · Curator · Saturation (sparkline).
- Problem title links to `/problems/<slug>/ratings#<filename-without-extension>` — deep-anchors to the matching `<article>` in Unit 3.3's per-problem ratings page.
- Sparkline: tiny 80×24 inline SVG line + dot per action's saturation. Same `--color-chart-2` hue as `SaturationCurve`. Qualitative points (ADR-0006) render as hollow circles; the line breaks around them.

## A11y

- `<section aria-label>` for the empty-state and non-empty wrappers.
- `<caption className="sr-only">` on the `<table>` describing the contents for screen readers.
- `<time datetime>` on every date cell.
- Per-sparkline `<svg role="img" aria-label="Saturation sparkline: N actions">`.
- Color tokens (`--color-chart-2`, `--color-chart-3`) meet AA contrast against `--background` per Unit 0.4 tokens authoring brief.

## Storybook stories

- `Q4Cohort` — 5 rows representing the Unit 3.1 q4 cohort (default 90-day window). Includes the mech-interp watchlist flip.
- `SingleWatchlistFlip` — just the mech-interp row, 30-day window.
- `Empty` — `rows: []`, renders the empty-state section.

## Where this renders

- `/trending` page (Unit 3.7). The page handler reads `recentRatingActions(windowDays)` from Unit 3.2's loader, computes diffs via `diffRatingAction`, and assembles `MoverRow[]`. Sparkline data comes from `ratingActionsForProblem(slug)` (full history per problem, not windowed).
- Table-fallback toggle: the table IS the fallback. No chart-only version of MoversBoard — it's tabular by design.

## Performance

Pure server-render. Inline sparkline SVGs (~700 bytes each). No client JS. Table virtualisation deliberately omitted — at the current corpus size (~20 rating actions) the full unwindowed table renders in a single viewport.
