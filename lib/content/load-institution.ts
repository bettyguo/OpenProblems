import { institutions, authors, papers, problems, taxonomy } from "#site/content";
import { getIndexedProblems } from "@/lib/content/load-problems-index";

type Institution = (typeof institutions)[number];
type Author = (typeof authors)[number];
type Paper = (typeof papers)[number];
type Problem = (typeof problems)[number];

export interface SubdomainCoverage {
  domain_id: string;
  subdomain_id: string;
  subdomain_title: string;
  paperCount: number;
}

export interface LoadedInstitution {
  institution: Institution;
  /** Authors whose `affiliations[].institution` matches this institution. */
  affiliatedAuthors: Author[];
  /** Papers whose `paper.institutions[]` includes this institution. */
  papers: Paper[];
  /** Ranked subdomain coverage from this institution's papers' contributions. Sorted by paperCount desc. */
  subdomainCoverage: SubdomainCoverage[];
  /** Deduped Problems touched by this institution's papers (Unit 2.12). */
  problemsTouched: Problem[];
  /** Sum of §8.3 advisory composite scores across `problemsTouched` (Unit 2.12). */
  cumulativeImpact?: number;
}

export function loadInstitution(slug: string): LoadedInstitution | null {
  const institution = institutions.find((i) => i.slug === slug);
  if (!institution) return null;

  const affiliatedAuthors = authors.filter((a) =>
    a.affiliations.some((aff) => aff.institution === slug),
  );

  const institutionPapers = papers.filter((p) => p.institutions.includes(slug));

  const problemsBySlug = new Map(problems.map((p) => [p.slug, p]));

  // Count papers per subdomain (de-duped per paper).
  const subdomainPaperSets = new Map<string, Set<string>>();
  for (const p of institutionPapers) {
    const subdomainsForPaper = new Set<string>();
    for (const c of p.contributions) {
      const problem = problemsBySlug.get(c.problem_slug);
      if (!problem) continue;
      subdomainsForPaper.add(`${problem.domain}::${problem.subdomain}`);
    }
    for (const key of subdomainsForPaper) {
      const set = subdomainPaperSets.get(key) ?? new Set<string>();
      set.add(p.id);
      subdomainPaperSets.set(key, set);
    }
  }

  const taxonomyTitle = new Map<string, string>();
  for (const d of taxonomy.domains) {
    for (const sd of d.subdomains) {
      taxonomyTitle.set(`${d.id}::${sd.id}`, sd.title);
    }
  }

  const subdomainCoverage: SubdomainCoverage[] = [];
  for (const [key, set] of subdomainPaperSets) {
    const sep = key.indexOf("::");
    const domain_id = key.slice(0, sep);
    const subdomain_id = key.slice(sep + 2);
    subdomainCoverage.push({
      domain_id,
      subdomain_id,
      subdomain_title: taxonomyTitle.get(key) ?? subdomain_id,
      paperCount: set.size,
    });
  }
  subdomainCoverage.sort((a, b) =>
    b.paperCount !== a.paperCount
      ? b.paperCount - a.paperCount
      : a.subdomain_title.localeCompare(b.subdomain_title),
  );

  // Problems touched by this institution's papers (deduped) + cumulative impact.
  const touchedSlugs = new Set<string>();
  for (const p of institutionPapers) {
    for (const c of p.contributions) touchedSlugs.add(c.problem_slug);
  }
  const problemsTouched: Problem[] = [];
  for (const ts of touchedSlugs) {
    const p = problemsBySlug.get(ts);
    if (p) problemsTouched.push(p);
  }

  const compositeBySlug = new Map<string, number>();
  for (const p of getIndexedProblems()) {
    if (typeof p.composite === "number") compositeBySlug.set(p.slug, p.composite);
  }
  let sum = 0;
  let counted = 0;
  for (const p of problemsTouched) {
    const c = compositeBySlug.get(p.slug);
    if (typeof c === "number") {
      sum += c;
      counted++;
    }
  }

  const loaded: LoadedInstitution = {
    institution,
    affiliatedAuthors,
    papers: institutionPapers,
    subdomainCoverage,
    problemsTouched,
  };
  if (counted > 0) loaded.cumulativeImpact = sum;
  return loaded;
}

export function allInstitutionSlugs(): string[] {
  return institutions.map((i) => i.slug);
}
