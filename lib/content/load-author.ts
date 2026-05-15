import { authors, institutions, papers, problems } from "#site/content";

type Author = (typeof authors)[number];
type Institution = (typeof institutions)[number];
type Paper = (typeof papers)[number];
type Problem = (typeof problems)[number];

export interface LoadedAuthor {
  author: Author;
  /** Author's affiliations, with each `institution` slug resolved to an Institution when present. */
  affiliations: Array<{
    raw: Author["affiliations"][number];
    institution: Institution | undefined;
  }>;
  /** Every Paper where this author appears in `paper.authors[]`. */
  papers: Paper[];
  /** Set of Problem slugs touched by this author's papers, with the Problem resolved. Deduped. */
  problemsTouched: Problem[];
}

export function loadAuthor(slug: string): LoadedAuthor | null {
  const author = authors.find((a) => a.slug === slug);
  if (!author) return null;

  const institutionsBySlug = new Map(institutions.map((i) => [i.slug, i]));
  const affiliations = author.affiliations.map((raw) => ({
    raw,
    institution: institutionsBySlug.get(raw.institution),
  }));

  const authorPapers = papers.filter((p) => p.authors.includes(slug));

  const problemsBySlug = new Map(problems.map((p) => [p.slug, p]));
  const touchedSlugs = new Set<string>();
  for (const p of authorPapers) {
    for (const c of p.contributions) {
      touchedSlugs.add(c.problem_slug);
    }
  }
  const problemsTouched: Problem[] = [];
  for (const ts of touchedSlugs) {
    const p = problemsBySlug.get(ts);
    if (p) problemsTouched.push(p);
  }

  return {
    author,
    affiliations,
    papers: authorPapers,
    problemsTouched,
  };
}

export function allAuthorSlugs(): string[] {
  return authors.map((a) => a.slug);
}
