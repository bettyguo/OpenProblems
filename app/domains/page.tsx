import Link from "next/link";
import { problems, taxonomy } from "#site/content";

function countProblemsInDomain(domainId: string): number {
  return problems.filter((p) => p.domain === domainId).length;
}

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

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {taxonomy.domains.map((d) => {
          const problemCount = countProblemsInDomain(d.id);
          return (
            <li key={d.id}>
              <Link
                href={`/domains/${d.id}`}
                className="group border-border hover:border-accent/60 hover:bg-muted/40 block rounded-md border p-4 transition-colors"
              >
                <div className="text-foreground group-hover:text-accent font-serif text-lg font-semibold tracking-tight">
                  {d.title}
                </div>
                <div className="text-muted-foreground mt-1 font-mono text-xs">
                  {d.subdomains.length} subdomain{d.subdomains.length === 1 ? "" : "s"}
                  <span aria-hidden> · </span>
                  {problemCount} problem{problemCount === 1 ? "" : "s"}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
