import type { Element, Root } from "hast";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import { bioSchema } from "../sanitize-schema";
import {
  GFM_TABLE_SCHEMA_OVERRIDES,
  PHASE_39_DEFAULT_ENABLED_SURFACES,
  TablesExtensionRegistry,
} from "./tables";

/**
 * Phase-57 schema-isolation helper: sanitize a manually-
 * constructed HAST tree through `rehype-sanitize` with the
 * Phase-57-evolved `GFM_TABLE_SCHEMA_OVERRIDES` schema, then
 * compile to HTML for assertion. The markdown pipeline currently
 * does NOT emit `colspan`/`rowspan`/`scope` attributes
 * (`remark-gfm` lacks span/scope markup; `remark-rehype` strips
 * raw HTML via `allowDangerousHtml: false`), so the schema is
 * exercised directly via HAST input — schema-ready-before-plugin
 * pattern per APPEND-D-AO.
 */
function sanitizeTableHast(thead: Element[], tbody: Element[]): string {
  const tree: Root = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "table",
        properties: {},
        children: [
          { type: "element", tagName: "thead", properties: {}, children: thead },
          { type: "element", tagName: "tbody", properties: {}, children: tbody },
        ],
      },
    ],
  };
  const processor = unified().use(rehypeSanitize, GFM_TABLE_SCHEMA_OVERRIDES).use(rehypeStringify);
  const transformed = processor.runSync(tree) as Root;
  return String(processor.stringify(transformed));
}

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

  it("adds th + td align attribute with value restriction + Phase-57 colSpan / rowSpan / scope per APPEND-D-AO", () => {
    // Schema uses PROPERTY names (camelCase JSX-style per `property-
    // information`), not HTML attribute names. `colSpan` / `rowSpan` are
    // the property names that map to HTML `colspan` / `rowspan` attributes
    // post-stringify; `scope` has no camelCase distinction.
    const attrs = GFM_TABLE_SCHEMA_OVERRIDES.attributes ?? {};
    expect(attrs["th"]).toEqual([
      ["align", "left", "center", "right"],
      "colSpan",
      "rowSpan",
      ["scope", "row", "col", "rowgroup", "colgroup"],
    ]);
    expect(attrs["td"]).toEqual([["align", "left", "center", "right"], "colSpan", "rowSpan"]);
  });

  it("Phase-57 table-specific attributes present (colSpan / rowSpan on th + td; scope on th)", () => {
    // **First schema-override extension on the `schemaOverrides` slot kind**
    // (APPEND-D-AO; closes APPEND-D-Q item 3 at 18-phase carryover — new
    // longest absolute APPEND-deferral closure ever observed). Sibling
    // pattern to Phase-46/47/48/51/53/55 plugin-regex-extension realizations.
    const attrs = GFM_TABLE_SCHEMA_OVERRIDES.attributes ?? {};
    const thAttrs = attrs["th"] ?? [];
    const tdAttrs = attrs["td"] ?? [];
    const thFlat = thAttrs.flatMap((entry) => (typeof entry === "string" ? [entry] : entry));
    const tdFlat = tdAttrs.flatMap((entry) => (typeof entry === "string" ? [entry] : entry));
    // th: colSpan + rowSpan + scope (scope is th-only per HTML5 spec)
    expect(thFlat).toContain("colSpan");
    expect(thFlat).toContain("rowSpan");
    expect(thFlat).toContain("scope");
    // td: colSpan + rowSpan (no scope per HTML5 spec)
    expect(tdFlat).toContain("colSpan");
    expect(tdFlat).toContain("rowSpan");
    expect(tdFlat).not.toContain("scope");
  });
});

