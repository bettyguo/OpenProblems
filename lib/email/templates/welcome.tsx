import { renderToStaticMarkup } from "react-dom/server";

/**
 * Welcome email template per [ADR-0021](../../../docs/adr/0021-subscriber-list-email.md)
 * D-F (Phase-30 email content).
 *
 * Sent immediately after the user confirms via the verification
 * link. Mirrors the verification template's static-render approach
 * — `renderToStaticMarkup` to HTML string; no React Email; no
 * MJML; no templating engine; no user-input echo.
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

export function WelcomeEmail({ domainTitles, unsubscribeUrl, supportEmail }: WelcomeEmailProps) {
  const domainsText = domainTitles.join(", ");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>You&rsquo;re subscribed to the LLM OpenProblems digest</title>
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
            You&rsquo;re subscribed
          </h1>
          <p>Thanks for confirming your subscription to the LLM OpenProblems digest.</p>
          <p>
            You&rsquo;ll receive a weekly summary covering: <strong>{domainsText}</strong>.
          </p>
          <p>
            The weekly digest scheduler launches in a future release. Until then, you can read the
            per-domain RSS feed at{" "}
            <a href="https://llm-openproblems.org/digest">llm-openproblems.org/digest</a> or via
            your preferred reader.
          </p>
          <hr style={{ border: 0, borderTop: "1px solid #E5E5E5", margin: "24px 0" }} />
          <p style={{ fontSize: "13px", color: "#71717A" }}>
            To unsubscribe at any time, click here:{" "}
            <a href={unsubscribeUrl}>Unsubscribe from the digest</a>.
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
 * Render `<WelcomeEmail>` to a static HTML string suitable for
 * inclusion in a Resend `emails.send({ html })` call.
 */
export function renderWelcomeEmail(props: WelcomeEmailProps): string {
  return "<!DOCTYPE html>" + renderToStaticMarkup(<WelcomeEmail {...props} />);
}
