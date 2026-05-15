import { describe, it, expect } from "vitest";
import { loadPaper, allPaperIds } from "@/lib/content/load-paper";
import { loadAuthor, allAuthorSlugs } from "@/lib/content/load-author";
import { loadInstitution, allInstitutionSlugs } from "@/lib/content/load-institution";

describe("loadPaper", () => {
  it("returns null for an unknown id", () => {
    expect(loadPaper("does-not-exist-2999.99999")).toBeNull();
  });

  it("returns an array via allPaperIds()", () => {
    expect(Array.isArray(allPaperIds())).toBe(true);
  });

  it("loads TruthfulQA (Unit 2.4) and resolves its author + institution joins", () => {
    const loaded = loadPaper("2109.07958");
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    expect(loaded.paper.title).toMatch(/TruthfulQA/);
    expect(loaded.authors.map((a) => a.slug)).toContain("owain-evans");
    expect(loaded.institutions.map((i) => i.slug)).toContain("openai");
    expect(loaded.contributions.length).toBeGreaterThan(0);
    expect(loaded.contributions[0]?.problem?.slug).toBe("hallucination-reduction");
  });
});

describe("loadAuthor", () => {
  it("returns null for an unknown slug", () => {
    expect(loadAuthor("nobody-here-2026")).toBeNull();
  });

  it("resolves each Unit-2.1 seed author and exposes affiliations + papers arrays", () => {
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
      // Affiliations stay empty until a later curation pass — papers anchor the dates.
      expect(loaded.affiliations).toEqual([]);
      // papers / problemsTouched grow as Units 2.4–2.6 land batches; just assert shape here.
      expect(Array.isArray(loaded.papers)).toBe(true);
      expect(Array.isArray(loaded.problemsTouched)).toBe(true);
    }
  });

  it("joins an author to their papers once a paper references them", () => {
    // Owain Evans is on the TruthfulQA paper (arXiv 2109.07958), committed in Unit 2.4.
    const loaded = loadAuthor("owain-evans");
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    const ids = loaded.papers.map((p) => p.id);
    expect(ids).toContain("2109.07958");
    const problemSlugs = loaded.problemsTouched.map((p) => p.slug);
    expect(problemSlugs).toContain("hallucination-reduction");
  });

  it("allAuthorSlugs() includes every Unit-2.1 seed author", () => {
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

  it("resolves each Unit-2.1 seed institution and exposes papers + coverage arrays", () => {
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
      expect(Array.isArray(loaded.papers)).toBe(true);
      expect(Array.isArray(loaded.subdomainCoverage)).toBe(true);
    }
  });

  it("joins an institution to its papers and ranks subdomain coverage", () => {
    // OpenAI is on TruthfulQA + SimpleQA, both committed in Unit 2.4 and both
    // contributing to hallucination-reduction (DL / large-language-models).
    const loaded = loadInstitution("openai");
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    const ids = loaded.papers.map((p) => p.id);
    expect(ids).toContain("2109.07958");
    expect(ids).toContain("2411.04368");
    const llmCoverage = loaded.subdomainCoverage.find(
      (c) => c.subdomain_id === "large-language-models",
    );
    expect(llmCoverage).toBeDefined();
    expect(llmCoverage?.paperCount).toBeGreaterThanOrEqual(2);
  });

  it("allInstitutionSlugs() returns at least the 8 Unit-2.1 seed institutions", () => {
    expect(allInstitutionSlugs().length).toBeGreaterThanOrEqual(8);
  });
});

describe("Unit 2.12 — cumulative impact + problemsTouched on institutions", () => {
  it("author cumulativeImpact is a positive sum when problemsTouched have composites", () => {
    // owain-evans → TruthfulQA → hallucination-reduction (rated, has composite).
    const loaded = loadAuthor("owain-evans");
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    expect(typeof loaded.cumulativeImpact).toBe("number");
    expect(loaded.cumulativeImpact ?? 0).toBeGreaterThan(0);
  });

  it("author cumulativeImpact is undefined when no problemsTouched has a composite", () => {
    // yejin-choi has no papers in the seed set → empty problemsTouched → undefined.
    const loaded = loadAuthor("yejin-choi");
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    expect(loaded.cumulativeImpact).toBeUndefined();
  });

  it("institution surfaces problemsTouched and cumulativeImpact", () => {
    const loaded = loadInstitution("openai");
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    expect(Array.isArray(loaded.problemsTouched)).toBe(true);
    const touchedSlugs = loaded.problemsTouched.map((p) => p.slug);
    expect(touchedSlugs).toContain("hallucination-reduction");
    expect(typeof loaded.cumulativeImpact).toBe("number");
    expect(loaded.cumulativeImpact ?? 0).toBeGreaterThan(0);
  });
});
