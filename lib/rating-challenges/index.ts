import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { ratingChallenges } from "@/lib/db/schema";

/**
 * Rating-challenges helpers + per-dimension validation (Unit 11.2).
 *
 * Pure-function half (`isValidDimension`, `validateProposedValue`,
 * `validateRationale`) is auth-agnostic + DB-agnostic; callers (the
 * `POST /api/v1/rating-challenges` route + the inline submission form's
 * server-action) check the session and shape arguments before invoking.
 *
 * DB-helper half (`submitChallenge`, `getUserChallenges`) is thin
 * Drizzle wrappers; uses `crypto.randomUUID()` via the schema's
 * `$defaultFn` on `id`. Mirrors `lib/watchlist/`'s separation of
 * concerns (no auth knowledge inside the helpers; callers handle auth).
 *
 * Per ADR-0013 D-F: `problemSlug` is plain text without an FK; orphan
 * rows tolerated until cleanup script lands.
 */

export const DIMENSIONS = [
  "difficulty",
  "saturation",
  "urgency",
  "value",
  "industry_call",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

const DIFFICULTY_GRADES = ["S", "A", "B", "C", "D", "E"] as const;

/**
 * Min + max length for the `rationale` field per Unit 11.0 D-7. Min
 * forces submitters to write a real argument (not "looks wrong"); max
 * keeps the surface bounded.
 */
export const RATIONALE_MIN = 50;
export const RATIONALE_MAX = 2000;

const CHALLENGES_LIMIT = 50;

export function isValidDimension(value: string): value is Dimension {
  return (DIMENSIONS as readonly string[]).includes(value);
}

/**
 * Returns null when the proposed value is valid for the given
 * dimension, otherwise a human-readable error string (used as the
 * `message` field in the 400 response). Per-dimension format follows
 * Unit 11.0 D-6:
 *   - `difficulty`: one of S / A / B / C / D / E (letter grade).
 *   - `saturation`: 0-100 or "N/A" (per ADR-0006).
 *   - `urgency` / `value` / `industry_call`: integer 0-5.
 */
export function validateProposedValue(dimension: Dimension, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Proposed value is required.";
  switch (dimension) {
    case "difficulty":
      if (!(DIFFICULTY_GRADES as readonly string[]).includes(trimmed)) {
        return `Difficulty must be one of: ${DIFFICULTY_GRADES.join(", ")}.`;
      }
      return null;
    case "saturation": {
      if (trimmed === "N/A") return null;
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        return "Saturation must be 0-100 or 'N/A'.";
      }
      return null;
    }
    case "urgency":
    case "value":
    case "industry_call": {
      const n = Number(trimmed);
      if (!Number.isInteger(n) || n < 0 || n > 5) {
        return `${dimension} must be an integer 0-5.`;
      }
      return null;
    }
  }
}

export function validateRationale(rationale: string): string | null {
  if (rationale.length < RATIONALE_MIN) {
    return `Rationale must be at least ${RATIONALE_MIN} characters.`;
  }
  if (rationale.length > RATIONALE_MAX) {
    return `Rationale must be at most ${RATIONALE_MAX} characters.`;
  }
  return null;
}

export interface NewChallengeInput {
  userId: string;
  problemSlug: string;
  dimension: Dimension;
  proposedValue: string;
  rationale: string;
}

export async function submitChallenge(input: NewChallengeInput): Promise<{ id: string }> {
  const [row] = await db
    .insert(ratingChallenges)
    .values({
      userId: input.userId,
      problemSlug: input.problemSlug,
      dimension: input.dimension,
      proposedValue: input.proposedValue,
      rationale: input.rationale,
    })
    .returning({ id: ratingChallenges.id });
  if (!row) {
    throw new Error("INSERT into ratingChallenge returned no row");
  }
  return { id: row.id };
}

export type UserChallenge = typeof ratingChallenges.$inferSelect;

export async function getUserChallenges(userId: string): Promise<UserChallenge[]> {
  return db
    .select()
    .from(ratingChallenges)
    .where(eq(ratingChallenges.userId, userId))
    .orderBy(desc(ratingChallenges.createdAt))
    .limit(CHALLENGES_LIMIT);
}
