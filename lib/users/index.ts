import { and, count, eq, inArray, sql } from "drizzle-orm";

import { problems } from "#site/content";

import { db } from "@/lib/db";
import { ratingChallenges, users, watchlist } from "@/lib/db/schema";

/**
 * Per-user public-profile helpers (Unit 14.2) per
 * [ADR-0015](../../docs/adr/0015-per-user-privacy-model.md).
 *
 * Three pieces:
 *
 *   1. {@link getPublicProfileByHandle} — case-insensitive lookup of a
 *      `users` row by `githubLogin` (ADR-0015 D-B). Returns the canonical
 *      case stored in the DB; URL case is just the link-time choice.
 *      The route caller invokes `notFound()` on null.
 *
 *   2. {@link getProfileActivity} — three parallel COUNT queries
 *      returning the **publicly-visible** activity aggregates per
 *      ADR-0015 D-A: watchlist count + pending-challenges count
 *      (`submitted ∪ under_review`) + accepted-challenges count.
 *      `rejected` + `withdrawn` counts are **never returned** by this
 *      helper — they're submitter-only per Phase-13 Unit 13.0 D-3.
 *
 *   3. {@link getCuratorOfRecordSlugs} — pure-function scan of the
 *      Velite-built `problems` array (`#site/content`) for problems
 *      where `editorial.primary_curator` matches the supplied handle
 *      **case-sensitively** per ADR-0015 D-E. Caller renders a small
 *      badge with the resulting slugs.
 *
 * These helpers know NOTHING about auth — callers (the
 * `/[locale]/u/[handle]` shell page + sub-route) check the session
 * separately if needed (e.g., for the "Edit your profile" CTA that
 * only renders when `session.user.id === profile.userId`).
 *
 * Mirrors the {@link "@/lib/watchlist"} + {@link "@/lib/rating-challenges"}
 * + {@link "@/lib/auth/login"} separation conventions: thin Drizzle /
 * file-scan wrappers; tests mock `@/lib/db` + `#site/content`.
 */

export interface PublicProfile {
  userId: string;
  /** Canonical case from `users.githubLogin` (NOT the URL case). */
  githubLogin: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
}

export interface ProfileActivity {
  watchedCount: number;
  /** `submitted` + `under_review` per ADR-0015 D-A. */
  pendingChallengeCount: number;
  acceptedChallengeCount: number;
}

/**
 * Single-row fetch by handle (case-insensitive). The `[handle]` URL
 * segment is matched against `users.githubLogin` via
 * `LOWER(githubLogin) = LOWER(?)`. Returns null when no row matches;
 * caller invokes `notFound()`.
 *
 * Per ADR-0015 D-B: no redirect on case mismatch — the URL case the
 * user typed stays in the browser bar; the profile body always renders
 * the canonical case from the matched `users.githubLogin` value.
 *
 * Skips rows where `githubLogin` is NULL (Phase-9 retrofit edge: users
 * who signed in before Unit 9.6's `events.linkAccount` callback are
 * unreachable via handle routing).
 */
export async function getPublicProfileByHandle(handle: string): Promise<PublicProfile | null> {
  const normalized = handle.trim();
  if (!normalized) return null;

  const [row] = await db
    .select({
      userId: users.id,
      githubLogin: users.githubLogin,
      name: users.name,
      image: users.image,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(sql`LOWER(${users.githubLogin}) = LOWER(${normalized})`)
    .limit(1);

  if (!row || !row.githubLogin) return null;

  return {
    userId: row.userId,
    githubLogin: row.githubLogin,
    name: row.name,
    image: row.image,
    createdAt: row.createdAt,
  };
}

/**
 * Returns publicly-visible activity aggregates for the supplied user
 * per ADR-0015 D-A. Three parallel COUNT queries:
 *
 *   - `watchedCount` — rows in `watchlist` where `userId = ?`.
 *   - `pendingChallengeCount` — rows in `ratingChallenge` where
 *     `userId = ?` AND `status IN ("submitted", "under_review")`.
 *   - `acceptedChallengeCount` — rows in `ratingChallenge` where
 *     `userId = ?` AND `status = "accepted"`.
 *
 * `rejected` + `withdrawn` counts are intentionally NOT returned —
 * Phase-13 Unit 13.0 D-3 + ADR-0015 D-A keep them submitter-only.
 * The user's own `/profile` surface (Phase 10 + 11 + 12) renders
 * full per-status partition; the public `/u/{handle}` surface uses
 * this helper instead.
 */
export async function getProfileActivity(userId: string): Promise<ProfileActivity> {
  const [watchedRow, pendingRow, acceptedRow] = await Promise.all([
    db.select({ n: count() }).from(watchlist).where(eq(watchlist.userId, userId)),
    db
      .select({ n: count() })
      .from(ratingChallenges)
      .where(
        and(
          eq(ratingChallenges.userId, userId),
          inArray(ratingChallenges.status, ["submitted", "under_review"]),
        ),
      ),
    db
      .select({ n: count() })
      .from(ratingChallenges)
      .where(and(eq(ratingChallenges.userId, userId), eq(ratingChallenges.status, "accepted"))),
  ]);

  return {
    watchedCount: watchedRow[0]?.n ?? 0,
    pendingChallengeCount: pendingRow[0]?.n ?? 0,
    acceptedChallengeCount: acceptedRow[0]?.n ?? 0,
  };
}

/**
 * Pure-function scan of the Velite-built `problems` array for problems
 * where `editorial.primary_curator` matches the supplied handle
 * **case-sensitively** per ADR-0015 D-E.
 *
 * Returns problem slugs (empty array on no match). Caller renders a
 * curator-of-record badge with the resulting count + (Phase 15+) an
 * expansion link to a per-curator activity page.
 *
 * Case-sensitivity rationale: `editorial.primary_curator` is a curator-
 * typed string in problem YAML; the canonical case is what the curator
 * chose. Case-insensitive comparison would lose editorial precision.
 * Caller should pass the **canonical case** from
 * `users.githubLogin` (which `getPublicProfileByHandle` returns), NOT
 * the raw URL `[handle]` segment.
 *
 * O(n_problems) cost; cheap at current 10 problems. Velite resolves
 * `#site/content` at build time so `problems` is a static array.
 */
export function getCuratorOfRecordSlugs(handle: string): readonly string[] {
  const trimmed = handle.trim();
  if (!trimmed) return [];
  return problems.filter((p) => p.editorial.primary_curator === trimmed).map((p) => p.slug);
}
