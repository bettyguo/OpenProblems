import type { DomainMapLink, DomainMapNode } from "@/components/viz/DomainMap/types";
import { getIndexedProblems } from "@/lib/content/load-problems-index";
import { taxonomy } from "#site/content";

/**
 * Build the `nodes` + `links` arrays the DomainMap viz consumes (Unit 4.2),
 * from the live taxonomy + problems + rating-action data.
 *
 * Shared by Unit 4.3 (`/domains` index) and Unit 4.4 (`/` landing).
 *
 * Hue assignment per Unit 4.0 D-5: 5 chart-token hues, one per domain in
 * `taxonomy.domains[]` declaration order. Subdomain + problem nodes inherit
 * their parent domain's hue.
 *
 * Composite aggregation per Unit 4.3 D-1: mean of leaf problems. Subdomain
 * composite = mean of child problems' composites. Domain composite = mean
 * of all descendant problems' composites (not nested subdomain means —
 * flatter aggregation is more honest under uneven subdomain populations).
 *
 * Unrated problems use a **3.0 placeholder composite** so the viz renders
 * full coverage; the table fallback distinguishes them via `composite ===
 * 3.0 && !rated` (the caller decides whether to surface that distinction).
 */

type DomainMapHue = DomainMapNode["hue"];

const PLACEHOLDER_COMPOSITE = 3.0;

function hueForDomainIndex(idx: number): DomainMapHue {
  return ((idx % 5) + 1) as DomainMapHue;
}

function mean(values: number[]): number {
  if (values.length === 0) return PLACEHOLDER_COMPOSITE;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export interface BuildDomainMapResult {
  nodes: DomainMapNode[];
  links: DomainMapLink[];
}

export function buildDomainMap(): BuildDomainMapResult {
  const indexed = getIndexedProblems();
  const nodes: DomainMapNode[] = [];
  const links: DomainMapLink[] = [];

  for (let dIdx = 0; dIdx < taxonomy.domains.length; dIdx++) {
    const domain = taxonomy.domains[dIdx]!;
    const hue = hueForDomainIndex(dIdx);
    const domainId = `domain:${domain.id}`;
    const domainProblems = indexed.filter((p) => p.domainId === domain.id);
    const domainComposite = mean(domainProblems.map((p) => p.composite ?? PLACEHOLDER_COMPOSITE));

    nodes.push({
      id: domainId,
      kind: "domain",
      label: domain.title,
      composite: domainComposite,
      hue,
      href: `/domains/${domain.id}`,
    });

    for (const sub of domain.subdomains) {
      const subId = `subdomain:${domain.id}/${sub.id}`;
      const subProblems = domainProblems.filter((p) => p.subdomainId === sub.id);
      const subComposite = mean(subProblems.map((p) => p.composite ?? PLACEHOLDER_COMPOSITE));

      nodes.push({
        id: subId,
        kind: "subdomain",
        label: sub.title,
        composite: subComposite,
        hue,
        href: `/domains/${domain.id}/${sub.id}`,
        parent: domainId,
      });
      links.push({ source: subId, target: domainId });

      for (const p of subProblems) {
        const problemId = `problem:${p.slug}`;
        nodes.push({
          id: problemId,
          kind: "problem",
          label: p.title,
          composite: p.composite ?? PLACEHOLDER_COMPOSITE,
          hue,
          href: `/problems/${p.slug}`,
          parent: subId,
        });
        links.push({ source: problemId, target: subId });
      }
    }

    // Problems whose declared subdomain is missing from taxonomy.yaml's
    // subdomains[] (shouldn't happen in HEAD, but defensive against
    // taxonomy edits): attach the problem directly to its domain node so
    // it doesn't get silently dropped.
    const orphanProblems = domainProblems.filter(
      (p) => !domain.subdomains.some((s) => s.id === p.subdomainId),
    );
    for (const p of orphanProblems) {
      const problemId = `problem:${p.slug}`;
      nodes.push({
        id: problemId,
        kind: "problem",
        label: p.title,
        composite: p.composite ?? PLACEHOLDER_COMPOSITE,
        hue,
        href: `/problems/${p.slug}`,
        parent: domainId,
      });
      links.push({ source: problemId, target: domainId });
    }
  }

  return { nodes, links };
}
