import { unsubscribeByToken } from "@/lib/subscribers";

/**
 * Unsubscribe endpoint (Unit 30.3) per
 * [ADR-0021](../../../../../../docs/adr/0021-subscriber-list-email.md)
 * D-E.
 *
 * `GET /api/v1/subscribe/unsubscribe/[token]`.
 *
 * Renders a minimal HTML confirmation page (no client JS; SSR-only).
 * Idempotent per ADR-0021 D-E: re-clicking the link returns the same
 * success page; the row is soft-deleted (status → `unsubscribed`) on
 * the first call; subsequent calls find the row already-unsubscribed
 * and return the same page without re-mutating.
 *
 * 2 outcomes per ADR-0021 D-E:
 *   - 404 page when token not found.
 *   - 200 page on success (idempotent on already-unsubscribed).
 */

interface RouteContext {
  params: Promise<{ token: string }>;
}

function htmlPage(title: string, body: string, status: number): Response {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;line-height:1.5;color:#0B0D10}h1{font-size:22px}a{color:#0B0D10;text-decoration:underline}</style></head><body><h1>${title}</h1>${body}<p style="margin-top:32px;font-size:14px;color:#71717A"><a href="/digest">← back to the digest page</a></p></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(_req: Request, context: RouteContext): Promise<Response> {
  const { token } = await context.params;
  if (!token) {
    return htmlPage(
      "Invalid unsubscribe link",
      "<p>The unsubscribe link is missing a token.</p>",
      404,
    );
  }

  const result = await unsubscribeByToken(token);
  if (!result.ok) {
    return htmlPage(
      "Invalid unsubscribe link",
      "<p>We couldn't find a subscription matching that link.</p>",
      404,
    );
  }

  return htmlPage(
    "You've been unsubscribed",
    "<p>You won't receive any more emails from the LLM OpenProblems digest. You can resubscribe at any time from the digest page.</p>",
    200,
  );
}
