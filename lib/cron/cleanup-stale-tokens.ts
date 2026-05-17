/**
 * Stale verification-token cleanup cron driver per
 * [Phase-32 prep doc](../../docs/thinking/32.0-phase-32-prep.md) D-3
 * (direct instantiation of [ADR-0022](../../docs/adr/0022-weekly-digest-scheduler.md)
 * D-A/D-D/D-F — no new ADR Phase 32; the cron pattern was designed
 * to scale additively).
 *
 * Removes `subscriber` rows whose verification was initiated but never
 * confirmed within the 24-hour TTL per ADR-0021 D-D. Preserves:
 *   - `status = 'verified'` rows (subscribed users).
 *   - `status = 'unsubscribed'` rows (audit trail per ADR-0021 D-E).
 *   - `status = 'pending_verification'` rows whose token has NOT yet
 *     expired (still within the 24-hour window; user may complete
 *     verification).
 *
 * Removes:
 *   - `status = 'pending_verification'` rows whose
 *     `verificationTokenExpiresAt < now` (expired and abandoned).
 *
 * Single-shared `CRON_SECRET` auth via `checkCronAuth` from
 * `digest-send.ts` — Phase-31 design extracted the helper exactly for
 * this multi-cron reuse case; Phase 32 is the first reuse.
 *
 * Mirrors `runDigestSend` injectable-deps shape so the loop logic is
 * unit-testable without a live DB (production deps inject Drizzle DELETE
 * + tests inject `vi.fn` mocks).
 */

export interface CleanupStaleTokensDeps {
  /**
   * DELETE stale `pending_verification` rows. Production: Drizzle
   * `db.delete(subscribers).where(...)`. Returns the deleted row count.
   */
  deleteStalePendingTokens: (cutoff: Date) => Promise<number>;
  /** Structured error logger (matches `runDigestSend.logError` shape). */
  logError: (msg: string, ctx: Record<string, unknown>) => void;
  /** Current time. Injected for deterministic tests. */
  now: () => Date;
}

export interface CleanupStaleTokensResult {
  /** Number of expired `pending_verification` rows deleted. */
  deletedCount: number;
  /** Wall-clock duration of the cleanup. */
  durationMs: number;
}

/**
 * Run the stale verification-token cleanup per Phase-32 prep D-3.
 *
 * Single-call DELETE — atomic at the SQLite-driver level so per-row
 * try/catch is unnecessary (mirrors ADR-0022 D-F's per-row-isolation
 * scope: the digest-send loop needs per-row isolation because each row
 * triggers an external API call; cleanup is pure DB-side so single-
 * statement atomicity suffices).
 *
 * Catches DB-level failures at the call site (a failed DELETE doesn't
 * leave the table in an inconsistent state; next week's cron retries
 * naturally — matches digest-send's "no in-week retry" posture per
 * ADR-0022 D-F).
 */
export async function runCleanupStaleTokens(
  deps: CleanupStaleTokensDeps,
): Promise<CleanupStaleTokensResult> {
  const start = deps.now().getTime();
  const cutoff = deps.now();

  let deletedCount = 0;
  try {
    deletedCount = await deps.deleteStalePendingTokens(cutoff);
  } catch (err) {
    deps.logError("cleanup-delete-failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return {
    deletedCount,
    durationMs: deps.now().getTime() - start,
  };
}
