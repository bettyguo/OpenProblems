import { describe, expect, it } from "vitest";
import { parseLocaleFromPath } from "./locale-filename";

describe("parseLocaleFromPath", () => {
  it("returns the default locale + the input unchanged when no locale infix is present", () => {
    expect(parseLocaleFromPath("methodology/v1")).toEqual({
      lang: "en",
      canonicalSlug: "methodology/v1",
    });
  });

  it("detects a trailing .fr infix on a methodology slug", () => {
    expect(parseLocaleFromPath("methodology/v1.fr")).toEqual({
      lang: "fr",
      canonicalSlug: "methodology/v1",
    });
  });

  it("detects .fr on a problemPages slug (background/definition/history)", () => {
    expect(parseLocaleFromPath("problems/hallucination-reduction/background.fr")).toEqual({
      lang: "fr",
      canonicalSlug: "problems/hallucination-reduction/background",
    });
  });

  it("detects .fr on a problem.yaml slug (the path before extension)", () => {
    expect(parseLocaleFromPath("problems/hallucination-reduction/problem.fr")).toEqual({
      lang: "fr",
      canonicalSlug: "problems/hallucination-reduction/problem",
    });
  });

  it("detects .fr on a paper slug", () => {
    expect(parseLocaleFromPath("papers/attention-is-all-you-need.fr")).toEqual({
      lang: "fr",
      canonicalSlug: "papers/attention-is-all-you-need",
    });
  });

  it("detects explicit .en infix as locale, not as canonical content", () => {
    // The pattern accepts any registered locale; en is rare in practice (EN
    // takes no infix per ADR-0011 D-C) but valid syntactically.
    expect(parseLocaleFromPath("foo.en")).toEqual({
      lang: "en",
      canonicalSlug: "foo",
    });
  });

  it("treats unknown locale-shaped suffix as part of the slug, not a locale", () => {
    expect(parseLocaleFromPath("foo.xx")).toEqual({
      lang: "en",
      canonicalSlug: "foo.xx",
    });
  });

  it("treats double infix as only-the-outer-being-the-locale", () => {
    // `foo.fr.fr` means "the FR translation of a file whose canonical name
    // contains .fr in the middle." Only the outermost .fr is the locale.
    expect(parseLocaleFromPath("foo.fr.fr")).toEqual({
      lang: "fr",
      canonicalSlug: "foo.fr",
    });
  });

  it("handles an empty-string input by returning default locale", () => {
    expect(parseLocaleFromPath("")).toEqual({
      lang: "en",
      canonicalSlug: "",
    });
  });
});
