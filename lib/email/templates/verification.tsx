/**
 * Verification email template per [ADR-0021](../../../docs/adr/0021-subscriber-list-email.md)
 * D-F (Phase-30 email content).
 *
 * Sent on initial subscribe + on re-submit if existing
 * `pending_verification` row's token expires. Returns a static HTML
 * string (no React; no JSX rendering pipeline; no templating engine
 * Phase 30). Plain template-literal-based string building keeps the
 * dependency surface minimal and avoids the Next.js App Router's
 * server-component-only restriction on `react-dom/server` imports.
 *
 * **No user-input echo** per ADR-0021 §15.5 reviewer-mode mindset
 * (f) email-content XSS guard. Template inputs are: (a) verification
 * URL (server-generated; trusted); (b) subscribed domain names
 * (taxonomy-derived; trusted); (c) support email (env-var-driven).
 * No subscriber-authored content is included; basic HTML-escaping
 * applied as defense-in-depth.
 *
 * Phase 30 ships English-only; FR translation deferred Phase 31+
 * (curator-track; B.17).
 */

export interface VerificationEmailProps {
  /** Full URL to `/api/v1/subscribe/verify/[token]`. */
  verificationUrl: string;
  /** Display list of subscribed domain titles (taxonomy-derived). */
  domainTitles: readonly string[];
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
 * Render the verification email to a static HTML string suitable for
 * inclusion in a Resend `emails.send({ html })` call.
 */
export function renderVerificationEmail({
  verificationUrl,
  domainTitles,
  supportEmail,
}: VerificationEmailProps): string {
  const url = escapeHtml(verificationUrl);
  const domainsText = escapeHtml(domainTitles.join(", "));
  const support = escapeHtml(supportEmail);

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Confirm your LLM OpenProblems digest subscription</title></head><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#0B0D10;background-color:#FAFAF7;margin:0;padding:24px"><div style="max-width:560px;margin:0 auto"><h1 style="font-size:20px;font-weight:600;margin-top:0">Confirm your subscription</h1><p>Thanks for subscribing to the LLM OpenProblems digest for ${domainsText}.</p><p>To confirm your subscription and start receiving the weekly digest, click below:</p><p style="margin:24px 0"><a href="${url}" style="display:inline-block;padding:12px 20px;background-color:#0B0D10;color:#FAFAF7;text-decoration:none;border-radius:4px;font-weight:600">Confirm subscription</a></p><p style="font-size:14px;color:#52525B">Or copy and paste this URL into your browser:</p><p style="font-size:14px;color:#52525B;word-break:break-all;font-family:monospace">${url}</p><p style="font-size:14px;color:#52525B">This link expires in 24 hours. If it expires, just resubmit the subscribe form to receive a fresh link.</p><hr style="border:0;border-top:1px solid #E5E5E5;margin:24px 0" /><p style="font-size:13px;color:#71717A">If you didn&rsquo;t request this subscription, you can safely ignore this email &mdash; no confirmation means no subscription.</p><p style="font-size:13px;color:#71717A">Questions? Contact <a href="mailto:${support}">${support}</a>.</p></div></body></html>`;
}
