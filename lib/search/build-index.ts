import { problems, taxonomy } from "#site/content";

export type SearchKind = "problem";

export interface SearchRecord {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  tags: string[];
  domainTitle?: string;
  subdomainTitle?: string;
  href: string;
}

export function getSearchIndex(): SearchRecord[] {
  const out: SearchRecord[] = [];
  for (const p of problems) {
    const domain = taxonomy.domains.find((d) => d.id === p.domain);
    const subdomain = domain?.subdomains.find((s) => s.id === p.subdomain);
    const rec: SearchRecord = {
      id: `problem:${p.slug}`,
      kind: "problem",
      title: p.title,
      tags: p.tags,
      href: `/problems/${p.slug}`,
    };
    if (p.subtitle) rec.subtitle = p.subtitle;
    if (domain) rec.domainTitle = domain.title;
    if (subdomain) rec.subdomainTitle = subdomain.title;
    out.push(rec);
  }
  return out;
}
