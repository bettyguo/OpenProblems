/**
 * Placeholder RSS feed (Phase 0). Returns 501 with a minimal RSS skeleton
 * so consumers see a well-formed XML envelope rather than a JSON error.
 * Phase 3 replaces this with the real rating-actions feed.
 */
export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>LLM OpenProblems — Rating Actions (placeholder)</title>
    <description>Phase 0 placeholder. Real feed arrives in Phase 3.</description>
    <link>https://llm-openproblems.org/ratings</link>
  </channel>
</rss>`;
  return new Response(body, {
    status: 501,
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
