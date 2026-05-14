import { z } from "zod";
import { isoDate, slug } from "@/lib/schemas/_primitives";

const AffiliationSchema = z.object({
  institution: slug,
  from: isoDate,
  to: isoDate.optional(),
});

export const AuthorSchema = z.object({
  slug,
  display_name: z.string().min(1),
  affiliations: z.array(AffiliationSchema),
  homepage: z.string().url().optional(),
  scholar_id: z.string().min(1).optional(),
  orcid: z
    .string()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, "must be in ORCID format 0000-0000-0000-000X")
    .optional(),
});
export type Author = z.infer<typeof AuthorSchema>;
