import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { watchlist } from "@/lib/db/schema";

/**
 * Cap on the number of slugs `getWatchedSlugs` returns. 50 is generous
 * for Phase 10 (the project has 10 problems; per-user watchlists won't
 * exceed 10 today). Future-proofs against runaway list rendering when
 * the problem catalog grows; profile-page list pagination is a Phase
 * 11+ enhancement when the cap becomes constraining.
 */
const WATCHLIST_LIMIT = 50;

/**
 * Watchlist helpers — Drizzle-shaped CRUD for the per-user `watchlist`
 * table (Unit 9.6 / [ADR-0013](../../docs/adr/0013-db-choice.md) D-F,
 * [Q56](../../OPEN_QUESTIONS.md#q56-watchlist-table-key-shape) resolved).
 *
 * These helpers know NOTHING about auth — callers (API route + server
 * action) check the session and then pass `userId` here. Pure CRUD;
 * easy to test by mocking `lib/db`.
 *
 * Mutation shape:
 *   - `addToWatchlist`: idempotent via `onConflictDoNothing`. Calling
 *     twice for the same `(userId, slug)` is safe.
 *   - `removeFromWatchlist`: idempotent (DELETE is a no-op on no match).
 *
 * Per ADR-0013 D-F, `problemSlug` is plain text — no FK to a content
 * table. Orphan rows (slug pointing at a deleted `content/problems/<slug>/`)
 * tolerated until a cleanup script lands (deferred follow-on).
 */

export async function isWatched(userId: string, problemSlug: string): Promise<boolean> {
  const rows = await db
    .select({ userId: watchlist.userId })
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.problemSlug, problemSlug)))
    .limit(1);
  return rows.length > 0;
}

export async function addToWatchlist(userId: string, problemSlug: string): Promise<void> {
  await db.insert(watchlist).values({ userId, problemSlug }).onConflictDoNothing();
}

export async function removeFromWatchlist(userId: string, problemSlug: string): Promise<void> {
  await db
    .delete(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.problemSlug, problemSlug)));
}

/**
 * Returns the slugs the user is watching, most-recently-added first,
 * capped at {@link WATCHLIST_LIMIT}. Used by the profile page (Unit 10.2)
 * to render the watched-problems list.
 *
 * Ordering is `createdAt DESC` so the user sees their latest watch
 * action at the top — matches what the profile page's empty-state →
 * filled-state transition will feel like (just-watched problems land at
 * the top of the list).
 */
export async function getWatchedSlugs(userId: string): Promise<string[]> {
  const rows = await db
    .select({ problemSlug: watchlist.problemSlug })
    .from(watchlist)
    .where(eq(watchlist.userId, userId))
    .orderBy(desc(watchlist.createdAt))
    .limit(WATCHLIST_LIMIT);
  return rows.map((r) => r.problemSlug);
}
