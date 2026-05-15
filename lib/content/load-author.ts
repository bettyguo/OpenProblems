import { authors, institutions, papers, problems } from "#site/content";
import { getIndexedProblems } from "@/lib/content/load-problems-index";

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
  /**
   * Sum of §8.3 advisory composite scores across `problemsTouched` (Unit 2.12).
   * Undefined when no touched problem has a composite — i.e., no rating action yet
   * on any problem this author has contributed to. Per §8.3 the composite is never
   * shown alone — the page renders the underlying problems list alongside it.
   */
  cumulativeImpact?: number;
}

function buildProblemCompositeMap(): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of getIndexedProblems()) {
    if (typeof p.composite === "number") map.set(p.slug, p.composite);
  }
  return map;
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

  const compositeBySlug = buildProblemCompositeMap();
  let sum = 0;
  let counted = 0;
  for (const p of problemsTouched) {
    const c = compositeBySlug.get(p.slug);
    if (typeof c === "number") {
      sum += c;
      counted++;
    }
  }
  const loaded: LoadedAuthor = {
    author,
    affiliations,
    papers: authorPapers,
    problemsTouched,
  };
  if (counted > 0) loaded.cumulativeImpact = sum;
  return loaded;
}

export function allAuthorSlugs(): string[] {
  return authors.map((a) => a.slug);
}
