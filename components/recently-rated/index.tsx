import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { getIndexedProblems, type IndexedProblem } from "@/lib/content/load-problems-index";
import { cn } from "@/lib/utils";

interface Props {
  /** Maximum rows to show. Defaults to 5 (§13 Phase 1: "top 3-5"). */
  limit?: number;
  className?: string;
}

function pickRecentlyRated(rows: IndexedProblem[], limit: number): IndexedProblem[] {
  return rows
    .filter((r): r is IndexedProblem & { latestRatingDate: string } => Boolean(r.latestRatingDate))
    .slice()
    .sort((a, b) => {
      if (a.latestRatingDate !== b.latestRatingDate) {
        return a.latestRatingDate < b.latestRatingDate ? 1 : -1;
      }
      return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
    })
    .slice(0, limit);
}

export function RecentlyRated({ limit = 5, className }: Props) {
  const rows = pickRecentlyRated(getIndexedProblems(), limit);

  if (rows.length === 0) {
    return (
      <p className={cn("text-muted-foreground text-sm", className)}>
        No rating actions yet — see{" "}
        <Link href="/contributing" className="hover:text-accent underline underline-offset-2">
          /contributing
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {rows.map((r) => (
        <li key={r.slug}>
          <Link
            href={`/problems/${r.slug}`}
            className="group border-border hover:border-accent/60 hover:bg-muted/40 block rounded-md border p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-foreground group-hover:text-accent font-serif text-base font-semibold tracking-tight">
                {r.title}
              </div>
              <StatusPill status={r.status} className="shrink-0" />
            </div>
            <div className="text-muted-foreground mt-2 font-mono text-xs">
              {r.domainTitle} · {r.subdomainTitle}
            </div>
            <div className="text-muted-foreground mt-2 flex items-center gap-3 font-mono text-xs">
              <span>rated {r.latestRatingDate}</span>
              {typeof r.composite === "number" && (
                <span aria-label="advisory composite (§8.3)">
                  composite {r.composite.toFixed(2)}
                </span>
              )}
            </div>
            {r.tags.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
                {r.tags.slice(0, 4).map((tag) => (
                  <li
                    key={tag}
                    className="border-border text-muted-foreground rounded-full border px-2 py-0.5 font-mono text-[10px]"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
