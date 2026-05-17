import { describe, expect, it, vi } from "vitest";

import {
  checkCronAuth,
  runDigestSend,
  startOfCurrentIsoWeekUtc,
  type DigestSendDeps,
} from "./digest-send";
import type { DigestPayload } from "@/lib/digest/build-digest";
import type { subscribers } from "@/lib/db/schema";
import type { SendEmailResult } from "@/lib/email";

/**
 * Tests for the weekly digest cron driver per
 * [ADR-0022](../../../docs/adr/0022-weekly-digest-scheduler.md).
 *
 * Three groups:
 *   1. `checkCronAuth` — pure-function auth check (belt-and-suspenders
 *      `CRON_SECRET` + `vercel-cron` per ADR-0022 D-D).
 *   2. `startOfCurrentIsoWeekUtc` — pure-function week-start computation
 *      (idempotency threshold per ADR-0022 D-10).
 *   3. `runDigestSend` — orchestrator with fully injected dependencies;
 *      tests the per-domain × per-subscriber loop, idempotency guard,
 *      per-row failure isolation, and empty-window skip per ADR-0022
 *      D-C + D-F.
 *
 * Coverage replaces the DB-helper "B.20 deferred" scope by stubbing
 * the entire dep surface — production code paths are exercised end-to-
 * end without touching SQLite or Resend.
 */

const VALID_SECRET = "abcdef1234567890";

function subRow(
  overrides: Partial<typeof subscribers.$inferSelect> = {},
): typeof subscribers.$inferSelect {
  return {
    id: "sub-id",
    email: "user@example.com",
    status: "verified",
    domainSubscriptions: '["general-ml"]',
    verificationToken: null,
    verificationTokenExpiresAt: null,
    unsubscribeToken: "unsub-tok",
    verifiedAt: new Date("2026-05-01T00:00:00Z"),
    unsubscribedAt: null,
    lastDigestSentAt: null,
    userId: null,
    createdAt: new Date("2026-05-01T00:00:00Z"),
    updatedAt: new Date("2026-05-01T00:00:00Z"),
    ...overrides,
  };
}

function payloadFixture(domain: string, itemCount: number): DigestPayload {
  return {
    domain,
    domainTitle: domain.toUpperCase(),
    windowDays: 7,
    generatedAt: "2026-05-18T00:00:00Z",
    cutoffDate: "2026-05-11",
    channelTitle: `LLM OpenProblems — ${domain} digest`,
    channelDescription: "",
    items: Array.from({ length: itemCount }, (_, i) => ({
      kind: "rating-action" as const,
      title: `Item ${i}`,
      link: `/problems/x/${i}`,
      date: "2026-05-15",
      description: `desc ${i}`,
      guid: `guid-${i}`,
      problemSlug: "x",
      problemTitle: "X",
    })),
  };
}

describe("checkCronAuth", () => {
  it("returns ok when both headers present + Authorization matches", () => {
    const result = checkCronAuth(
      {
        authorizationHeader: `Bearer ${VALID_SECRET}`,
        vercelCronHeader: "1",
      },
      VALID_SECRET,
    );
    expect(result).toEqual({ ok: true });
  });

  it("returns missing_cron_secret_env when env var unset", () => {
    const result = checkCronAuth(
      {
        authorizationHeader: `Bearer ${VALID_SECRET}`,
        vercelCronHeader: "1",
      },
      undefined,
    );
    expect(result).toEqual({ ok: false, reason: "missing_cron_secret_env" });
  });

  it("returns missing_cron_secret_env when env var is empty string", () => {
    const result = checkCronAuth(
      {
        authorizationHeader: `Bearer ${VALID_SECRET}`,
        vercelCronHeader: "1",
      },
      "",
    );
    expect(result).toEqual({ ok: false, reason: "missing_cron_secret_env" });
  });

  it("returns missing_vercel_cron_header when vercel-cron absent", () => {
    const result = checkCronAuth(
      {
        authorizationHeader: `Bearer ${VALID_SECRET}`,
        vercelCronHeader: null,
      },
      VALID_SECRET,
    );
    expect(result).toEqual({ ok: false, reason: "missing_vercel_cron_header" });
  });

  it("returns bad_authorization when Authorization header absent", () => {
    const result = checkCronAuth(
      { authorizationHeader: null, vercelCronHeader: "1" },
      VALID_SECRET,
    );
    expect(result).toEqual({ ok: false, reason: "bad_authorization" });
  });

  it("returns bad_authorization when Authorization header is wrong secret", () => {
    const result = checkCronAuth(
      {
        authorizationHeader: `Bearer wrong-secret`,
        vercelCronHeader: "1",
      },
      VALID_SECRET,
    );
    expect(result).toEqual({ ok: false, reason: "bad_authorization" });
  });

  it("returns bad_authorization when scheme is not Bearer", () => {
    const result = checkCronAuth(
      {
        authorizationHeader: `Basic ${VALID_SECRET}`,
        vercelCronHeader: "1",
      },
      VALID_SECRET,
    );
    expect(result).toEqual({ ok: false, reason: "bad_authorization" });
  });

  it("uses length-mismatch fast-path without throwing", () => {
    // shorter-than-expected token — must not throw
    const result = checkCronAuth(
      { authorizationHeader: "Bearer x", vercelCronHeader: "1" },
      VALID_SECRET,
    );
    expect(result).toEqual({ ok: false, reason: "bad_authorization" });
  });
});

