import { z } from "zod";
import { slug } from "@/lib/schemas/_primitives";

export const InstitutionTypeSchema = z.enum([
  "academic",
  "industry",
  "government",
  "nonprofit",
  "other",
]);
export type InstitutionType = z.infer<typeof InstitutionTypeSchema>;

export const InstitutionSchema = z.object({
  slug,
  display_name: z.string().min(1),
  country: z.string().min(1).optional(),
  type: InstitutionTypeSchema.optional(),
  homepage: z.string().url().optional(),
  ror_id: z
    .string()
    .regex(/^0[\da-z]{6}\d{2}$/, "must be a ROR ID (9 chars: 0 + 6 alphanumeric + 2 digits)")
    .optional(),
});
export type Institution = z.infer<typeof InstitutionSchema>;
