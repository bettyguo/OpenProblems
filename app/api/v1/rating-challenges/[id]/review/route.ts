import { auth } from "@/lib/auth";
import { isCurator } from "@/lib/auth/curator";
import { getLoginById } from "@/lib/auth/login";
import {
  getChallengeById,
  isAllowedReviewTransition,
  reviewChallenge,
  validateReviewNotes,
  type ChallengeStatus,
  type ReviewAction,
} from "@/lib/rating-challenges";
import { getCoIStatus } from "@/lib/rating-challenges/coi";

/**
 * Curator review-action API surface (Unit 12.4) — third dynamic API
 * route (after `/api/auth/[...nextauth]` + `/api/v1/watchlist/[slug]`
 * + `/api/v1/rating-challenges` POST).
 *
 * `POST /api/v1/rating-challenges/[id]/review` (body JSON) —
 * apply a `start_review` / `accept` / `reject` transition to a
 * challenge. Pinned by [ADR-0014](../../../../../../docs/adr/0014-curator-review-pipeline.md)
 * D-A state machine + D-F server-action-vs-API split.
 *
 * Exit shapes:
 *   - 401 `{ error: "unauthenticated" }` when `auth()` returns null.
 *   - 403 `{ error: "forbidden" }` when signed-in caller is NOT in
 *     `LOP_CURATOR_LOGINS` allowlist per ADR-0014 D-B.
 *   - 404 `{ error: "not-found" }` when no challenge matches `id`.
 *   - 409 `{ error: "coi-blocked", reason }` when COI hard-blocks (per
 *     ADR-0014 D-C self-review block).
 *   - 409 `{ error: "illegal-transition", from, action }` when current
 *     `status` doesn't allow the requested action.
 *   - 400 `{ error: "bad-request", field, message }` for body / notes
 *     validation failures.
 *   - 200 `{ id, status, reviewedAt }` on success.
 */

interface ReviewRouteContext {
  params: Promise<{ id: string }>;
}

interface ReviewBody {
  action?: unknown;
  notes?: unknown;
}

function unauthenticated(): Response {
  return Response.json({ error: "unauthenticated" }, { status: 401 });
}

function forbidden(): Response {
  return Response.json({ error: "forbidden" }, { status: 403 });
}

function notFound(): Response {
  return Response.json({ error: "not-found" }, { status: 404 });
}

function coiBlocked(reason: string): Response {
  return Response.json({ error: "coi-blocked", reason }, { status: 409 });
}

function illegalTransition(from: ChallengeStatus, action: ReviewAction): Response {
  return Response.json({ error: "illegal-transition", from, action }, { status: 409 });
}

function badRequest(field: string, message: string): Response {
  return Response.json({ error: "bad-request", field, message }, { status: 400 });
}

export async function POST(req: Request, context: ReviewRouteContext): Promise<Response> {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return unauthenticated();
  const reviewerLogin = await getLoginById(session.user.id);
  if (!isCurator(reviewerLogin)) return forbidden();

  let body: ReviewBody;
  try {
    body = (await req.json()) as ReviewBody;
  } catch {
    return badRequest("body", "Invalid JSON body.");
  }

  const actionRaw = typeof body.action === "string" ? body.action : "";
  const notes = typeof body.notes === "string" ? body.notes : "";
  if (actionRaw !== "start_review" && actionRaw !== "accept" && actionRaw !== "reject") {
    return badRequest("action", "action must be one of: start_review, accept, reject.");
  }
  const action = actionRaw as ReviewAction;

  const notesError = validateReviewNotes(notes, action);
  if (notesError) return badRequest("notes", notesError);

  const challenge = await getChallengeById(id);
  if (!challenge) return notFound();

  const currentStatus = challenge.status as ChallengeStatus;
  if (!isAllowedReviewTransition(currentStatus, action)) {
    return illegalTransition(currentStatus, action);
  }

  const submitterLogin = await getLoginById(challenge.userId);
  const coi = getCoIStatus(reviewerLogin ?? "", challenge.problemSlug, submitterLogin);
  if (coi.blocked) return coiBlocked(coi.reason ?? "unknown");

  const result = await reviewChallenge({
    challengeId: id,
    reviewerId: session.user.id,
    action,
    notes,
  });

  return Response.json({
    id,
    status: result.status,
    reviewedAt: result.reviewedAt?.toISOString() ?? null,
  });
}
