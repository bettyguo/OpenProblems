import { problems, problemPages, ratings, taxonomy } from "#site/content";

type Problem = (typeof problems)[number];
type ProblemPage = (typeof problemPages)[number];
type Rating = (typeof ratings)[number];

export interface LoadedProblem {
  problem: Problem;
  pages: {
    background?: ProblemPage;
    definition?: ProblemPage;
    history?: ProblemPage;
  };
  ratings: Rating[];
  /** Latest by `date`, or `undefined` if none. */
  latestRating: Rating | undefined;
  /** Resolved taxonomy crumbs; `undefined` if FK is broken (Unit 0.7 should already flag this in CI). */
  taxonomy: {
    domain: { id: string; title: string } | undefined;
    subdomain: { id: string; title: string } | undefined;
  };
}

export function loadProblem(slug: string): LoadedProblem | null {
  const problem = problems.find((p) => p.slug === slug);
  if (!problem) return null;

  const ownPages = problemPages.filter((page) => page.problem_slug === slug);
  const pages: LoadedProblem["pages"] = {};
  for (const page of ownPages) {
    if (page.kind === "background") pages.background = page;
    else if (page.kind === "definition") pages.definition = page;
    else if (page.kind === "history") pages.history = page;
  }

  const ownRatings = ratings
    .filter((r) => r.problem_slug === slug)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const domain = taxonomy.domains.find((d) => d.id === problem.domain);
  const subdomain = domain?.subdomains.find((s) => s.id === problem.subdomain);

  return {
    problem,
    pages,
    ratings: ownRatings,
    latestRating: ownRatings[0],
    taxonomy: {
      domain: domain ? { id: domain.id, title: domain.title } : undefined,
      subdomain: subdomain ? { id: subdomain.id, title: subdomain.title } : undefined,
    },
  };
}

export function allProblemSlugs(): string[] {
  return problems.map((p) => p.slug);
}
