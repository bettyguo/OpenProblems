import { z } from "zod";

/**
 * Kebab-case slug: lowercase letters, digits, and hyphens.
 * Used for problem, author, institution, domain, and subdomain ids.
 */
export const slug = z
  .string()
  .regex(/^[a-z0-9-]+$/, "must be kebab-case (lowercase letters, digits, hyphens)");

/**
 * ISO-8601 calendar date string: YYYY-MM-DD. No time component.
 * Used for posed_year (with a year-only refinement applied separately),
 * editorial.last_curated, rating-action date, entry date, affiliations.
 */
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be an ISO calendar date YYYY-MM-DD");
