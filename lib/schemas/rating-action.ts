import { z } from "zod";
import { isoDate, slug } from "@/lib/schemas/_primitives";

export const DifficultyGradeSchema = z.enum(["S", "A", "B", "C", "D", "E"]);
export type DifficultyGrade = z.infer<typeof DifficultyGradeSchema>;

const Confidence = z.number().min(0).max(1);
const Stars = z.number().int().min(0).max(5);

const DifficultyDimensionSchema = z.object({
  grade: DifficultyGradeSchema,
  confidence: Confidence,
  rationale: z.string().min(1),
});

/**
 * Saturation dimension — supports both numeric (0–100) values and the
 * qualitative N/A escape hatch from MASTER_PROMPT §8.2 / ADR-0006.
 *
 * - `value: number (0–100)` for the canonical case (defensible ceiling exists).
 * - `value: null` for the §8.2 "no ceiling" case; `qualitative_band` carries
 *   the editorial signal in that case.
 * - Both can coexist when a curator is confident in both. The refine ensures
 *   at least one is set so the dimension is never silently empty.
 */
const SaturationDimensionSchema = z
  .object({
    value: z.number().min(0).max(100).nullable(),
    qualitative_band: z.enum(["low", "medium", "high"]).optional(),
    confidence: Confidence,
    rationale: z.string().min(1),
  })
  .refine((data) => data.value !== null || data.qualitative_band !== undefined, {
    message: "saturation: either `value` (0–100) or `qualitative_band` must be set",
  });

const StarDimensionSchema = z.object({
  stars: Stars,
  confidence: Confidence,
  rationale: z.string().min(1),
});

/**
 * Every rating action is a complete snapshot — all five dimensions must
 * be addressed, even when "unchanged" — per ADR-0005 immutability.
 * A partial action would create silent gaps in the audit log.
 */
export const RatingActionSchema = z.object({
  problem_slug: slug,
  date: isoDate,
  methodology_version: z.string().min(1),
  curator: z.string().min(1),
  prior_action: z.string().min(1).optional(),
  dimensions: z.object({
    difficulty: DifficultyDimensionSchema,
    saturation: SaturationDimensionSchema,
    urgency: StarDimensionSchema,
    value: StarDimensionSchema,
    industry_call: StarDimensionSchema,
  }),
  signals_considered: z.array(z.string().min(1)).optional(),
  watchlist: z.boolean().default(false),
});
export type RatingAction = z.infer<typeof RatingActionSchema>;
