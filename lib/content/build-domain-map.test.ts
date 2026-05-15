import { describe, it, expect } from "vitest";
import { buildDomainMap } from "@/lib/content/build-domain-map";
import { taxonomy } from "#site/content";
import { getIndexedProblems } from "@/lib/content/load-problems-index";

describe("buildDomainMap", () => {
  it("emits one domain node per taxonomy.domains entry, in declaration order with hues 1..5 (wrapping)", () => {
    const { nodes } = buildDomainMap();
    const domainNodes = nodes.filter((n) => n.kind === "domain");
    expect(domainNodes.length).toBe(taxonomy.domains.length);
    for (let i = 0; i < domainNodes.length; i++) {
      const expected = taxonomy.domains[i]!;
      expect(domainNodes[i]!.id).toBe(`domain:${expected.id}`);
      expect(domainNodes[i]!.label).toBe(expected.title);
      expect(domainNodes[i]!.hue).toBe(((i % 5) + 1) as 1 | 2 | 3 | 4 | 5);
    }
  });

  it("emits one subdomain node per (domain, subdomain) pair", () => {
    const { nodes } = buildDomainMap();
    const subdomainNodes = nodes.filter((n) => n.kind === "subdomain");
    const expectedCount = taxonomy.domains.reduce((sum, d) => sum + d.subdomains.length, 0);
    expect(subdomainNodes.length).toBe(expectedCount);
  });

  it("inherits domain hue on every subdomain + problem node", () => {
    const { nodes } = buildDomainMap();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    for (const n of nodes) {
      if (n.kind === "domain" || !n.parent) continue;
      const parent = byId.get(n.parent);
      expect(parent).toBeDefined();
      expect(n.hue).toBe(parent!.hue);
    }
  });

  it("every link's source and target id exists in nodes", () => {
    const { nodes, links } = buildDomainMap();
    const ids = new Set(nodes.map((n) => n.id));
    for (const l of links) {
      expect(ids.has(l.source)).toBe(true);
      expect(ids.has(l.target)).toBe(true);
    }
  });

  it("every non-domain node has a parent that resolves to another node", () => {
    const { nodes } = buildDomainMap();
    const ids = new Set(nodes.map((n) => n.id));
    for (const n of nodes) {
      if (n.kind === "domain") continue;
      expect(n.parent).toBeDefined();
      expect(ids.has(n.parent as string)).toBe(true);
    }
  });

  it("domain composite is the arithmetic mean of its descendant problems' composites", () => {
    const { nodes } = buildDomainMap();
    const indexed = getIndexedProblems();
    for (const d of taxonomy.domains) {
      const own = indexed.filter((p) => p.domainId === d.id);
      if (own.length === 0) continue;
      const expectedMean = own.reduce((acc, p) => acc + (p.composite ?? 3.0), 0) / own.length;
      const domainNode = nodes.find((n) => n.id === `domain:${d.id}`);
      expect(domainNode).toBeDefined();
      expect(domainNode!.composite).toBeCloseTo(expectedMean, 6);
    }
  });

  it("subdomain composite is the mean of its child problems' composites (or 3.0 placeholder when empty)", () => {
    const { nodes } = buildDomainMap();
    const indexed = getIndexedProblems();
    for (const d of taxonomy.domains) {
      for (const s of d.subdomains) {
        const own = indexed.filter((p) => p.domainId === d.id && p.subdomainId === s.id);
        const expected =
          own.length === 0
            ? 3.0
            : own.reduce((acc, p) => acc + (p.composite ?? 3.0), 0) / own.length;
        const subNode = nodes.find((n) => n.id === `subdomain:${d.id}/${s.id}`);
        expect(subNode).toBeDefined();
        expect(subNode!.composite).toBeCloseTo(expected, 6);
      }
    }
  });

  it("emits one problem node per indexed problem (no drops, no duplicates)", () => {
    const { nodes } = buildDomainMap();
    const problemNodes = nodes.filter((n) => n.kind === "problem");
    const indexed = getIndexedProblems();
    expect(problemNodes.length).toBe(indexed.length);
    const slugs = new Set(problemNodes.map((n) => n.id.replace(/^problem:/, "")));
    for (const p of indexed) {
      expect(slugs.has(p.slug)).toBe(true);
    }
  });

  it("every problem node carries an href to /problems/<slug>", () => {
    const { nodes } = buildDomainMap();
    for (const n of nodes.filter((n) => n.kind === "problem")) {
      const slug = n.id.replace(/^problem:/, "");
      expect(n.href).toBe(`/problems/${slug}`);
    }
  });
});
