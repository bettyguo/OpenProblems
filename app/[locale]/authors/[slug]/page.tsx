import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { allAuthorSlugs, loadAuthor } from "@/lib/content/load-author";
import { Link } from "@/lib/i18n/navigation";
import { isLocale, locales } from "@/lib/i18n/routing";

interface AuthorPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return locales.flatMap((locale) => allAuthorSlugs().map((slug) => ({ locale, slug })));
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loaded = loadAuthor(slug);
  if (!loaded) notFound();

  const { author, affiliations, papers, problemsTouched, cumulativeImpact } = loaded;

  return (
    <main className="mx-auto max-w-prose px-6 py-12">
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3 text-xs">
        <Link href="/authors" className="hover:text-foreground underline-offset-2 hover:underline">
          Authors
        </Link>
      </nav>

      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {author.display_name}
      </h1>
      <p className="text-muted-foreground mt-1 font-mono text-xs">@{author.slug}</p>

      {(author.homepage ?? author.orcid ?? author.scholar_id) && (
        <ul className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {author.homepage && (
            <li>
              <a
                href={author.homepage}
                className="hover:text-foreground underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Homepage
              </a>
            </li>
          )}
          {author.orcid && (
            <li>
              <a
                href={`https://orcid.org/${author.orcid}`}
                className="hover:text-foreground underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                ORCID
              </a>
            </li>
          )}
          {author.scholar_id && (
            <li>
              <a
                href={`https://scholar.google.com/citations?user=${author.scholar_id}`}
                className="hover:text-foreground underline-offset-2 hover:underline"
                rel="noopener noreferrer"
                target="_blank"
              >
                Google Scholar
              </a>
            </li>
          )}
        </ul>
      )}

      <section aria-label="Affiliations" className="border-border mt-8 border-t pt-6">
        <h2 className="font-serif text-xl font-semibold">Affiliations</h2>
        {affiliations.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            No affiliations recorded yet. (Phase-2 authors land with empty affiliations; verified
            history will be backfilled as the seed-paper batches commit.)
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {affiliations.map((aff, i) => (
              <li key={`${aff.raw.institution}-${aff.raw.from}-${i}`}>
                {aff.institution ? (
                  <Link
                    href={`/institutions/${aff.institution.slug}`}
                    className="hover:text-foreground underline-offset-2 hover:underline"
                  >
                    {aff.institution.display_name}
                  </Link>
                ) : (
                  <span className="font-mono">{aff.raw.institution}</span>
                )}
                <span className="text-muted-foreground">
                  {" · "}
                  <time dateTime={aff.raw.from}>{aff.raw.from}</time>
                  {aff.raw.to ? (
                    <>
                      {" → "}
                      <time dateTime={aff.raw.to}>{aff.raw.to}</time>
                    </>
                  ) : (
                    " → present"
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Papers" className="border-border mt-8 border-t pt-6">
        <h2 className="font-serif text-xl font-semibold">
          Papers{" "}
          <span className="text-muted-foreground text-sm font-normal">({papers.length})</span>
        </h2>
        {papers.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            No papers yet. Papers will appear here as Units 2.4–2.6 commit the seed-paper batches.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {papers.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/papers/${p.id}`}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  {p.title}
                </Link>
                <span className="text-muted-foreground"> · {p.year}</span>
                {p.venue && <span className="text-muted-foreground"> · {p.venue}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Problems touched" className="border-border mt-8 border-t pt-6">
        <h2 className="font-serif text-xl font-semibold">
          Problems touched{" "}
          <span className="text-muted-foreground text-sm font-normal">
            ({problemsTouched.length})
          </span>
        </h2>
        {problemsTouched.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            None yet — derived from this author&apos;s papers&apos; contributions[].
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {problemsTouched.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/problems/${p.slug}`}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Cumulative impact" className="border-border mt-8 border-t pt-6">
        <h2 className="font-serif text-xl font-semibold">Cumulative impact</h2>
        {typeof cumulativeImpact === "number" ? (
          <p className="mt-3 text-sm">
            <span className="font-mono text-base">{cumulativeImpact.toFixed(2)}</span>
            <span className="text-muted-foreground">
              {" "}
              — sum of §8.3 advisory composite across {problemsTouched.length} problem
              {problemsTouched.length === 1 ? "" : "s"} touched.
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground mt-3 text-sm italic">
            No cumulative impact yet — none of this author&apos;s problemsTouched has a rating
            action with a composite.
          </p>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          §8.3 cardinal rule: composite is advisory and never shown alone. The problemsTouched list
          above is the always-paired view.
        </p>
      </section>
    </main>
  );
}
