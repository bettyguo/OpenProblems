import type { MetadataRoute } from "next";
import {
  authors,
  contributing,
  institutions,
  methodology,
  papers,
  problems,
  taxonomy,
} from "#site/content";
import { SITE } from "@/lib/site-url";

/** Re-export for backward-compat with downstream importers (Unit 8.5). */
export { SITE };

const STATIC_ROUTES = [
  "/",
  "/about",
  "/contributing",
  "/digest",
  "/domains",
  "/methodology",
  "/papers",
  "/problems",
  "/ratings",
  "/trending",
] as const;

const PROBLEM_SUBROUTES = ["", "/history", "/leaderboard", "/ratings", "/talk"] as const;

/**
 * Builds a sitemap entry with locale alternates for every project route.
 *
 * Post-Unit 8.1 every page route has a `/[locale]/` shadow, so the
 * sitemap-test invariant "no alternates without a shadow" is vacuously
 * satisfied — every URL carries `alternates.languages` pointing at its
 * `/en/<path>` + `/fr/<path>` variants per ADR-0011 D-E (English-canonical
 * slugs; locale-prefixed URLs are alternates of the bare canonical).
 *
 * For the home route the canonical is `${SITE}` and the alternates are
 * `${SITE}/en` and `${SITE}/fr` (Next.js `app/[locale]/page.tsx`).
 */
function entryWithAlternates(route: string): MetadataRoute.Sitemap[number] {
  const suffix = route === "/" ? "" : route;
  return {
    url: `${SITE}${route}`,
    alternates: {
      languages: {
        en: `${SITE}/en${suffix}`,
        fr: `${SITE}/fr${suffix}`,
      },
    },
  };
}

/**
 * Builds the project sitemap by enumerating static + dynamic routes from
 * the Velite content collections. Returns entries sorted by URL for
 * deterministic builds.
 *
 * Q48 sitemap-half closure (Unit 7.8): every `/problems/[slug]/talk` URL
 * is enrolled. Unit 8.5 extends locale alternates to every route — bulk
 * migration in Unit 8.1 guarantees every route has a `[locale]/` shadow.
 */
export function buildSitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of STATIC_ROUTES) {
    entries.push(entryWithAlternates(route));
  }

  // Problem detail + every sub-route per problem.
  for (const problem of problems) {
    for (const sub of PROBLEM_SUBROUTES) {
      entries.push(entryWithAlternates(`/problems/${problem.slug}${sub}`));
    }
  }

  // Papers / Authors / Institutions.
  for (const paper of papers) {
    entries.push(entryWithAlternates(`/papers/${paper.id}`));
  }
  for (const author of authors) {
    entries.push(entryWithAlternates(`/authors/${author.slug}`));
  }
  for (const institution of institutions) {
    entries.push(entryWithAlternates(`/institutions/${institution.slug}`));
  }

  // Domain + subdomain pages from the taxonomy.
  for (const domain of taxonomy.domains) {
    entries.push(entryWithAlternates(`/domains/${domain.id}`));
    for (const subdomain of domain.subdomains) {
      entries.push(entryWithAlternates(`/domains/${domain.id}/${subdomain.id}`));
    }
  }

  // Methodology + Contributing versioned pages. Filter prevents duplicate
  // URLs when FR siblings (e.g. methodology/v1.fr.mdx) join the Velite
  // collection — the alternates block already covers the FR variant.
  for (const m of methodology) {
    if (m.lang !== "en") continue;
    entries.push(entryWithAlternates(`/methodology/${m.slug}`));
  }
  for (const c of contributing) {
    if (c.lang !== "en") continue;
    entries.push(entryWithAlternates(`/contributing/${c.slug}`));
  }

  return entries.sort((a, b) => a.url.localeCompare(b.url));
}
