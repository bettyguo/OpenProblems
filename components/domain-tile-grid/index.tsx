import Link from "next/link";
import { problems, taxonomy } from "#site/content";
import { cn } from "@/lib/utils";

function countProblemsInDomain(domainId: string): number {
  return problems.filter((p) => p.domain === domainId).length;
}

export function DomainTileGrid({ className }: { className?: string }) {
  return (
    <ul className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
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
  );
}