describe("startOfCurrentIsoWeekUtc", () => {
  it("returns the Monday 00:00 UTC of the current ISO week", () => {
    // 2026-05-18 is a Monday.
    expect(startOfCurrentIsoWeekUtc(new Date("2026-05-18T12:34:56Z"))).toBe(
      new Date("2026-05-18T00:00:00Z").getTime(),
    );
  });

  it("handles Sunday by walking back to the prior Monday", () => {
    // 2026-05-17 is a Sunday.
    expect(startOfCurrentIsoWeekUtc(new Date("2026-05-17T12:00:00Z"))).toBe(
      new Date("2026-05-11T00:00:00Z").getTime(),
    );
  });

  it("handles Wednesday by walking back to Monday", () => {
    // 2026-05-20 is a Wednesday.
    expect(startOfCurrentIsoWeekUtc(new Date("2026-05-20T08:00:00Z"))).toBe(
      new Date("2026-05-18T00:00:00Z").getTime(),
    );
  });

  it("snaps to midnight UTC regardless of input time", () => {
    expect(startOfCurrentIsoWeekUtc(new Date("2026-05-18T23:59:59.999Z"))).toBe(
      new Date("2026-05-18T00:00:00Z").getTime(),
    );
  });
});

function makeDeps(overrides: Partial<DigestSendDeps> = {}): DigestSendDeps {
  return {
    buildDigestForDomain: vi.fn(async (id) => payloadFixture(id, 2)),
    getVerifiedSubscribersForDomain: vi.fn(async () => []),
    renderDigestEmail: vi.fn(() => "<html>fake</html>"),
    sendEmail: vi.fn(async (): Promise<SendEmailResult> => ({ ok: true, id: "msg-1" })),
    updateLastDigestSentAt: vi.fn(async () => {}),
    logError: vi.fn(),
    now: () => new Date("2026-05-18T00:00:00Z"),
    domains: [{ id: "general-ml", title: "General ML" }],
    ...overrides,
  };
}

