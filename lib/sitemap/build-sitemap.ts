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

/**
 * Canonical site URL (Q2 placeholder). Hardcoded across three call sites —
 * `lib/digest/rss.ts`, `app/api/v1/rss.xml/route.ts`, and here. When DNS
 * lands (Q2), all three update together. If the call-site count grows to
 * 5+, extract into a shared `lib/site-url.ts` (deferred follow-on).
 */
export const SITE = "https://llm-openproblems.org";

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
 * Builds the project sitemap by enumerating static + dynamic routes from
 * the Velite content collections. Returns the entries sorted by URL for
 * determinism across builds.
 *
 * Locale alternates per ADR-0011 D-E (English-canonical slugs): currently
 * only `/about` has `[locale]/` shadows (`/en/about` + `/fr/about` from
 * Unit 7.3). When Unit 7.3a expands `[locale]/<route>` coverage, the
 * `ALTERNATES` table below extends accordingly.
 *
 * Q48 sitemap-half closure: every `/problems/[slug]/talk` URL is enrolled
 * (10 talk pages for the 10 problems at HEAD).
 */
export function buildSitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of STATIC_ROUTES) {
    const entry: MetadataRoute.Sitemap[number] = { url: `${SITE}${route}` };
    if (route === "/about") {
      entry.alternates = {
        languages: {
          en: `${SITE}/en/about`,
          fr: `${SITE}/fr/about`,
        },
      };
    } else if (route === "/methodology") {
      entry.alternates = {
        languages: {
          en: `${SITE}/en/methodology`,
          fr: `${SITE}/fr/methodology`,
        },
      };
    }
    entries.push(entry);
  }

  // Problem detail + every sub-route per problem.
  for (const problem of problems) {
    for (const sub of PROBLEM_SUBROUTES) {
      entries.push({ url: `${SITE}/problems/${problem.slug}${sub}` });
    }
  }

  // Papers / Authors / Institutions.
  for (const paper of papers) {
    entries.push({ url: `${SITE}/papers/${paper.id}` });
  }
  for (const author of authors) {
    entries.push({ url: `${SITE}/authors/${author.slug}` });
  }
  for (const institution of institutions) {
    entries.push({ url: `${SITE}/institutions/${institution.slug}` });
  }

  // Domain + subdomain pages from the taxonomy.
  for (const domain of taxonomy.domains) {
    entries.push({ url: `${SITE}/domains/${domain.id}` });
    for (const subdomain of domain.subdomains) {
      entries.push({ url: `${SITE}/domains/${domain.id}/${subdomain.id}` });
    }
  }

  // Methodology + Contributing versioned pages. Bare paths serve EN; locale-
  // aware variants live under /[locale]/... (Unit 7.5+; sitemap enrolment is
  // Unit 7.8's scope per Q48 sitemap-half). Filter prevents duplicate URLs
  // when FR siblings (e.g. methodology/v1.fr.mdx) join the Velite collection.
  for (const m of methodology) {
    if (m.lang !== "en") continue;
    entries.push({
      url: `${SITE}/methodology/${m.slug}`,
      alternates: {
        languages: {
          en: `${SITE}/en/methodology/${m.slug}`,
          fr: `${SITE}/fr/methodology/${m.slug}`,
        },
      },
    });
  }
  for (const c of contributing) {
    if (c.lang !== "en") continue;
    entries.push({ url: `${SITE}/contributing/${c.slug}` });
  }

  return entries.sort((a, b) => a.url.localeCompare(b.url));
}
