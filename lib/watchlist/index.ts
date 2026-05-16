import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { watchlist } from "@/lib/db/schema";

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
