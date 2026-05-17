import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { RatingActionSchema, type RatingAction } from "@/lib/schemas/rating-action";
import {
  buildRatingActionYaml,
  CHALLENGE_DIMENSIONS,
  parseProposedValue,
  PLACEHOLDER_DIFFICULTY_GRADE,
  PLACEHOLDER_PRIOR_ACTION,
  PLACEHOLDER_RATIONALE,
  PLACEHOLDER_SATURATION_VALUE,
  PLACEHOLDER_SIGNAL,
  PLACEHOLDER_STARS,
  type ScaffoldInput,
} from "./scaffold";

const BASE_INPUT: ScaffoldInput = {
  problemSlug: "hallucination-reduction",
  challengeId: "c-abc-123",
  submitterUserId: "u-submitter",
  reviewerId: "u-reviewer",
  reviewerLogin: "octocat",
  dimension: "difficulty",
  proposedValue: "B",
  rationale: "Recent 2026-Q3 results suggest a tighter ceiling than the prior A grade implies.",
  date: "2026-05-17",
  scaffoldedAt: "2026-05-17T01:23:45.000Z",
};

/**
 * Strip the leading `# ...` comment header (variable per-run) and parse the
 * YAML body into a fully-typed `RatingAction` via `RatingActionSchema.parse`.
 * Doubles as a structural-validity assertion — schema parse throws when the
 * scaffold drifts from the canonical shape.
 */
function parseAction(yamlString: string): RatingAction {
  const lines = yamlString.split("\n");
  const bodyStart = lines.findIndex((l) => !l.startsWith("#") && l.trim() !== "");
  const body = parseYaml(lines.slice(bodyStart).join("\n"));
  return RatingActionSchema.parse(body);
}

describe("parseProposedValue", () => {
  it("accepts difficulty grades S/A/B/C/D/E case-insensitive", () => {
    for (const g of ["S", "a", "B", "c", "D", "e"]) {
      const result = parseProposedValue("difficulty", g);
      expect(result).toEqual({ ok: true, value: g.toUpperCase() });
    }
  });

  it("rejects difficulty grades outside the enum", () => {
    expect(parseProposedValue("difficulty", "F")).toEqual({ ok: false });
    expect(parseProposedValue("difficulty", "")).toEqual({ ok: false });
    expect(parseProposedValue("difficulty", "BB")).toEqual({ ok: false });
  });

  it("accepts saturation values in 0-100; rejects out-of-range + non-numeric", () => {
    expect(parseProposedValue("saturation", "0")).toEqual({ ok: true, value: 0 });
    expect(parseProposedValue("saturation", "100")).toEqual({ ok: true, value: 100 });
    expect(parseProposedValue("saturation", "42.5")).toEqual({ ok: true, value: 42.5 });
    expect(parseProposedValue("saturation", "-1")).toEqual({ ok: false });
    expect(parseProposedValue("saturation", "101")).toEqual({ ok: false });
    expect(parseProposedValue("saturation", "high")).toEqual({ ok: false });
  });

  it("accepts urgency/value/industry_call stars in 0-5; rejects out-of-range + decimals", () => {
    for (const d of ["urgency", "value", "industry_call"] as const) {
      expect(parseProposedValue(d, "0")).toEqual({ ok: true, value: 0 });
      expect(parseProposedValue(d, "5")).toEqual({ ok: true, value: 5 });
      expect(parseProposedValue(d, "6")).toEqual({ ok: false });
      expect(parseProposedValue(d, "-1")).toEqual({ ok: false });
      expect(parseProposedValue(d, "3.5")).toEqual({ ok: true, value: 3 }); // parseInt truncates
      expect(parseProposedValue(d, "nope")).toEqual({ ok: false });
    }
  });
});

