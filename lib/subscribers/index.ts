import { randomBytes, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";

/**
 * Subscriber-list helpers (Unit 30.3) per
 * [ADR-0021](../../docs/adr/0021-subscriber-list-email.md). Pure-function
 * half (`canonicalizeEmail`, `validateEmail`, `generateToken`,
 * `parseDomainSubscriptions`, `serializeDomainSubscriptions`,
 * `safeCompareTokens`) is DB-agnostic; DB-helper half
 * (`createOrRefreshPendingSubscription`, `verifyByToken`,
 * `unsubscribeByToken`) is thin Drizzle wrappers.
 *
 * Mirrors `lib/rating-challenges/` + `lib/watchlist/` separation of
 * concerns (no auth knowledge inside the helpers; callers handle auth
 * if needed; Phase 30 subscriber rows are anonymous email-only per
 * ADR-0021 D-C; per-user-account subscriptions = Phase-31+ Q76 candidate).
 */

const TOKEN_BYTES = 32;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours per ADR-0021 D-D.
const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export type SubscriberStatus = "pending_verification" | "verified" | "unsubscribed";

/**
 * Lowercase + trim. Caller-side normalization per ADR-0021 D-B; ensures
 * the UNIQUE constraint on `email` is case-insensitive in practice.
 */
export function canonicalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Defensive email-format check. Not RFC-5322-complete (intentionally —
 * full RFC compliance is unsuitable for client validation); covers the
 * common-case shape that Resend's API will also validate server-side.
 */
export function validateEmail(email: string): boolean {
  if (email.length === 0 || email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Cryptographically random 32-byte URL-safe base64 token (256 bits of
 * entropy). Used for both `verificationToken` (single-use; 24h expiry)
 * and `unsubscribeToken` (never expires; idempotent) per ADR-0021 D-D
 * + D-E.
 */
export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * Constant-time string comparison via `crypto.timingSafeEqual`. Defends
 * against timing side-channels for token lookup per ADR-0021 D-D §15.5
 * reviewer-mode mindset (c) email-list-leak-via-timing guard.
 *
 * Returns `false` immediately when lengths differ (timingSafeEqual
 * throws on length mismatch); same-length comparison is constant-time
 * over the byte buffer.
 */
export function safeCompareTokens(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

/**
 * Parse the `domainSubscriptions` column (JSON-encoded `string[]`) per
 * ADR-0021 D-B. Returns empty array on parse failure (defensive).
 */
export function parseDomainSubscriptions(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

/**
 * Serialize a `string[]` of domain IDs to the `domainSubscriptions`
 * column. Deduplicates + sorts for canonical-form storage (makes
 * cross-row comparison + audit-trail diffing easier).
 */
export function serializeDomainSubscriptions(domains: readonly string[]): string {
  const unique = Array.from(new Set(domains.map((d) => d.trim()).filter(Boolean)));
  unique.sort();
  return JSON.stringify(unique);
}

export interface CreateSubscriptionResult {
  subscriber: typeof subscribers.$inferSelect;
  /** True when this call refreshed an existing row (re-submit or re-subscribe). */
  wasRefresh: boolean;
}

/**
 * Create a new `pending_verification` subscriber row, or refresh tokens
 * on an existing row. Implements the state-transition semantics per
 * ADR-0021 D-D step 3:
 *   - No row → create new with fresh tokens.
 *   - Existing `pending_verification` → refresh `verificationToken` + expiry.
 *   - Existing `verified` → no-op (caller treats as "already subscribed").
 *   - Existing `unsubscribed` → re-use row + reset status; preserves
 *     `unsubscribedAt` for audit trail.
 *
 * Caller pre-validates email format + canonicalizes. Caller-side i18n
 * messages distinguish the 4 outcomes via `result.subscriber.status` +
 * `result.wasRefresh`.
 */
export async function createOrRefreshPendingSubscription(
  email: string,
  domains: readonly string[],
): Promise<CreateSubscriptionResult> {
  const now = new Date(Date.now());
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
  const verificationToken = generateToken();
  const domainSubscriptions = serializeDomainSubscriptions(domains);

  const existing = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);

  const existingRow = existing[0];
  if (existingRow) {
    if (existingRow.status === "verified") {
      // No-op: row stays in `verified`; caller renders "already subscribed".
      return { subscriber: existingRow, wasRefresh: false };
    }
    // pending_verification OR unsubscribed → refresh + reset to pending.
    const updated = await db
      .update(subscribers)
      .set({
        status: "pending_verification",
        domainSubscriptions,
        verificationToken,
        verificationTokenExpiresAt: expiresAt,
        updatedAt: now,
      })
      .where(eq(subscribers.email, email))
      .returning();
    const updatedRow = updated[0];
    if (!updatedRow) {
      throw new Error("Subscriber row vanished between SELECT and UPDATE");
    }
    return { subscriber: updatedRow, wasRefresh: true };
  }

  const unsubscribeToken = generateToken();
  const inserted = await db
    .insert(subscribers)
    .values({
      email,
      status: "pending_verification",
      domainSubscriptions,
      verificationToken,
      verificationTokenExpiresAt: expiresAt,
      unsubscribeToken,
    })
    .returning();
  const insertedRow = inserted[0];
  if (!insertedRow) {
    throw new Error("INSERT returned no rows");
  }
  return { subscriber: insertedRow, wasRefresh: false };
}

export type VerifyResult =
  | { ok: true; subscriber: typeof subscribers.$inferSelect; alreadyVerified: boolean }
  | { ok: false; error: "invalid_token" | "token_expired" };

/**
 * Look up subscriber by `verificationToken` and transition to `verified`
 * if not expired. Idempotent on already-verified rows (returns
 * `alreadyVerified: true`).
 */
export async function verifyByToken(token: string): Promise<VerifyResult> {
  const rows = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.verificationToken, token))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "invalid_token" };
  // Constant-time re-validation defends against partial-match SQL timing.
  if (!row.verificationToken || !safeCompareTokens(row.verificationToken, token)) {
    return { ok: false, error: "invalid_token" };
  }
  if (row.status === "verified") {
    // Idempotent — caller can render the success page without re-sending welcome.
    return { ok: true, subscriber: row, alreadyVerified: true };
  }
  if (!row.verificationTokenExpiresAt || row.verificationTokenExpiresAt.getTime() < Date.now()) {
    return { ok: false, error: "token_expired" };
  }
  const now = new Date(Date.now());
  const updated = await db
    .update(subscribers)
    .set({
      status: "verified",
      verificationToken: null,
      verificationTokenExpiresAt: null,
      verifiedAt: now,
      updatedAt: now,
    })
    .where(eq(subscribers.id, row.id))
    .returning();
  const updatedRow = updated[0];
  if (!updatedRow) {
    throw new Error("Subscriber row vanished between SELECT and UPDATE on verify");
  }
  return { ok: true, subscriber: updatedRow, alreadyVerified: false };
}

export type UnsubscribeResult =
  | { ok: true; subscriber: typeof subscribers.$inferSelect; alreadyUnsubscribed: boolean }
  | { ok: false; error: "invalid_token" };

/**
 * Look up subscriber by `unsubscribeToken` and transition to
 * `unsubscribed`. Idempotent on already-unsubscribed rows.
 *
 * Token NOT cleared per ADR-0021 D-E — re-clicking is idempotent and
 * returns the same confirmation page.
 */
export async function unsubscribeByToken(token: string): Promise<UnsubscribeResult> {
  const rows = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.unsubscribeToken, token))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "invalid_token" };
  if (!safeCompareTokens(row.unsubscribeToken, token)) {
    return { ok: false, error: "invalid_token" };
  }
  if (row.status === "unsubscribed") {
    return { ok: true, subscriber: row, alreadyUnsubscribed: true };
  }
  const now = new Date(Date.now());
  const updated = await db
    .update(subscribers)
    .set({
      status: "unsubscribed",
      unsubscribedAt: now,
      updatedAt: now,
    })
    .where(eq(subscribers.id, row.id))
    .returning();
  const updatedRow = updated[0];
  if (!updatedRow) {
    throw new Error("Subscriber row vanished between SELECT and UPDATE on unsubscribe");
  }
  return { ok: true, subscriber: updatedRow, alreadyUnsubscribed: false };
}
