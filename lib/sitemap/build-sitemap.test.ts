import { describe, expect, it } from "vitest";
import { buildSitemap, SITE } from "./build-sitemap";

const sitemap = buildSitemap();
const urls = sitemap.map((entry) => entry.url);

describe("buildSitemap", () => {
  it("returns a non-empty array", () => {
    expect(sitemap.length).toBeGreaterThan(0);
  });

  it("uses the canonical SITE prefix on every URL", () => {
    for (const url of urls) {
      expect(url.startsWith(SITE)).toBe(true);
    }
  });

  it("produces unique URLs (no duplicates)", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("returns entries sorted by URL for deterministic builds", () => {
    const sorted = [...urls].sort((a, b) => a.localeCompare(b));
    expect(urls).toEqual(sorted);
  });

  it("includes every static project route", () => {
    const expectedStatic = [
      "/",
      "/about",
      "/contributing",
      "/digest",
      "/domains",
      "/methodology",
      "/papers",
      "/problems",
      "/ratings",
      "/trending",
    ];
    for (const route of expectedStatic) {
      expect(urls).toContain(`${SITE}${route}`);
    }
  });

  it("attaches en + fr locale alternates to the /about entry (ADR-0011 D-E)", () => {
    const aboutEntry = sitemap.find((e) => e.url === `${SITE}/about`);
    expect(aboutEntry).toBeDefined();
    expect(aboutEntry?.alternates).toEqual({
      languages: {
        en: `${SITE}/en/about`,
        fr: `${SITE}/fr/about`,
      },
    });
  });

  it("attaches en + fr locale alternates to the /methodology entry (Unit 7.5)", () => {
    const methEntry = sitemap.find((e) => e.url === `${SITE}/methodology`);
    expect(methEntry).toBeDefined();
    expect(methEntry?.alternates).toEqual({
      languages: {
        en: `${SITE}/en/methodology`,
        fr: `${SITE}/fr/methodology`,
      },
    });
  });

  it("attaches en + fr locale alternates to each per-version methodology entry (Unit 7.5)", () => {
    const v1Entry = sitemap.find((e) => e.url === `${SITE}/methodology/v1`);
    expect(v1Entry).toBeDefined();
    expect(v1Entry?.alternates).toEqual({
      languages: {
        en: `${SITE}/en/methodology/v1`,
        fr: `${SITE}/fr/methodology/v1`,
      },
    });
  });

  it("does NOT attach locale alternates to routes without a [locale]/ shadow", () => {
    // Only /about has the alternates block today. Routes like /problems or
    // /digest must not carry alternates pointing to URLs that 404.
    const problemsEntry = sitemap.find((e) => e.url === `${SITE}/problems`);
    expect(problemsEntry?.alternates).toBeUndefined();
    const digestEntry = sitemap.find((e) => e.url === `${SITE}/digest`);
    expect(digestEntry?.alternates).toBeUndefined();
  });

  it("includes every problem detail page (10 problems at HEAD)", () => {
    const problemDetailUrls = urls.filter(
      (u) => u.startsWith(`${SITE}/problems/`) && !u.match(/\/(history|leaderboard|ratings|talk)$/),
    );
    expect(problemDetailUrls.length).toBe(10);
  });

  it("closes Q48 sitemap-half: every problem has a /talk URL enrolled", () => {
    const talkUrls = urls.filter((u) => u.endsWith("/talk"));
    expect(talkUrls.length).toBe(10);
  });

  it("includes every problem sub-route (history / leaderboard / ratings / talk)", () => {
    const subroutes = ["history", "leaderboard", "ratings", "talk"];
    for (const sub of subroutes) {
      const matching = urls.filter((u) => u.endsWith(`/${sub}`));
      expect(matching.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("includes domain + subdomain pages from taxonomy", () => {
    expect(urls).toContain(`${SITE}/domains/deep-learning`);
    expect(urls).toContain(`${SITE}/domains/deep-learning/large-language-models`);
  });

  it("includes versioned methodology + contributing pages", () => {
    expect(urls).toContain(`${SITE}/methodology/v1`);
    expect(urls).toContain(`${SITE}/contributing/v1`);
    expect(urls).toContain(`${SITE}/contributing/v1.1`);
  });

  it("does not include framework routes or not-found", () => {
    for (const url of urls) {
      expect(url).not.toMatch(/\/api\//);
      expect(url).not.toMatch(/\/_not-found/);
    }
  });
});
