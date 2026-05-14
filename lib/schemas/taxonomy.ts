import { z } from "zod";
import { slug } from "@/lib/schemas/_primitives";

export const SubdomainSchema = z.object({
  id: slug,
  title: z.string().min(1),
});
export type Subdomain = z.infer<typeof SubdomainSchema>;

export const DomainSchema = z
  .object({
    id: slug,
    title: z.string().min(1),
    subdomains: z.array(SubdomainSchema).min(1),
  })
  .superRefine((domain, ctx) => {
    const seen = new Set<string>();
    for (const sd of domain.subdomains) {
      if (seen.has(sd.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate subdomain id within domain "${domain.id}": ${sd.id}`,
          path: ["subdomains"],
        });
      }
      seen.add(sd.id);
    }
  });
export type Domain = z.infer<typeof DomainSchema>;

/**
 * Subdomain id collisions across domains are allowed (e.g.,
 * `representation-learning` exists under both `deep-learning` and
 * `general-ml`). The canonical URL strategy is domain-scoped:
 * `/domains/[domain]/[subdomain]`. See OPEN_QUESTIONS Q11.
 */
export const TaxonomySchema = z
  .object({
    domains: z.array(DomainSchema).min(1),
  })
  .superRefine((taxonomy, ctx) => {
    const seen = new Set<string>();
    for (const d of taxonomy.domains) {
      if (seen.has(d.id)) {
        ctx.addIssue({
          code: "custom",
          message: `duplicate domain id: ${d.id}`,
          path: ["domains"],
        });
      }
      seen.add(d.id);
    }
  });
export type Taxonomy = z.infer<typeof TaxonomySchema>;
