import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { allInstitutionSlugs, loadInstitution } from "@/lib/content/load-institution";
import { Link } from "@/lib/i18n/navigation";
import { isLocale, locales } from "@/lib/i18n/routing";

interface InstitutionPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return locales.flatMap((locale) => allInstitutionSlugs().map((slug) => ({ locale, slug })));
}

const TYPE_LABEL: Record<string, string> = {
  academic: "Academic",
  industry: "Industry",
  government: "Government",
  nonprofit: "Non-profit",
  other: "Other",
};

export default async function InstitutionPage({ params }: InstitutionPageProps) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loaded = loadInstitution(slug);
  if (!loaded) notFound();

  const {
    institution,
    affiliatedAuthors,
    papers,
    subdomainCoverage,
    problemsTouched,
    cumulativeImpact,
  } = loaded;

  return (
    <main className="mx-auto max-w-prose px-6 py-12">
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3 text-xs">
        <Link
          href="/institutions"
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          Institutions
        </Link>
      </nav>

      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {institution.display_name}
      </h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {institution.type && <span>{TYPE_LABEL[institution.type] ?? institution.type}</span>}
        {institution.type && institution.country && <span> · </span>}
        {institution.country && <span>{institution.country}</span>}
        {institution.homepage && (
          <>
            {(institution.type ?? institution.country) && <span> · </span>}
            <a
              href={institution.homepage}
              className="hover:text-foreground underline-offset-2 hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Homepage
            </a>
          </>
        )}
      </p>

      <section aria-label="Affiliated authors" className="border-border mt-8 border-t pt-6">
        <h2 className="font-serif text-xl font-semibold">
          Affiliated authors{" "}
          <span className="text-muted-foreground text-sm font-normal">
            ({affiliatedAuthors.length})
          </span>
        </h2>
        {affiliatedAuthors.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            No authors are listing this institution in their affiliations[] yet. (Phase-2 authors
            land with empty affiliations; Units 2.4–2.6 backfill as papers anchor dates.)
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {affiliatedAuthors.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/authors/${a.slug}`}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  {a.display_name}
                </Link>
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

      <section aria-label="Subdomain coverage" className="border-border mt-8 border-t pt-6">
        <h2 className="font-serif text-xl font-semibold">
          Subdomain coverage{" "}
          <span className="text-muted-foreground text-sm font-normal">
            ({subdomainCoverage.length})
          </span>
        </h2>
        {subdomainCoverage.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Derived from this institution&apos;s papers&apos; contributions[]. Empty until papers
            land.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {subdomainCoverage.map((c) => (
              <li key={`${c.domain_id}-${c.subdomain_id}`}>
                <Link
                  href={`/domains/${c.domain_id}/${c.subdomain_id}`}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  {c.subdomain_title}
                </Link>
                <span className="text-muted-foreground">
                  {" · "}
                  {c.paperCount} {c.paperCount === 1 ? "paper" : "papers"}
                </span>
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
              {problemsTouched.length === 1 ? "" : "s"} touched by this institution&apos;s papers.
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground mt-3 text-sm italic">
            No cumulative impact yet — this institution&apos;s papers&apos; problems don&apos;t have
            rating actions with composites.
          </p>
        )}
        <p className="text-muted-foreground mt-2 text-xs">
          §8.3 cardinal rule: composite is advisory and never shown alone. The subdomain-coverage
          section above is the always-paired view.
        </p>
      </section>
    </main>
  );
}
