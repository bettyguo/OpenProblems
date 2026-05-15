import { ratings } from "#site/content";

/**
 * Cross-problem rating-action loader (Unit 3.2).
 *
 * Phase 3 surface that backs:
 *   - per-problem `/problems/[slug]/ratings` sub-page (Unit 3.3)
 *   - global `/ratings` HTML feed (Unit 3.4)
 *   - `/api/v1/ratings` JSON + `/api/v1/rss.xml` (Unit 3.5)
 *   - `/trending` MoversBoard window-filtering (Unit 3.7)
 *   - `SaturationCurve` / `RatingHistoryStream` data shaping (Units 3.6, 3.8, 3.9)
 *
 * Velite's `ratings` collection emits one entry per
 * `content/problems/<slug>/ratings/<filename>.yaml`. The Velite-side schema
 * (velite.config.ts `RatingActionS`) injects a stable `id` field via the
 * `s.path()` transform — `<problem_slug>/<filename-without-extension>` — used
 * here for lookup and downstream as a feed-guid + URL fragment.
 */

export type RatingAction = (typeof ratings)[number];

export type DimensionName = "difficulty" | "saturation" | "urgency" | "value" | "industry_call";

const STAR_DIMENSIONS = ["urgency", "value", "industry_call"] as const;
const CONFIDENCE_DELTA_THRESHOLD = 0.05;

export interface RatingActionDelta {
  dimension: DimensionName;
  /** Human-readable one-liner, e.g. "saturation 35 → 32" or "urgency ★4 → ★5". */
  summary: string;
  /** Signed change in confidence on this dimension. */
  confidenceDelta: number;
  /** Whether this delta is the "headline" change for feed display. */
  primary: boolean;
}

export interface RatingActionDiff {
  /** Empty for the initial action of a problem (no prior). */
  deltas: RatingActionDelta[];
  watchlistChanged: boolean;
  priorWatchlist?: boolean;
  newWatchlist: boolean;
}

function sortNewestFirst(arr: readonly RatingAction[]): RatingAction[] {
  return arr.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Every rating action across all problems, sorted newest-first. */
export function allRatingActions(): RatingAction[] {
  return sortNewestFirst(ratings);
}

/** Rating actions for one problem, sorted newest-first. */
export function ratingActionsForProblem(slug: string): RatingAction[] {
  return sortNewestFirst(ratings.filter((r) => r.problem_slug === slug));
}

/** Stable lookup by the Velite-injected id (`<slug>/<filename-without-extension>`). */
export function ratingActionById(id: string): RatingAction | undefined {
  return ratings.find((r) => r.id === id);
}

/**
 * Actions whose date falls within `windowDays` of an anchor date. The anchor
 * defaults to the most-recent action's date across the whole corpus (NOT
 * today's wall-clock) per Unit 3.0 D-8. This keeps `/trending` showing
 * relative motion against simulated rating histories rather than emptying
 * out when wall-clock time outruns the data.
 */
export function recentRatingActions(windowDays = 90, anchorDate?: string): RatingAction[] {
  const all = allRatingActions();
  if (all.length === 0) return [];
  const anchor = anchorDate ?? toIsoString(all[0]!.date);
  const anchorMs = Date.parse(anchor);
  const cutoffMs = anchorMs - windowDays * 24 * 60 * 60 * 1000;
  return all.filter((r) => {
    const t = Date.parse(toIsoString(r.date));
    return t >= cutoffMs && t <= anchorMs;
  });
}

/**
 * Compute the diff between an action and its prior action. One `RatingActionDelta`
 * per dimension where either the grade/value/stars changed OR the confidence
 * shifted by ≥ `CONFIDENCE_DELTA_THRESHOLD` (currently 0.05). When `prior` is
 * undefined (initial action) returns an empty deltas list with
 * `watchlistChanged = false`.
 *
 * The `primary` flag marks the headline change for feed display: the first
 * non-confidence-only delta, falling back to the first delta when every
 * change is confidence-only.
 */
export function diffRatingAction(
  action: RatingAction,
  prior: RatingAction | undefined,
): RatingActionDiff {
  if (!prior) {
    return { deltas: [], watchlistChanged: false, newWatchlist: action.watchlist };
  }
  const deltas: RatingActionDelta[] = [];

  // Difficulty (categorical grade + confidence).
  {
    const a = action.dimensions.difficulty;
    const p = prior.dimensions.difficulty;
    if (a.grade !== p.grade) {
      deltas.push({
        dimension: "difficulty",
        summary: `difficulty ${p.grade} → ${a.grade}`,
        confidenceDelta: a.confidence - p.confidence,
        primary: false,
      });
    } else if (Math.abs(a.confidence - p.confidence) >= CONFIDENCE_DELTA_THRESHOLD) {
      deltas.push({
        dimension: "difficulty",
        summary: `difficulty confidence ${p.confidence.toFixed(2)} → ${a.confidence.toFixed(2)}`,
        confidenceDelta: a.confidence - p.confidence,
        primary: false,
      });
    }
  }

  // Saturation (numeric value + confidence).
  {
    const a = action.dimensions.saturation;
    const p = prior.dimensions.saturation;
    if (a.value !== p.value) {
      deltas.push({
        dimension: "saturation",
        summary: `saturation ${p.value} → ${a.value}`,
        confidenceDelta: a.confidence - p.confidence,
        primary: false,
      });
    } else if (Math.abs(a.confidence - p.confidence) >= CONFIDENCE_DELTA_THRESHOLD) {
      deltas.push({
        dimension: "saturation",
        summary: `saturation confidence ${p.confidence.toFixed(2)} → ${a.confidence.toFixed(2)}`,
        confidenceDelta: a.confidence - p.confidence,
        primary: false,
      });
    }
  }

  // Star dimensions (urgency, value, industry_call).
  for (const dim of STAR_DIMENSIONS) {
    const a = action.dimensions[dim];
    const p = prior.dimensions[dim];
    if (a.stars !== p.stars) {
      deltas.push({
        dimension: dim,
        summary: `${dim} ★${p.stars} → ★${a.stars}`,
        confidenceDelta: a.confidence - p.confidence,
        primary: false,
      });
    } else if (Math.abs(a.confidence - p.confidence) >= CONFIDENCE_DELTA_THRESHOLD) {
      deltas.push({
        dimension: dim,
        summary: `${dim} confidence ${p.confidence.toFixed(2)} → ${a.confidence.toFixed(2)}`,
        confidenceDelta: a.confidence - p.confidence,
        primary: false,
      });
    }
  }

  if (deltas.length > 0) {
    const nonConfIdx = deltas.findIndex((d) => !d.summary.includes("confidence"));
    const primaryIdx = nonConfIdx >= 0 ? nonConfIdx : 0;
    deltas[primaryIdx]!.primary = true;
  }

  const result: RatingActionDiff = {
    deltas,
    watchlistChanged: action.watchlist !== prior.watchlist,
    newWatchlist: action.watchlist,
  };
  if (action.watchlist !== prior.watchlist) {
    result.priorWatchlist = prior.watchlist;
  }
  return result;
}

/**
 * Helper: accept either a Date or ISO string and return a normalized ISO string.
 * Velite's s.isodate() yields Date objects at runtime; defensive coercion
 * keeps the loader robust to either shape.
 */
function toIsoString(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  if (typeof d === "string") return d;
  return new Date(String(d)).toISOString();
}
