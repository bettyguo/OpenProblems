import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/ui/status-pill";
import {
  allDomainSubdomainPairs,
  loadDomain,
  loadSubdomain,
  problemsInSubdomain,
} from "@/lib/content/load-domain";

interface PageProps {
  params: Promise<{ domain: string; subdomain: string }>;
}

export function generateStaticParams() {
  return allDomainSubdomainPairs();
}

export default async function SubdomainPage({ params }: PageProps) {
  const { domain: domainId, subdomain: subdomainId } = await params;
  const domain = loadDomain(domainId);
  const subdomain = loadSubdomain(domainId, subdomainId);
  if (!domain || !subdomain) notFound();

  const items = problemsInSubdomain(domainId, subdomainId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3 text-xs">
        <Link href="/domains" className="hover:text-foreground hover:underline">
          Domains
        </Link>
        <span aria-hidden> › </span>
        <Link href={`/domains/${domain.id}`} className="hover:text-foreground hover:underline">
          {domain.title}
        </Link>
      </nav>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">{subdomain.title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {items.length} problem{items.length === 1 ? "" : "s"} · within {domain.title}
      </p>

      {items.length === 0 ? (
        <p className="text-muted-foreground mt-10 text-sm">
          No problems authored in this subdomain yet. The seed list (§16 of the master prompt)
          covers ten problems; the remaining nine are scheduled for Unit 1.11.
        </p>
      ) : (
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-border text-muted-foreground border-b text-left text-xs tracking-wider uppercase">
              <th className="py-2 font-medium">Problem</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Posed</th>
              <th className="py-2 font-medium">Last curated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.slug} className="border-border/50 border-b last:border-0">
                <td className="py-3 align-top">
                  <Link
                    href={`/problems/${p.slug}`}
                    className="text-foreground hover:text-accent font-medium underline-offset-2 hover:underline"
                  >
                    {p.title}
                  </Link>
                  {p.subtitle ? (
                    <div className="text-muted-foreground mt-0.5 text-xs">{p.subtitle}</div>
                  ) : null}
                </td>
                <td className="py-3 align-top">
                  <StatusPill status={p.status} />
                </td>
                <td className="py-3 align-top font-mono text-xs">{p.posed_year}</td>
                <td className="text-muted-foreground py-3 align-top font-mono text-xs">
                  {p.editorial.last_curated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
