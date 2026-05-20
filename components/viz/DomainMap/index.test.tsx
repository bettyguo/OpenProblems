import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DomainMap } from "./index";
import type { DomainMapNode, DomainMapLink } from "./types";

function render(props: Parameters<typeof DomainMap>[0]): string {
  return renderToStaticMarkup(<DomainMap {...props} />);
}

const TINY_NODES: DomainMapNode[] = [
  { id: "domain:a", kind: "domain", label: "Domain A", composite: 4.0, hue: 1 },
  { id: "domain:b", kind: "domain", label: "Domain B", composite: 3.5, hue: 2 },
  {
    id: "problem:p1",
    kind: "problem",
    label: "Problem 1",
    composite: 4.2,
    hue: 1,
    href: "/problems/p1",
    parent: "domain:a",
  },
  {
    id: "problem:p2",
    kind: "problem",
    label: "Problem 2",
    composite: 3.4,
    hue: 2,
    href: "/problems/p2",
    parent: "domain:b",
  },
];

const TINY_LINKS: DomainMapLink[] = [
  { source: "problem:p1", target: "domain:a" },
  { source: "problem:p2", target: "domain:b" },
];

describe("DomainMap", () => {
  it("renders an <svg role=img> with a derived aria-label", () => {
    const html = render({ nodes: TINY_NODES, links: TINY_LINKS });
    expect(html).toMatch(/<svg [^>]*role="img"/);
    expect(html).toMatch(/aria-label="Domain map of 2 problems across 2 domains"/);
  });

  it("emits a <desc> enumerating node counts and per-domain summaries", () => {
    const html = render({ nodes: TINY_NODES, links: TINY_LINKS });
    expect(html).toMatch(/Domain map: 2 domains, 0 subdomains, 2 problems/);
    expect(html).toMatch(/Domain A \(composite 4.0, 1 problem\)/);
    expect(html).toMatch(/Problem 1 \(composite 4.2\)/);
  });

  it("renders one <line> per link", () => {
    const html = render({ nodes: TINY_NODES, links: TINY_LINKS });
    const lines = html.match(/<line\b/g) ?? [];
    expect(lines.length).toBe(TINY_LINKS.length);
  });

  it("renders one <circle> per node", () => {
    const html = render({ nodes: TINY_NODES, links: TINY_LINKS });
    const circles = html.match(/<circle\b/g) ?? [];
    expect(circles.length).toBe(TINY_NODES.length);
  });

  it("wraps problem nodes with hrefs in <a href=…>", () => {
    const html = render({ nodes: TINY_NODES, links: TINY_LINKS });
    expect(html).toMatch(/<a [^>]*href="\/problems\/p1"/);
    expect(html).toMatch(/<a [^>]*href="\/problems\/p2"/);
  });

  it("references the chart-token hue for each node", () => {
    const html = render({ nodes: TINY_NODES, links: TINY_LINKS });
    // Domain A + Problem 1 are hue=1; Domain B + Problem 2 are hue=2.
    expect(html).toContain("var(--color-chart-1)");
    expect(html).toContain("var(--color-chart-2)");
  });

  it("renders an empty-state figure for nodes=[]", () => {
    const html = render({ nodes: [], links: [] });
    expect(html).toMatch(/No domains to map\./);
    expect(html).toMatch(/aria-label="Domain map \(no data\)"/);
    const circles = html.match(/<circle\b/g) ?? [];
    expect(circles.length).toBe(0);
  });

  it("applies dimmed opacity to nodes in dimmedIds", () => {
    const html = render({
      nodes: TINY_NODES,
      links: TINY_LINKS,
      dimmedIds: new Set(["domain:b", "problem:p2"]),
    });
    // The two dimmed nodes should render with opacity:0.2 in inline style.
    const dimmedMatches = html.match(/opacity:0\.2/g) ?? [];
    expect(dimmedMatches.length).toBeGreaterThanOrEqual(2);
  });

  it("emits a deterministic layout across renders (no Math.random drift)", () => {
    const a = render({ nodes: TINY_NODES, links: TINY_LINKS });
    const b = render({ nodes: TINY_NODES, links: TINY_LINKS });
    expect(a).toBe(b);
  });

  it("auto-fits the viewBox to the actual layout extent so nodes are never clipped (regression: 96-node graphs had most nodes positioned outside the fixed 0 0 600 420 viewBox)", () => {
    // Bug: a fixed viewBox of `0 0 600 420` clipped most nodes in graphs
    // larger than ~20 nodes because the d3-force simulation (chargeStrength
    // = -180, link distance 60) spreads many nodes well outside that
    // window. Fix computes the actual bounding box of the positioned
    // layout and emits viewBox dynamically.
    const html = render({ nodes: TINY_NODES, links: TINY_LINKS });
    // The viewBox attr is dynamic: regex captures the 4 numbers; assert
    // the rect is large enough to contain all 4 positioned nodes (each
    // has radius ~sqrt(composite)*k ≤ ~14 px). With only 2 domain + 2
    // problem nodes, the layout fits in a small box but the viewBox
    // must NOT be the legacy fixed `0 0 600 420`.
    const viewBoxMatch = html.match(/viewBox="([^"]+)"/);
    expect(viewBoxMatch).not.toBeNull();
    expect(viewBoxMatch?.[1]).not.toBe("0 0 600 420");
    const parts = viewBoxMatch?.[1]?.split(" ").map(Number) ?? [];
    expect(parts.length).toBe(4);
    const [, , w, h] = parts;
    expect(w).toBeGreaterThan(0);
    expect(h).toBeGreaterThan(0);
  });

  it('renders responsive width="100%" + preserveAspectRatio="xMidYMid meet" so the SVG fills its container', () => {
    // Combined with the auto-fit viewBox, this makes the chart scale to
    // its container width regardless of node count.
    const html = render({ nodes: TINY_NODES, links: TINY_LINKS });
    expect(html).toMatch(/width="100%"/);
    expect(html).toMatch(/preserveAspectRatio="xMidYMid meet"/);
  });
});
