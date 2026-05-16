import { notFound } from "next/navigation";
import { taxonomy } from "#site/content";
import { buildDigest } from "@/lib/digest/build-digest";
import { renderDigestRss } from "@/lib/digest/rss";

/**
 * GET /api/v1/digest/<domain-slug>
 *
 * Per-domain weekly digest as an RSS 2.0 feed (Unit 5.8).
 *
 * Route-path deviation from Unit 5.0: the planned `[domain].xml/route.ts`
 * was demoted to `[domain]/route.ts` for Next.js + Windows + git path
 * compatibility. URL is `/api/v1/digest/<slug>` (no `.xml` suffix); the
 * content-type header still types the response as RSS. Discoverability
 * compensation lands in Unit 5.9's `/digest` hub.
 *
 * Mirrors Unit 3.5's `/api/v1/rss.xml` rendering shape — same xmlEscape,
 * toRfc822, channel + atom:link self + items. Per Q44 lean: no
 * `<managingEditor>` (gated on Q33 + Q2 DNS).
 *
 * SSG via `generateStaticParams()` enumerating all taxonomy domains.
 *
 * Note: testable helpers (renderDigestRss / xmlEscape / toRfc822) live
 * in `lib/digest/rss.ts` because Next.js route files restrict arbitrary
 * exports. Tests import them from there.
 */

export const dynamic = "force-static";

export function generateStaticParams(): Array<{ domain: string }> {
  return taxonomy.domains.map((d) => ({ domain: d.id }));
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ domain: string }> },
): Promise<Response> {
  const { domain } = await context.params;

  if (!taxonomy.domains.some((d) => d.id === domain)) {
    notFound();
  }

  const payload = await buildDigest({ domain });
  const body = renderDigestRss(payload);

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
