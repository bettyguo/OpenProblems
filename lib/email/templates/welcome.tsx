/**
 * Welcome email template per [ADR-0021](../../../docs/adr/0021-subscriber-list-email.md)
 * D-F (Phase-30 email content).
 *
 * Sent immediately after the user confirms via the verification link.
 * Returns a static HTML string (no React; no JSX rendering pipeline;
 * see verification.tsx header comment for rationale).
 *
 * Phase 30 ships English-only; FR translation deferred Phase 31+
 * (curator-track; B.17).
 */

export interface WelcomeEmailProps {
  /** Display list of subscribed domain titles (taxonomy-derived). */
  domainTitles: readonly string[];
  /** Full URL to `/api/v1/subscribe/unsubscribe/[token]`. */
  unsubscribeUrl: string;
  /** Support contact email (env-driven). */
  supportEmail: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Render the welcome email to a static HTML string suitable for
 * inclusion in a Resend `emails.send({ html })` call.
 */
export function renderWelcomeEmail({
  domainTitles,
  unsubscribeUrl,
  supportEmail,
}: WelcomeEmailProps): string {
  const domainsText = escapeHtml(domainTitles.join(", "));
  const unsubUrl = escapeHtml(unsubscribeUrl);
  const support = escapeHtml(supportEmail);

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>You&rsquo;re subscribed to the LLM OpenProblems digest</title></head><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#0B0D10;background-color:#FAFAF7;margin:0;padding:24px"><div style="max-width:560px;margin:0 auto"><h1 style="font-size:20px;font-weight:600;margin-top:0">You&rsquo;re subscribed</h1><p>Thanks for confirming your subscription to the LLM OpenProblems digest.</p><p>You&rsquo;ll receive a weekly summary covering: <strong>${domainsText}</strong>.</p><p>The weekly digest scheduler launches in a future release. Until then, you can read the per-domain RSS feed at <a href="https://llm-openproblems.org/digest">llm-openproblems.org/digest</a> or via your preferred reader.</p><hr style="border:0;border-top:1px solid #E5E5E5;margin:24px 0" /><p style="font-size:13px;color:#71717A">To unsubscribe at any time, click here: <a href="${unsubUrl}">Unsubscribe from the digest</a>.</p><p style="font-size:13px;color:#71717A">Questions? Contact <a href="mailto:${support}">${support}</a>.</p></div></body></html>`;
}
