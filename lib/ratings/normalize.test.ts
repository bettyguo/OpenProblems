import { describe, expect, it } from "vitest";
import {
  composite,
  dimensionsToRadar,
  meanConfidence,
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
