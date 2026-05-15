import { describe, it, expect } from "vitest";
import {
  allRatingActions,
  ratingActionsForProblem,
  ratingActionById,
  recentRatingActions,
  diffRatingAction,
} from "@/lib/content/load-ratings";

describe("allRatingActions", () => {
  it("returns every committed rating action across all problems", () => {
    const all = allRatingActions();
    // 10 initial actions (Unit 1.x) + 10 q3/q4 revisions (Unit 3.1) = 20.
    expect(all.length).toBe(20);
  });

  it("sorts newest-first by date", () => {
    const all = allRatingActions();
    for (let i = 0; i < all.length - 1; i++) {
      expect(all[i]!.date >= all[i + 1]!.date).toBe(true);
    }
  });

  it("populates the stable id field on every action", () => {
    const all = allRatingActions();
    for (const r of all) {
      expect(r.id).toMatch(/^[a-z0-9-]+\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/);
    }
  });
});

describe("ratingActionsForProblem", () => {
  it("returns 3 actions for hallucination-reduction (initial + q3 + q4 from Unit 3.1)", () => {
    const own = ratingActionsForProblem("hallucination-reduction");
    expect(own.length).toBe(3);
  });

  it("sorts newest-first; q4 comes before q3 comes before initial", () => {
    const own = ratingActionsForProblem("hallucination-reduction");
    expect(own[0]!.id).toBe("hallucination-reduction/2026-12-15-q4-revision");
    expect(own[1]!.id).toBe("hallucination-reduction/2026-09-01-q3-revision");
    expect(own[2]!.id).toBe("hallucination-reduction/2026-05-14-initial");
  });

  it("returns 1 action for problems without multi-action histories", () => {
    // 5 problems get multi-action histories per Unit 3.1's scope; the other 5 stay single-action.
    const single = ratingActionsForProblem("benchmark-integrity");
    expect(single.length).toBe(1);
  });

  it("returns empty for an unknown slug", () => {
    expect(ratingActionsForProblem("does-not-exist-9999")).toEqual([]);
  });
});

describe("ratingActionById", () => {
  it("returns the initial action by full id", () => {
    const action = ratingActionById("hallucination-reduction/2026-05-14-initial");
    expect(action).toBeDefined();
    expect(action?.problem_slug).toBe("hallucination-reduction");
    expect(action?.prior_action).toBeUndefined();
  });

  it("returns a revision action with prior_action pointing to the previous file", () => {
    const action = ratingActionById("hallucination-reduction/2026-09-01-q3-revision");
    expect(action).toBeDefined();
    expect(action?.prior_action).toBe("hallucination-reduction/2026-05-14-initial");
  });

  it("returns undefined for an unknown id", () => {
    expect(ratingActionById("not-a-real-id/2099-01-01-fake")).toBeUndefined();
  });
});

describe("recentRatingActions", () => {
  it("with default 90-day window from the most-recent action returns the q4 cohort (5 actions)", () => {
    const recent = recentRatingActions();
    // Anchor = 2026-12-15 (newest action). 90-day window reaches 2026-09-16 → catches q4 only.
    expect(recent.length).toBe(5);
    for (const r of recent) {
      expect(r.id.endsWith("q4-revision")).toBe(true);
    }
  });

  it("with a 180-day window catches q3 + q4 (10 actions)", () => {
    const recent = recentRatingActions(180);
    // 180 days back from 2026-12-15 ≈ 2026-06-18 → q3 (2026-09-01) + q4 (2026-12-15) = 10 actions.
    expect(recent.length).toBe(10);
  });

  it("with a 365-day window catches everything (20 actions)", () => {
    const recent = recentRatingActions(365);
    expect(recent.length).toBe(20);
  });

  it("with an explicit anchor date filters from that date", () => {
    const recent = recentRatingActions(60, "2026-09-30");
    // 60 days back from 2026-09-30 = 2026-08-01 → catches q3 (2026-09-01) actions only.
    expect(recent.length).toBe(5);
    for (const r of recent) {
      expect(r.id.endsWith("q3-revision")).toBe(true);
    }
  });
});

describe("diffRatingAction", () => {
  it("returns empty deltas for an initial action (no prior)", () => {
    const initial = ratingActionById("hallucination-reduction/2026-05-14-initial")!;
    const diff = diffRatingAction(initial, undefined);
    expect(diff.deltas).toEqual([]);
    expect(diff.watchlistChanged).toBe(false);
    expect(diff.newWatchlist).toBe(false);
  });

  it("flags saturation 35 → 32 as the primary delta on hallucination-reduction q3", () => {
    const q3 = ratingActionById("hallucination-reduction/2026-09-01-q3-revision")!;
    const initial = ratingActionById("hallucination-reduction/2026-05-14-initial")!;
    const diff = diffRatingAction(q3, initial);
    const sat = diff.deltas.find((d) => d.dimension === "saturation");
    expect(sat).toBeDefined();
    expect(sat?.summary).toBe("saturation 35 → 32");
    expect(sat?.primary).toBe(true);
  });

  it("captures watchlist false → true on mechanistic-interpretability q4", () => {
    const q4 = ratingActionById("mechanistic-interpretability/2026-12-15-q4-revision")!;
    const q3 = ratingActionById("mechanistic-interpretability/2026-09-01-q3-revision")!;
    const diff = diffRatingAction(q4, q3);
    expect(diff.watchlistChanged).toBe(true);
    expect(diff.priorWatchlist).toBe(false);
    expect(diff.newWatchlist).toBe(true);
  });

  it("captures saturation 18 → 22 on scalable-oversight q4", () => {
    const q4 = ratingActionById("scalable-oversight/2026-12-15-q4-revision")!;
    const q3 = ratingActionById("scalable-oversight/2026-09-01-q3-revision")!;
    const diff = diffRatingAction(q4, q3);
    const sat = diff.deltas.find((d) => d.dimension === "saturation");
    expect(sat?.summary).toBe("saturation 18 → 22");
  });

  it("flags a confidence-only change with the 'confidence' substring in the summary", () => {
    // hallucination-reduction q4 vs q3: all dimensions unchanged except confidences.
    const q4 = ratingActionById("hallucination-reduction/2026-12-15-q4-revision")!;
    const q3 = ratingActionById("hallucination-reduction/2026-09-01-q3-revision")!;
    const diff = diffRatingAction(q4, q3);
    expect(diff.deltas.length).toBeGreaterThan(0);
    for (const d of diff.deltas) {
      expect(d.summary).toMatch(/confidence/);
    }
  });
});
