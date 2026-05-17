import { describe, expect, it, vi } from "vitest";

import { runCleanupStaleTokens, type CleanupStaleTokensDeps } from "./cleanup-stale-tokens";

/**
 * Tests for the stale verification-token cleanup cron driver per
 * [Phase-32 prep doc](../../../docs/thinking/32.0-phase-32-prep.md) D-3.
 *
 * Mirrors `digest-send.test.ts` injectable-deps testing style: all
 * deps are `vi.fn()` mocks; production code path (DELETE statement)
 * exercised end-to-end without touching SQLite. Replaces the original
 * B.20 DB-helper-deferred scope for the cleanup-cron path (matches
 * Phase-31 Unit 31.3 dep-injection coverage precedent).
 */

function makeDeps(overrides: Partial<CleanupStaleTokensDeps> = {}): CleanupStaleTokensDeps {
  return {
    deleteStalePendingTokens: vi.fn(async () => 0),
    logError: vi.fn(),
    now: () => new Date("2026-05-19T00:00:00Z"),
    ...overrides,
  };
}

describe("runCleanupStaleTokens", () => {
  it("returns deletedCount === 0 when nothing matches", async () => {
    const deps = makeDeps();
    const result = await runCleanupStaleTokens(deps);
    expect(result.deletedCount).toBe(0);
    expect(deps.deleteStalePendingTokens).toHaveBeenCalledTimes(1);
  });

  it("returns the count returned by deleteStalePendingTokens", async () => {
    const deps = makeDeps({ deleteStalePendingTokens: vi.fn(async () => 17) });
    const result = await runCleanupStaleTokens(deps);
    expect(result.deletedCount).toBe(17);
  });

  it("passes the current time as the cutoff to deleteStalePendingTokens", async () => {
    const fixedNow = new Date("2026-05-19T00:00:00Z");
    const deps = makeDeps({ now: () => fixedNow });
    await runCleanupStaleTokens(deps);
    expect(deps.deleteStalePendingTokens).toHaveBeenCalledWith(fixedNow);
  });

  it("isolates a thrown DELETE failure and returns 0 + logs the error", async () => {
    const deps = makeDeps({
      deleteStalePendingTokens: vi.fn(async () => {
        throw new Error("DB exploded");
      }),
    });
    const result = await runCleanupStaleTokens(deps);
    expect(result.deletedCount).toBe(0);
    expect(deps.logError).toHaveBeenCalledWith(
      "cleanup-delete-failed",
      expect.objectContaining({ error: "DB exploded" }),
    );
  });

  it("returns a non-negative durationMs", async () => {
    const deps = makeDeps();
    const result = await runCleanupStaleTokens(deps);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
