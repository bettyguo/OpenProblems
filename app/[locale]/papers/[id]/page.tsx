import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { allPaperIds, loadPaper } from "@/lib/content/load-paper";
import { Link } from "@/lib/i18n/navigation";
import { isLocale, locales } from "@/lib/i18n/routing";
import { SITE } from "@/lib/site-url";

interface PaperPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export function generateStaticParams() {
  return locales.flatMap((locale) => allPaperIds().map((id) => ({ locale, id })));
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loaded = loadPaper(id);
  if (!loaded) notFound();

  const {
    paper,
    authors,
    unresolvedAuthorSlugs,
    institutions,
    unresolvedInstitutionSlugs,
    contributions,
  } = loaded;

  const citationAuthors =
    authors.length > 0
      ? authors.map((a) => a.display_name).join(" and ")
      : "LLM OpenProblems contributors";

  return (
    <main className="mx-auto max-w-prose px-6 py-12">
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3 text-xs">
        <Link href="/papers" className="hover:text-foreground underline-offset-2 hover:underline">
          Papers
        </Link>
      </nav>

      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {paper.title}
      </h1>

      <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {paper.venue && <span>{paper.venue}</span>}
        {paper.venue && <span aria-hidden>·</span>}
        <span className="font-mono">{paper.year}</span>
        {paper.arxiv_id && (
          <>
            <span aria-hidden>·</span>
            <a
              href={`https://arxiv.org/abs/${paper.arxiv_id}`}
              className="hover:text-foreground underline-offset-2 hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              arXiv:{paper.arxiv_id}
            </a>
          </>
        )}
        {paper.doi && (
          <>
            <span aria-hidden>·</span>
            <a
              href={`https://doi.org/${paper.doi}`}
              className="hover:text-foreground underline-offset-2 hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              DOI
            </a>
          </>
        )}
        {paper.github && (
          <>
            <span aria-hidden>·</span>
            <a
              href={paper.github}
              className="hover:text-foreground underline-offset-2 hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          </>
        )}
      </p>

      <section aria-label="TL;DR" className="border-border mt-8 border-t pt-6">
        <h2 className="font-serif text-xl font-semibold">TL;DR</h2>
        <p className="mt-3 text-sm leading-relaxed">{paper.tldr}</p>
      </section>

      <section aria-label="Contributions" className="border-border mt-8 border-t pt-6">
        <h2 className="font-serif text-xl font-semibold">
          Contributions{" "}
          <span className="text-muted-foreground text-sm font-normal">
            ({contributions.length})
          </span>
        </h2>
        {contributions.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm italic">
            No contributions listed on this paper yet.
          </p>
        ) : (
          <div className="border-border mt-4 overflow-x-auto rounded border">
            <table className="w-full border-collapse text-sm">
              <thead className="text-muted-foreground bg-muted text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Problem</th>
                  <th className="px-3 py-2 text-left font-medium">Benchmark</th>
                  <th className="px-3 py-2 text-left font-medium">Metric</th>
                  <th className="px-3 py-2 text-left font-medium">Score</th>
                  <th className="px-3 py-2 text-left font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c, i) => (
                  <tr
                    key={`${c.contribution.problem_slug}-${i}`}
                    className="border-border border-t"
                  >
                    <td className="px-3 py-2">
                      {c.problem ? (
                        <Link
                          href={`/problems/${c.problem.slug}`}
                          className="hover:text-accent underline-offset-2 hover:underline"
                        >
                          {c.problem.title}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs">
                          {c.contribution.problem_slug}{" "}
                          <span className="text-muted-foreground">(unresolved)</span>
                        </span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                      {c.contribution.benchmark_id ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                      {c.contribution.metric ?? "—"}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                      {typeof c.contribution.score === "number" ? c.contribution.score : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={c.contribution.evidence}
                        className="hover:text-accent text-xs underline-offset-2 hover:underline"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        link
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        aria-label="Authors and institutions"
        className="border-border mt-8 grid gap-8 border-t pt-6 sm:grid-cols-2"
      >
        <div>
          <h2 className="font-serif text-xl font-semibold">
            Authors{" "}
            <span className="text-muted-foreground text-sm font-normal">
              ({authors.length + unresolvedAuthorSlugs.length})
            </span>
          </h2>
          {authors.length === 0 && unresolvedAuthorSlugs.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm italic">
              Author list pending. Phase-2 papers land with empty authors[]; author slugs land in a
              later Phase-2 unit alongside the cross-link audit.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {authors.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/authors/${a.slug}`}
                    className="hover:text-foreground underline-offset-2 hover:underline"
                  >
                    {a.display_name}
                  </Link>
                </li>
              ))}
              {unresolvedAuthorSlugs.map((slug) => (
                <li key={slug} className="font-mono text-xs">
                  @{slug} <span className="text-muted-foreground">(unresolved)</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-serif text-xl font-semibold">
            Institutions{" "}
            <span className="text-muted-foreground text-sm font-normal">
              ({institutions.length + unresolvedInstitutionSlugs.length})
            </span>
          </h2>
          {institutions.length === 0 && unresolvedInstitutionSlugs.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm italic">
              Institution list pending; lands alongside the author backfill.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {institutions.map((i) => (
                <li key={i.slug}>
                  <Link
                    href={`/institutions/${i.slug}`}
                    className="hover:text-foreground underline-offset-2 hover:underline"
                  >
                    {i.display_name}
                  </Link>
                </li>
              ))}
              {unresolvedInstitutionSlugs.map((slug) => (
                <li key={slug} className="font-mono text-xs">
                  {slug} <span className="text-muted-foreground">(unresolved)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-label="Cite this paper" className="border-border mt-8 border-t pt-6">
        <h2 className="font-serif text-xl font-semibold">Cite this page</h2>
        <pre className="bg-muted text-foreground mt-4 overflow-x-auto rounded p-4 font-mono text-xs leading-relaxed">
          {`@misc{op-paper-${paper.id},
  title  = {${paper.title}},
  author = {${citationAuthors}},
  year   = {${paper.year}},${paper.venue ? `\n  note   = {${paper.venue}},` : ""}${paper.arxiv_id ? `\n  eprint = {${paper.arxiv_id}},\n  archivePrefix = {arXiv},` : ""}${paper.doi ? `\n  doi    = {${paper.doi}},` : ""}
  url    = {${SITE}/${locale}/papers/${paper.id}},
}`}
        </pre>
      </section>
    </main>
  );
}
