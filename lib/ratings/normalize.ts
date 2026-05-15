/**
 * Normalize each rating dimension into the `[0, 5]` space the radar uses
 * (and the composite formula in §8.3 also uses).
 *
 *   Difficulty letter → 0 (E) … 5 (S)
 *   Saturation 0–100 → (100 − saturation) / 20 → 0 (fully saturated, no
 *                       progress remaining) … 5 (open, much remaining)
 *   Urgency / Value / Industry Call stars 0–5 → pass-through
 *
 * Output order is fixed: difficulty, saturation, urgency, value,
 * industry_call. Consumers (radar, composite calculator) MUST not
 * reorder — chart hue index → dimension is part of the brand.
 */

import type { RatingAction } from "@/lib/schemas/rating-action";

export type DimensionId = "difficulty" | "saturation" | "urgency" | "value" | "industry_call";

export interface RadarPoint {
  dimension: DimensionId;
  /** 0–5 value plotted on the radar. */
  normalized: number;
  /** Original raw value as a display string (e.g., "A", "35", "5"). */
  rawDisplay: string;
  /** 0–1 confidence the curator attached to this dimension. */
  confidence: number;
  /** Curator's one-paragraph rationale, surfaced in tooltip / table-fallback. */
  rationale: string;
}

const GRADE_TO_NORM: Record<"S" | "A" | "B" | "C" | "D" | "E", number> = {
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  E: 0,
};

export function dimensionsToRadar(dimensions: RatingAction["dimensions"]): RadarPoint[] {
  return [
    {
      dimension: "difficulty",
      normalized: GRADE_TO_NORM[dimensions.difficulty.grade],
      rawDisplay: dimensions.difficulty.grade,
      confidence: dimensions.difficulty.confidence,
      rationale: dimensions.difficulty.rationale,
    },
    {
      dimension: "saturation",
      normalized: (100 - dimensions.saturation.value) / 20,
      rawDisplay: String(dimensions.saturation.value),
      confidence: dimensions.saturation.confidence,
      rationale: dimensions.saturation.rationale,
    },
    {
      dimension: "urgency",
      normalized: dimensions.urgency.stars,
      rawDisplay: String(dimensions.urgency.stars),
      confidence: dimensions.urgency.confidence,
      rationale: dimensions.urgency.rationale,
    },
    {
      dimension: "value",
      normalized: dimensions.value.stars,
      rawDisplay: String(dimensions.value.stars),
      confidence: dimensions.value.confidence,
      rationale: dimensions.value.rationale,
    },
    {
      dimension: "industry_call",
      normalized: dimensions.industry_call.stars,
      rawDisplay: String(dimensions.industry_call.stars),
      confidence: dimensions.industry_call.confidence,
      rationale: dimensions.industry_call.rationale,
    },
  ];
}

/** Mean confidence across the five dimensions. */
export function meanConfidence(points: RadarPoint[]): number {
  if (points.length === 0) return 0;
  return points.reduce((acc, p) => acc + p.confidence, 0) / points.length;
}

/** Phase 0 composite per §8.3 — advisory only, never shown alone. */
export function composite(points: RadarPoint[]): number {
  const map = Object.fromEntries(points.map((p) => [p.dimension, p.normalized]));
  const diff = map.difficulty ?? 0;
  const sat = map.saturation ?? 0;
  const urg = map.urgency ?? 0;
  const val = map.value ?? 0;
  const ind = map.industry_call ?? 0;
  return 0.25 * diff + 0.25 * val + 0.2 * urg + 0.15 * ind + 0.15 * sat;
}
