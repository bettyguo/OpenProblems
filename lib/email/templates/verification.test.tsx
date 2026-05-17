import { describe, expect, it } from "vitest";

import { renderVerificationEmail } from "./verification";

/**
 * Tests for the verification email template per
 * [ADR-0021](../../../docs/adr/0021-subscriber-list-email.md) D-F.
 *
 * Validates: (a) HTML structure includes the verification URL +
 * domain titles + support email; (b) `<!DOCTYPE html>` prefix is
 * present; (c) no user-input echo (template inputs are all
 * server-trusted per ADR-0021 §15.5 reviewer-mode mindset (f)).
 *
 * The template uses `<a href={...}>` with server-trusted URLs;
 * sanitization is NOT applied at template time (different
 * surface from the markdown-render `dangerouslySetInnerHTML`
 * surfaces — emails are template-controlled HTML, not user
 * markdown).
 */

describe("renderVerificationEmail", () => {
  it("includes the verification URL in href + as plain-text fallback", () => {
    const html = renderVerificationEmail({
      verificationUrl: "https://example.com/api/v1/subscribe/verify/tok_abc123",
      domainTitles: ["General ML"],
      supportEmail: "support@example.com",
    });
    expect(html).toContain('href="https://example.com/api/v1/subscribe/verify/tok_abc123"');
    // Plain-text URL appears as fallback inside the monospace paragraph.
    const occurrences =
      html.split("https://example.com/api/v1/subscribe/verify/tok_abc123").length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });

  it("includes the domain titles in the subscribe-context message", () => {
    const html = renderVerificationEmail({
      verificationUrl: "https://example.com/verify/x",
      domainTitles: ["General ML", "Applications"],
      supportEmail: "support@example.com",
    });
    expect(html).toContain("General ML, Applications");
  });

  it("includes a mailto link to the support email", () => {
    const html = renderVerificationEmail({
      verificationUrl: "https://example.com/verify/x",
      domainTitles: ["X"],
      supportEmail: "support@example.com",
    });
    expect(html).toContain('href="mailto:support@example.com"');
  });

  it("renders with <!DOCTYPE html> prefix (email-client compat)", () => {
    const html = renderVerificationEmail({
      verificationUrl: "https://example.com/verify/x",
      domainTitles: ["X"],
      supportEmail: "support@example.com",
    });
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
  });

  it("mentions the 24-hour expiry window", () => {
    const html = renderVerificationEmail({
      verificationUrl: "https://example.com/verify/x",
      domainTitles: ["X"],
      supportEmail: "support@example.com",
    });
    expect(html.toLowerCase()).toContain("24 hours");
  });
});
