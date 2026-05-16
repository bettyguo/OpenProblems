import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { ratingChallenges } from "@/lib/db/schema";

/**
 * Rating-challenges helpers + per-dimension validation (Units 11.2 + 12.3).
 *
 * Pure-function half (`isValidDimension`, `validateProposedValue`,
 * `validateRationale`, `validateReviewNotes`, `isAllowedTransition`) is
 * auth-agnostic + DB-agnostic; callers (the `POST /api/v1/rating-challenges`
 * + `POST /api/v1/rating-challenges/[id]/review` routes + server-actions)
 * check the session and shape arguments before invoking.
 *
 * DB-helper half (`submitChallenge`, `getUserChallenges`,
 * `getChallengeById`, `getPendingChallenges`, `reviewChallenge`,
 * `withdrawChallenge`, `attachAcceptedAction`) is thin Drizzle wrappers;
 * uses `crypto.randomUUID()` via the schema's `$defaultFn` on `id`.
 * Mirrors `lib/watchlist/`'s separation of concerns (no auth knowledge
 * inside the helpers; callers handle auth + curator-authz + COI).
 *
 * Status state machine per [ADR-0014](../../docs/adr/0014-curator-review-pipeline.md)
 * D-A: 5 statuses + 7 legal transitions; terminal states irreversible
 * (mirrors ADR-0005 immutability spirit).
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

// ---------------------------------------------------------------------------
// Phase-12 review pipeline (Unit 12.3) — per ADR-0014 D-A state machine.
// ---------------------------------------------------------------------------

export const CHALLENGE_STATUSES = [
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "withdrawn",
] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

export const TERMINAL_STATUSES = ["accepted", "rejected", "withdrawn"] as const;
const PENDING_STATUSES = ["submitted", "under_review"] as const;

/**
 * Max length for the curator's `reviewNotes` field per ADR-0014 D-A.
 * Longer than submitter `RATIONALE_MAX` (2000) to allow more detailed
 * curator-side commentary. Min length 0 — notes are optional on
 * `start_review`; required on `accept`/`reject` (enforced at action time).
 */
export const REVIEW_NOTES_MAX = 4000;

export type ReviewAction = "start_review" | "accept" | "reject";

/**
 * State-machine transition table per ADR-0014 D-A.
 *
 * Allowed transitions:
 *   submitted → under_review (start_review)
 *   submitted → accepted     (accept; fast lane)
 *   submitted → rejected     (reject; fast lane)
 *   submitted → withdrawn    (submitter; via withdrawChallenge)
 *   under_review → accepted  (accept)
 *   under_review → rejected  (reject)
 *   under_review → withdrawn (submitter; via withdrawChallenge)
 *
 * Terminal: accepted / rejected / withdrawn (irreversible per ADR-0005 spirit).
 */
const REVIEW_TRANSITIONS: Record<ReviewAction, readonly ChallengeStatus[]> = {
  start_review: ["submitted"],
  accept: ["submitted", "under_review"],
  reject: ["submitted", "under_review"],
};

const WITHDRAW_ALLOWED_FROM: readonly ChallengeStatus[] = PENDING_STATUSES;

export function isAllowedReviewTransition(current: ChallengeStatus, action: ReviewAction): boolean {
  return REVIEW_TRANSITIONS[action].includes(current);
}

export function isAllowedWithdrawal(current: ChallengeStatus): boolean {
  return WITHDRAW_ALLOWED_FROM.includes(current);
}

export function validateReviewNotes(notes: string, action: ReviewAction): string | null {
  if (notes.length > REVIEW_NOTES_MAX) {
    return `Review notes must be at most ${REVIEW_NOTES_MAX} characters.`;
  }
  // `accept` and `reject` require a non-empty rationale; `start_review`
  // does not.
  if ((action === "accept" || action === "reject") && notes.trim().length === 0) {
    return "Review notes are required when accepting or rejecting a challenge.";
  }
  return null;
}

/**
 * Single-row fetch by challenge UUID. Returns `null` when not found
 * (e.g., row was cascaded by a `userId` delete; per ADR-0014 D-A spirit
 * the cascade-removed row simply ceases to exist).
 */
