import { problems } from "#site/content";

/**
 * Conflict-of-interest evaluation for curator review (Unit 12.3).
 * Pinned in [ADR-0014](../../docs/adr/0014-curator-review-pipeline.md)
 * D-C — Phase-12 simplification of `MASTER_PROMPT.md` §8.6.
 *
 * §8.6 verbatim: *"A curator must not rate a problem where they (or
 * their direct collaborators within the last 24 months) hold a
 * current leaderboard top-5 entry."*
 *
 * Applied to challenge review (the "rate" surface is now "review a
 * challenge to a rating"), Phase 12 simplifies:
 *
 * - **HARD BLOCK** when curator GitHub login = submitter's GitHub
 *   login (self-review). Curator cannot review their own challenges.
 *   Server-side refuse; UI disables review buttons.
 *
 * - **SOFT WARN** when curator GitHub login = problem's
 *   `editorial.primary_curator` field on `problem.yaml`. The curator
 *   authored the current rating; reviewing a challenge to their own
 *   rating creates a self-review surface that §8.6 spirit forbids.
 *   UI displays a disclaimer; does NOT block. Phase 13+ may promote
 *   to hard block on usage observations.
 *
 * - **DEFERRED** to Phase 13+: full §8.6 24-mo collaborator check
 *   (requires DB ↔ file-system multi-hop join `users.githubLogin` ↔
 *   `paper.authors[].slug` ↔ `paper.year`). The `reviewNotes` field
 *   serves as human-audit trail for §8.6 attestation until automated.
 */

export type CoIReason = "self-review" | "primary-curator" | null;

export interface CoIStatus {
  /** When `true`, the API + UI refuse the review action. */
  blocked: boolean;
  /** Curator-facing message; surfaced as disclaimer (soft) or refusal (hard). */
  warning?: string;
  /** Discriminator for UI messaging differentiation. */
  reason: CoIReason;
}

const SELF_REVIEW_MESSAGE = "You cannot review your own challenge.";
const PRIMARY_CURATOR_MESSAGE = "You authored this problem's current rating — review carefully.";

/**
 * Evaluates the COI surface for a curator about to review a challenge.
 *
 * Pure-function; reads `problems` from `#site/content` synchronously.
 * Phase-12 inputs are limited to logins + slug; Phase 13+ may extend
 * with paper-collaborator inputs.
 *
 * @param reviewerLogin - GitHub login of the curator (from `users.githubLogin`).
 * @param problemSlug - The problem slug from `ratingChallenge.problemSlug`.
 * @param submitterLogin - GitHub login of the submitter (joined via
 *   `ratingChallenge.userId` → `users.githubLogin`). May be `null` if
 *   the submitter signed in before [ADR-0012](../../docs/adr/0012-auth-provider.md)
 *   D-E's `events.linkAccount` callback populated `githubLogin` (rare;
 *   Phase 9 retrofit). Treated as "no self-review block" when null.
 */
export function getCoIStatus(
  reviewerLogin: string,
  problemSlug: string,
  submitterLogin: string | null,
): CoIStatus {
  if (submitterLogin && reviewerLogin === submitterLogin) {
    return { blocked: true, warning: SELF_REVIEW_MESSAGE, reason: "self-review" };
  }

  const problem = problems.find((p) => p.slug === problemSlug);
  if (problem?.editorial?.primary_curator === reviewerLogin) {
    return { blocked: false, warning: PRIMARY_CURATOR_MESSAGE, reason: "primary-curator" };
  }

  return { blocked: false, reason: null };
}
