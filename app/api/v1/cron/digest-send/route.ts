import { eq } from "drizzle-orm";

import { taxonomy } from "#site/content";

import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { buildDigest } from "@/lib/digest/build-digest";
import { sendEmail } from "@/lib/email";
import { renderDigestEmail } from "@/lib/email/templates/digest";
import { checkCronAuth, runDigestSend, type DigestSendDeps } from "@/lib/cron/digest-send";
import { SITE } from "@/lib/site-url";
import { getVerifiedSubscribersForDomain } from "@/lib/subscribers";

/**
 * Weekly digest cron endpoint per
 * [ADR-0022](../../../../../docs/adr/0022-weekly-digest-scheduler.md).
 *
 * Triggered by Vercel Cron per `vercel.json` `crons` config (Monday
 * 00:00 UTC weekly per ADR-0022 D-B). Authenticated via the belt-and-
 * suspenders `CRON_SECRET` bearer-token + `vercel-cron` header per
 * ADR-0022 D-D.
 *
 * Thin route shim — all logic lives in [`lib/cron/digest-send.ts`](../../../../../lib/cron/digest-send.ts).
 * The route's job is to (a) check auth + return 401 on failure, (b)
 * adapt the production dependencies into the `DigestSendDeps` shape,
 * (c) return the structured `DigestSendResult` JSON for Vercel
 * dashboard observability + Q75 monitoring sub-step per ADR-0022 D-G.
 *
 * **POST only** (per Vercel Cron's HTTP method default). GET returns
 * 405.
 */

export async function POST(req: Request): Promise<Response> {
  const auth = checkCronAuth(
    {
      authorizationHeader: req.headers.get("authorization"),
      vercelCronHeader: req.headers.get("vercel-cron"),
    },
    process.env["CRON_SECRET"],
  );
  if (!auth.ok) {
    return Response.json({ error: "unauthorized", reason: auth.reason }, { status: 401 });
  }

  const supportEmail = process.env["EMAIL_FROM"]?.match(/<([^>]+)>/)?.[1] ?? "support@example.com";

  const deps: DigestSendDeps = {
    buildDigestForDomain: (domainId) => buildDigest({ domain: domainId }),
    getVerifiedSubscribersForDomain: (domainId) => getVerifiedSubscribersForDomain(domainId),
    renderDigestEmail: (payload, unsubscribeToken) =>
      renderDigestEmail({
        payload,
        unsubscribeUrl: `${SITE}/api/v1/subscribe/unsubscribe/${encodeURIComponent(unsubscribeToken)}`,
        supportEmail,
      }),
    sendEmail: (to, subject, html) => sendEmail(to, subject, html),
    updateLastDigestSentAt: async (subscriberId, sentAt) => {
      await db
        .update(subscribers)
        .set({ lastDigestSentAt: sentAt, updatedAt: sentAt })
        .where(eq(subscribers.id, subscriberId));
    },
    logError: (msg, ctx) => {
      // Vercel dashboard captures stderr; structured-log shape per ADR-0022 D-F.

      console.error(`[digest-send] ${msg}`, ctx);
    },
    now: () => new Date(),
    domains: taxonomy.domains,
  };

  const result = await runDigestSend(deps);
  return Response.json(result, { status: 200 });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "method_not_allowed" }, { status: 405 });
}