describe("buildRatingActionYaml — scaffold shape", () => {
  it("PROPOSED difficulty: grade populated from challenge; other 4 dimensions placeholder", () => {
    const yaml = buildRatingActionYaml({
      ...BASE_INPUT,
      dimension: "difficulty",
      proposedValue: "B",
    });
    const action = parseAction(yaml);

    expect(action.problem_slug).toBe("hallucination-reduction");
    expect(action.curator).toBe("octocat");
    expect(action.date).toBe("2026-05-17");
    expect(action.prior_action).toBe(PLACEHOLDER_PRIOR_ACTION);

    expect(action.dimensions.difficulty.grade).toBe("B");
    expect(action.dimensions.difficulty.rationale).toContain("tighter ceiling");

    // OTHER 4 dimensions placeholder.
    expect(action.dimensions.saturation.value).toBe(PLACEHOLDER_SATURATION_VALUE);
    expect(action.dimensions.saturation.rationale).toBe(PLACEHOLDER_RATIONALE);
    expect(action.dimensions.urgency.stars).toBe(PLACEHOLDER_STARS);
    expect(action.dimensions.urgency.rationale).toBe(PLACEHOLDER_RATIONALE);
    expect(action.dimensions.value.stars).toBe(PLACEHOLDER_STARS);
    expect(action.dimensions.industry_call.stars).toBe(PLACEHOLDER_STARS);

    expect(action.signals_considered).toEqual([PLACEHOLDER_SIGNAL]);
    expect(action.watchlist).toBe(false);
  });

  it("PROPOSED saturation: value populated from challenge; difficulty + 3 star dimensions placeholder", () => {
    const yaml = buildRatingActionYaml({
      ...BASE_INPUT,
      dimension: "saturation",
      proposedValue: "42",
      rationale: "2026-Q3 SOTA benchmark shows ceiling tighter than 50.",
    });
    const action = parseAction(yaml);

    expect(action.dimensions.saturation.value).toBe(42);
    expect(action.dimensions.saturation.rationale).toContain("2026-Q3");
    expect(action.dimensions.difficulty.grade).toBe(PLACEHOLDER_DIFFICULTY_GRADE);
    expect(action.dimensions.difficulty.rationale).toBe(PLACEHOLDER_RATIONALE);
    expect(action.dimensions.urgency.stars).toBe(PLACEHOLDER_STARS);
  });

  it.each([
    ["urgency", "4", 4],
    ["value", "3", 3],
    ["industry_call", "5", 5],
  ] as const)(
    "PROPOSED %s: stars populated from challenge; other dimensions placeholder",
    (dimension, proposedValue, expectedStars) => {
      const yaml = buildRatingActionYaml({
        ...BASE_INPUT,
        dimension,
        proposedValue,
        rationale: `Promoting ${dimension} given recent signal.`,
      });
      const action = parseAction(yaml);

      expect(action.dimensions[dimension].stars).toBe(expectedStars);
      expect(action.dimensions[dimension].rationale).toContain("Promoting");

      // Other dimensions remain placeholders.
      for (const other of CHALLENGE_DIMENSIONS) {
        if (other === dimension) continue;
        expect(action.dimensions[other].rationale).toBe(PLACEHOLDER_RATIONALE);
      }
    },
  );

  it("malformed proposedValue: falls back to placeholder value + retains submitter rationale in TODO note", () => {
    const yaml = buildRatingActionYaml({
      ...BASE_INPUT,
      dimension: "difficulty",
      proposedValue: "Z", // invalid grade
      rationale: "Original submitter prose retained even on parse failure.",
    });
    const action = parseAction(yaml);

    expect(action.dimensions.difficulty.grade).toBe(PLACEHOLDER_DIFFICULTY_GRADE);
    expect(action.dimensions.difficulty.rationale).toContain(
      'TODO: proposedValue "Z" did not parse',
    );
    expect(action.dimensions.difficulty.rationale).toContain("Original submitter prose retained");
  });

  it("header comment block mentions challenge id, reviewer login, problem slug, target content path", () => {
    const yaml = buildRatingActionYaml(BASE_INPUT);
    expect(yaml).toContain("# Auto-scaffolded by `pnpm emit-challenge-action c-abc-123`");
    expect(yaml).toContain("on 2026-05-17T01:23:45.000Z");
    expect(yaml).toContain("Reviewer: user u-reviewer (githubLogin: octocat)");
    expect(yaml).toContain('for problem "hallucination-reduction"');
    expect(yaml).toContain("content/problems/hallucination-reduction/ratings/2026-05-17-");
    expect(yaml).toContain("/curator/challenges/c-abc-123");
  });
});
