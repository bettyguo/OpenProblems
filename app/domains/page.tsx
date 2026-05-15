import Link from "next/link";
import { taxonomy } from "#site/content";

export default function DomainsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">Domains</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        The {taxonomy.domains.length} top-level domains of the LLM OpenProblems taxonomy. Phase 1 —
        Unit 1.7 will replace this list with the full tile grid.
      </p>
      <ul className="mt-8 space-y-2">
        {taxonomy.domains.map((domain) => (
          <li key={domain.id}>
            <Link
              href={`/domains/${domain.id}`}
              className="text-foreground text-base font-medium underline-offset-4 hover:underline"
            >
              {domain.title}
            </Link>{" "}
            <span className="text-muted-foreground text-xs">
              · {domain.subdomains.length} subdomain
              {domain.subdomains.length === 1 ? "" : "s"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
