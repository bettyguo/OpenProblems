/**
 * DomainMap — Phase 4 catalog item 4 (§11).
 *
 * Type contract for the force-graph viz. The viz itself is presentational —
 * consumer pages (Unit 4.3 `/domains`, Unit 4.4 `/`) build these arrays
 * from `taxonomy.yaml` + `problems.json` + the §8.3 composite formula and
 * pass them in as props.
 */

export type DomainMapNodeKind = "domain" | "subdomain" | "problem";

export interface DomainMapNode {
  /** Stable id across the graph. Convention: `${kind}:${slug}` (e.g., "domain:deep-learning"). */
  id: string;
  kind: DomainMapNodeKind;
  /** Display text on the node. */
  label: string;
  /** Composite rating in [1, 5]. Drives node size via radius = sqrt(composite) × k (Unit 4.0 D-4). */
  composite: number;
  /** 1–5 indexing the chart-token hue family (Unit 4.0 D-5). */
  hue: 1 | 2 | 3 | 4 | 5;
  /** Optional navigation target. Problems → /problems/<slug>; domains → /domains/<slug>. */
  href?: string;
  /** Parent node id, used to disambiguate subdomain/problem placement and threading. */
  parent?: string;
}

export interface DomainMapLink {
  source: string;
  target: string;
}
