import { z } from "zod";
import { slug } from "@/lib/schemas/_primitives";
import { TranslationSourceSchema } from "@/lib/schemas/problem";

export const ContributionSchema = z.object({
  problem_slug: slug,
  benchmark_id: z.string().min(1).optional(),
  score: z.number().optional(),
  metric: z.string().min(1).optional(),
  rank_at_publication: z.number().int().min(1).optional(),
  evidence: z.string().url(),
});
export type Contribution = z.infer<typeof ContributionSchema>;

export const PaperSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  authors: z.array(slug),
  institutions: z.array(slug),
  venue: z.string().optional(),
  year: z
    .number()
    .int()
    .gte(1900)
    .refine((year) => year <= new Date().getFullYear(), {
      message: "year cannot be in the future",
    }),
  arxiv_id: z.string().min(1).optional(),
  doi: z.string().min(1).optional(),
  github: z.string().url().optional(),
  tldr: z.string().min(1).max(400),
  contributions: z.array(ContributionSchema),
  // ADR-0011 D-G — required on `.fr.yaml` siblings; omitted on EN canonical.
  translation_source: TranslationSourceSchema.optional(),
});
export type Paper = z.infer<typeof PaperSchema>;
