import { describe, expect, it } from "vitest";

import { renderWelcomeEmail } from "./welcome";

/**
 * Tests for the welcome email template per
 * [ADR-0021](../../../docs/adr/0021-subscriber-list-email.md) D-F.
 *
 * Validates: (a) HTML structure includes the subscribed domain
 * titles + unsubscribe URL + support email; (b) `<!DOCTYPE html>`
 * prefix; (c) the "scheduler launches in a future release"
 * placeholder text sets user expectations correctly per ADR-0021
 * Consequences "foundation-only Phase 30 has weak UX" mitigation.
 */

describe("renderWelcomeEmail", () => {
  it("includes the unsubscribe URL in href", () => {
    const html = renderWelcomeEmail({
      domainTitles: ["General ML"],
      unsubscribeUrl: "https://example.com/api/v1/subscribe/unsubscribe/tok_xyz",
      supportEmail: "support@example.com",
    });
    expect(html).toContain('href="https://example.com/api/v1/subscribe/unsubscribe/tok_xyz"');
  });

  it("lists subscribed domain titles in bold", () => {
    const html = renderWelcomeEmail({
      domainTitles: ["General ML", "Deep Learning"],
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html).toContain("<strong>General ML, Deep Learning</strong>");
  });

  it("includes a mailto link to the support email", () => {
    const html = renderWelcomeEmail({
      domainTitles: ["X"],
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html).toContain('href="mailto:support@example.com"');
  });

  it("renders with <!DOCTYPE html> prefix (email-client compat)", () => {
    const html = renderWelcomeEmail({
      domainTitles: ["X"],
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("mentions the scheduler-launches-in-future-release placeholder", () => {
    const html = renderWelcomeEmail({
      domainTitles: ["X"],
      unsubscribeUrl: "https://example.com/unsub/x",
      supportEmail: "support@example.com",
    });
    expect(html.toLowerCase()).toContain("future release");
  });
});
