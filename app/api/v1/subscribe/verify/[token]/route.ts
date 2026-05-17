import { taxonomy } from "#site/content";

import { sendEmail } from "@/lib/email";
import { renderWelcomeEmail } from "@/lib/email/templates/welcome";
import { parseDomainSubscriptions, verifyByToken } from "@/lib/subscribers";

/**
 * Verification endpoint (Unit 30.3) per
 * [ADR-0021](../../../../../../docs/adr/0021-subscriber-list-email.md)
 * D-D.
 *
 * `GET /api/v1/subscribe/verify/[token]`.
 *
 * Renders a minimal HTML confirmation page (no client JS; SSR-only) on
 * success or failure. On success, also sends the welcome email per
 * ADR-0021 D-D step 5 (best-effort; graceful degradation if Resend
 * env vars unset).
 *
 * 3 outcomes per ADR-0021 D-D:
 *   - 404 + `email.invalid_token` page when token not found.
 *   - 410 + `email.token_expired` page when token expired.
 *   - 200 + `email.verify_success` page on success (idempotent: same
 *     page on re-click of already-verified token).
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
      "Invalid verification link",
      "<p>The verification link is missing a token.</p>",
      404,
    );
  }

  const result = await verifyByToken(token);
  if (!result.ok) {
    if (result.error === "token_expired") {
      return htmlPage(
        "Verification link expired",
        "<p>This verification link has expired (24-hour window). Please submit the subscribe form again to receive a fresh link.</p>",
        410,
      );
    }
    return htmlPage(
      "Invalid verification link",
      "<p>We couldn't find a subscription matching that link. It may have been used already, or the link may have been corrupted in transit. Please submit the subscribe form again.</p>",
      404,
    );
  }

  // Send welcome email best-effort (idempotent: even on already-verified
  // re-click we render the same success page but skip the re-send).
  if (!result.alreadyVerified) {
    const domainIds = parseDomainSubscriptions(result.subscriber.domainSubscriptions);
    const domainTitles = taxonomy.domains
      .filter((d) => domainIds.includes(d.id))
      .map((d) => d.title);
    const unsubscribeUrl = buildUnsubscribeUrl(_req, result.subscriber.unsubscribeToken);
    const supportEmail =
      process.env["EMAIL_FROM"]?.match(/<([^>]+)>/)?.[1] ?? "support@example.com";
    const html = renderWelcomeEmail({ domainTitles, unsubscribeUrl, supportEmail });
    await sendEmail(
      result.subscriber.email,
      "You're subscribed to the LLM OpenProblems digest",
      html,
    );
  }

  return htmlPage(
    "Subscription confirmed",
    "<p>Your subscription is confirmed. You'll receive a welcome email shortly, and the weekly digest will arrive once the scheduler launches in a future release.</p>",
    200,
  );
}

function buildUnsubscribeUrl(req: Request, token: string): string {
  const base = new URL(req.url);
  return `${base.protocol}//${base.host}/api/v1/subscribe/unsubscribe/${encodeURIComponent(token)}`;
}
