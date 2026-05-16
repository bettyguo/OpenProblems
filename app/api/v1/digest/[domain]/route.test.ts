import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { renderDigestRss, xmlEscape, toRfc822, SITE } from "@/lib/digest/rss";
import { taxonomy } from "#site/content";

const SAMPLE_PAYLOAD = {
  domain: "deep-learning",
  domainTitle: "Deep Learning",
  windowDays: 7,
  generatedAt: "2026-05-15T12:00:00.000Z",
  cutoffDate: "2026-05-08",
  channelTitle: "LLM OpenProblems — Deep Learning digest",
  channelDescription: "2 items in the last 7 days for problems in the Deep Learning domain.",
  items: [
    {
      kind: "rating-action" as const,
      title: "Hallucination Reduction — saturation 35 → 32",
      link: "/problems/hallucination-reduction/ratings#hr-q3",
      date: "2026-05-14",
      description: "Rating action by jikun on 2026-05-14: saturation 35 → 32.",
      guid: "hallucination-reduction/2026-05-14-q3-revision",
      problemSlug: "hallucination-reduction",
      problemTitle: "Hallucination Reduction",
    },
    {
      kind: "leaderboard-entry" as const,
      title: 'A & B "test" <foo> — halueval 88.2',
      link: "/problems/hallucination-reduction",
      date: "2026-05-12",
      description:
        'Leaderboard entry: 2411.04368 reports 88.2 on halueval (2026-05-12). protocol: GPT-4 zero-shot & "verified"',
      guid: "entry:hallucination-reduction/2411.04368/halueval/2026-05-12",
      problemSlug: "hallucination-reduction",
      problemTitle: "Hallucination Reduction",
    },
  ],
};

describe("renderDigestRss", () => {
  it("emits a valid RSS 2.0 envelope with required namespaces", () => {
    const rss = renderDigestRss(SAMPLE_PAYLOAD);
    expect(rss).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(rss).toContain('<rss version="2.0"');
    expect(rss).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(rss).toContain("<channel>");
    expect(rss).toContain("</channel>");
    expect(rss).toContain("</rss>");
  });

  it("emits an atom:link self-ref with the canonical URL", () => {
    const rss = renderDigestRss(SAMPLE_PAYLOAD);
    expect(rss).toContain(
      `<atom:link href="${SITE}/api/v1/digest/deep-learning" rel="self" type="application/rss+xml" />`,
    );
  });

  it("emits channel-level title, description, language, lastBuildDate", () => {
    const rss = renderDigestRss(SAMPLE_PAYLOAD);
    expect(rss).toContain("<title>LLM OpenProblems — Deep Learning digest</title>");
    expect(rss).toContain("<language>en</language>");
    expect(rss).toMatch(/<lastBuildDate>[A-Z][a-z]{2}, /);
    expect(rss).toContain("2 items in the last 7 days");
  });

  it("emits one <item> per payload item", () => {
    const rss = renderDigestRss(SAMPLE_PAYLOAD);
    const itemOpens = rss.match(/<item>/g) ?? [];
    expect(itemOpens.length).toBe(2);
  });

  it("XML-escapes title + description text", () => {
    const rss = renderDigestRss(SAMPLE_PAYLOAD);
    expect(rss).toContain("A &amp; B &quot;test&quot; &lt;foo&gt;");
    expect(rss).toContain("GPT-4 zero-shot &amp; &quot;verified&quot;");
  });

  it("prefixes item links with SITE", () => {
    const rss = renderDigestRss(SAMPLE_PAYLOAD);
    expect(rss).toContain(`<link>${SITE}/problems/hallucination-reduction/ratings#hr-q3</link>`);
  });

  it("emits guid with isPermaLink=false", () => {
    const rss = renderDigestRss(SAMPLE_PAYLOAD);
    expect(rss).toContain('<guid isPermaLink="false">');
  });

  it("RFC-822 dates on pubDate", () => {
    const rss = renderDigestRss(SAMPLE_PAYLOAD);
    expect(rss).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/);
  });

  it("emits valid empty-channel feed when items=[]", () => {
    const empty = { ...SAMPLE_PAYLOAD, items: [], channelDescription: "No activity." };
    const rss = renderDigestRss(empty);
    expect(rss).toContain("<title>");
    expect(rss).toContain("<atom:link");
    const itemOpens = rss.match(/<item>/g) ?? [];
    expect(itemOpens.length).toBe(0);
  });
});

describe("xmlEscape", () => {
  it("escapes all 5 entities", () => {
    expect(xmlEscape("&")).toBe("&amp;");
    expect(xmlEscape("<")).toBe("&lt;");
    expect(xmlEscape(">")).toBe("&gt;");
    expect(xmlEscape('"')).toBe("&quot;");
    expect(xmlEscape("'")).toBe("&apos;");
  });
});

describe("toRfc822", () => {
  it("converts an ISO date string to RFC-822 form", () => {
    expect(toRfc822("2026-05-14")).toMatch(/^Thu, 14 May 2026/);
  });
});

describe("GET handler", () => {
  it("returns 200 + RSS body for a real domain", async () => {
    const aDomain = taxonomy.domains[0]!.id;
    const response = await GET(new Request("http://localhost/"), {
      params: Promise.resolve({ domain: aDomain }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/application\/rss\+xml/);
    const body = await response.text();
    expect(body).toContain('<rss version="2.0"');
    expect(body).toContain(`<atom:link href="${SITE}/api/v1/digest/${aDomain}"`);
  });

  it("sets cache-control to 5 minutes", async () => {
    const aDomain = taxonomy.domains[0]!.id;
    const response = await GET(new Request("http://localhost/"), {
      params: Promise.resolve({ domain: aDomain }),
    });
    expect(response.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=300");
  });
});
