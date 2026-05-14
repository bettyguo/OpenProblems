import { describe, it, expect } from "vitest";
import { loadTaxonomy } from "@/lib/content/load-taxonomy";

const EXPECTED_DOMAIN_IDS = [
  "applications",
  "deep-learning",
  "general-ml",
  "optimization",
  "probabilistic-methods",
  "reinforcement-learning",
  "theory",
  "social-aspects",
] as const;

describe("content/taxonomy.yaml", () => {
  it("parses and validates against TaxonomySchema", async () => {
    const taxonomy = await loadTaxonomy();
    expect(taxonomy.domains.length).toBe(EXPECTED_DOMAIN_IDS.length);
  });

  it("contains the eight top-level domains from MASTER_PROMPT §4 in order", async () => {
    const taxonomy = await loadTaxonomy();
    expect(taxonomy.domains.map((d) => d.id)).toEqual(EXPECTED_DOMAIN_IDS);
  });

  it("every domain has at least one subdomain", async () => {
    const taxonomy = await loadTaxonomy();
    for (const d of taxonomy.domains) {
      expect(d.subdomains.length).toBeGreaterThan(0);
    }
  });

  it("preserves the expected cross-domain subdomain id collisions (per Q11)", async () => {
    const taxonomy = await loadTaxonomy();
    const byDomain = new Map(taxonomy.domains.map((d) => [d.id, d]));

    // robustness exists under both deep-learning and social-aspects
    const dlSubs = byDomain.get("deep-learning")?.subdomains.map((s) => s.id) ?? [];
    const saSubs = byDomain.get("social-aspects")?.subdomains.map((s) => s.id) ?? [];
    expect(dlSubs).toContain("robustness");
    expect(saSubs).toContain("robustness");

    // representation-learning exists under both deep-learning and general-ml
    const gmlSubs = byDomain.get("general-ml")?.subdomains.map((s) => s.id) ?? [];
    expect(dlSubs).toContain("representation-learning");
    expect(gmlSubs).toContain("representation-learning");
  });
});
