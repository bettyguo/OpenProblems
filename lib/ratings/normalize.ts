/**
 * Normalize each rating dimension into the `[0, 5]` space the radar uses
 * (and the composite formula in §8.3 also uses).
 *
 *   Difficulty letter → 0 (E) … 5 (S)
 *   Saturation
 *     numeric 0–100   → (100 − saturation) / 20 → 0 (fully saturated, no
 *                         progress remaining) … 5 (open, much remaining)
 *     null + band     → low → 4, medium → 2.5, high → 1 (qualitative-only
 *                         encoding per ADR-0006; radar plots the band's
 *                         center-of-bucket so the viz shape stays readable)
 *   Urgency / Value / Industry Call stars 0–5 → pass-through
 *
 * Output order is fixed: difficulty, saturation, urgency, value,
 * industry_call. Consumers (radar, composite calculator) MUST not
 * reorder — chart hue index → dimension is part of the brand.
 */

import type { RatingAction } from "@/lib/schemas/rating-action";

const BAND_TO_NORM: Record<"low" | "medium" | "high", number> = {
  low: 4,
  medium: 2.5,
  high: 1,
};

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
      // ADR-0006: value may be null (no ceiling defensible); fall back to
      // qualitative_band's center-of-bucket. The schema's refine() guarantees
      // at least one is set, so the band branch is reachable iff value is null.
      normalized:
        dimensions.saturation.value !== null
          ? (100 - dimensions.saturation.value) / 20
          : BAND_TO_NORM[dimensions.saturation.qualitative_band ?? "medium"],
      rawDisplay:
        dimensions.saturation.value !== null
          ? String(dimensions.saturation.value)
          : `N/A (${dimensions.saturation.qualitative_band ?? "medium"})`,
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

/**
 * Composite weights per §8.3. Each dimension multiplies a [0, 5] normalized
 * value; weights should sum to 1.0 (the §8.3 default does).
 */
export interface CompositeWeights {
  difficulty: number;
  value: number;
  urgency: number;
  industry_call: number;
  saturation: number;
}

/** §8.3 default weights — the canonical composite shown on /problems by default. */
export const DEFAULT_COMPOSITE_WEIGHTS: CompositeWeights = {
  difficulty: 0.25,
  value: 0.25,
  urgency: 0.2,
  industry_call: 0.15,
  saturation: 0.15,
};

/** §8.3 composite — advisory only, never shown alone. Phase 3 "Recompose" UI
 * (Unit 3.10) passes user-customized weights via the optional 2nd argument. */
export function composite(
  points: RadarPoint[],
  weights: CompositeWeights = DEFAULT_COMPOSITE_WEIGHTS,
): number {
  const map = Object.fromEntries(points.map((p) => [p.dimension, p.normalized]));
  const diff = map.difficulty ?? 0;
  const sat = map.saturation ?? 0;
  const urg = map.urgency ?? 0;
  const val = map.value ?? 0;
  const ind = map.industry_call ?? 0;
  return (
    weights.difficulty * diff +
    weights.value * val +
    weights.urgency * urg +
    weights.industry_call * ind +
    weights.saturation * sat
  );
}

/** Validate that weights are non-negative and sum to ~1.0 (±0.01 tolerance). */
export function isValidCompositeWeights(w: CompositeWeights): boolean {
  const vals = [w.difficulty, w.value, w.urgency, w.industry_call, w.saturation];
  if (vals.some((v) => !Number.isFinite(v) || v < 0)) return false;
  const sum = vals.reduce((acc, v) => acc + v, 0);
  return Math.abs(sum - 1) <= 0.01;
}
