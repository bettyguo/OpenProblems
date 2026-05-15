import Link from "next/link";
import { notFound } from "next/navigation";
import { allProblemSlugs, loadProblem } from "@/lib/content/load-problem";
import { loadEntriesForProblem } from "@/lib/content/load-entries";

interface LeaderboardPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allProblemSlugs().map((slug) => ({ slug }));
}

function sortEntries<T extends { score: number; date: string }>(
  entries: T[],
  direction: "higher-is-better" | "lower-is-better",
): T[] {
  const dir = direction === "higher-is-better" ? -1 : 1;
  return [...entries].sort((a, b) => {
    if (a.score !== b.score) return dir * (a.score - b.score);
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { slug } = await params;
  const loaded = loadProblem(slug);
  if (!loaded) notFound();

  const { problem } = loaded;
  const entries = await loadEntriesForProblem(slug);

  // Group entries by benchmark for per-benchmark tables.
  const byBenchmark = new Map<string, typeof entries>();
  for (const e of entries) {
    const arr = byBenchmark.get(e.benchmark_id) ?? [];
    arr.push(e);
    byBenchmark.set(e.benchmark_id, arr);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3 text-xs">
        <Link href="/problems" className="hover:text-foreground underline-offset-2 hover:underline">
          Problems
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={`/problems/${slug}`}
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          {problem.title}
        </Link>
        <span aria-hidden> / </span>
        <span>Leaderboard</span>
      </nav>

      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {problem.title} — leaderboard
      </h1>
      <p className="text-muted-foreground mt-3 max-w-prose text-sm">
        Per-benchmark verified scores. Every entry traces to its paper&apos;s public source (§10.2 —
        every quantity is sourced). Verified entries have been replicated or have explicit protocol
        notes; unverified entries are author-claimed and pending review.
      </p>

      {entries.length === 0 ? (
        <section
          aria-label="No entries"
          className="border-border mt-10 rounded border border-dashed p-6 text-center"
        >
          <p className="text-sm">
            <span className="font-semibold">No entries yet for this problem.</span>{" "}
            <span className="text-muted-foreground">
              Curators populate <code className="font-mono">entries.json</code> per problem as SOTA
              evolves; §15.6 forbids fabricated scores, so this page goes live empty. See{" "}
              <Link
                href="/contributing"
                className="hover:text-foreground underline underline-offset-2"
              >
                /contributing
              </Link>{" "}
              for the leaderboard-entry workflow.
            </span>
          </p>
        </section>
      ) : (
        <div className="mt-10 space-y-10">
          {problem.benchmarks.map((b) => {
            const rows = sortEntries(byBenchmark.get(b.id) ?? [], b.metric_direction);
            return (
              <section key={b.id} aria-label={`${b.name} leaderboard`}>
                <h2 className="font-serif text-xl font-semibold">
                  {b.name}{" "}
                  <span className="text-muted-foreground text-sm font-normal">
                    ({b.metric} {b.metric_direction === "higher-is-better" ? "↑" : "↓"})
                  </span>
                </h2>
                {rows.length === 0 ? (
                  <p className="text-muted-foreground mt-2 text-sm italic">
                    No entries on this benchmark yet.
                  </p>
                ) : (
                  <div className="border-border mt-4 overflow-x-auto rounded border">
                    <table className="w-full border-collapse text-sm">
                      <thead className="text-muted-foreground bg-muted text-xs">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Paper</th>
                          <th className="px-3 py-2 text-left font-medium">Score</th>
                          <th className="px-3 py-2 text-left font-medium">Verified</th>
                          <th className="px-3 py-2 text-left font-medium">Date</th>
                          <th className="px-3 py-2 text-left font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((e, i) => (
                          <tr
                            key={`${e.paper_id}-${e.date}-${i}`}
                            className="border-border border-t"
                          >
                            <td className="px-3 py-2">
                              <Link
                                href={`/papers/${e.paper_id}`}
                                className="hover:text-accent underline-offset-2 hover:underline"
                              >
                                {e.paper_id}
                              </Link>
                            </td>
                            <td className="px-3 py-2 font-mono">{e.score}</td>
                            <td className="px-3 py-2 text-xs">
                              {e.verified ? (
                                <span className="inline-flex items-center rounded-full bg-[var(--color-chart-2)]/15 px-2 py-0.5 font-mono tracking-wide text-[var(--color-chart-2)]">
                                  verified
                                </span>
                              ) : (
                                <span className="text-muted-foreground bg-muted/40 inline-flex items-center rounded-full px-2 py-0.5 font-mono tracking-wide">
                                  unverified
                                </span>
                              )}
                            </td>
                            <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                              <time dateTime={e.date}>{e.date}</time>
                            </td>
                            <td className="text-muted-foreground px-3 py-2 text-xs">
                              {e.protocol_notes ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <p className="text-muted-foreground mt-10 text-xs">
        <Link
          href={`/problems/${slug}`}
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          ← back to {problem.title}
        </Link>
      </p>
    </main>
  );
}
