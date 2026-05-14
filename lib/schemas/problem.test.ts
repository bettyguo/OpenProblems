import { describe, it, expect } from "vitest";
import { OpenProblemSchema } from "@/lib/schemas/problem";

const VALID = {
  slug: "hallucination-reduction",
  title: "Faithful & Calibrated Hallucination Reduction in LLMs",
  domain: "deep-learning",
  subdomain: "large-language-models",
  tags: ["llm", "factuality"],
  status: "open" as const,
  posed_year: 2020,
  benchmarks: [],
  editorial: { primary_curator: "@jikun", last_curated: "2026-05-14" },
};

describe("OpenProblemSchema", () => {
  it("accepts a minimal valid problem", () => {
    expect(OpenProblemSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects a non-kebab-case slug", () => {
    expect(
      OpenProblemSchema.safeParse({ ...VALID, slug: "HallucinationReduction" })
        .success,
    ).toBe(false);
  });

  it("rejects a future posed_year", () => {
    expect(
      OpenProblemSchema.safeParse({
        ...VALID,
        posed_year: new Date().getFullYear() + 1,
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid status enum", () => {
    expect(
      OpenProblemSchema.safeParse({ ...VALID, status: "in-progress" }).success,
    ).toBe(false);
  });

  it("rejects a title shorter than 5 characters", () => {
    expect(
      OpenProblemSchema.safeParse({ ...VALID, title: "abc" }).success,
    ).toBe(false);
  });
});
