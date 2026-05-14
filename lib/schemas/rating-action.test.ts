import { describe, it, expect } from "vitest";
import { RatingActionSchema } from "@/lib/schemas/rating-action";

const VALID = {
  problem_slug: "hallucination-reduction",
  date: "2026-05-14",
  methodology_version: "v1.0",
  curator: "@jikun",
  dimensions: {
    difficulty: {
      grade: "A" as const,
      confidence: 0.7,
      rationale: "Multi-decade resistance on knowledge-intensive QA.",
    },
    saturation: {
      value: 35,
      confidence: 0.6,
      rationale: "Best SOTA on HaluEval sits well below human-expert ceiling.",
    },
    urgency: {
      stars: 5,
      confidence: 0.8,
      rationale: "Cited heavily by AI-safety reports.",
    },
    value: {
      stars: 5,
      confidence: 0.8,
      rationale: "Unlocks many downstream applications.",
    },
    industry_call: {
      stars: 5,
      confidence: 0.7,
      rationale: "Frontier labs roadmaps list this explicitly.",
    },
  },
};

describe("RatingActionSchema", () => {
  it("accepts a minimal valid rating action", () => {
    expect(RatingActionSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects a difficulty grade outside S–E", () => {
    expect(
      RatingActionSchema.safeParse({
        ...VALID,
        dimensions: {
          ...VALID.dimensions,
          difficulty: { ...VALID.dimensions.difficulty, grade: "F" },
        },
      }).success,
    ).toBe(false);
  });

  it("rejects saturation > 100", () => {
    expect(
      RatingActionSchema.safeParse({
        ...VALID,
        dimensions: {
          ...VALID.dimensions,
          saturation: { value: 101, confidence: 0.5, rationale: "x" },
        },
      }).success,
    ).toBe(false);
  });

  it("rejects confidence > 1", () => {
    expect(
      RatingActionSchema.safeParse({
        ...VALID,
        dimensions: {
          ...VALID.dimensions,
          difficulty: { ...VALID.dimensions.difficulty, confidence: 1.1 },
        },
      }).success,
    ).toBe(false);
  });

  it("defaults watchlist to false when omitted", () => {
    const parsed = RatingActionSchema.parse(VALID);
    expect(parsed.watchlist).toBe(false);
  });
});
