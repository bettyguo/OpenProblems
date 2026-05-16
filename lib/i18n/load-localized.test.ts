import { describe, expect, it } from "vitest";
import { resolveLocalized } from "./load-localized";

interface MockMethodology {
  lang: "en" | "fr";
  version: string;
  title: string;
}

const EN_V1: MockMethodology = { lang: "en", version: "1.0.0", title: "Methodology v1.0" };
const FR_V1: MockMethodology = { lang: "fr", version: "1.0.0", title: "Méthodologie v1.0" };
const EN_V2: MockMethodology = { lang: "en", version: "2.0.0", title: "Methodology v2.0" };

describe("resolveLocalized", () => {
  it("returns the FR record when locale=fr and both EN+FR are present", () => {
    const result = resolveLocalized([EN_V1, FR_V1], "fr", (m) => m.version === "1.0.0");
    expect(result).toEqual({ record: FR_V1, didFallback: false });
  });

  it("returns the EN record with didFallback=false when locale=en and both present", () => {
    const result = resolveLocalized([EN_V1, FR_V1], "en", (m) => m.version === "1.0.0");
    expect(result).toEqual({ record: EN_V1, didFallback: false });
  });

  it("returns the EN record with didFallback=true when locale=fr and only EN is present", () => {
    const result = resolveLocalized([EN_V1], "fr", (m) => m.version === "1.0.0");
    expect(result).toEqual({ record: EN_V1, didFallback: true });
  });

  it("returns the EN record with didFallback=false when locale=en and only EN is present", () => {
    const result = resolveLocalized([EN_V1], "en", (m) => m.version === "1.0.0");
    expect(result).toEqual({ record: EN_V1, didFallback: false });
  });

  it("returns null when no record matches the predicate at all", () => {
    const result = resolveLocalized([EN_V1, FR_V1], "fr", (m) => m.version === "99.0.0");
    expect(result).toBeNull();
  });

  it("returns null when only FR exists for the requested key (defensive — EN canonical should always exist)", () => {
    // FR-only is a degenerate state that should not occur in practice (every
    // FR sibling has an EN canonical per ADR-0011 D-C). The resolver returns
    // null rather than the FR record when locale=en falls back, because the
    // fallback chain is FR → EN (one direction).
    const result = resolveLocalized([FR_V1], "en", (m) => m.version === "1.0.0");
    expect(result).toBeNull();
  });

  it("filters by predicate before resolving locale (handles multiple candidate keys)", () => {
    // Collection has both v1 and v2 in EN + FR (v1). The predicate selects
    // only v2; resolver should return EN v2 with didFallback=true for locale=fr
    // (FR v2 doesn't exist).
    const result = resolveLocalized([EN_V1, FR_V1, EN_V2], "fr", (m) => m.version === "2.0.0");
    expect(result).toEqual({ record: EN_V2, didFallback: true });
  });

  it("returns the FR record when filtered to v1 (multiple candidates; predicate narrows)", () => {
    const result = resolveLocalized([EN_V1, FR_V1, EN_V2], "fr", (m) => m.version === "1.0.0");
    expect(result).toEqual({ record: FR_V1, didFallback: false });
  });
});
