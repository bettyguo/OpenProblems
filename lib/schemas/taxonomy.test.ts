import { describe, it, expect } from "vitest";
import { DomainSchema, SubdomainSchema, TaxonomySchema } from "@/lib/schemas/taxonomy";

describe("SubdomainSchema", () => {
  it("accepts a valid kebab-case id", () => {
    expect(
      SubdomainSchema.safeParse({
        id: "large-language-models",
        title: "Large Language Models",
      }).success,
    ).toBe(true);
  });

  it("rejects an id with uppercase letters or whitespace", () => {
    expect(SubdomainSchema.safeParse({ id: "LLMs", title: "x" }).success).toBe(false);
    expect(SubdomainSchema.safeParse({ id: "with space", title: "x" }).success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(SubdomainSchema.safeParse({ id: "valid-id", title: "" }).success).toBe(false);
  });
});

describe("DomainSchema", () => {
  it("accepts a domain with one subdomain", () => {
    expect(
      DomainSchema.safeParse({
        id: "deep-learning",
        title: "Deep Learning",
        subdomains: [{ id: "llms", title: "LLMs" }],
      }).success,
    ).toBe(true);
  });

  it("rejects an empty subdomains array", () => {
    expect(DomainSchema.safeParse({ id: "x", title: "X", subdomains: [] }).success).toBe(false);
  });

  it("rejects duplicate subdomain ids within the same domain", () => {
    expect(
      DomainSchema.safeParse({
        id: "deep-learning",
        title: "Deep Learning",
        subdomains: [
          { id: "llms", title: "Large Language Models" },
          { id: "llms", title: "Duplicate" },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("TaxonomySchema", () => {
  it("accepts a minimal valid taxonomy", () => {
    expect(
      TaxonomySchema.safeParse({
        domains: [
          {
            id: "d1",
            title: "Domain 1",
            subdomains: [{ id: "s1", title: "S1" }],
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("allows the same subdomain id under different domains (per Q11)", () => {
    expect(
      TaxonomySchema.safeParse({
        domains: [
          {
            id: "deep-learning",
            title: "Deep Learning",
            subdomains: [{ id: "robustness", title: "Robustness" }],
          },
          {
            id: "social-aspects",
            title: "Social Aspects",
            subdomains: [{ id: "robustness", title: "Robustness" }],
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects duplicate domain ids", () => {
    expect(
      TaxonomySchema.safeParse({
        domains: [
          {
            id: "x",
            title: "X",
            subdomains: [{ id: "a", title: "A" }],
          },
          {
            id: "x",
            title: "X again",
            subdomains: [{ id: "b", title: "B" }],
          },
        ],
      }).success,
    ).toBe(false);
  });
});