describe("runDigestSend", () => {
  it("iterates domains × verified subscribers and sends one email per pair", async () => {
    const deps = makeDeps({
      domains: [
        { id: "general-ml", title: "General ML" },
        { id: "applications", title: "Applications" },
      ],
      getVerifiedSubscribersForDomain: vi.fn(async (id) => [
        subRow({ id: `sub-${id}-1`, domainSubscriptions: `["${id}"]` }),
        subRow({ id: `sub-${id}-2`, domainSubscriptions: `["${id}"]` }),
      ]),
    });
    const result = await runDigestSend(deps);
    expect(result.sent).toBe(4);
    expect(result.failed).toBe(0);
    expect(result.skippedEmptyDomains).toBe(0);
    expect(result.skippedAlreadySent).toBe(0);
    expect(result.domains).toBe(2);
    expect(deps.sendEmail).toHaveBeenCalledTimes(4);
    expect(deps.updateLastDigestSentAt).toHaveBeenCalledTimes(4);
  });

  it("skips empty-window domains entirely", async () => {
    const deps = makeDeps({
      domains: [
        { id: "general-ml", title: "General ML" },
        { id: "applications", title: "Applications" },
      ],
      buildDigestForDomain: vi.fn(async (id) => payloadFixture(id, id === "general-ml" ? 0 : 2)),
      getVerifiedSubscribersForDomain: vi.fn(async () => [subRow()]),
    });
    const result = await runDigestSend(deps);
    expect(result.skippedEmptyDomains).toBe(1);
    expect(result.sent).toBe(1);
    expect(deps.getVerifiedSubscribersForDomain).toHaveBeenCalledTimes(1);
    expect(deps.getVerifiedSubscribersForDomain).toHaveBeenCalledWith("applications");
  });

  it("skips subscribers whose lastDigestSentAt is within the current ISO week (idempotency)", async () => {
    // weekStart = 2026-05-18 Monday 00:00 UTC; "now" = same Monday 00:00 UTC.
    // Subscriber sent at 2026-05-18 00:05 → within current week → skip.
    // Subscriber sent at 2026-05-11 00:00 → previous week → send.
    const deps = makeDeps({
      getVerifiedSubscribersForDomain: vi.fn(async () => [
        subRow({ id: "skip-me", lastDigestSentAt: new Date("2026-05-18T00:05:00Z") }),
        subRow({ id: "send-me", lastDigestSentAt: new Date("2026-05-11T00:00:00Z") }),
      ]),
    });
    const result = await runDigestSend(deps);
    expect(result.sent).toBe(1);
    expect(result.skippedAlreadySent).toBe(1);
    const calls = (deps.updateLastDigestSentAt as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.map((c) => c[0])).toEqual(["send-me"]);
  });

  it("isolates per-row send failures and continues the batch", async () => {
    const deps = makeDeps({
      getVerifiedSubscribersForDomain: vi.fn(async () => [
        subRow({ id: "ok-1" }),
        subRow({ id: "fails", email: "bad@example.com" }),
        subRow({ id: "ok-2" }),
      ]),
      sendEmail: vi.fn(async (to): Promise<SendEmailResult> => {
        if (to === "bad@example.com")
          return { ok: false, error: "provider_error", message: "boom" };
        return { ok: true, id: "ok" };
      }),
    });
    const result = await runDigestSend(deps);
    expect(result.sent).toBe(2);
    expect(result.failed).toBe(1);
    expect(deps.logError).toHaveBeenCalledWith(
      "send-failed",
      expect.objectContaining({ subscriberId: "fails", error: "provider_error" }),
    );
    // Failed row should NOT have its lastDigestSentAt updated.
    const updateCalls = (deps.updateLastDigestSentAt as ReturnType<typeof vi.fn>).mock.calls;
    expect(updateCalls.map((c) => c[0]).sort()).toEqual(["ok-1", "ok-2"]);
  });

  it("isolates per-row thrown exceptions and continues the batch", async () => {
    const deps = makeDeps({
      getVerifiedSubscribersForDomain: vi.fn(async () => [
        subRow({ id: "ok-1", email: "ok1@example.com" }),
        subRow({ id: "throws", email: "boom@example.com" }),
        subRow({ id: "ok-2", email: "ok2@example.com" }),
      ]),
      sendEmail: vi.fn(async (to): Promise<SendEmailResult> => {
        if (to === "boom@example.com") throw new Error("network exploded");
        return { ok: true, id: "ok" };
      }),
    });
    const result = await runDigestSend(deps);
    expect(result.sent).toBe(2);
    expect(result.failed).toBe(1);
    expect(deps.logError).toHaveBeenCalledWith(
      "send-threw",
      expect.objectContaining({ subscriberId: "throws", error: "network exploded" }),
    );
  });

  it("does not call updateLastDigestSentAt for failed sends", async () => {
    const deps = makeDeps({
      getVerifiedSubscribersForDomain: vi.fn(async () => [subRow({ id: "fails" })]),
      sendEmail: vi.fn(
        async (): Promise<SendEmailResult> => ({
          ok: false,
          error: "missing_api_key",
        }),
      ),
    });
    await runDigestSend(deps);
    expect(deps.updateLastDigestSentAt).not.toHaveBeenCalled();
  });

  it("survives a failing buildDigestForDomain and continues to the next domain", async () => {
    const deps = makeDeps({
      domains: [
        { id: "fails", title: "Fails" },
        { id: "ok", title: "OK" },
      ],
      buildDigestForDomain: vi.fn(async (id) => {
        if (id === "fails") throw new Error("digest build failed");
        return payloadFixture(id, 1);
      }),
      getVerifiedSubscribersForDomain: vi.fn(async () => [subRow()]),
    });
    const result = await runDigestSend(deps);
    expect(result.sent).toBe(1);
    expect(deps.logError).toHaveBeenCalledWith(
      "digest-build-failed",
      expect.objectContaining({ domain: "fails" }),
    );
  });

  it("survives a failing getVerifiedSubscribersForDomain and continues to the next domain", async () => {
    const deps = makeDeps({
      domains: [
        { id: "select-fails", title: "Fails" },
        { id: "ok", title: "OK" },
      ],
      getVerifiedSubscribersForDomain: vi.fn(async (id) => {
        if (id === "select-fails") throw new Error("DB exploded");
        return [subRow()];
      }),
    });
    const result = await runDigestSend(deps);
    expect(result.sent).toBe(1);
    expect(deps.logError).toHaveBeenCalledWith(
      "subscriber-fetch-failed",
      expect.objectContaining({ domain: "select-fails" }),
    );
  });

  it("returns 0 sends when domains array is empty", async () => {
    const deps = makeDeps({ domains: [] });
    const result = await runDigestSend(deps);
    expect(result).toMatchObject({ domains: 0, sent: 0, failed: 0, skippedEmptyDomains: 0 });
  });

  it("renders the digest email with the subscriber's unsubscribe token", async () => {
    const deps = makeDeps({
      getVerifiedSubscribersForDomain: vi.fn(async () => [subRow({ unsubscribeToken: "tok-abc" })]),
    });
    await runDigestSend(deps);
    expect(deps.renderDigestEmail).toHaveBeenCalledWith(expect.anything(), "tok-abc");
  });

  it("sends emails with a domain-titled subject line", async () => {
    const deps = makeDeps({
      domains: [{ id: "general-ml", title: "General Machine Learning" }],
      getVerifiedSubscribersForDomain: vi.fn(async () => [subRow()]),
    });
    await runDigestSend(deps);
    expect(deps.sendEmail).toHaveBeenCalledWith(
      "user@example.com",
      "General Machine Learning — weekly digest",
      "<html>fake</html>",
    );
  });
});