export async function getChallengeById(id: string): Promise<UserChallenge | null> {
  const rows = await db.select().from(ratingChallenges).where(eq(ratingChallenges.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * Curator-side dashboard query. Returns challenges with `status ∈
 * {submitted, under_review}` ("pending review queue") ordered by
 * `createdAt ASC` (oldest first; fairness queue). Per ADR-0014 D-F
 * default sort.
 */
export async function getPendingChallenges(): Promise<UserChallenge[]> {
  return db
    .select()
    .from(ratingChallenges)
    .where(inArray(ratingChallenges.status, [...PENDING_STATUSES]))
    .orderBy(asc(ratingChallenges.createdAt))
    .limit(CHALLENGES_LIMIT);
}

export interface ReviewChallengeInput {
  challengeId: string;
  reviewerId: string;
  action: ReviewAction;
  notes: string;
}

export interface ReviewChallengeResult {
  status: ChallengeStatus;
  reviewedAt: Date | null;
}

/**
 * Curator-side state transition. Atomically:
 * 1. Re-reads the challenge to confirm `status` allows the transition.
 * 2. Refuses with `Error("transition X → Y not allowed")` on illegal moves.
 * 3. Sets `status` + `reviewedAt` (NULL for start_review; Date.now for
 *    accept/reject) + `reviewerId` + `reviewNotes`.
 *
 * Per ADR-0014 D-A: helpers enforce transition table server-side.
 * Callers (curator dashboard server-action + review API) must have
 * already verified `isCurator(reviewerLogin)` + `!getCoIStatus(...).blocked`.
 */
export async function reviewChallenge(input: ReviewChallengeInput): Promise<ReviewChallengeResult> {
  const existing = await getChallengeById(input.challengeId);
  if (!existing) {
    throw new Error(`Challenge ${input.challengeId} not found`);
  }
  const currentStatus = existing.status as ChallengeStatus;
  if (!isAllowedReviewTransition(currentStatus, input.action)) {
    throw new Error(
      `Transition ${currentStatus} → ${input.action} not allowed (terminal or illegal)`,
    );
  }

  const nextStatus: ChallengeStatus =
    input.action === "start_review"
      ? "under_review"
      : input.action === "accept"
        ? "accepted"
        : "rejected";

  const isTerminal = input.action !== "start_review";
  const reviewedAt = isTerminal ? new Date() : null;

  await db
    .update(ratingChallenges)
    .set({
      status: nextStatus,
      reviewedAt,
      reviewerId: input.reviewerId,
      reviewNotes: input.notes,
    })
    .where(eq(ratingChallenges.id, input.challengeId));

  return { status: nextStatus, reviewedAt };
}

/**
 * Submitter-side withdrawal. Atomically:
 * 1. Re-reads the challenge to confirm `userId` matches caller.
 * 2. Refuses with `Error("not your challenge")` on userId mismatch.
 * 3. Refuses with `Error("cannot withdraw terminal challenge")` on
 *    `status ∈ {accepted, rejected, withdrawn}`.
 * 4. Sets `status = "withdrawn"`. Does NOT set `reviewedAt` or
 *    `reviewerId` — withdrawal is submitter-side; the curator's review
 *    columns stay NULL.
 */
export async function withdrawChallenge(
  challengeId: string,
  submitterId: string,
): Promise<{ status: ChallengeStatus }> {
  const existing = await getChallengeById(challengeId);
  if (!existing) {
    throw new Error(`Challenge ${challengeId} not found`);
  }
  if (existing.userId !== submitterId) {
    throw new Error("not your challenge");
  }
  const currentStatus = existing.status as ChallengeStatus;
  if (!isAllowedWithdrawal(currentStatus)) {
    throw new Error(`Cannot withdraw challenge in status ${currentStatus}`);
  }

  await db
    .update(ratingChallenges)
    .set({ status: "withdrawn" })
    .where(eq(ratingChallenges.id, challengeId));

  return { status: "withdrawn" };
}

/**
 * Attach the emitted rating-action YAML filename to an `accepted`
 * challenge (ADR-0014 D-D manual emission step 5). Caller has already
 * verified the YAML file exists at `content/problems/<slug>/ratings/<filename>`.
 *
 * Refuses if status ≠ "accepted" (the YAML attachment is meaningful
 * only after acceptance).
 */
export async function attachAcceptedAction(
  challengeId: string,
  acceptedActionId: string,
): Promise<void> {
  const existing = await getChallengeById(challengeId);
  if (!existing) {
    throw new Error(`Challenge ${challengeId} not found`);
  }
  if (existing.status !== "accepted") {
    throw new Error(
      `Cannot attach action YAML to challenge in status ${existing.status}; must be 'accepted'`,
    );
  }
  await db
    .update(ratingChallenges)
    .set({ acceptedActionId })
    .where(eq(ratingChallenges.id, challengeId));
}

/**
 * Counts how many challenges currently sit in `submitted` or
 * `under_review` for the supplied problem. Used by Phase-13+ public-
 * visibility surfaces (Q58 lean) + the curator dashboard's per-problem
 * grouping; Phase 12 calls this only from the curator dashboard.
 */
export async function getOpenChallengeCountByProblem(problemSlug: string): Promise<number> {
  const rows = await db
    .select({ id: ratingChallenges.id })
    .from(ratingChallenges)
    .where(
      and(
        eq(ratingChallenges.problemSlug, problemSlug),
        inArray(ratingChallenges.status, [...PENDING_STATUSES]),
      ),
    );
  return rows.length;
}
