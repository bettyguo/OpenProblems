import { stringify as stringifyYaml } from "yaml";

/**
 * Rating-action YAML scaffolder — pure helpers backing Phase-22's
 * `pnpm emit-challenge-action <id>` CLI (per [ADR-0014](../../docs/adr/0014-curator-review-pipeline.md)
 * D-D). Factored out of `scripts/emit-challenge-action.ts` so the
 * generation logic stays unit-testable without DB / FS / process
 * dependencies.
 *
 * Phase-22 lean: the PROPOSED dimension is fully populated from
 * challenge data; the OTHER 4 dimensions are filled with placeholder
 * values + TODO rationale text. Curator MUST edit the placeholders
 * before committing — ADR-0005 + Velite + Zod schema validation
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
}

/**
 * Build the rating-action YAML string from challenge + reviewer fields.
 * Pure function — no DB / FS / network. Output matches
 * `RatingActionSchema` shape; curator MUST edit the 4 placeholder
 * dimensions + `prior_action` + `signals_considered` before commit.
 */
export function buildRatingActionYaml(input: ScaffoldInput): string {
  const parsed = parseProposedValue(input.dimension, input.proposedValue);
  const isMalformed = !parsed.ok;
  const proposedRationale = isMalformed
    ? `TODO: proposedValue ${JSON.stringify(input.proposedValue)} did not parse for dimension "${input.dimension}"; fix here.\n\nOriginal submitter rationale:\n${input.rationale}`
    : input.rationale;

  function dimensionBlock(d: ChallengeDimension): Record<string, unknown> {
    const isProposed = d === input.dimension;
    const rationale = isProposed ? proposedRationale : PLACEHOLDER_RATIONALE;
    const confidence = SCAFFOLDED_CONFIDENCE;
    if (d === "difficulty") {
      const grade =
        isProposed && parsed.ok ? (parsed.value as DifficultyGrade) : PLACEHOLDER_DIFFICULTY_GRADE;
      return { grade, confidence, rationale };
    }
    if (d === "saturation") {
      const value =
        isProposed && parsed.ok ? (parsed.value as number) : PLACEHOLDER_SATURATION_VALUE;
      return { value, confidence, rationale };
    }
    const stars = isProposed && parsed.ok ? (parsed.value as number) : PLACEHOLDER_STARS;
    return { stars, confidence, rationale };
  }

  const payload = {
    problem_slug: input.problemSlug,
    date: input.date,
    methodology_version: METHODOLOGY_VERSION,
    curator: input.reviewerLogin,
    prior_action: PLACEHOLDER_PRIOR_ACTION,
    dimensions: {
      difficulty: dimensionBlock("difficulty"),
      saturation: dimensionBlock("saturation"),
      urgency: dimensionBlock("urgency"),
      value: dimensionBlock("value"),
      industry_call: dimensionBlock("industry_call"),
    },
    signals_considered: [PLACEHOLDER_SIGNAL],
    watchlist: false,
  };

  const scaffoldedAt = input.scaffoldedAt ?? new Date().toISOString();
  const header = [
    `# Auto-scaffolded by \`pnpm emit-challenge-action ${input.challengeId}\` on ${scaffoldedAt}.`,
    `# Source: rating-challenge ${input.challengeId} submitted by user ${input.submitterUserId}`,
    `#         for problem "${input.problemSlug}".`,
    `# Reviewer: user ${input.reviewerId} (githubLogin: ${input.reviewerLogin}).`,
    `#`,
    `# REVIEW REQUIRED before commit:`,
    `#   - The PROPOSED dimension (${input.dimension}) is scaffolded from challenge data.`,
    `#     Edit confidence + rationale as needed.`,
    `#   - The OTHER 4 dimensions are PLACEHOLDERS — copy unchanged values + rationales`,
    `#     from the prior rating-action under content/problems/${input.problemSlug}/ratings/.`,
    `#   - \`prior_action\` is a TODO — set to the filename (without .yaml) of the most`,
    `#     recent rating-action for this problem.`,
    `#   - \`signals_considered\` is a TODO — list the editorial signals considered.`,
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
