import { taxonomy } from "#site/content";
import { ChartTableSwitch } from "@/components/viz/_shared/chart-table-switch";
import { DomainMap } from "@/components/viz/DomainMap";
import { DomainMapTable } from "@/components/viz/DomainMap/table";
import { buildDomainMap } from "@/lib/content/build-domain-map";

export default function DomainsPage() {
  const { nodes, links } = buildDomainMap();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Domains</h1>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">
          The {taxonomy.domains.length} top-level domains of the LLM OpenProblems taxonomy
          (MASTER_PROMPT §4). Each domain&apos;s aggregate composite rating drives its node size on
          the map below; tap any node to drill into the corresponding hub or problem page.
        </p>
      </header>

      <ChartTableSwitch
        ariaLabel="Domain map and tabular fallback"
        chart={<DomainMap nodes={nodes} links={links} ariaLabel="Map of LLM research domains" />}
        table={<DomainMapTable nodes={nodes} />}
        label="View domains as table"
      />
    </main>
  );
}
