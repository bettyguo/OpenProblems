import { timingSafeEqual } from "node:crypto";

import type { DigestPayload } from "@/lib/digest/build-digest";
import type { SendEmailResult } from "@/lib/email";
import type { subscribers } from "@/lib/db/schema";

/**
 * Weekly digest cron driver per [ADR-0022](../../docs/adr/0022-weekly-digest-scheduler.md)
 * D-C (send semantics) + D-D (auth boundary) + D-F (per-row try/catch
 * failure handling) + D-10 (`subscriber.lastDigestSentAt` idempotency).
 *
 * Two pure-ish surfaces:
 *
 * - **`checkCronAuth`** — pure function that validates the cron-route
 *   request headers. Returns `{ ok: true }` iff BOTH (a) the `vercel-cron`
 *   header is present AND (b) the `Authorization` header equals
 *   `Bearer ${CRON_SECRET}` under constant-time comparison. Mirrors
 *   Phase-30 `safeCompareTokens` defense against timing side-channels.
 *
 * - **`runDigestSend`** — orchestrator with **fully injectable dependencies**.
 *   The cron route adapts real implementations (`db` + `sendEmail` +
 *   `buildDigest` + `getVerifiedSubscribersForDomain`) into the
 *   `DigestSendDeps` shape; tests inject mocks. Returns a structured
 *   `DigestSendResult` for cron-route response payload + Vercel
 *   dashboard observability.
 *
 * Kept separate from `app/api/v1/cron/digest-send/route.ts` so the loop
 * logic is unit-testable without a live DB or Resend client — mirrors
 * Phase-30's pure/DB split in `lib/subscribers/`.
 */

export interface CronAuthHeaders {
  /** Value of the `Authorization` request header, or `null` when absent. */
  authorizationHeader: string | null;
  /** Value of the `vercel-cron` request header, or `null` when absent. */
  vercelCronHeader: string | null;
}

export type CronAuthResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing_cron_secret_env" | "missing_vercel_cron_header" | "bad_authorization";
    };

/**
 * Constant-time string comparison via `crypto.timingSafeEqual`. Mirrors
 * `lib/subscribers/safeCompareTokens` per ADR-0022 D-D — bearer-token
 * comparison must be constant-time to defend against timing side-channels.
 */
