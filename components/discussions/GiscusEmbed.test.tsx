import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "next-themes";
import { GiscusEmbed, mapResolvedThemeToGiscus } from "./GiscusEmbed";

describe("mapResolvedThemeToGiscus", () => {
  it("returns 'dark' when resolvedTheme is 'dark'", () => {
    expect(mapResolvedThemeToGiscus("dark")).toBe("dark");
  });

  it("returns 'light' when resolvedTheme is 'light'", () => {
    expect(mapResolvedThemeToGiscus("light")).toBe("light");
  });

  it("returns 'light' when resolvedTheme is undefined (pre-resolve)", () => {
    expect(mapResolvedThemeToGiscus(undefined)).toBe("light");
  });

  it("returns 'light' for any other theme value (e.g. 'system', 'gruvbox')", () => {
    expect(mapResolvedThemeToGiscus("system")).toBe("light");
    expect(mapResolvedThemeToGiscus("gruvbox")).toBe("light");
  });
});

describe("GiscusEmbed (SSR pre-hydration)", () => {
  it("renders the 'Loading discussion…' placeholder before mount", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <GiscusEmbed />
      </ThemeProvider>,
    );
    expect(html).toContain("Loading discussion");
  });

  it("wraps the pre-mount placeholder in a <p> with muted-foreground styling", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <GiscusEmbed />
      </ThemeProvider>,
    );
    expect(html).toMatch(/<p [^>]*class="[^"]*text-muted-foreground[^"]*"/);
  });

  it("does NOT render the Giscus iframe markup pre-hydration (no use-client + useEffect)", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <GiscusEmbed />
      </ThemeProvider>,
    );
    // The actual Giscus iframe is rendered post-mount; SSR output should not
    // include iframe markup. (Hydration-safety contract per the theme-toggle
    // precedent — pre-mount placeholder only.)
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("giscus.app");
  });
});
