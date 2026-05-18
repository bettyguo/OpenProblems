import { problems } from "#site/content";

import { auth } from "@/lib/auth";
import { getModerator } from "@/lib/moderation";
import {
  DIMENSIONS,
  isValidDimension,
  submitChallenge,
  validateProposedValue,
  validateRationale,
} from "@/lib/rating-challenges";

/**
 * Rating-challenge submission endpoint (Unit 11.2) — the project's
 * **second write-path** (first was `/api/v1/watchlist/[slug]`).
 *
 * `POST /api/v1/rating-challenges` (body JSON) — submits a new challenge.
 *
 * Exit shapes:
 *   - 401 `{ error: "unauthenticated" }` when `auth()` returns null.
 *   - 400 `{ error: "bad-request", field, message }` for any
 *     validation failure (invalid JSON body, unknown problemSlug,
 *     invalid dimension, malformed proposedValue, rationale length).
 *     Per Unit 11.0 D-13: field-specific errors so the inline form can
 *     surface the message next to the offending input.
 *   - 201 `{ id, slug, dimension, status: "submitted" }` on success.
 *
 * Per ADR-0013 D-F: `problemSlug` is plain text (no FK to content);
 * the route guards against unknown slugs via the `problems` import
 * from `#site/content`.
 *
 * Per ADR-0012 D-D: sign-in is a separate redirect flow; this route
 * does NOT attempt to redirect on missing session — it returns 401
 * and lets the caller (form / API client) handle the auth gap.
 */

interface SubmissionBody {
  problemSlug?: unknown;
  dimension?: unknown;
  proposedValue?: unknown;
  rationale?: unknown;
}

function unauthenticated(): Response {
  return Response.json({ error: "unauthenticated" }, { status: 401 });
}

function badRequest(field: string, message: string): Response {
  return Response.json({ error: "bad-request", field, message }, { status: 400 });
}

function moderationRefused(field: string, message: string): Response {
  return Response.json({ error: "moderation-refused", field, message }, { status: 422 });
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return unauthenticated();

  let body: SubmissionBody;
  try {
    body = (await req.json()) as SubmissionBody;
  } catch {
    return Response.json(
      { error: "bad-request", field: "body", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const problemSlug = typeof body.problemSlug === "string" ? body.problemSlug : "";
  const dimensionRaw = typeof body.dimension === "string" ? body.dimension : "";
  const proposedValue = typeof body.proposedValue === "string" ? body.proposedValue : "";
  const rationale = typeof body.rationale === "string" ? body.rationale : "";

  if (!problemSlug || !problems.some((p) => p.slug === problemSlug)) {
    return badRequest("problemSlug", "Unknown problem slug.");
  }
  if (!isValidDimension(dimensionRaw)) {
    return badRequest("dimension", `Dimension must be one of: ${DIMENSIONS.join(", ")}.`);
  }
  const proposedValueError = validateProposedValue(dimensionRaw, proposedValue);
  if (proposedValueError) {
    return badRequest("proposedValue", proposedValueError);
  }
  const rationaleError = validateRationale(rationale);
  if (rationaleError) {
    return badRequest("rationale", rationaleError);
  }

  // Content moderation per ADR-0024 D-D rating-challenge surface +
  // D-12 lean (rationale only; other fields are short-form). Default
  // Phase 35 = NoopModerator → `{ ok: true }`. Future providers refuse
  // on policy violation; 422 distinguishes moderation refusal from the
  // 400 validation-failure shape.
  const moderationDecision = await getModerator().moderateText(rationale, {
    surface: "rating-challenge",
    userIdOrEmail: session.user.id,
  });
  if (!moderationDecision.ok && moderationDecision.severity === "block") {
    return moderationRefused(
      "rationale",
      moderationDecision.reasons[0] ?? "Rationale refused by content moderation.",
    );
  }

  const { id } = await submitChallenge({
    userId: session.user.id,
    problemSlug,
    dimension: dimensionRaw,
    proposedValue,
    rationale,
  });

  return Response.json(
    { id, slug: problemSlug, dimension: dimensionRaw, status: "submitted" },
    { status: 201 },
  );
}
