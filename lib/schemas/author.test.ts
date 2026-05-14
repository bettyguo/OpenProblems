import { describe, it, expect } from "vitest";
import { AuthorSchema } from "@/lib/schemas/author";

const VALID = {
  slug: "yann-lecun",
  display_name: "Yann LeCun",
  affiliations: [
    { institution: "nyu", from: "2003-09-01" },
    { institution: "meta-ai", from: "2013-12-01", to: "2026-01-01" },
  ],
};

describe("AuthorSchema", () => {
  it("accepts a valid author with multiple affiliations", () => {
    expect(AuthorSchema.safeParse(VALID).success).toBe(true);
  });

  it("rejects an invalid ORCID format", () => {
    expect(AuthorSchema.safeParse({ ...VALID, orcid: "1234-5678" }).success).toBe(
      false,
    );
  });

  it("accepts a valid ORCID with X check digit", () => {
    expect(
      AuthorSchema.safeParse({ ...VALID, orcid: "0000-0001-2345-678X" }).success,
    ).toBe(true);
  });

  it("rejects a slug with uppercase letters", () => {
    expect(
      AuthorSchema.safeParse({ ...VALID, slug: "Yann-LeCun" }).success,
    ).toBe(false);
  });

  it("rejects an affiliation with a malformed from date", () => {
    expect(
      AuthorSchema.safeParse({
        ...VALID,
        affiliations: [{ institution: "x", from: "September 2003" }],
      }).success,
    ).toBe(false);
  });
});
