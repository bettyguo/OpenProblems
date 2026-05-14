import { describe, it, expect } from "vitest";
import { InstitutionSchema } from "@/lib/schemas/institution";

const VALID = {
  slug: "mit",
  display_name: "Massachusetts Institute of Technology",
  country: "US",
  type: "academic" as const,
  homepage: "https://web.mit.edu",
  ror_id: "042nb2s44",
};

describe("InstitutionSchema", () => {
  it("accepts a valid institution", () => {
    expect(InstitutionSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects an invalid type enum", () => {
    expect(
      InstitutionSchema.safeParse({ ...VALID, type: "company" }).success,
    ).toBe(false);
  });

  it("rejects a malformed ROR id", () => {
    expect(
      InstitutionSchema.safeParse({ ...VALID, ror_id: "not-a-ror" }).success,
    ).toBe(false);
  });

  it("accepts a minimal institution with only slug + display_name", () => {
    expect(
      InstitutionSchema.safeParse({
        slug: "mit",
        display_name: "MIT",
      }).success,
    ).toBe(true);
  });
});
