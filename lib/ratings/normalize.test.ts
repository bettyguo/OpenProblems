import { describe, expect, it } from "vitest";
import {
  composite,
  dimensionsToRadar,
  isValidCompositeWeights,
  meanConfidence,
  DEFAULT_COMPOSITE_WEIGHTS,
  type RadarPoint,
} from "@/lib/ratings/normalize";
import type { RatingAction } from "@/lib/schemas/rating-action";

const baseDimensions: RatingAction["dimensions"] = {
  difficulty: { grade: "A", confidence: 0.8, rationale: "x" },
  saturation: { value: 35, confidence: 0.6, rationale: "x" },
  urgency: { stars: 5, confidence: 0.8, rationale: "x" },
  value: { stars: 5, confidence: 0.7, rationale: "x" },
  industry_call: { stars: 4, confidence: 0.7, rationale: "x" },
};

describe("dimensionsToRadar", () => {
  it("orders dimensions difficulty, saturation, urgency, value, industry_call", () => {
    const points = dimensionsToRadar(baseDimensions);
    expect(points.map((p) => p.dimension)).toEqual([
      "difficulty",
      "saturation",
      "urgency",
      "value",
      "industry_call",
    ]);
  });

  it("maps difficulty grades to [0..5]", () => {
    const grades = ["S", "A", "B", "C", "D", "E"] as const;
    const expected = [5, 4, 3, 2, 1, 0];
    for (let i = 0; i < grades.length; i++) {
      const dims = {
        ...baseDimensions,
        difficulty: { ...baseDimensions.difficulty, grade: grades[i]! },
      };
      const points = dimensionsToRadar(dims);
      expect(points[0]?.normalized).toBe(expected[i]);
      expect(points[0]?.rawDisplay).toBe(grades[i]);
    }
  });

  it("inverts saturation: 100 → 0, 0 → 5, 35 → 3.25", () => {
    const tests = [
      { value: 100, expected: 0 },
      { value: 0, expected: 5 },
      { value: 35, expected: 3.25 },
      { value: 50, expected: 2.5 },
    ];
    for (const { value, expected } of tests) {
      const dims = {
        ...baseDimensions,
        saturation: { ...baseDimensions.saturation, value },
      };
      const points = dimensionsToRadar(dims);
      expect(points[1]?.normalized).toBeCloseTo(expected, 10);
    }
  });

  // ADR-0006: Saturation N/A encoding falls back to qualitative band.
  it("maps null saturation + qualitative_band to center-of-bucket (low=4, medium=2.5, high=1)", () => {
    const tests = [
      { band: "low" as const, expected: 4 },
      { band: "medium" as const, expected: 2.5 },
      { band: "high" as const, expected: 1 },
    ];
    for (const { band, expected } of tests) {
      const dims = {
        ...baseDimensions,
        saturation: {
          value: null,
          qualitative_band: band,
          confidence: 0.4,
          rationale: "no ceiling defensible",
        },
      };
      const points = dimensionsToRadar(dims);
      expect(points[1]?.normalized).toBe(expected);
      expect(points[1]?.rawDisplay).toBe(`N/A (${band})`);
    }
  });

  it("passes star ratings through unchanged", () => {
    const points = dimensionsToRadar(baseDimensions);
    expect(points[2]?.normalized).toBe(5);
    expect(points[3]?.normalized).toBe(5);
    expect(points[4]?.normalized).toBe(4);
  });

  it("carries rationale and confidence onto the point", () => {
    const dims = {
      ...baseDimensions,
      urgency: { stars: 3, confidence: 0.25, rationale: "low-confidence WATCH" },
    };
    const points = dimensionsToRadar(dims);
    expect(points[2]?.confidence).toBe(0.25);
    expect(points[2]?.rationale).toBe("low-confidence WATCH");
  });
});

// Unit 3.10 — Recompose weight validation.
describe("isValidCompositeWeights", () => {
  it("accepts the §8.3 defaults", () => {
    expect(isValidCompositeWeights(DEFAULT_COMPOSITE_WEIGHTS)).toBe(true);
  });

  it("accepts any non-negative weights summing to ~1 within tolerance", () => {
    expect(
      isValidCompositeWeights({
        difficulty: 0.2,
        value: 0.2,
        urgency: 0.2,
        industry_call: 0.2,
        saturation: 0.2,
      }),
    ).toBe(true);
  });

  it("rejects negative weights", () => {
    expect(
      isValidCompositeWeights({
        difficulty: -0.1,
        value: 0.4,
        urgency: 0.3,
        industry_call: 0.2,
        saturation: 0.2,
      }),
    ).toBe(false);
  });

  it("rejects when sum ≠ 1 outside the ±0.01 tolerance", () => {
    expect(
      isValidCompositeWeights({
        difficulty: 0.5,
        value: 0.5,
        urgency: 0.5,
        industry_call: 0.5,
        saturation: 0.5,
      }),
    ).toBe(false);
  });

  it("accepts sums within ±0.01 of 1 (rounding tolerance)", () => {
    expect(
      isValidCompositeWeights({
        difficulty: 0.25,
        value: 0.25,
        urgency: 0.205,
        industry_call: 0.15,
        saturation: 0.15,
      }),
    ).toBe(true);
  });
});

describe("meanConfidence", () => {
  it("averages confidences across the five points", () => {
    const points = dimensionsToRadar(baseDimensions);
    // confidences: 0.8, 0.6, 0.8, 0.7, 0.7 → mean 0.72
    expect(meanConfidence(points)).toBeCloseTo(0.72, 5);
  });

  it("returns 0 for an empty array", () => {
    expect(meanConfidence([])).toBe(0);
  });
});

describe("composite", () => {
  it("applies the §8.3 default weights", () => {
    const points = dimensionsToRadar(baseDimensions);
    // 0.25*4 (diff) + 0.25*5 (val) + 0.2*5 (urg) + 0.15*4 (ind) + 0.15*3.25 (sat)
    // = 1.0 + 1.25 + 1.0 + 0.6 + 0.4875 = 4.3375
    expect(composite(points)).toBeCloseTo(4.3375, 5);
  });

  // Unit 3.10 — Recompose accepts user-customized weights.
  it("accepts custom weights and reweights accordingly", () => {
    const points = dimensionsToRadar(baseDimensions);
    // 100% saturation weight: composite = saturation normalized = 3.25
    const all_sat = composite(points, {
      difficulty: 0,
      value: 0,
      urgency: 0,
      industry_call: 0,
      saturation: 1,
    });
    expect(all_sat).toBeCloseTo(3.25, 5);
  });

  it("defaults match DEFAULT_COMPOSITE_WEIGHTS export", () => {
    const points = dimensionsToRadar(baseDimensions);
    expect(composite(points)).toBe(composite(points, DEFAULT_COMPOSITE_WEIGHTS));
  });

  it("handles a missing dimension gracefully (zero-fill)", () => {
    const points: RadarPoint[] = [
      {
        dimension: "difficulty",
        normalized: 4,
        rawDisplay: "A",
        confidence: 1,
        rationale: "",
      },
    ];
    // Only difficulty contributes: 0.25 * 4 = 1
    expect(composite(points)).toBeCloseTo(1, 5);
  });
});