function safeCompareStrings(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Validate the cron-route request per ADR-0022 D-D (belt-and-suspenders
 * `CRON_SECRET` bearer-token + `vercel-cron` header presence check).
 *
 * Both layers must pass:
 *   1. `vercel-cron` header is present (Vercel injects `vercel-cron: 1`
 *      on cron invocations).
 *   2. `Authorization` header equals `Bearer ${cronSecret}` under
 *      constant-time comparison.
 *
 * When `cronSecret` is `undefined`/empty (env var unset), returns
 * `{ ok: false, reason: "missing_cron_secret_env" }` — graceful
 * degradation mirroring Q54 + Q73 + Q75 posture.
 */
export function checkCronAuth(
  headers: CronAuthHeaders,
  cronSecret: string | undefined,
): CronAuthResult {
  if (!cronSecret) return { ok: false, reason: "missing_cron_secret_env" };
  if (headers.vercelCronHeader === null) return { ok: false, reason: "missing_vercel_cron_header" };
  const expected = `Bearer ${cronSecret}`;
  const actual = headers.authorizationHeader ?? "";
  if (!safeCompareStrings(actual, expected)) {
    return { ok: false, reason: "bad_authorization" };
  }
  return { ok: true };
}

export interface DigestSendDeps {
  /**
   * Build the per-domain `DigestPayload` for the trailing-7-day window.
   * Production: thin wrapper around `lib/digest/build-digest`. Tests
   * inject deterministic fixtures.
   */
  buildDigestForDomain: (domainId: string) => Promise<DigestPayload>;
  /**
   * Fetch verified subscribers opted into a given taxonomy domain.
   * Production: `lib/subscribers/getVerifiedSubscribersForDomain`.
   */
  getVerifiedSubscribersForDomain: (
    domainId: string,
  ) => Promise<(typeof subscribers.$inferSelect)[]>;
  /** Render the digest email HTML for a given (payload, subscriber) pair. */
  renderDigestEmail: (payload: DigestPayload, unsubscribeToken: string) => string;
  /** Send the rendered email via the provider abstraction. */
  sendEmail: (to: string, subject: string, html: string) => Promise<SendEmailResult>;
  /**
   * Persist the `lastDigestSentAt` column for the given subscriber after
   * a successful send. Production: Drizzle UPDATE.
   */
  updateLastDigestSentAt: (subscriberId: string, sentAt: Date) => Promise<void>;
  /** Structured error logger (not throw — per ADR-0022 D-F log + skip). */
  logError: (msg: string, ctx: Record<string, unknown>) => void;
  /** Current time. Injected for deterministic tests. */
  now: () => Date;
  /** Taxonomy domain list (id + title pairs). Production: `taxonomy.domains`. */
  domains: ReadonlyArray<{ id: string; title: string }>;
}

export interface DigestSendResult {
  /** Number of domains iterated (full `domains.length`). */
  domains: number;
  /** Number of domains skipped because `buildDigest.items.length === 0`. */
  skippedEmptyDomains: number;
  /** Number of subscriber-emails successfully sent. */
  sent: number;
  /** Number of subscriber-emails attempted but failed. */
  failed: number;
  /** Number of subscriber-rows skipped because already sent this week. */
  skippedAlreadySent: number;
  /** Wall-clock duration of the send loop. */
  durationMs: number;
}

/**
 * Compute the start-of-current-ISO-week timestamp in UTC (Monday 00:00:00.000).
 *
 * Used as the idempotency threshold per ADR-0022 D-10 — subscriber rows
 * whose `lastDigestSentAt > startOfCurrentIsoWeekUtc(now)` are skipped
 * (already received this week's digest).
 *
 * Algorithm: from `now`, snap to UTC midnight, then subtract the number
 * of days since Monday (`dayOfWeek` mapping: Sun=0 → subtract 6;
 * Mon=1 → subtract 0; Tue=2 → subtract 1; ...).
 */
export function startOfCurrentIsoWeekUtc(now: Date): number {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  const dayOfWeek = d.getUTCDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setUTCDate(d.getUTCDate() - daysToSubtract);
  return d.getTime();
}

/**
 * Run the weekly digest send loop per ADR-0022 D-C.
 *
 * Outer loop iterates taxonomy domains; inner loop iterates verified
 * subscribers opted into that domain. Per-row try/catch ensures one bad
 * recipient does NOT halt the batch (ADR-0022 D-F). Per-row idempotency
 * check against `startOfCurrentIsoWeekUtc(now)` guards against double-
 * sends across Vercel Cron retries (ADR-0022 D-10).
 *
 * Empty-window domains (where `buildDigest.items.length === 0`) are
 * skipped entirely — subscribers' `lastDigestSentAt` is NOT updated so
 * next week's cron picks them up cleanly if there's content (ADR-0022
 * D-F empty-window skip).
 */
export async function runDigestSend(deps: DigestSendDeps): Promise<DigestSendResult> {
  const start = deps.now().getTime();
  const weekStartMs = startOfCurrentIsoWeekUtc(deps.now());

  let sent = 0;
  let failed = 0;
  let skippedAlreadySent = 0;
  let skippedEmptyDomains = 0;

  for (const domain of deps.domains) {
    let payload: DigestPayload;
    try {
      payload = await deps.buildDigestForDomain(domain.id);
    } catch (err) {
      deps.logError("digest-build-failed", {
        domain: domain.id,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    if (payload.items.length === 0) {
      skippedEmptyDomains++;
      continue;
    }

    let subs: (typeof subscribers.$inferSelect)[];
    try {
      subs = await deps.getVerifiedSubscribersForDomain(domain.id);
    } catch (err) {
      deps.logError("subscriber-fetch-failed", {
        domain: domain.id,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    for (const sub of subs) {
      if (sub.lastDigestSentAt && sub.lastDigestSentAt.getTime() >= weekStartMs) {
        skippedAlreadySent++;
        continue;
      }
      try {
        const html = deps.renderDigestEmail(payload, sub.unsubscribeToken);
        const subject = `${domain.title} — weekly digest`;
        const result = await deps.sendEmail(sub.email, subject, html);
        if (!result.ok) {
          failed++;
          deps.logError("send-failed", {
            subscriberId: sub.id,
            domain: domain.id,
            error: result.error,
            message: "message" in result ? result.message : undefined,
          });
          continue;
        }
        await deps.updateLastDigestSentAt(sub.id, deps.now());
        sent++;
      } catch (err) {
        failed++;
        deps.logError("send-threw", {
          subscriberId: sub.id,
          domain: domain.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return {
    domains: deps.domains.length,
    skippedEmptyDomains,
    sent,
    failed,
    skippedAlreadySent,
    durationMs: deps.now().getTime() - start,
  };
}
