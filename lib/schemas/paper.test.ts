import { describe, it, expect } from "vitest";
import { PaperSchema } from "@/lib/schemas/paper";

const VALID = {
  id: "yang-2025-test-time-hallucinations",
  title: "Test-time scaling amplifies hallucinations on knowledge tasks",
  authors: ["yang-2025-author"],
  institutions: ["mit"],
  year: 2025,
  tldr: "Reasoning chains increase hallucinations on knowledge-intensive QA.",
  contributions: [],
};

describe("PaperSchema", () => {
  it("accepts a minimal valid paper", () => {
    expect(PaperSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects a tldr longer than 400 characters", () => {
    expect(PaperSchema.safeParse({ ...VALID, tldr: "x".repeat(401) }).success).toBe(false);
  });

  it("rejects a future year", () => {
    expect(
      PaperSchema.safeParse({
        ...VALID,
        year: new Date().getFullYear() + 1,
      }).success,
    ).toBe(false);
  });

  it("rejects a contribution with non-URL evidence", () => {
    expect(
      PaperSchema.safeParse({
        ...VALID,
        contributions: [{ problem_slug: "x", evidence: "see paper section 4" }],
      }).success,
    ).toBe(false);
  });

  it("accepts a contribution with a URL evidence", () => {
    expect(
      PaperSchema.safeParse({
        ...VALID,
        contributions: [
          {
            problem_slug: "hallucination-reduction",
            evidence: "https://arxiv.org/abs/2509.99999v1#table-3",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("accepts an optional translation_source = 'human' (ADR-0011 D-G)", () => {
    expect(PaperSchema.safeParse({ ...VALID, translation_source: "human" }).success).toBe(true);
  });

  it("rejects an unknown translation_source value", () => {
    expect(PaperSchema.safeParse({ ...VALID, translation_source: "auto" }).success).toBe(false);
  });
});
