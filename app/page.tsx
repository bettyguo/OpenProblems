import Link from "next/link";
import { taxonomy } from "#site/content";
import { RecentlyRated } from "@/components/recently-rated";
import { ChartTableSwitch } from "@/components/viz/_shared/chart-table-switch";
import { DomainMap } from "@/components/viz/DomainMap";
import { DomainMapTable } from "@/components/viz/DomainMap/table";
import { buildDomainMap } from "@/lib/content/build-domain-map";

export default function HomePage() {
  const { nodes, links } = buildDomainMap();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section aria-labelledby="hero-heading" className="max-w-prose">
        <h1
          id="hero-heading"
          className="text-foreground font-serif text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Rated open problems in LLM &amp; AI research.
        </h1>
        <p className="text-muted-foreground mt-4 text-base sm:text-lg">
          A taxonomy-organized encyclopedia of open problems, scored on five revisable dimensions —
          Difficulty, Saturation, Urgency, Value, Industry Call — with an immutable rating-action
          log behind every score.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/problems"
            className="bg-foreground text-background hover:bg-accent inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            Browse problems
          </Link>
          <Link
            href="/methodology"
            className="border-border hover:border-accent/60 hover:text-accent inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
          >
            Read the methodology
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="recently-rated-heading"
        className="border-border mt-16 border-t pt-8"
      >
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2
            id="recently-rated-heading"
            className="font-serif text-2xl font-semibold tracking-tight"
          >
            Recently rated
          </h2>
          <Link
            href="/ratings"
            className="text-muted-foreground hover:text-accent font-mono text-xs underline-offset-2 hover:underline"
          >
            All rating actions →
          </Link>
        </div>
        <RecentlyRated />
      </section>

      <section aria-labelledby="by-domain-heading" className="border-border mt-16 border-t pt-8">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="by-domain-heading" className="font-serif text-2xl font-semibold tracking-tight">
            By domain
          </h2>
          <Link
            href="/domains"
            className="text-muted-foreground hover:text-accent font-mono text-xs underline-offset-2 hover:underline"
          >
            All domains →
          </Link>
        </div>
        <nav aria-label="Browse by domain" className="mb-4 flex flex-wrap gap-2">
          {taxonomy.domains.map((d) => (
            <Link
              key={d.id}
              href={`/domains/${d.id}`}
              className="border-border hover:border-accent/60 hover:bg-muted/40 hover:text-accent rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            >
              {d.title}
            </Link>
          ))}
        </nav>
        <ChartTableSwitch
          ariaLabel="Domain map teaser and tabular fallback"
          chart={<DomainMap nodes={nodes} links={links} ariaLabel="Map of LLM research domains" />}
          table={<DomainMapTable nodes={nodes} />}
          label="View domains as table"
        />
      </section>

      <section aria-labelledby="methodology-heading" className="border-border mt-16 border-t pt-8">
        <h2 id="methodology-heading" className="font-serif text-2xl font-semibold tracking-tight">
          Methodology
        </h2>
        <p className="text-muted-foreground mt-3 max-w-prose text-sm">
          Every rating traces back to a published, versioned methodology. Five dimensions, one
          advisory composite, and a strict rating-action log — modeled on how credit rating agencies
          publish sovereign opinions, adapted for AI research questions.
        </p>
        <div className="mt-4">
          <Link
            href="/methodology"
            className="text-foreground hover:text-accent text-sm underline underline-offset-2"
          >
            Read methodology v1 →
          </Link>
        </div>
      </section>
    </main>
  );
}
