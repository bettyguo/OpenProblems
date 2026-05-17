import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import { RatingActionSchema, type RatingAction } from "@/lib/schemas/rating-action";

/**
 * Rating-action YAML scaffolder — helpers backing Phase-22's
 * `pnpm emit-challenge-action <id>` CLI (per [ADR-0014](../../docs/adr/0014-curator-review-pipeline.md)
 * D-D). Factored out of `scripts/emit-challenge-action.ts` so the
 * generation logic stays unit-testable without DB / process
 * dependencies.
 *
 * Phase-22 lean: the PROPOSED dimension is fully populated from
 * challenge data; the OTHER 4 dimensions are filled with placeholder
 * values + TODO rationale text.
 *
 * Phase-23 enhancement (this file's Unit 23.1 update): when a prior
 * rating-action exists for the challenge's problem, `readPriorRatingAction`
 * loads the most-recent one and `buildRatingActionYaml` copies its 4
 * OTHER dimensions + `signals_considered` + `watchlist` + sets
 * `prior_action` to its filename. Curator still reviews + edits +
 * commits manually — ADR-0005 + Velite + Zod schema validation
 * together catch any forgotten placeholder at commit time via the
 * `pnpm validate-content` pre-commit gate.
 */

export const METHODOLOGY_VERSION = "1.0.0";
export const PLACEHOLDER_RATIONALE = "TODO: copy unchanged from prior action.";
export const PLACEHOLDER_PRIOR_ACTION = "TODO-set-to-prior-action-filename";
export const PLACEHOLDER_SIGNAL =
  "TODO: list signals (papers, leaderboard movements, industry announcements) considered.";
export const PLACEHOLDER_DIFFICULTY_GRADE = "S" as const;
export const PLACEHOLDER_STARS = 0;
export const PLACEHOLDER_SATURATION_VALUE = 0;
export const SCAFFOLDED_CONFIDENCE = 0.7;

export const TERMINAL_STATUSES = new Set(["accepted", "rejected", "withdrawn"]);

export const DIFFICULTY_GRADES = ["S", "A", "B", "C", "D", "E"] as const;
export type DifficultyGrade = (typeof DIFFICULTY_GRADES)[number];

export const CHALLENGE_DIMENSIONS = [
  "difficulty",
  "saturation",
  "urgency",
  "value",
  "industry_call",
] as const;
export type ChallengeDimension = (typeof CHALLENGE_DIMENSIONS)[number];

export function isChallengeDimension(d: string): d is ChallengeDimension {
  return (CHALLENGE_DIMENSIONS as readonly string[]).includes(d);
}

/**
 * Parse the challenge's TEXT `proposedValue` into the dimension-specific
 * value type per [RatingActionSchema](../schemas/rating-action.ts):
 *
 * - `difficulty.grade`: enum `"S" | "A" | "B" | "C" | "D" | "E"`.
 * - `saturation.value`: number 0-100.
 * - `urgency` / `value` / `industry_call`.`stars`: integer 0-5.
 *
 * Returns `{ ok: true, value }` on parse success; `{ ok: false }`
 * otherwise. The caller falls back to placeholder + TODO rationale so
 * the curator catches malformed values during the manual-edit pass.
 */
export function parseProposedValue(
  dimension: ChallengeDimension,
  raw: string,
): { ok: true; value: DifficultyGrade | number } | { ok: false } {
  const trimmed = raw.trim();
  switch (dimension) {
    case "difficulty": {
      const upper = trimmed.toUpperCase();
      if ((DIFFICULTY_GRADES as readonly string[]).includes(upper))
        return { ok: true, value: upper as DifficultyGrade };
      return { ok: false };
    }
    case "saturation": {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 0 || n > 100) return { ok: false };
      return { ok: true, value: n };
    }
    case "urgency":
    case "value":
    case "industry_call": {
      const n = Number.parseInt(trimmed, 10);
      if (!Number.isInteger(n) || n < 0 || n > 5) return { ok: false };
      return { ok: true, value: n };
    }
  }
}

/**
 * Prior rating-action info returned by `readPriorRatingAction`.
 * `filename` is the basename without `.yaml` extension (so it can be
 * concatenated into `<problemSlug>/<filename>` for the new action's
 * `prior_action` field, matching existing content's convention).
 */
