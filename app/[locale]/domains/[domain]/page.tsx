import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/ui/status-pill";
import { allDomainIds, loadDomain, problemsInDomain } from "@/lib/content/load-domain";
import { Link } from "@/lib/i18n/navigation";
import { isLocale, locales } from "@/lib/i18n/routing";

interface DomainPageProps {
  params: Promise<{ locale: string; domain: string }>;
}

export function generateStaticParams() {
  return locales.flatMap((locale) => allDomainIds().map((domain) => ({ locale, domain })));
}

export default async function DomainPage({ params }: DomainPageProps) {
  const { locale, domain: domainId } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const domain = loadDomain(domainId);
  if (!domain) notFound();

  const allProblems = problemsInDomain(domainId);
  const featured = allProblems.slice(0, 3);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3 text-xs">
        <Link href="/domains" className="hover:text-foreground underline-offset-2 hover:underline">
          Domains
        </Link>
      </nav>
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {domain.title}
      </h1>
      <p className="text-muted-foreground mt-2 font-mono text-xs">
        {domain.subdomains.length} subdomain
        {domain.subdomains.length === 1 ? "" : "s"} · {allProblems.length} problem
        {allProblems.length === 1 ? "" : "s"}
      </p>

      {featured.length > 0 && (
        <section aria-label="Featured problems" className="mt-12">
          <h2 className="font-serif text-xl font-semibold tracking-tight">Featured problems</h2>
          <ul className="border-border mt-4 divide-y divide-current/10 border-t border-b">
            {featured.map((p) => (
              <li key={p.slug} className="flex items-center gap-3 py-3">
                <Link
                  href={`/problems/${p.slug}`}
                  className="text-foreground hover:text-accent text-sm underline-offset-2 hover:underline"
                >
                  {p.title}
                </Link>
                <StatusPill status={p.status} className="ml-auto" />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Subdomains" className="mt-12">
        <h2 className="font-serif text-xl font-semibold tracking-tight">Subdomains</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {domain.subdomains.map((s) => {
            const subProblemCount = allProblems.filter((p) => p.subdomain === s.id).length;
            return (
              <li key={s.id}>
                <Link
                  href={`/domains/${domain.id}/${s.id}`}
                  className="border-border hover:border-accent group block rounded border px-3 py-2 transition-colors"
                >
                  <div className="text-foreground group-hover:text-accent text-sm font-medium">
                    {s.title}
                  </div>
                  <div className="text-muted-foreground mt-0.5 font-mono text-xs">
                    {subProblemCount} problem{subProblemCount === 1 ? "" : "s"}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
