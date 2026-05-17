/**
 * Weekly digest email template per [ADR-0022](../../../docs/adr/0022-weekly-digest-scheduler.md)
 * D-E (Phase-31 digest content).
 *
 * Sibling to Phase-30 `verification.tsx` + `welcome.tsx`. Returns a static
 * HTML string (no React; no JSX rendering pipeline; no templating engine).
 * Plain template-literal-based string building keeps the dependency surface
 * minimal and avoids the Next.js App Router's server-component-only
 * restriction on `react-dom/server` imports (precedent established Unit
 * 30.2 + carried Unit 31.1 ADR-0022 D-E).
 *
 * **Inputs reused verbatim from RSS-side**: consumes the same `DigestPayload`
 * type that [`lib/digest/build-digest.ts`](../../digest/build-digest.ts)
 * emits — Phase-5 builder owns the content-aggregation logic; this template
 * is the email-side renderer of the same payload shape. **Type-level
 * contract preservation** per ADR-0022 D-E.
 *
 * **No user-input echo** per ADR-0022 §15.5 reviewer-mode mindset (e)
 * digest-template XSS guard. Template inputs are: (a) `DigestPayload`
 * (content-derived from `lib/digest/build-digest`; rating-action curator
 * + problem slugs + benchmark IDs — all server-trusted); (b) unsubscribe
 * URL (server-generated from token; trusted); (c) support email (env-
 * driven). No subscriber-authored content is included; basic HTML-
 * escaping applied as defense-in-depth (matches Phase-30 templates).
 *
 * **Empty-items contract**: when `payload.items.length === 0`, the cron
 * route's per-domain skip per ADR-0022 D-F means this template is NEVER
 * called with an empty payload in production. The template still renders
 * a sensible "no activity this week" placeholder for defense-in-depth
 * (tests exercise this path).
 *
 * Phase 31 ships English-only; FR translation deferred Phase 32+
 * (curator-track per ADR-0022 D-H).
 */

import { SITE } from "@/lib/site-url";
import type { DigestPayload } from "@/lib/digest/build-digest";

export interface DigestEmailProps {
  /** Per-domain `DigestPayload` from `lib/digest/build-digest`. */
  payload: DigestPayload;
  /** Full URL to `/api/v1/subscribe/unsubscribe/[token]`. */
  unsubscribeUrl: string;
  /** Support contact email (env-driven; same EMAIL_FROM extraction as Phase-30 verify route). */
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
 * Normalize a `DigestItem.link` (relative path like `/problems/foo`) to an
 * absolute URL prefixed by `SITE`. Email-client compat requires absolute
 * URLs — relative paths in `<a href>` resolve against the email client's
 * domain (`mail.google.com`, etc.), not against the project site.
 */
function absolutize(link: string): string {
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  if (link.startsWith("/")) return `${SITE}${link}`;
  return `${SITE}/${link}`;
}

/**
 * Render one item as an HTML list entry. Defensive HTML-escape on all
 * string fields; absolute-URL conversion on the link.
 */
function renderItem(item: DigestPayload["items"][number]): string {
  const title = escapeHtml(item.title);
  const description = escapeHtml(item.description);
  const date = escapeHtml(item.date);
  const url = escapeHtml(absolutize(item.link));
  return `<li style="margin:0 0 16px 0;padding:12px;background-color:#FFFFFF;border:1px solid #E5E5E5;border-radius:4px"><div style="font-size:12px;color:#71717A;font-family:monospace;margin-bottom:4px">${date}</div><div style="font-weight:600;margin-bottom:6px"><a href="${url}" style="color:#0B0D10;text-decoration:none">${title}</a></div><div style="font-size:14px;color:#52525B;line-height:1.5">${description}</div></li>`;
}

/**
 * Render the weekly digest email to a static HTML string suitable for
 * inclusion in a Resend `emails.send({ html })` call.
 *
 * Mobile-friendly 600px max-width per ADR-0022 D-E. Header (domain title
 * + week-range) + items list + footer (next-digest cadence reminder +
 * unsubscribe link + support email).
 */
export function renderDigestEmail({
  payload,
  unsubscribeUrl,
  supportEmail,
}: DigestEmailProps): string {
  const domainTitle = escapeHtml(payload.domainTitle);
  const itemCount = payload.items.length;
  const itemCountLabel = itemCount === 1 ? "1 update" : `${itemCount} updates`;
  const cutoff = escapeHtml(payload.cutoffDate);
  const generated = escapeHtml(payload.generatedAt.slice(0, 10));
  const unsub = escapeHtml(unsubscribeUrl);
  const support = escapeHtml(supportEmail);

  const itemsHtml =
    itemCount === 0
      ? `<p style="font-style:italic;color:#71717A">No activity in this domain over the last ${payload.windowDays} days.</p>`
      : `<ul style="list-style:none;padding:0;margin:0">${payload.items.map(renderItem).join("")}</ul>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>LLM OpenProblems weekly digest &mdash; ${domainTitle}</title></head><body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#0B0D10;background-color:#FAFAF7;margin:0;padding:24px"><div style="max-width:600px;margin:0 auto"><h1 style="font-size:20px;font-weight:600;margin-top:0">${domainTitle} &mdash; weekly digest</h1><p style="font-size:14px;color:#52525B">${itemCountLabel} between ${cutoff} and ${generated}.</p>${itemsHtml}<hr style="border:0;border-top:1px solid #E5E5E5;margin:32px 0 24px 0" /><p style="font-size:13px;color:#71717A">You&rsquo;re receiving this because you subscribed to the <strong>${domainTitle}</strong> digest. The next digest will arrive next Monday.</p><p style="font-size:13px;color:#71717A">To unsubscribe at any time, click here: <a href="${unsub}">Unsubscribe from the digest</a>.</p><p style="font-size:13px;color:#71717A">Questions? Contact <a href="mailto:${support}">${support}</a>.</p></div></body></html>`;
}
