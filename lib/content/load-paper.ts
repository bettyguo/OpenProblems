import { papers, authors, institutions, problems } from "#site/content";

type Paper = (typeof papers)[number];
type Author = (typeof authors)[number];
type Institution = (typeof institutions)[number];
type Problem = (typeof problems)[number];

export interface LoadedPaper {
  paper: Paper;
  authors: Author[];
  /** Author slugs cited by the paper that did NOT resolve to an Author YAML. */
  unresolvedAuthorSlugs: string[];
  institutions: Institution[];
  unresolvedInstitutionSlugs: string[];
  /** One entry per item in paper.contributions[], with the parent Problem resolved when present. */
  contributions: Array<{
    contribution: Paper["contributions"][number];
    problem: Problem | undefined;
  }>;
}

export function loadPaper(id: string): LoadedPaper | null {
  const paper = papers.find((p) => p.id === id);
  if (!paper) return null;

  const authorsBySlug = new Map(authors.map((a) => [a.slug, a]));
  const resolvedAuthors: Author[] = [];
  const unresolvedAuthorSlugs: string[] = [];
  for (const slug of paper.authors) {
    const a = authorsBySlug.get(slug);
    if (a) resolvedAuthors.push(a);
    else unresolvedAuthorSlugs.push(slug);
  }

  const institutionsBySlug = new Map(institutions.map((i) => [i.slug, i]));
  const resolvedInstitutions: Institution[] = [];
  const unresolvedInstitutionSlugs: string[] = [];
  for (const slug of paper.institutions) {
    const i = institutionsBySlug.get(slug);
    if (i) resolvedInstitutions.push(i);
    else unresolvedInstitutionSlugs.push(slug);
  }

  const problemsBySlug = new Map(problems.map((p) => [p.slug, p]));
  const contributions = paper.contributions.map((c) => ({
    contribution: c,
    problem: problemsBySlug.get(c.problem_slug),
  }));

  return {
    paper,
    authors: resolvedAuthors,
    unresolvedAuthorSlugs,
    institutions: resolvedInstitutions,
    unresolvedInstitutionSlugs,
    contributions,
  };
}

export function allPaperIds(): string[] {
  return papers.map((p) => p.id);
}
