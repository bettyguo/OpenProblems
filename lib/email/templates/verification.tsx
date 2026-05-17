import { renderToStaticMarkup } from "react-dom/server";

/**
 * Verification email template per [ADR-0021](../../../docs/adr/0021-subscriber-list-email.md)
 * D-F (Phase-30 email content).
 *
 * Sent on initial subscribe + on re-submit if existing
 * `pending_verification` row's token expires. Rendered to a static
 * HTML string via `renderToStaticMarkup` (`react-dom/server`); no
 * React Email; no MJML; no templating engine (foundation-only;
 * Phase 31+ if template count grows beyond ~5).
 *
 * **No user-input echo** per ADR-0021 §15.5 reviewer-mode mindset
 * (f) email-content XSS guard. Template inputs are: (a) verification
 * URL (server-generated; trusted); (b) subscribed domain names
 * (taxonomy-derived; trusted); (c) support email (env-var-driven).
 * No subscriber-authored content is included.
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

export function VerificationEmail({
  verificationUrl,
  domainTitles,
  supportEmail,
}: VerificationEmailProps) {
  const domainsText = domainTitles.join(", ");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Confirm your LLM OpenProblems digest subscription</title>
      </head>
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1.5,
          color: "#0B0D10",
          backgroundColor: "#FAFAF7",
          margin: 0,
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 600, marginTop: 0 }}>
            Confirm your subscription
          </h1>
          <p>Thanks for subscribing to the LLM OpenProblems digest for {domainsText}.</p>
          <p>To confirm your subscription and start receiving the weekly digest, click below:</p>
          <p style={{ margin: "24px 0" }}>
            <a
              href={verificationUrl}
              style={{
                display: "inline-block",
                padding: "12px 20px",
                backgroundColor: "#0B0D10",
                color: "#FAFAF7",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              Confirm subscription
            </a>
          </p>
          <p style={{ fontSize: "14px", color: "#52525B" }}>
            Or copy and paste this URL into your browser:
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "#52525B",
              wordBreak: "break-all",
              fontFamily: "monospace",
            }}
          >
            {verificationUrl}
          </p>
          <p style={{ fontSize: "14px", color: "#52525B" }}>
            This link expires in 24 hours. If it expires, just resubmit the subscribe form to
            receive a fresh link.
          </p>
          <hr style={{ border: 0, borderTop: "1px solid #E5E5E5", margin: "24px 0" }} />
          <p style={{ fontSize: "13px", color: "#71717A" }}>
            If you didn&rsquo;t request this subscription, you can safely ignore this email — no
            confirmation means no subscription.
          </p>
          <p style={{ fontSize: "13px", color: "#71717A" }}>
            Questions? Contact <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </p>
        </div>
      </body>
    </html>
  );
}

/**
 * Render `<VerificationEmail>` to a static HTML string suitable for
 * inclusion in a Resend `emails.send({ html })` call.
 */
export function renderVerificationEmail(props: VerificationEmailProps): string {
  return "<!DOCTYPE html>" + renderToStaticMarkup(<VerificationEmail {...props} />);
}
