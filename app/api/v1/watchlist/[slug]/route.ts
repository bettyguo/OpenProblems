import { problems } from "#site/content";

import { auth } from "@/lib/auth";
import { addToWatchlist, removeFromWatchlist } from "@/lib/watchlist";

/**
 * Watchlist write-path REST surface (Unit 9.6 — **§5.7 trigger (a) FIRES
 * here**, the first first-party DB write of the project).
 *
 * POST /api/v1/watchlist/[slug]    — add slug to caller's watchlist (idempotent).
 * DELETE /api/v1/watchlist/[slug] — remove slug from caller's watchlist (idempotent).
 *
 * Exits per method (6 total = 2 verbs × 3 shapes):
 *   - 401 `{ error: "unauthenticated" }` when `auth()` returns null.
 *   - 404 `{ error: "unknown-problem" }` when `slug` isn't in `problems`
 *     (`#site/content`).
 *   - 200 `{ slug, watched: <bool> }` on success.
 *
 * Per ADR-0012 D-D the sign-in flow is full-page redirect; this API
 * surface is the programmatic counterpart for clients that already have
 * a session cookie. Mirrors the digest route's response-shaping
 * convention (one Response-construction site per exit).
 */

interface WatchlistRouteContext {
  params: Promise<{ slug: string }>;
}

function knownSlug(slug: string): boolean {
  return problems.some((p) => p.slug === slug);
}

function unauthenticated(): Response {
  return Response.json({ error: "unauthenticated" }, { status: 401 });
}

function unknownProblem(): Response {
  return Response.json({ error: "unknown-problem" }, { status: 404 });
}

export async function POST(_req: Request, context: WatchlistRouteContext): Promise<Response> {
  const { slug } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return unauthenticated();
  if (!knownSlug(slug)) return unknownProblem();
  await addToWatchlist(session.user.id, slug);
  return Response.json({ slug, watched: true });
}

export async function DELETE(_req: Request, context: WatchlistRouteContext): Promise<Response> {
  const { slug } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return unauthenticated();
  if (!knownSlug(slug)) return unknownProblem();
  await removeFromWatchlist(session.user.id, slug);
  return Response.json({ slug, watched: false });
}
