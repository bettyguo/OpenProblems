import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { RatingRadar } from "@/components/viz/RatingRadar";
import { StatusPill } from "@/components/ui/status-pill";
import { MDXContent } from "@/lib/mdx/mdx-content";
import { allProblemSlugs, loadProblem } from "@/lib/content/load-problem";
import { tryGetDiscussionByPath } from "@/lib/discussions/github-graphql";
import { Link } from "@/lib/i18n/navigation";
import { isLocale, locales } from "@/lib/i18n/routing";
import { dimensionsToRadar } from "@/lib/ratings/normalize";
import { SITE } from "@/lib/site-url";

interface ProblemPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return locales.flatMap((locale) => allProblemSlugs().map((slug) => ({ locale, slug })));
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loaded = loadProblem(slug);
  if (!loaded) notFound();

  const { problem, pages, ratings, latestRating, taxonomy } = loaded;
  const discussion = await tryGetDiscussionByPath(`/${locale}/problems/${slug}/talk`);
  const discussionCount =
    discussion && discussion.commentCount > 0 ? discussion.commentCount : undefined;

  return (
    <main className="mx-auto max-w-prose px-6 py-12">
      {/* 1. Header card */}
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3 text-xs">
        {taxonomy.domain && (
          <>
            <Link
              href={`/domains/${taxonomy.domain.id}`}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              {taxonomy.domain.title}
            </Link>
            {taxonomy.subdomain && (
              <>
                <span className="mx-1.5" aria-hidden>
                  /
                </span>
                <Link
                  href={`/domains/${taxonomy.domain.id}/${taxonomy.subdomain.id}`}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  {taxonomy.subdomain.title}
                </Link>
              </>
            )}
          </>
        )}
      </nav>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {problem.title}
        </h1>
        <StatusPill status={problem.status} className="mt-2 shrink-0" />
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        Last curated{" "}
        <time dateTime={problem.editorial.last_curated}>{problem.editorial.last_curated}</time>
        {" · "}
        <span className="font-mono">@{problem.editorial.primary_curator}</span>
      </p>
      <p className="mt-3 text-xs">
        <Link
          href={`/problems/${slug}/talk`}
          className="text-accent underline-offset-2 hover:underline"
        >
          Discuss this problem
          {discussionCount !== undefined && (
            <span className="font-mono"> ({discussionCount})</span>
          )}{" "}
          →
        </Link>
      </p>

      {/* 2. RatingRadar + 3. TL;DR */}
      <section
        aria-label="Rating snapshot"
        className="border-border mt-8 grid gap-6 border-t pt-8 sm:grid-cols-[auto_1fr] sm:items-center"
      >
        {latestRating ? (
          <RatingRadar
            dimensions={latestRating.dimensions}
            size={200}
            ariaLabel={`Current rating radar for ${problem.title}`}
          />
        ) : (
          <div className="border-muted-foreground/30 size-[200px] rounded border border-dashed" />
        )}
        <div>
          {problem.subtitle && (
            <p className="font-serif text-lg leading-snug">{problem.subtitle}</p>
          )}
          {latestRating && (
            <details className="text-muted-foreground mt-4 text-xs">
              <summary className="hover:text-foreground cursor-pointer underline-offset-2 hover:underline">
                View as table
              </summary>
              <table className="mt-3 w-full border-collapse text-sm">
                <thead className="text-muted-foreground text-xs">
                  <tr>
                    <th className="border-border border-b py-1 pr-3 text-left font-medium">
                      Dimension
                    </th>
                    <th className="border-border border-b py-1 pr-3 text-left font-medium">
                      Value
                    </th>
                    <th className="border-border border-b py-1 text-left font-medium">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {dimensionsToRadar(latestRating.dimensions).map((p) => (
                    <tr key={p.dimension} className="border-border border-b last:border-0">
                      <td className="py-1 pr-3 capitalize">{p.dimension.replace("_", " ")}</td>
                      <td className="py-1 pr-3 font-mono">{p.rawDisplay}</td>
                      <td className="py-1 font-mono">{(p.confidence * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </div>
      </section>

      {/* 4. Background */}
      <section aria-label="Background" className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">Background</h2>
        <article className="prose prose-neutral dark:prose-invert mt-4 max-w-none">
          {pages.background ? (
            <MDXContent code={pages.background.body} />
          ) : (
            <p className="text-muted-foreground text-sm italic">
              TODO(curate): background.mdx pending.
            </p>
          )}
        </article>
      </section>

      {/* 5. Formal definition */}
      <section aria-label="Formal definition" className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">Formal definition</h2>
        <article className="prose prose-neutral dark:prose-invert mt-4 max-w-none">
          {pages.definition ? (
            <MDXContent code={pages.definition.body} />
          ) : (
            <p className="text-muted-foreground text-sm italic">
              TODO(curate): definition.mdx pending.
            </p>
          )}
        </article>
      </section>

      {/* 6. Benchmarks & current SOTA */}
      <section aria-label="Benchmarks" className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          Benchmarks &amp; current SOTA
        </h2>
        {problem.benchmarks.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm italic">
            TODO(curate): no benchmarks listed yet.
          </p>
        ) : (
          <div className="border-border mt-4 overflow-x-auto rounded border">
            <table className="w-full border-collapse text-sm">
              <thead className="text-muted-foreground bg-muted text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Benchmark</th>
                  <th className="px-3 py-2 text-left font-medium">Dataset</th>
                  <th className="px-3 py-2 text-left font-medium">Metric</th>
                  <th className="px-3 py-2 text-left font-medium">Ceiling</th>
                  <th className="px-3 py-2 text-left font-medium">Protocol</th>
                </tr>
              </thead>
              <tbody>
                {problem.benchmarks.map((b) => (
                  <tr key={b.id} className="border-border border-t">
                    <td className="px-3 py-2 font-medium">{b.name}</td>
                    <td className="text-muted-foreground px-3 py-2">{b.dataset}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {b.metric} {b.metric_direction === "higher-is-better" ? "↑" : "↓"}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                      {b.upper_bound ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {b.protocol_url ? (
                        <a
                          href={b.protocol_url}
                          className="hover:text-accent text-xs underline-offset-2 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          view
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Link
          href={`/problems/${slug}/leaderboard`}
          className="text-accent mt-3 inline-block text-xs underline-offset-2 hover:underline"
        >
          View full leaderboard →
        </Link>
      </section>

      {/* 7. History */}
      <section aria-label="History" className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">History</h2>
        <article className="prose prose-neutral dark:prose-invert mt-4 max-w-none">
          {pages.history ? (
            <MDXContent code={pages.history.body} />
          ) : (
            <p className="text-muted-foreground text-sm italic">
              TODO(curate): history.mdx pending.
            </p>
          )}
        </article>
      </section>

      {/* 8. Recent rating actions */}
      <section aria-label="Recent rating actions" className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">Recent rating actions</h2>
        {ratings.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm italic">No rating actions yet.</p>
        ) : (
          <ul className="border-border mt-4 divide-y divide-current/10 border-t border-b">
            {ratings.slice(0, 3).map((r, i) => (
              <li key={`${r.date}-${i}`} className="flex items-center gap-3 py-2 text-sm">
                <time dateTime={String(r.date)} className="text-muted-foreground font-mono text-xs">
                  {String(r.date).slice(0, 10)}
                </time>
                <span className="text-foreground">
                  {r.prior_action ? "Revised" : "Initial"} · methodology v{r.methodology_version}
                </span>
                <span className="text-muted-foreground ml-auto font-mono text-xs">
                  @{r.curator}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/problems/${slug}/ratings`}
          className="text-accent mt-3 inline-block text-xs underline-offset-2 hover:underline"
        >
          View full history →
        </Link>
      </section>

      {/* 9. Related problems */}
      {problem.related_problems && problem.related_problems.length > 0 && (
        <section aria-label="Related problems" className="mt-12">
          <h2 className="font-serif text-xl font-semibold tracking-tight">Related problems</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {problem.related_problems.map((rel) => (
              <li key={rel}>
                <Link
                  href={`/problems/${rel}`}
                  className="border-border hover:border-accent hover:text-accent inline-block rounded-full border px-3 py-1 font-mono text-xs underline-offset-2"
                >
                  {rel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 10. Citation */}
      <section aria-label="Cite this page" className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">Cite this page</h2>
        <pre className="bg-muted text-foreground mt-4 overflow-x-auto rounded p-4 font-mono text-xs leading-relaxed">
          {`@misc{op-${slug}-${problem.editorial.last_curated},
  title  = {${problem.title}},
  author = {LLM OpenProblems contributors},
  year   = {${problem.editorial.last_curated.slice(0, 4)}},
  url    = {${SITE}/${locale}/problems/${slug}},
  note   = {Last curated ${problem.editorial.last_curated}; methodology v${
    latestRating?.methodology_version ?? "1.0.0"
  }},
}`}
        </pre>
      </section>
    </main>
  );
}
