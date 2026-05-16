import { describe, expect, it } from "vitest";
import { defaultLocale, isLocale, locales, type Locale } from "./routing";

describe("locales constant", () => {
  it("contains exactly 'en' and 'fr' (Phase 7 bilingual scope)", () => {
    expect(locales).toEqual(["en", "fr"]);
  });

  it("is readonly (typed `as const`)", () => {
    // Compile-time check: assigning a wider type fails TypeScript. Runtime
    // assertion just confirms the array is non-empty and the elements are
    // strings — readonly-ness is a TS-only contract.
    expect(locales.length).toBeGreaterThan(0);
    for (const l of locales) {
      expect(typeof l).toBe("string");
    }
  });
});

describe("defaultLocale", () => {
  it("is 'en' (ADR-0011 D-B default)", () => {
    expect(defaultLocale).toBe("en");
  });

  it("is a member of the locales array", () => {
    expect((locales as readonly string[]).includes(defaultLocale)).toBe(true);
  });
});

describe("isLocale (type-narrowing helper)", () => {
  it("returns true for 'en'", () => {
    expect(isLocale("en")).toBe(true);
  });

  it("returns true for 'fr'", () => {
    expect(isLocale("fr")).toBe(true);
  });

  it("returns false for an unrecognized locale string", () => {
    expect(isLocale("xx")).toBe(false);
    expect(isLocale("zh-CN")).toBe(false);
    expect(isLocale("EN")).toBe(false); // case-sensitive
    expect(isLocale("")).toBe(false);
  });

  it("returns false for null / undefined / non-string inputs", () => {
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("narrows the type when used in a guard (compile-time check)", () => {
    // Pure type-narrowing test: after `isLocale(value)`, `value` should be of
    // type `Locale`. Tested by assigning to a `Locale`-typed variable.
    const candidate: string = "fr";
    if (isLocale(candidate)) {
      const narrowed: Locale = candidate;
      expect(narrowed).toBe("fr");
    }
  });
});
