import { describe, expect, it } from "vitest";

import { bioSchema } from "../sanitize-schema";
import {
  GFM_TABLE_SCHEMA_OVERRIDES,
  PHASE_39_DEFAULT_ENABLED_SURFACES,
  TablesExtensionRegistry,
} from "./tables";

describe("GFM_TABLE_SCHEMA_OVERRIDES — content", () => {
  it("includes the 6 GFM table tags", () => {
    const tagNames = GFM_TABLE_SCHEMA_OVERRIDES.tagNames ?? [];
    expect(tagNames).toContain("table");
    expect(tagNames).toContain("thead");
    expect(tagNames).toContain("tbody");
    expect(tagNames).toContain("tr");
    expect(tagNames).toContain("th");
    expect(tagNames).toContain("td");
  });

  it("includes the Phase-17 base allow-list verbatim per APPEND-D-C override-replace contract", () => {
    // Divergence-detector: if ADR-0018 D-B base allow-list ever expands
    // and this override is not updated, the parity assertion below fails
    // and signals "tables override missed the base-list expansion".
    const tagNames = GFM_TABLE_SCHEMA_OVERRIDES.tagNames ?? [];
    for (const base of bioSchema.tagNames ?? []) {
      expect(tagNames).toContain(base);
    }
  });

  it("includes the Phase-17 base attributes verbatim per APPEND-D-C", () => {
    const attrs = GFM_TABLE_SCHEMA_OVERRIDES.attributes ?? {};
    expect(attrs["a"]).toEqual(["href"]);
    expect(attrs["input"]).toEqual([["type", "checkbox"], "checked", "disabled"]);
    expect(attrs["*"]).toEqual([]);
  });

  it("adds the th + td align attribute with value restriction via the tuple form", () => {
    const attrs = GFM_TABLE_SCHEMA_OVERRIDES.attributes ?? {};
    expect(attrs["th"]).toEqual([["align", "left", "center", "right"]]);
    expect(attrs["td"]).toEqual([["align", "left", "center", "right"]]);
  });

  it("does not add other table-specific attributes Phase 39 (colspan / rowspan / scope deferred Phase 40+)", () => {
    const attrs = GFM_TABLE_SCHEMA_OVERRIDES.attributes ?? {};
    // No colspan / rowspan / scope etc. on th/td in the Phase-39 allow-list.
    const thAttrs = attrs["th"] ?? [];
    const tdAttrs = attrs["td"] ?? [];
    const flat = [...thAttrs, ...tdAttrs].flatMap((entry) =>
      typeof entry === "string" ? [entry] : entry,
    );
    expect(flat).not.toContain("colspan");
    expect(flat).not.toContain("rowspan");
    expect(flat).not.toContain("scope");
  });
});

describe("TablesExtensionRegistry — class behavior", () => {
  it("returns GFM_TABLE_SCHEMA_OVERRIDES for enabled surfaces", () => {
    const r = new TablesExtensionRegistry(new Set(["reviewNotes"]));
    expect(r.getExtensions("reviewNotes")).toEqual({
      schemaOverrides: GFM_TABLE_SCHEMA_OVERRIDES,
    });
  });

  it("returns empty extension set for non-enabled surfaces (Phase-17/27/29 baseline preserved)", () => {
    const r = new TablesExtensionRegistry(new Set(["reviewNotes"]));
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports an empty enabled set (all surfaces disabled)", () => {
    const r = new TablesExtensionRegistry(new Set());
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
  });

  it("supports multiple enabled surfaces (Phase 40+ cross-surface expansion shape)", () => {
    const r = new TablesExtensionRegistry(new Set(["bio", "reviewNotes"]));
    expect(r.getExtensions("bio")).toEqual({
      schemaOverrides: GFM_TABLE_SCHEMA_OVERRIDES,
    });
    expect(r.getExtensions("reviewNotes")).toEqual({
      schemaOverrides: GFM_TABLE_SCHEMA_OVERRIDES,
    });
    expect(r.getExtensions("rationale")).toEqual({});
  });

  it("exposes PHASE_39_DEFAULT_ENABLED_SURFACES = Set of all 4 surfaces (Phase 43 expansion)", () => {
    // Phase 39 ship through Phase-42 close: Set(["reviewNotes"]). Phase 43
    // expansion: all 4 surfaces per ADR-0018 APPEND-D-Q item 2 closure
    // (cross-surface table expansion). Mirrors Phase-42 wikilinks
    // expansion pattern; constant NAME preserved per Phase-42 D-8
    // precedent (Phase 39 = introduction phase encoded in name; VALUE
    // evolves Phase 43).
    expect(PHASE_39_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(true);
    expect(PHASE_39_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(true);
    expect(PHASE_39_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_39_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(true);
    expect(PHASE_39_DEFAULT_ENABLED_SURFACES.size).toBe(4);
  });
});
