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

  it("attaches locale alternates to the home / route (Unit 8.5)", () => {
    const homeEntry = sitemap.find((e) => e.url === `${SITE}/`);
    expect(homeEntry).toBeDefined();
    expect(homeEntry?.alternates).toEqual({
      languages: {
        en: `${SITE}/en`,
        fr: `${SITE}/fr`,
      },
    });
  });

  it("attaches locale alternates to /problems and /digest (Unit 8.5 — every route has a [locale] shadow)", () => {
    const problemsEntry = sitemap.find((e) => e.url === `${SITE}/problems`);
    expect(problemsEntry?.alternates).toEqual({
      languages: {
        en: `${SITE}/en/problems`,
        fr: `${SITE}/fr/problems`,
      },
    });
    const digestEntry = sitemap.find((e) => e.url === `${SITE}/digest`);
    expect(digestEntry?.alternates).toEqual({
      languages: {
        en: `${SITE}/en/digest`,
        fr: `${SITE}/fr/digest`,
      },
    });
  });

  it("attaches locale alternates to dynamic-segment routes (Unit 8.5)", () => {
    // Pick any problem detail page; locale alternates should match the slug.
    const problemDetailEntry = sitemap.find(
      (e) =>
        e.url.startsWith(`${SITE}/problems/`) &&
        !e.url.match(/\/(history|leaderboard|ratings|talk)$/),
    );
    expect(problemDetailEntry).toBeDefined();
    const slug = problemDetailEntry?.url.replace(`${SITE}/problems/`, "") ?? "";
    expect(problemDetailEntry?.alternates).toEqual({
      languages: {
        en: `${SITE}/en/problems/${slug}`,
        fr: `${SITE}/fr/problems/${slug}`,
      },
    });
  });

  it("attaches locale alternates to /contributing versioned entries (Unit 8.5)", () => {
    const v1Entry = sitemap.find((e) => e.url === `${SITE}/contributing/v1`);
    expect(v1Entry?.alternates).toEqual({
      languages: {
        en: `${SITE}/en/contributing/v1`,
        fr: `${SITE}/fr/contributing/v1`,
      },
    });
  });

  it("every sitemap entry carries locale alternates (Unit 8.5 invariant)", () => {
    // Post-Unit 8.1 every route has a [locale]/ shadow, so the Unit 7.8
    // invariant "no alternates without shadow" flips: every URL carries
    // alternates pointing at /en/<path> and /fr/<path>.
    for (const entry of sitemap) {
      expect(entry.alternates?.languages?.en).toBeDefined();
      expect(entry.alternates?.languages?.fr).toBeDefined();
    }
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
