import { z } from "zod";
import { BenchmarkSchema } from "@/lib/schemas/benchmark";
import { isoDate, slug } from "@/lib/schemas/_primitives";

export const ProblemStatusSchema = z.enum([
  "open",
  "partially-solved",
  "converging",
  "solved",
  "retired",
]);
export type ProblemStatus = z.infer<typeof ProblemStatusSchema>;

const ExternalLinksSchema = z.object({
  arxiv_survey: z.string().url().optional(),
  paperswithcode_legacy: z.string().url().optional(),
  nlp_progress: z.string().url().optional(),
  canonical_survey: z.string().url().optional(),
});

const EditorialSchema = z.object({
  primary_curator: z.string().min(1),
  last_curated: isoDate,
});

export const OpenProblemSchema = z.object({
  slug,
  title: z.string().min(5).max(120),
  subtitle: z.string().max(200).optional(),
  domain: z.string().min(1),
  subdomain: z.string().min(1),
  tags: z.array(z.string().min(1)),
  status: ProblemStatusSchema,
  posed_year: z
    .number()
    .int()
    .gte(1950)
    .refine((year) => year <= new Date().getFullYear(), {
      message: "posed_year cannot be in the future",
    }),
  authors_who_posed: z.array(z.string().min(1)).optional(),
  related_problems: z.array(slug).optional(),
  benchmarks: z.array(BenchmarkSchema),
  external_links: ExternalLinksSchema.optional(),
  editorial: EditorialSchema,
});
export type OpenProblem = z.infer<typeof OpenProblemSchema>;
