import { problems, taxonomy } from "#site/content";

type Domain = (typeof taxonomy.domains)[number];
type Subdomain = Domain["subdomains"][number];
type Problem = (typeof problems)[number];

export function loadDomain(id: string): Domain | null {
  return taxonomy.domains.find((d) => d.id === id) ?? null;
}

export function loadSubdomain(domainId: string, subId: string): Subdomain | null {
  const domain = loadDomain(domainId);
  if (!domain) return null;
  return domain.subdomains.find((s) => s.id === subId) ?? null;
}

export function problemsInDomain(id: string): Problem[] {
  return problems
    .filter((p) => p.domain === id)
    .slice()
    .sort(byLastCuratedDesc);
}

export function problemsInSubdomain(domainId: string, subId: string): Problem[] {
  return problems
    .filter((p) => p.domain === domainId && p.subdomain === subId)
    .slice()
    .sort(byLastCuratedDesc);
}

export function allDomainIds(): string[] {
  return taxonomy.domains.map((d) => d.id);
}

export function allDomainSubdomainPairs(): { domain: string; subdomain: string }[] {
  const pairs: { domain: string; subdomain: string }[] = [];
  for (const d of taxonomy.domains) {
    for (const s of d.subdomains) {
      pairs.push({ domain: d.id, subdomain: s.id });
    }
  }
  return pairs;
}

function byLastCuratedDesc(a: Problem, b: Problem): number {
  const ad = a.editorial.last_curated;
  const bd = b.editorial.last_curated;
  return ad < bd ? 1 : ad > bd ? -1 : 0;
}
