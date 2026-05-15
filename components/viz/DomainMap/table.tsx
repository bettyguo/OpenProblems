import type { DomainMapNode } from "./types";

/**
 * DomainMapTable — tabular fallback for DomainMap (Unit 4.2).
 *
 * Mirrors the Unit 3.12 pattern (chart-table-switch.tsx). Wrapped by the
 * consumer page (Unit 4.3 `/domains`, Unit 4.4 `/`) inside <ChartTableSwitch>.
 *
 * Renders one row per problem, grouped by domain (and subdomain when present).
 * Empty-state line is a paragraph, not a table — find-in-page friendly.
 */

export interface DomainMapTableProps {
  nodes: DomainMapNode[];
}

interface SubdomainGroup {
  subdomain: DomainMapNode | null;
  problems: DomainMapNode[];
}

function groupByDomain(
  nodes: DomainMapNode[],
): { domain: DomainMapNode; subdomains: SubdomainGroup[] }[] {
  const domains = nodes.filter((n) => n.kind === "domain");
  const subdomains = nodes.filter((n) => n.kind === "subdomain");
  const problems = nodes.filter((n) => n.kind === "problem");

  return domains.map((d) => {
    const childSubs = subdomains.filter((s) => s.parent === d.id);
    const childGroups: SubdomainGroup[] = childSubs.map((s) => ({
      subdomain: s,
      problems: problems.filter((p) => p.parent === s.id),
    }));
    const orphanProblems = problems.filter((p) => p.parent === d.id);
    if (orphanProblems.length > 0) {
      childGroups.push({ subdomain: null, problems: orphanProblems });
    }
    return { domain: d, subdomains: childGroups };
  });
}

export function DomainMapTable({ nodes }: DomainMapTableProps) {
  if (nodes.length === 0) {
    return <p className="text-muted-foreground text-sm italic">No domains to tabulate.</p>;
  }

  const grouped = groupByDomain(nodes);

  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">
        Open-problem taxonomy: domains → subdomains → problems with composite ratings.
      </caption>
      <thead className="text-muted-foreground text-xs">
        <tr>
          <th className="px-3 py-2 text-left font-medium">Domain</th>
          <th className="px-3 py-2 text-left font-medium">Subdomain</th>
          <th className="px-3 py-2 text-left font-medium">Problem</th>
          <th className="px-3 py-2 text-left font-medium">Composite</th>
        </tr>
      </thead>
      <tbody>
        {grouped.flatMap(({ domain, subdomains }) => {
          if (subdomains.length === 0) {
            return [
              <tr key={`${domain.id}-empty`} className="border-border border-t">
                <td className="px-3 py-2 font-medium">{domain.label}</td>
                <td className="text-muted-foreground px-3 py-2 text-xs">—</td>
                <td className="text-muted-foreground px-3 py-2 text-xs italic">No problems</td>
                <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                  {domain.composite.toFixed(2)}
                </td>
              </tr>,
            ];
          }
          return subdomains.flatMap((group) =>
            group.problems.length === 0
              ? [
                  <tr
                    key={`${domain.id}-${group.subdomain?.id ?? "orphan"}-empty`}
                    className="border-border border-t"
                  >
                    <td className="px-3 py-2 font-medium">{domain.label}</td>
                    <td className="px-3 py-2 text-xs">{group.subdomain?.label ?? "—"}</td>
                    <td className="text-muted-foreground px-3 py-2 text-xs italic">No problems</td>
                    <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                      {domain.composite.toFixed(2)}
                    </td>
                  </tr>,
                ]
              : group.problems.map((p) => (
                  <tr key={p.id} className="border-border border-t">
                    <td className="px-3 py-2 font-medium">{domain.label}</td>
                    <td className="px-3 py-2 text-xs">{group.subdomain?.label ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{p.label}</td>
                    <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                      {p.composite.toFixed(2)}
                    </td>
                  </tr>
                )),
          );
        })}
      </tbody>
    </table>
  );
}
