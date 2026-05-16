/**
 * Canonical site URL — single source of truth across sitemap, RSS, robots,
 * citation blocks, and any other absolute-URL generator.
 *
 * `process.env.NEXT_PUBLIC_SITE_URL` lets preview deploys (Vercel, Netlify)
 * substitute their actual hostname so RSS / sitemap / citations point at
 * the deploy URL rather than the production placeholder. Falls back to the
 * Q2 placeholder when unset (local dev, CI, tests). Inlined at build time
 * per Next.js's `NEXT_PUBLIC_*` static-replacement contract.
 *
 * Consolidated in Unit 8.5 (was hardcoded across 3 lib + 2 page sites);
 * extraction threshold was 5+ per Unit 7.8 follow-on. Update the fallback
 * literal here when Q2 (DNS) resolves; all consumers pick it up.
 */
export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://llm-openproblems.org";
