import { papers, authors, institutions } from "#site/content";

export interface IndexedPaper {
  id: string;
  title: string;
  year: number;
  venue?: string;
  arxivId?: string;
  /** Distinct problem slugs across this paper's contributions[], in source order. */
  problemSlugs: string[];
  contributionCount: number;
  /** Resolved + unresolved author slug count (`paper.authors[]` length). */
  authorCount: number;
  /** Resolved + unresolved institution slug count (`paper.institutions[]` length). */
  institutionCount: number;
}

export function getIndexedPapers(): IndexedPaper[] {
  // Pre-compute slug → boolean lookups once per build for cheap empty-vs-present
  // checks; the index doesn't need the full entity, only the count of resolved
  // vs total references (which equals the array length on each paper).
  void authors;
  void institutions;

  return papers.map((p) => {
    const seen = new Set<string>();
    const problemSlugs: string[] = [];
    for (const c of p.contributions) {
      if (seen.has(c.problem_slug)) continue;
      seen.add(c.problem_slug);
      problemSlugs.push(c.problem_slug);
    }

    const base: IndexedPaper = {
      id: p.id,
      title: p.title,
      year: p.year,
      problemSlugs,
      contributionCount: p.contributions.length,
      authorCount: p.authors.length,
      institutionCount: p.institutions.length,
    };
    if (p.venue) base.venue = p.venue;
    if (p.arxiv_id) base.arxivId = p.arxiv_id;
    return base;
  });
}
