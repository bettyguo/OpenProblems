import { describe, it, expect } from "vitest";
import { LeaderboardEntrySchema } from "@/lib/schemas/entry";

const VALID = {
  paper_id: "yang-2025-test-time",
  benchmark_id: "halueval",
  score: 0.75,
  date: "2025-12-01",
  verified: true,
};

describe("LeaderboardEntrySchema", () => {
  it("accepts a minimal valid entry", () => {
    expect(LeaderboardEntrySchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects a non-ISO date format", () => {
    expect(
      LeaderboardEntrySchema.safeParse({ ...VALID, date: "12/01/2025" })
        .success,
    ).toBe(false);
  });

  it("rejects a missing verified flag", () => {
    const { verified: _v, ...rest } = VALID;
    expect(LeaderboardEntrySchema.safeParse(rest).success).toBe(false);
  });

  it("accepts an optional protocol_notes field", () => {
    expect(
      LeaderboardEntrySchema.safeParse({
        ...VALID,
        protocol_notes: "n=100 trials with seed=42",
      }).success,
    ).toBe(true);
  });
});
