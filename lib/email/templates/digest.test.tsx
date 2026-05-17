import { describe, expect, it } from "vitest";

import { renderDigestEmail } from "./digest";
import type { DigestPayload } from "@/lib/digest/build-digest";

/**
 * Tests for the weekly digest email template per
 * [ADR-0022](../../../docs/adr/0022-weekly-digest-scheduler.md) D-E.
 *
 * Validates: (a) HTML structure includes the domain title + item content
 * + unsubscribe URL + support email; (b) `<!DOCTYPE html>` prefix is
 * present; (c) relative item links are absolutized via `SITE`;
 * (d) defensive HTML-escape on string fields; (e) empty-items payload
 * renders the "no activity" placeholder (defense-in-depth — the cron
 * route's per-domain skip per ADR-0022 D-F means this path is not hit
 * in production).
 */

function payloadFixture(overrides: Partial<DigestPayload> = {}): DigestPayload {
  return {
    domain: "general-ml",
    domainTitle: "General Machine Learning",
    windowDays: 7,
    generatedAt: "2026-05-18T00:00:00.000Z",
    cutoffDate: "2026-05-11",
    channelTitle: "LLM OpenProblems — General Machine Learning digest",
    channelDescription: "2 items in the last 7 days for the General Machine Learning domain.",
    items: [
      {
        kind: "rating-action",
        title: "Benchmark Integrity — Difficulty A → S",
        link: "/problems/benchmark-integrity/ratings#abc",
        date: "2026-05-17",
        description: "Rating action by curator-x on 2026-05-17: Difficulty upgraded A → S.",
        guid: "abc",
        problemSlug: "benchmark-integrity",
        problemTitle: "Benchmark Integrity",
      },
      {
        kind: "leaderboard-entry",
        title: "Benchmark Integrity — SWE-bench 0.85",
        link: "/problems/benchmark-integrity",
        date: "2026-05-15",
        description: "Leaderboard entry: paper-id reports 0.85 on SWE-bench (2026-05-15).",
        guid: "entry:benchmark-integrity/p1/swe/2026-05-15",
        problemSlug: "benchmark-integrity",
        problemTitle: "Benchmark Integrity",
      },
    ],
    ...overrides,
  };
}

describe("renderDigestEmail", () => {
  it("renders with <!DOCTYPE html> prefix (email-client compat)", () => {
    const html = renderDigestEmail({
      payload: payloadFixture(),
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("includes the domain title in heading + footer", () => {
    const html = renderDigestEmail({
      payload: payloadFixture(),
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    // Heading + footer "you're receiving this because" mention.
    expect(html).toContain("General Machine Learning &mdash; weekly digest");
    expect(html).toContain("<strong>General Machine Learning</strong>");
  });

  it("renders each item's title + date + description", () => {
    const html = renderDigestEmail({
      payload: payloadFixture(),
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    // Item titles (em-dash + arrow are literal Unicode in the fixture; not HTML-escaped by `escapeHtml`).
    expect(html).toContain("Benchmark Integrity — Difficulty A → S");
    expect(html).toContain("Benchmark Integrity — SWE-bench 0.85");
    // Dates.
    expect(html).toContain("2026-05-17");
    expect(html).toContain("2026-05-15");
    // Descriptions.
    expect(html).toContain("Rating action by curator-x");
    expect(html).toContain("Leaderboard entry: paper-id reports 0.85");
  });

  it("absolutizes relative item links via the SITE base", () => {
    const html = renderDigestEmail({
      payload: payloadFixture(),
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    // Relative `/problems/...` links → absolute `https://llm-openproblems.org/problems/...`.
    expect(html).toContain(
      'href="https://llm-openproblems.org/problems/benchmark-integrity/ratings#abc"',
    );
    expect(html).toContain('href="https://llm-openproblems.org/problems/benchmark-integrity"');
  });

  it("preserves absolute item links unchanged", () => {
    const html = renderDigestEmail({
      payload: payloadFixture({
        items: [
          {
            kind: "rating-action",
            title: "External title",
            link: "https://example.org/somewhere",
            date: "2026-05-14",
            description: "desc",
            guid: "g",
            problemSlug: "p",
            problemTitle: "P",
          },
        ],
      }),
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html).toContain('href="https://example.org/somewhere"');
    expect(html).not.toContain("llm-openproblems.org/https://example.org");
  });

  it("includes the unsubscribe URL in href", () => {
    const html = renderDigestEmail({
      payload: payloadFixture(),
      unsubscribeUrl: "https://example.com/api/v1/subscribe/unsubscribe/tok_xyz",
      supportEmail: "support@example.com",
    });
    expect(html).toContain('href="https://example.com/api/v1/subscribe/unsubscribe/tok_xyz"');
  });

  it("includes a mailto link to the support email", () => {
    const html = renderDigestEmail({
      payload: payloadFixture(),
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html).toContain('href="mailto:support@example.com"');
  });

  it("HTML-escapes item titles and descriptions (defensive)", () => {
    const html = renderDigestEmail({
      payload: payloadFixture({
        items: [
          {
            kind: "rating-action",
            title: "Title with <script>alert(1)</script>",
            link: "/p/x",
            date: "2026-05-14",
            description: 'Description with <img onerror="x"> attempted XSS',
            guid: "g",
            problemSlug: "p",
            problemTitle: "P",
          },
        ],
      }),
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img onerror");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;img onerror=&quot;x&quot;&gt;");
  });

  it("renders the empty-items placeholder when payload has no items (defense-in-depth)", () => {
    const html = renderDigestEmail({
      payload: payloadFixture({ items: [] }),
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html).toContain("No activity in this domain over the last 7 days");
    // Should NOT contain the list element when empty.
    expect(html).not.toContain("<ul");
  });

  it("uses singular '1 update' label when itemCount === 1", () => {
    const html = renderDigestEmail({
      payload: payloadFixture({
        items: [
          {
            kind: "rating-action",
            title: "Only one",
            link: "/p/x",
            date: "2026-05-14",
            description: "d",
            guid: "g",
            problemSlug: "p",
            problemTitle: "P",
          },
        ],
      }),
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html).toContain("1 update between");
  });

  it("uses plural '2 updates' label when itemCount > 1", () => {
    const html = renderDigestEmail({
      payload: payloadFixture(),
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html).toContain("2 updates between");
  });
});