export interface PriorActionInfo {
  filename: string;
  action: RatingAction;
}

/**
 * Find and parse the most-recent prior rating-action YAML for a problem
 * (Phase-23 D-3 / D-4). Reads `<contentRoot>/<problemSlug>/ratings/*.yaml`,
 * sorts filenames lexically descending (the `YYYY-MM-DD-<descriptive>.yaml`
 * pattern sorts correctly by date when lexical-descending applied), and
 * tries each in order until one parses successfully against
 * `RatingActionSchema`.
 *
 * Returns `null` when:
 *   - The problem's ratings directory doesn't exist (e.g., first-ever
 *     rating-action for a new problem).
 *   - The directory is empty.
 *   - All `.yaml` files in the directory fail schema validation
 *     (malformed mid-edit / legacy / drift). Each failure is logged
 *     to stderr; the caller falls back to Phase-22 placeholder
 *     behavior.
 *
 * Pure-ish: takes `contentRoot` as parameter for fixture-based testing.
 */
export async function readPriorRatingAction(opts: {
  contentRoot: string;
  problemSlug: string;
}): Promise<PriorActionInfo | null> {
  const dir = path.join(opts.contentRoot, opts.problemSlug, "ratings");
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return null;
  }
  const candidates = entries.filter((f) => f.endsWith(".yaml")).sort((a, b) => b.localeCompare(a));
  for (const filename of candidates) {
    const filepath = path.join(dir, filename);
    try {
      const raw = await readFile(filepath, "utf8");
      const parsed = parseYaml(raw);
      const action = RatingActionSchema.parse(parsed);
      return { filename: filename.replace(/\.yaml$/, ""), action };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[scaffold] Skipping malformed prior at ${filepath}: ${message}`);
    }
  }
  return null;
}

export interface ScaffoldInput {
  problemSlug: string;
  challengeId: string;
  submitterUserId: string;
  reviewerId: string;
  reviewerLogin: string;
  dimension: ChallengeDimension;
  proposedValue: string;
  rationale: string;
  /** ISO `YYYY-MM-DD` date. */
  date: string;
  /** ISO 8601 timestamp for the auto-scaffold header comment; defaults to `new Date().toISOString()`. */
  scaffoldedAt?: string;
  /**
   * Most-recent prior rating-action for the problem. When set, the 4
   * OTHER dimensions + `signals_considered` + `watchlist` are copied
   * from prior and `prior_action` is auto-set. When null/undefined,
   * Phase-22 placeholder behavior is preserved.
   */
  priorAction?: PriorActionInfo | null;
}

/**
 * Build the rating-action YAML string from challenge + reviewer fields.
 * Output matches `RatingActionSchema` shape.
 *
 * - When `priorAction` is provided (Phase-23 auto-fill): 4 OTHER
 *   dimensions copied from prior; `prior_action` set; `signals_considered`
 *   seeded from prior + placeholder TODO; `watchlist` inherits.
 *   Curator MUST still review + edit OTHER dimensions if signals
 *   demand re-rating.
 * - When `priorAction` is null/undefined: Phase-22 placeholder behavior
 *   preserved (OTHER 4 dimensions filled with placeholder values + TODO
 *   rationale; `prior_action` TODO; `signals_considered` single
 *   placeholder; `watchlist: false`).
 */
export function buildRatingActionYaml(input: ScaffoldInput): string {
  const parsed = parseProposedValue(input.dimension, input.proposedValue);
  const isMalformed = !parsed.ok;
  const proposedRationale = isMalformed
    ? `TODO: proposedValue ${JSON.stringify(input.proposedValue)} did not parse for dimension "${input.dimension}"; fix here.\n\nOriginal submitter rationale:\n${input.rationale}`
    : input.rationale;

  const prior = input.priorAction ?? null;

  function dimensionBlock(d: ChallengeDimension): Record<string, unknown> {
    const isProposed = d === input.dimension;
    if (isProposed) {
      const confidence = SCAFFOLDED_CONFIDENCE;
      if (d === "difficulty") {
        const grade = parsed.ok ? (parsed.value as DifficultyGrade) : PLACEHOLDER_DIFFICULTY_GRADE;
        return { grade, confidence, rationale: proposedRationale };
      }
      if (d === "saturation") {
        const value = parsed.ok ? (parsed.value as number) : PLACEHOLDER_SATURATION_VALUE;
        return { value, confidence, rationale: proposedRationale };
      }
      const stars = parsed.ok ? (parsed.value as number) : PLACEHOLDER_STARS;
      return { stars, confidence, rationale: proposedRationale };
    }

    // OTHER dimension — copy from prior if available, else placeholder.
    if (prior) {
      // Round-trip through plain object so YAML stringifier doesn't carry
      // schema-internal wrappers; preserves declared property order.
      const block = prior.action.dimensions[d];
      return { ...block };
    }
    const confidence = SCAFFOLDED_CONFIDENCE;
    if (d === "difficulty")
      return {
        grade: PLACEHOLDER_DIFFICULTY_GRADE,
        confidence,
        rationale: PLACEHOLDER_RATIONALE,
      };
    if (d === "saturation")
      return {
        value: PLACEHOLDER_SATURATION_VALUE,
        confidence,
        rationale: PLACEHOLDER_RATIONALE,
      };
    return { stars: PLACEHOLDER_STARS, confidence, rationale: PLACEHOLDER_RATIONALE };
  }

  const priorActionField = prior
    ? `${input.problemSlug}/${prior.filename}`
    : PLACEHOLDER_PRIOR_ACTION;

  const signalsConsidered = prior
    ? [...(prior.action.signals_considered ?? []), PLACEHOLDER_SIGNAL]
    : [PLACEHOLDER_SIGNAL];

  const watchlist = prior ? prior.action.watchlist : false;

  const payload = {
    problem_slug: input.problemSlug,
    date: input.date,
    methodology_version: METHODOLOGY_VERSION,
    curator: input.reviewerLogin,
    prior_action: priorActionField,
    dimensions: {
      difficulty: dimensionBlock("difficulty"),
      saturation: dimensionBlock("saturation"),
      urgency: dimensionBlock("urgency"),
      value: dimensionBlock("value"),
      industry_call: dimensionBlock("industry_call"),
    },
    signals_considered: signalsConsidered,
    watchlist,
  };

  const scaffoldedAt = input.scaffoldedAt ?? new Date().toISOString();
  const otherDimensionsHeader = prior
    ? [
        `#   - The OTHER 4 dimensions are COPIED FROM PRIOR (${prior.filename}) —`,
        `#     adjust grade/value/stars/confidence/rationale if new signals demand re-rating.`,
        `#   - \`prior_action\` is auto-set to "${priorActionField}".`,
        `#   - \`signals_considered\` is seeded from prior + a TODO placeholder — extend or replace.`,
      ]
    : [
        `#   - The OTHER 4 dimensions are PLACEHOLDERS — copy unchanged values + rationales`,
        `#     from the prior rating-action under content/problems/${input.problemSlug}/ratings/.`,
        `#   - \`prior_action\` is a TODO — set to the filename (without .yaml) of the most`,
        `#     recent rating-action for this problem.`,
        `#   - \`signals_considered\` is a TODO — list the editorial signals considered.`,
      ];

  const header = [
    `# Auto-scaffolded by \`pnpm emit-challenge-action ${input.challengeId}\` on ${scaffoldedAt}.`,
    `# Source: rating-challenge ${input.challengeId} submitted by user ${input.submitterUserId}`,
    `#         for problem "${input.problemSlug}".`,
    `# Reviewer: user ${input.reviewerId} (githubLogin: ${input.reviewerLogin}).`,
    `#`,
    `# REVIEW REQUIRED before commit:`,
    `#   - The PROPOSED dimension (${input.dimension}) is scaffolded from challenge data.`,
    `#     Edit confidence + rationale as needed.`,
    ...otherDimensionsHeader,
    `#`,
    `# Then move this file to:`,
    `#   content/problems/${input.problemSlug}/ratings/${input.date}-<descriptive-slug>.yaml`,
    `# \`git add\` + commit (ADR-0005 immutability hook + Zod validation fire on commit).`,
    `# Return to /curator/challenges/${input.challengeId} to attach the filename via the`,
    `# acceptedActionId form (per ADR-0014 D-D manual-attachment step).`,
    ``,
  ].join("\n");

  return header + stringifyYaml(payload, { lineWidth: 0 });
}
