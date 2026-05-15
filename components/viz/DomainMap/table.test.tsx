import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DomainMapTable } from "./table";
import type { DomainMapNode } from "./types";

function render(props: Parameters<typeof DomainMapTable>[0]): string {
  return renderToStaticMarkup(<DomainMapTable {...props} />);
}

const SAMPLE_NODES: DomainMapNode[] = [
  { id: "domain:a", kind: "domain", label: "Alignment", composite: 4.1, hue: 2 },
  {
    id: "subdomain:a/oversight",
    kind: "subdomain",
    label: "Scalable Oversight",
    composite: 4.0,
    hue: 2,
    parent: "domain:a",
  },
  {
    id: "problem:p1",
    kind: "problem",
    label: "Scalable Oversight",
    composite: 4.2,
    hue: 2,
    parent: "subdomain:a/oversight",
  },
  {
    id: "problem:p2",
    kind: "problem",
    label: "Benchmark Integrity",
    composite: 3.3,
    hue: 2,
    parent: "domain:a",
  },
];

describe("DomainMapTable", () => {
  it("renders one <tr> per problem (plus header)", () => {
    const html = render({ nodes: SAMPLE_NODES });
    const rows = html.match(/<tr\b/g) ?? [];
    // 1 header + 2 problems = 3 rows.
    expect(rows.length).toBe(3);
  });

  it("includes each problem's display name and composite rating", () => {
    const html = render({ nodes: SAMPLE_NODES });
    expect(html).toContain("Scalable Oversight");
    expect(html).toContain("Benchmark Integrity");
    expect(html).toContain(">4.20<");
    expect(html).toContain(">3.30<");
  });

  it("shows the domain label on every problem row", () => {
    const html = render({ nodes: SAMPLE_NODES });
    // The domain "Alignment" should appear at least twice (once per problem row).
    const matches = html.match(/Alignment/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("renders the subdomain label when set, '—' otherwise", () => {
    const html = render({ nodes: SAMPLE_NODES });
    expect(html).toContain("Scalable Oversight");
    expect(html).toContain(">—<"); // p2 is parented directly under the domain
  });

  it("renders a paragraph empty-state for nodes=[]", () => {
    const html = render({ nodes: [] });
    expect(html).toMatch(/No domains to tabulate\./);
    expect(html).not.toMatch(/<table/);
  });
});
