import { describe, it, expect } from "vitest";
import { loadPaper, allPaperIds } from "@/lib/content/load-paper";
import { loadAuthor, allAuthorSlugs } from "@/lib/content/load-author";
import { loadInstitution, allInstitutionSlugs } from "@/lib/content/load-institution";

describe("loadPaper", () => {
  it("returns null for an unknown id", () => {
    expect(loadPaper("does-not-exist-2999.99999")).toBeNull();
  });

  it("returns the full paper count via allPaperIds()", () => {
    // Phase 2.2 lands collections empty; the count grows in 2.4–2.6.
    expect(Array.isArray(allPaperIds())).toBe(true);
  });
});

describe("loadAuthor", () => {
  it("returns null for an unknown slug", () => {
    expect(loadAuthor("nobody-here-2026")).toBeNull();
  });

  it("loads each seed author and reports empty joins until papers land", () => {
    const seedSlugs = [
      "yejin-choi",
      "percy-liang",
      "owain-evans",
      "jacob-steinhardt",
      "dario-amodei",
    ];
    for (const slug of seedSlugs) {
      const loaded = loadAuthor(slug);
      expect(loaded, `author ${slug} should resolve`).not.toBeNull();
      if (!loaded) continue;
      expect(loaded.author.slug).toBe(slug);
      // Affiliations are intentionally empty in Unit 2.1; papers come in 2.4–2.6.
      expect(loaded.affiliations).toEqual([]);
      expect(loaded.papers).toEqual([]);
      expect(loaded.problemsTouched).toEqual([]);
    }
  });

  it("allAuthorSlugs() includes every seed author", () => {
    const slugs = allAuthorSlugs();
    for (const expected of [
      "yejin-choi",
      "percy-liang",
      "owain-evans",
      "jacob-steinhardt",
      "dario-amodei",
    ]) {
      expect(slugs).toContain(expected);
    }
  });
});

describe("loadInstitution", () => {
  it("returns null for an unknown slug", () => {
    expect(loadInstitution("no-such-institution-2026")).toBeNull();
  });

  it("loads each seed institution with empty paper joins", () => {
    const seedSlugs = [
      "openai",
      "anthropic",
      "google-deepmind",
      "meta-fair",
      "microsoft-research",
      "stanford-university",
      "mit",
      "uc-berkeley",
    ];
    for (const slug of seedSlugs) {
      const loaded = loadInstitution(slug);
      expect(loaded, `institution ${slug} should resolve`).not.toBeNull();
      if (!loaded) continue;
      expect(loaded.institution.slug).toBe(slug);
      expect(loaded.papers).toEqual([]);
      expect(loaded.subdomainCoverage).toEqual([]);
    }
  });

  it("allInstitutionSlugs() returns the 8 seed institutions", () => {
    expect(allInstitutionSlugs().length).toBeGreaterThanOrEqual(8);
  });
});
