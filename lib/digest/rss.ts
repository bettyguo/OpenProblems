import type { DigestPayload } from "@/lib/digest/build-digest";
import { SITE } from "@/lib/site-url";

/**
 * RSS-rendering helpers for the per-domain digest endpoint (Unit 5.8).
 *
 * Lives in `lib/digest/` rather than `app/api/v1/digest/[domain]/route.ts`
 * because Next.js App Router route files restrict the allowed exports to
 * a fixed set (GET / POST / dynamic / generateStaticParams / ...); arbitrary
 * helper exports trigger a build-time type error. The route imports these
 * helpers; tests import them directly.
 *
 * Mirrors Unit 3.5's `/api/v1/rss.xml/route.ts` rendering shape.
 */

/** Re-export for backward-compat with downstream importers (Unit 8.5). */
export { SITE };

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function toRfc822(d: unknown): string {
  const date = d instanceof Date ? d : typeof d === "string" ? new Date(d) : new Date(String(d));
  return date.toUTCString();
}

export function renderDigestRss(payload: DigestPayload): string {
  const lastBuildDate = payload.items[0]
    ? toRfc822(payload.items[0].date)
    : toRfc822(payload.generatedAt);

  const selfUrl = `${SITE}/api/v1/digest/${payload.domain}`;
  const hubUrl = `${SITE}/digest`;

  const items = payload.items
    .map(
      (item) => `    <item>
      <title>${xmlEscape(item.title)}</title>
      <link>${xmlEscape(`${SITE}${item.link}`)}</link>
      <guid isPermaLink="false">${xmlEscape(item.guid)}</guid>
      <pubDate>${toRfc822(item.date)}</pubDate>
      <description>${xmlEscape(item.description)}</description>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(payload.channelTitle)}</title>
    <link>${xmlEscape(hubUrl)}</link>
    <atom:link href="${xmlEscape(selfUrl)}" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(payload.channelDescription)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}
