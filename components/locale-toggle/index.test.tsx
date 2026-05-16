import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { computeToggle, LocaleToggle } from "./index";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("computeToggle (pure helper)", () => {
  it("returns null for a bare path with no locale prefix", () => {
    expect(computeToggle("/about")).toBeNull();
  });

  it("returns null for the root path", () => {
    expect(computeToggle("/")).toBeNull();
  });

  it("returns null when the first segment is not a recognized locale", () => {
    expect(computeToggle("/xx/about")).toBeNull();
    expect(computeToggle("/problems/foo")).toBeNull();
  });

  it("computes the toggle target for an EN-prefixed path", () => {
    expect(computeToggle("/en/about")).toEqual({
      currentLocale: "en",
      targetLocale: "fr",
      targetHref: "/fr/about",
    });
  });

  it("computes the toggle target for an FR-prefixed path", () => {
    expect(computeToggle("/fr/about")).toEqual({
      currentLocale: "fr",
      targetLocale: "en",
      targetHref: "/en/about",
    });
  });

  it("preserves multi-segment paths under the new locale", () => {
    expect(computeToggle("/en/problems/hallucination-reduction/talk")).toEqual({
      currentLocale: "en",
      targetLocale: "fr",
      targetHref: "/fr/problems/hallucination-reduction/talk",
    });
  });

  it("returns just the locale root when path is /en or /fr (no rest)", () => {
    expect(computeToggle("/en")).toEqual({
      currentLocale: "en",
      targetLocale: "fr",
      targetHref: "/fr",
    });
    expect(computeToggle("/fr/")).toEqual({
      currentLocale: "fr",
      targetLocale: "en",
      targetHref: "/en",
    });
  });
});

describe("<LocaleToggle />", () => {
  it("renders nothing on a bare path", () => {
    vi.mocked(usePathname).mockReturnValue("/about");
    const html = renderToStaticMarkup(<LocaleToggle />);
    expect(html).toBe("");
  });

  it("renders an EN-labeled link to /fr/about when on /en/about", () => {
    vi.mocked(usePathname).mockReturnValue("/en/about");
    const html = renderToStaticMarkup(<LocaleToggle />);
    expect(html).toContain('href="/fr/about"');
    expect(html).toContain(">EN<");
    expect(html).toContain('aria-label="Passer au français"');
  });

  it("renders an FR-labeled link to /en/about when on /fr/about", () => {
    vi.mocked(usePathname).mockReturnValue("/fr/about");
    const html = renderToStaticMarkup(<LocaleToggle />);
    expect(html).toContain('href="/en/about"');
    expect(html).toContain(">FR<");
    expect(html).toContain('aria-label="Switch to English"');
  });

  it("forwards an optional className to the anchor", () => {
    vi.mocked(usePathname).mockReturnValue("/en/about");
    const html = renderToStaticMarkup(<LocaleToggle className="custom-x" />);
    expect(html).toContain("custom-x");
  });
});
