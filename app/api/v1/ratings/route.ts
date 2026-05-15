import { NextRequest, NextResponse } from "next/server";
import { allRatingActions, diffRatingAction } from "@/lib/content/load-ratings";

/**
 * GET /api/v1/ratings
 *
 * Paginated JSON feed of rating actions, newest-first (Unit 3.5).
 * Hybrid envelope per Q25 lean / Unit 3.0 D-4:
 *
 *   {
 *     items: RatingActionResource[],
 *     page: number,
 *     pageSize: number,
 *     total: number
 *   }
 *
 * Query params:
 *   page=N         1-indexed page number (default 1)
 *   pageSize=N     items per page (default 50, max 200)
 *   problem=<slug> filter to one problem (optional)
 */
export const dynamic = "force-static";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const requestedSize = parseInt(url.searchParams.get("pageSize") ?? `${DEFAULT_PAGE_SIZE}`, 10);
  const pageSize = Math.max(
    1,
    Math.min(MAX_PAGE_SIZE, Number.isFinite(requestedSize) ? requestedSize : DEFAULT_PAGE_SIZE),
  );
  const problemFilter = url.searchParams.get("problem");

  let actions = allRatingActions();
  if (problemFilter) {
    actions = actions.filter((a) => a.problem_slug === problemFilter);
  }
  const total = actions.length;
  const start = (page - 1) * pageSize;
  const slice = actions.slice(start, start + pageSize);

  // Compute prior actions for diff summaries.
  const byProblem = new Map<string, typeof actions>();
  for (const a of actions) {
    const arr = byProblem.get(a.problem_slug) ?? [];
    arr.push(a);
    byProblem.set(a.problem_slug, arr);
  }
  const priorByActionId = new Map<string, (typeof actions)[number]>();
  for (const arr of byProblem.values()) {
    const oldestFirst = arr.slice().reverse();
    for (let i = 1; i < oldestFirst.length; i++) {
      priorByActionId.set(oldestFirst[i]!.id, oldestFirst[i - 1]!);
    }
  }

  const items = slice.map((action) => {
    const prior = priorByActionId.get(action.id);
    const diff = diffRatingAction(action, prior);
    return {
      id: action.id,
      problem_slug: action.problem_slug,
      date: typeof action.date === "string" ? action.date : (action.date as Date).toISOString(),
      methodology_version: action.methodology_version,
      curator: action.curator,
      prior_action: action.prior_action ?? null,
      watchlist: action.watchlist,
      dimensions: action.dimensions,
      signals_considered: action.signals_considered ?? [],
      diff: {
        deltas: diff.deltas.map((d) => ({
          dimension: d.dimension,
          summary: d.summary,
          confidence_delta: d.confidenceDelta,
          primary: d.primary,
        })),
        watchlist_changed: diff.watchlistChanged,
        prior_watchlist: diff.priorWatchlist ?? null,
        new_watchlist: diff.newWatchlist,
      },
    };
  });

  return NextResponse.json(
    { items, page, pageSize, total },
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=300",
      },
    },
  );
}
