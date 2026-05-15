import { problems, ratings, taxonomy } from "#site/content";
import {
  composite,
  dimensionsToRadar,
  meanConfidence,
  type RadarPoint,
} from "@/lib/ratings/normalize";

export interface IndexedProblem {
  slug: string;
  title: string;
  status: "open" | "partially-solved" | "converging" | "solved" | "retired";
  domainId: string;
  domainTitle: string;
  subdomainId: string;
  subdomainTitle: string;
  tags: string[];
  lastCurated: string;
  /** Normalized 0–5 points (5 entries) when a rating exists; else undefined. */
  points?: RadarPoint[];
  /** Mean confidence across dimensions; undefined when no rating. */
  confidence?: number;
  /** §8.3 advisory composite; undefined when no rating. */
  composite?: number;
  /** ISO date (YYYY-MM-DD) of the latest rating action; undefined when no rating. */
  latestRatingDate?: string;
}

export function getIndexedProblems(): IndexedProblem[] {
  return problems.map((p) => {
    const ownRatings = ratings
      .filter((r) => r.problem_slug === p.slug)
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const latest = ownRatings[0];
    const domain = taxonomy.domains.find((d) => d.id === p.domain);
    const subdomain = domain?.subdomains.find((s) => s.id === p.subdomain);
    const base: IndexedProblem = {
      slug: p.slug,
      title: p.title,
      status: p.status,
      domainId: p.domain,
      domainTitle: domain?.title ?? p.domain,
      subdomainId: p.subdomain,
      subdomainTitle: subdomain?.title ?? p.subdomain,
      tags: p.tags,
      lastCurated: p.editorial.last_curated,
    };
    if (latest) {
      const points = dimensionsToRadar(latest.dimensions);
      base.points = points;
      base.confidence = meanConfidence(points);
      base.composite = composite(points);
      base.latestRatingDate = latest.date;
    }
    return base;
  });
}