describe("GFM_TABLE_SCHEMA_OVERRIDES — Phase-57 schema-isolation behavior (first schema-override extension on `schemaOverrides` slot kind)", () => {
  it("<th colspan='3'> survives sanitize (NEW Phase-57)", () => {
    const html = sanitizeTableHast(
      [
        {
          type: "element",
          tagName: "tr",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "th",
              properties: { colSpan: 3 },
              children: [{ type: "text", value: "Header" }],
            },
          ],
        },
      ],
      [],
    );
    expect(html).toContain('colspan="3"');
    expect(html).toContain("<th");
    expect(html).toContain("Header");
  });

  it("<th rowspan='2'> survives sanitize (NEW Phase-57)", () => {
    const html = sanitizeTableHast(
      [
        {
          type: "element",
          tagName: "tr",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "th",
              properties: { rowSpan: 2 },
              children: [{ type: "text", value: "Spanning header" }],
            },
          ],
        },
      ],
      [],
    );
    expect(html).toContain('rowspan="2"');
  });

  it("<th scope='col'> survives sanitize (NEW Phase-57; literal-enum value)", () => {
    const html = sanitizeTableHast(
      [
        {
          type: "element",
          tagName: "tr",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "th",
              properties: { scope: "col" },
              children: [{ type: "text", value: "Col header" }],
            },
          ],
        },
      ],
      [],
    );
    expect(html).toContain('scope="col"');
  });

  it("<th scope='row'> survives sanitize (NEW Phase-57)", () => {
    const html = sanitizeTableHast(
      [],
      [
        {
          type: "element",
          tagName: "tr",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "th",
              properties: { scope: "row" },
              children: [{ type: "text", value: "Row label" }],
            },
          ],
        },
      ],
    );
    expect(html).toContain('scope="row"');
  });

  it("<th scope='rowgroup'> + <th scope='colgroup'> survive sanitize (NEW Phase-57; full 4-literal enum coverage)", () => {
    for (const scope of ["rowgroup", "colgroup"] as const) {
      const html = sanitizeTableHast(
        [
          {
            type: "element",
            tagName: "tr",
            properties: {},
            children: [
              {
                type: "element",
                tagName: "th",
                properties: { scope },
                children: [{ type: "text", value: scope }],
              },
            ],
          },
        ],
        [],
      );
      expect(html).toContain(`scope="${scope}"`);
    }
  });

  it("<td colspan='2'> + <td rowspan='3'> survive sanitize (NEW Phase-57; td gets colspan + rowspan, no scope per HTML5 spec)", () => {
    const html = sanitizeTableHast(
      [],
      [
        {
          type: "element",
          tagName: "tr",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "td",
              properties: { colSpan: 2, rowSpan: 3 },
              children: [{ type: "text", value: "Spanning cell" }],
            },
          ],
        },
      ],
    );
    expect(html).toContain('colspan="2"');
    expect(html).toContain('rowspan="3"');
  });

  it("<th scope='invalid'> STRIPS the scope attribute (NEW Phase-57; literal-enum XSS-audit defense)", () => {
    // Defense-in-depth: scope tuple form `["scope", "row", "col",
    // "rowgroup", "colgroup"]` whitelists exactly 4 literal values per HTML5
    // spec. Any other value gets stripped by `rehype-sanitize`. This
    // mirrors the Phase-39 `align` value-restriction discipline.
    const html = sanitizeTableHast(
      [
        {
          type: "element",
          tagName: "tr",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "th",
              properties: { scope: "invalid" },
              children: [{ type: "text", value: "Header" }],
            },
          ],
        },
      ],
      [],
    );
    expect(html).not.toContain("scope=");
    expect(html).toContain("<th");
    expect(html).toContain("Header");
  });

  it("<th onclick='alert(1)'> STRIPS the onclick attribute (regression-guard: Phase-57 schema-extension does NOT leak XSS surface)", () => {
    // Regression guard: adding colspan/rowspan/scope to th must NOT widen
    // the attribute allow-list to include event-handler attributes. The
    // base attribute filter strips any attribute not in the allow-list.
    const html = sanitizeTableHast(
      [
        {
          type: "element",
          tagName: "tr",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "th",
              properties: { onClick: "alert(1)" },
              children: [{ type: "text", value: "Header" }],
            },
          ],
        },
      ],
      [],
    );
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("alert");
  });

  it("Phase-39 align attribute survives alongside Phase-57 colspan + rowspan + scope on <th> (backwards-compat)", () => {
    // Combined attribute presence: align + colspan + rowspan + scope all
    // survive sanitize, all carry their value restrictions. Validates
    // multi-attribute coexistence on a single <th>.
    const html = sanitizeTableHast(
      [
        {
          type: "element",
          tagName: "tr",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "th",
              properties: { align: "center", colSpan: 2, rowSpan: 1, scope: "col" },
              children: [{ type: "text", value: "Combined" }],
            },
          ],
        },
      ],
      [],
    );
    expect(html).toContain('align="center"');
    expect(html).toContain('colspan="2"');
    expect(html).toContain('rowspan="1"');
    expect(html).toContain('scope="col"');
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
