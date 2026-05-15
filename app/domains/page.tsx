import { taxonomy } from "#site/content";
import { DomainTileGrid } from "@/components/domain-tile-grid";

export default function DomainsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">Domains</h1>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">
          The {taxonomy.domains.length} top-level domains of the LLM OpenProblems taxonomy
          (MASTER_PROMPT §4). Tap a domain to drill into its subdomains and listed problems.
        </p>
      </header>

      <DomainTileGrid />
    </main>
  );
}
