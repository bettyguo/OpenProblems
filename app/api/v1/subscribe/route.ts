import { taxonomy } from "#site/content";

import { sendEmail } from "@/lib/email";
import { renderVerificationEmail } from "@/lib/email/templates/verification";
import {
  canonicalizeEmail,
  createOrRefreshPendingSubscription,
  validateEmail,
} from "@/lib/subscribers";

/**
 * Subscribe endpoint (Unit 30.3) per
 * [ADR-0021](../../../../docs/adr/0021-subscriber-list-email.md) D-D
 * verification-flow contract.
 *
 * `POST /api/v1/subscribe` (body JSON `{ email, domains: string[] }`).
 *
 * Exit shapes:
 *   - 400 `{ error: "bad-request", field, message }` on validation
 *     failure (invalid JSON / invalid email / no valid domains).
 *   - 200 `{ status: "already_subscribed", domains }` when an existing
 *     `verified` row matches the email (no-op idempotent).
 *   - 200 `{ status: "verification_sent", refreshed?: true }` on
 *     success (new row OR refreshed pending row). When `RESEND_API_KEY`
 *     unset, the row is created but the email-send step returns the
 *     same `verification_sent` status with `emailUnavailable: true`
 *     surfacing the graceful-degradation case to the caller.
 *
 * Per ADR-0021 D-G graceful degradation: missing env vars do NOT block
 * the subscribe row from being created; the response surfaces
 * `emailUnavailable: true` so the caller renders an "we couldn't send
 * the email; contact support" message via i18n key
 * `email.send_unavailable`.
 */

interface SubscribeBody {
  email?: unknown;
  domains?: unknown;
}

function badRequest(field: string, message: string): Response {
  return Response.json({ error: "bad-request", field, message }, { status: 400 });
}

export async function POST(req: Request): Promise<Response> {
  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return Response.json(
      { error: "bad-request", field: "body", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const emailRaw = typeof body.email === "string" ? body.email : "";
  const email = canonicalizeEmail(emailRaw);
  if (!validateEmail(email)) {
    return badRequest("email", "Invalid email address.");
  }

  const domainsRaw = Array.isArray(body.domains) ? body.domains : [];
  const validDomainIds = new Set(taxonomy.domains.map((d) => d.id));
  const requestedDomains = domainsRaw
    .filter((d): d is string => typeof d === "string")
    .filter((d) => validDomainIds.has(d));
  if (requestedDomains.length === 0) {
    return badRequest("domains", "Select at least one valid domain.");
  }

  const { subscriber, wasRefresh } = await createOrRefreshPendingSubscription(
    email,
    requestedDomains,
  );

  if (subscriber.status === "verified") {
    return Response.json({
      status: "already_subscribed",
      domains: requestedDomains,
    });
  }

  // Send the verification email. Graceful degradation per ADR-0021 D-G:
  // missing env vars do NOT block the row from being created; we surface
  // the email-failure to the caller so they can render the support-
  // contact fallback message.
  const verificationUrl = buildVerificationUrl(req, subscriber.verificationToken ?? "");
  const domainTitles = taxonomy.domains
    .filter((d) => requestedDomains.includes(d.id))
    .map((d) => d.title);
  const supportEmail = process.env["EMAIL_FROM"]?.match(/<([^>]+)>/)?.[1] ?? "support@example.com";
  const html = renderVerificationEmail({ verificationUrl, domainTitles, supportEmail });
  const sendResult = await sendEmail(
    email,
    "Confirm your LLM OpenProblems digest subscription",
    html,
  );

  const responseBody: Record<string, unknown> = {
    status: "verification_sent",
    domains: requestedDomains,
  };
  if (wasRefresh) responseBody["refreshed"] = true;
  if (!sendResult.ok) responseBody["emailUnavailable"] = true;
  return Response.json(responseBody);
}

function buildVerificationUrl(req: Request, token: string): string {
  const base = new URL(req.url);
  return `${base.protocol}//${base.host}/api/v1/subscribe/verify/${encodeURIComponent(token)}`;
}
