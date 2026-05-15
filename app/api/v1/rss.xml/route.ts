import { problems } from "#site/content";
import { allRatingActions, diffRatingAction } from "@/lib/content/load-ratings";

/**
 * GET /api/v1/rss.xml
 *
 * RSS 2.0 feed of rating actions, newest-first (Unit 3.5).
 * Shape per Unit 3.0 D-5:
 *
 *   - One <item> per rating action.
 *   - Channel: title "LLM OpenProblems — Rating actions", link /ratings,
 *     description from MASTER_PROMPT §3.1.
 *   - Item title: "<Problem Title> — <revision|initial> (<primary delta>)".
 *   - Item link: /problems/<slug>/ratings#<filename-without-extension>.
 *   - Item pubDate: action.date at 00:00:00 UTC in RFC-822 form.
 *   - Item guid (isPermaLink=false): the stable id from Unit 3.2.
 *   - Item description: prior → new vector for the primary delta, then
 *     the rationale of that dimension.
 *   - Item dc:creator: action.curator (per Q33 lean).
 *
 * Must pass W3C feed validator — verified in Unit 3.13 acceptance gate.
 */
export const dynamic = "force-static";

// The site URL is the placeholder from MASTER_PROMPT.md §5.10 pending Q2.
// RSS feeds require absolute URLs; this matches the Phase-0 stub convention.
const SITE = "https://llm-openproblems.org";

const CHANNEL_TITLE = "LLM OpenProblems — Rating actions";
const CHANNEL_DESCRIPTION =
  "Public, append-only log of every rating action across LLM OpenProblems. Mirrors S&P / Moody's / Fitch rating-action conventions — prior → new, per dimension, with rationale.";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(d: unknown): string {
  const date = d instanceof Date ? d : typeof d === "string" ? new Date(d) : new Date(String(d));
  // Date.prototype.toUTCString returns RFC-822-compliant form, e.g.
  // "Sat, 14 May 2026 00:00:00 GMT". W3C validator accepts both GMT and +0000.
  return date.toUTCString();
}

function titleOf(slug: string): string {
  return problems.find((p) => p.slug === slug)?.title ?? slug;
}

function rationaleForPrimary(
  action: ReturnType<typeof allRatingActions>[number],
  primaryDim: "difficulty" | "saturation" | "urgency" | "value" | "industry_call" | undefined,
): string {
  if (!primaryDim) return "";
  return action.dimensions[primaryDim].rationale;
}

export function GET() {
  const actions = allRatingActions();

  // Compute priors per problem to drive item descriptions / titles.
  const byProblem = new Map<string, typeof actions>();
  for (const a of actions) {
    const arr = byProblem.get(a.problem_slug) ?? [];
    arr.push(a);
    byProblem.set(a.problem_slug, arr);
  }
  const priorByActionId = new Map<string, (typeof actions)[number]>();
  for (const arr of byProblem.values()) {
    const oldestFirst = arr.slice().reverse();
    for (let i = 1; i < oldestFirst.length; i++) {
      priorByActionId.set(oldestFirst[i]!.id, oldestFirst[i - 1]!);
    }
  }

  const lastBuildDate = actions[0] ? toRfc822(actions[0].date) : new Date().toUTCString();

  const items = actions
    .map((action) => {
      const prior = priorByActionId.get(action.id);
      const diff = diffRatingAction(action, prior);
      const primary = diff.deltas.find((d) => d.primary);
      const tag = prior ? "revision" : "initial action";
      const subtitle = primary?.summary ?? (prior ? "rationale-only refresh" : "initial");
      const titleText = `${titleOf(action.problem_slug)} — ${tag} (${subtitle})`;
      const anchor = action.id.replace(/^[^/]+\//, "");
      const link = `${SITE}/problems/${action.problem_slug}/ratings#${anchor}`;
      const rationale = rationaleForPrimary(action, primary?.dimension);
      const descParts: string[] = [];
      if (primary) descParts.push(primary.summary);
      if (diff.watchlistChanged) {
        descParts.push(`watchlist ${String(diff.priorWatchlist)} → ${String(diff.newWatchlist)}`);
      }
      if (rationale) descParts.push(rationale);
      const description = descParts.join("\n\n");
      return `    <item>
      <title>${xmlEscape(titleText)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="false">${xmlEscape(action.id)}</guid>
      <pubDate>${toRfc822(action.date)}</pubDate>
      <dc:creator>${xmlEscape(action.curator)}</dc:creator>
      <description>${xmlEscape(description)}</description>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(CHANNEL_TITLE)}</title>
    <link>${SITE}/ratings</link>
    <atom:link href="${SITE}/api/v1/rss.xml" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(CHANNEL_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
