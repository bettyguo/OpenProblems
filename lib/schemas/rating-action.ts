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

const SaturationDimensionSchema = z.object({
  value: z.number().min(0).max(100),
  confidence: Confidence,
  rationale: z.string().min(1),
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
