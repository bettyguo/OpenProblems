import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
  type PriorActionInfo,
  readPriorRatingAction,
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

// Phase-23 — readPriorRatingAction + auto-fill integration.

const VALID_PRIOR_YAML = `problem_slug: hallucination-reduction
date: 2026-04-01
methodology_version: "1.0.0"
curator: alice
prior_action: hallucination-reduction/2026-01-15-initial
dimensions:
  difficulty:
    grade: A
    confidence: 0.8
    rationale: |
      Difficulty A — capability ceiling tight; reasoning-heavy benchmarks resist.
  saturation:
    value: 25
    confidence: 0.6
    rationale: |
      Saturation 25 — coarse approaches plateau; per-prompt allocators show gap.
  urgency:
    stars: 4
    confidence: 0.7
    rationale: |
      Urgency 4 — hallucinations remain the dominant frontier failure mode.
  value:
    stars: 5
    confidence: 0.8
    rationale: |
      Value 5 — eliminating hallucinations unblocks tool-using-agent reliability.
  industry_call:
    stars: 5
    confidence: 0.85
    rationale: |
      Industry call 5 — frontier labs publishing safety evals quarterly.
signals_considered:
  - 2026-Q1 frontier-lab eval reports
  - 2026-Q1 retrieval-grounded-decoding result
watchlist: true
`;

describe("readPriorRatingAction — Phase-23 D-4", () => {
  let contentRoot: string;

  beforeEach(async () => {
    contentRoot = await mkdtemp(path.join(tmpdir(), "scaffold-test-"));
  });
  afterEach(async () => {
    await rm(contentRoot, { recursive: true, force: true });
  });

  it("returns null when problem directory does not exist", async () => {
    const result = await readPriorRatingAction({
      contentRoot,
      problemSlug: "no-such-problem",
    });
    expect(result).toBeNull();
  });

  it("returns null when ratings/ exists but contains no .yaml files", async () => {
    const ratingsDir = path.join(contentRoot, "hallucination-reduction", "ratings");
    await mkdir(ratingsDir, { recursive: true });
    await writeFile(path.join(ratingsDir, "README.md"), "not a yaml", "utf8");
    const result = await readPriorRatingAction({
      contentRoot,
      problemSlug: "hallucination-reduction",
    });
    expect(result).toBeNull();
  });

  it("returns the most-recent action when multiple .yaml files exist (lexical-sort-descending picks latest)", async () => {
    const ratingsDir = path.join(contentRoot, "hallucination-reduction", "ratings");
    await mkdir(ratingsDir, { recursive: true });
    // Three priors; lexical desc sort yields 2026-04-01 as most recent.
    await writeFile(path.join(ratingsDir, "2026-01-15-initial.yaml"), VALID_PRIOR_YAML, "utf8");
    await writeFile(path.join(ratingsDir, "2026-02-20-q1-revision.yaml"), VALID_PRIOR_YAML, "utf8");
    await writeFile(
      path.join(ratingsDir, "2026-04-01-spring-update.yaml"),
      VALID_PRIOR_YAML,
      "utf8",
    );
    const result = await readPriorRatingAction({
      contentRoot,
      problemSlug: "hallucination-reduction",
    });
    expect(result).not.toBeNull();
    expect(result!.filename).toBe("2026-04-01-spring-update");
    expect(result!.action.curator).toBe("alice");
    expect(result!.action.dimensions.difficulty.grade).toBe("A");
  });

  it("skips malformed YAML and returns the next-most-recent valid action", async () => {
    const ratingsDir = path.join(contentRoot, "hallucination-reduction", "ratings");
    await mkdir(ratingsDir, { recursive: true });
    await writeFile(path.join(ratingsDir, "2026-01-15-initial.yaml"), VALID_PRIOR_YAML, "utf8");
    // Most-recent by sort order is malformed — should fall back.
    await writeFile(
      path.join(ratingsDir, "2026-12-99-broken.yaml"),
      "not: valid: yaml: at: all",
      "utf8",
    );
    const result = await readPriorRatingAction({
      contentRoot,
      problemSlug: "hallucination-reduction",
    });
    expect(result).not.toBeNull();
    expect(result!.filename).toBe("2026-01-15-initial");
  });
});

describe("buildRatingActionYaml — Phase-23 priorAction auto-fill", () => {
  const PRIOR: PriorActionInfo = {
    filename: "2026-04-01-spring-update",
    action: RatingActionSchema.parse(parseYaml(VALID_PRIOR_YAML)),
  };

  it("copies OTHER 4 dimensions from prior; PROPOSED dimension still populated from challenge", () => {
    const yaml = buildRatingActionYaml({
      ...BASE_INPUT,
      dimension: "difficulty",
      proposedValue: "B",
      priorAction: PRIOR,
    });
    const action = parseAction(yaml);

    // PROPOSED dimension overrides prior with challenge data.
    expect(action.dimensions.difficulty.grade).toBe("B");
    expect(action.dimensions.difficulty.rationale).toContain("tighter ceiling");

    // OTHER 4 dimensions copied verbatim from prior (saturation/urgency/value/industry_call).
    expect(action.dimensions.saturation.value).toBe(25);
    expect(action.dimensions.saturation.rationale).toContain("coarse approaches plateau");
    expect(action.dimensions.urgency.stars).toBe(4);
    expect(action.dimensions.value.stars).toBe(5);
    expect(action.dimensions.industry_call.stars).toBe(5);
  });

  it("sets prior_action to `<problemSlug>/<filename>` shape", () => {
    const yaml = buildRatingActionYaml({ ...BASE_INPUT, priorAction: PRIOR });
    const action = parseAction(yaml);
    expect(action.prior_action).toBe("hallucination-reduction/2026-04-01-spring-update");
  });

  it("seeds signals_considered from prior + appends a placeholder TODO entry", () => {
    const yaml = buildRatingActionYaml({ ...BASE_INPUT, priorAction: PRIOR });
    const action = parseAction(yaml);
    expect(action.signals_considered).toEqual([
      "2026-Q1 frontier-lab eval reports",
      "2026-Q1 retrieval-grounded-decoding result",
      PLACEHOLDER_SIGNAL,
    ]);
  });

  it("inherits watchlist from prior", () => {
    const yaml = buildRatingActionYaml({ ...BASE_INPUT, priorAction: PRIOR });
    const action = parseAction(yaml);
    expect(action.watchlist).toBe(true); // PRIOR has watchlist: true
  });

  it("header notes COPIED-FROM-PRIOR origin instead of TODO placeholder", () => {
    const yaml = buildRatingActionYaml({ ...BASE_INPUT, priorAction: PRIOR });
    expect(yaml).toContain("COPIED FROM PRIOR (2026-04-01-spring-update)");
    expect(yaml).toContain(
      '`prior_action` is auto-set to "hallucination-reduction/2026-04-01-spring-update"',
    );
    expect(yaml).not.toContain("`prior_action` is a TODO");
  });

  it("priorAction: null preserves Phase-22 placeholder behavior (regression guard)", () => {
    const yaml = buildRatingActionYaml({ ...BASE_INPUT, priorAction: null });
    const action = parseAction(yaml);
    expect(action.prior_action).toBe(PLACEHOLDER_PRIOR_ACTION);
    expect(action.dimensions.saturation.value).toBe(PLACEHOLDER_SATURATION_VALUE);
    expect(action.dimensions.urgency.stars).toBe(PLACEHOLDER_STARS);
    expect(action.signals_considered).toEqual([PLACEHOLDER_SIGNAL]);
    expect(action.watchlist).toBe(false);
  });
});
