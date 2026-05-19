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
  it("includes the 7 GFM table tags (Phase-39 6 base tags + Phase-61 caption)", () => {
    const tagNames = GFM_TABLE_SCHEMA_OVERRIDES.tagNames ?? [];
    expect(tagNames).toContain("table");
    expect(tagNames).toContain("thead");
    expect(tagNames).toContain("tbody");
    expect(tagNames).toContain("tr");
    expect(tagNames).toContain("th");
    expect(tagNames).toContain("td");
    // Phase-61 schema-extension addition (APPEND-D-AS):
    expect(tagNames).toContain("caption");
  });

  it("Phase-61 caption tag added to tagNames per APPEND-D-AS (second schema-extension realization; first 2-realization for that pattern; first state where schema-extension is observed twice within the same consumer)", () => {
    // **Second realization of the Phase-57-derived schema-extension
    // phase-shape pattern** in project history (Phase 57 attributes;
    // Phase 61 caption). First 2-realization for that pattern (extends
    // Phase-57 record 1 → 2). First state where the schema-extension
    // pattern is observed twice within the same consumer (tables).
    // **Tables consumer gains 3rd evolution post-first-ship** (Phase
    // 43 cross-surface + Phase 57 attributes + Phase 61 caption);
    // first state where TWO consumers have 3+ evolutions each (arxiv
    // first via Phase 44 + 47 + 53; tables joins). Closes APPEND-D-Q
    // item 4 at 22-phase carryover (Phase 39 → 61) — NEW LONGEST
    // ABSOLUTE APPEND-DEFERRAL CLOSURE EVER OBSERVED (extends Phase-57
    // 18-phase record by 4 phases). Schema-ready-before-plugin
    // discipline extended from attributes (Phase 57) to tags (Phase
    // 61) — first TAG-addition schema-ready-before-plugin.
    const tagNames = GFM_TABLE_SCHEMA_OVERRIDES.tagNames ?? [];
    expect(tagNames).toContain("caption");
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

describe("GFM_TABLE_SCHEMA_OVERRIDES — Phase-61 schema-isolation behavior (second schema-extension realization; <caption> tag schema-ready-before-plugin)", () => {
  /**
   * Phase-61 schema-isolation helper: sanitize a manually-constructed
   * HAST tree containing a `<caption>` element. Mirrors the Phase-57
   * `sanitizeTableHast` pattern but accepts a caption child of `<table>`
   * (caption is positioned as the first child of table per HTML5 spec).
   */
  function sanitizeTableHastWithCaption(captionText: string): string {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "table",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "caption",
              properties: {},
              children: [{ type: "text", value: captionText }],
            },
            {
              type: "element",
              tagName: "thead",
              properties: {},
              children: [],
            },
            {
              type: "element",
              tagName: "tbody",
              properties: {},
              children: [],
            },
          ],
        },
      ],
    };
    const processor = unified()
      .use(rehypeSanitize, GFM_TABLE_SCHEMA_OVERRIDES)
      .use(rehypeStringify);
    const transformed = processor.runSync(tree) as Root;
    return String(processor.stringify(transformed));
  }

  it("<caption>Title</caption> child of <table> survives sanitize (NEW Phase-61; second schema-extension realization)", () => {
    // Phase-61 closes APPEND-D-Q item 4 at 22-phase carryover (Phase 39
    // → Phase 61) — NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE EVER
    // OBSERVED (extends Phase-57 18-phase record by 4 phases). Pipeline-
    // emission caveat: `remark-gfm` does NOT parse GFM-table captions
    // (GFM table syntax has no caption markup); `remark-rehype` with
    // `allowDangerousHtml: false` strips raw HTML. Therefore no current
    // Phase-37-framework pipeline emits `<caption>` — Phase 61 ships
    // the schema-ready-before-plugin state. Mirrors Phase-57 caveat
    // verbatim.
    const html = sanitizeTableHastWithCaption("Sample Table Title");
    expect(html).toContain("<caption>Sample Table Title</caption>");
    expect(html).toContain("<table>");
  });

  it("<caption> with inline <strong> + <em> survives sanitize (NEW Phase-61; inline elements already allow-listed via Phase-17 base)", () => {
    // caption with inline children: <caption>Sample <strong>important</strong>
    // <em>note</em></caption>. The inline tags (strong/em) are in the
    // Phase-17 base allow-list; caption is the new Phase-61 addition.
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "table",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "caption",
              properties: {},
              children: [
                { type: "text", value: "Sample " },
                {
                  type: "element",
                  tagName: "strong",
                  properties: {},
                  children: [{ type: "text", value: "important" }],
                },
                { type: "text", value: " " },
                {
                  type: "element",
                  tagName: "em",
                  properties: {},
                  children: [{ type: "text", value: "note" }],
                },
              ],
            },
          ],
        },
      ],
    };
    const processor = unified()
      .use(rehypeSanitize, GFM_TABLE_SCHEMA_OVERRIDES)
      .use(rehypeStringify);
    const transformed = processor.runSync(tree) as Root;
    const html = String(processor.stringify(transformed));
    expect(html).toContain("<caption>Sample <strong>important</strong> <em>note</em></caption>");
  });

  it("<caption> with onclick attribute has the attribute stripped (XSS regression guard; no caption-specific attributes allowed per HTML5)", () => {
    // Phase-61 schema-extension adds `caption` to tagNames but does NOT
    // add any caption-specific attributes to `attributes`. HTML5 spec
    // has no caption-specific attributes (the historical `align`
    // attribute is obsolete). Sanitize strips any caption attribute
    // including XSS-vector `onclick` per the global `attributes["*"]
    // = []` rule.
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "table",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "caption",
              properties: { onClick: "alert(1)" },
              children: [{ type: "text", value: "Title" }],
            },
          ],
        },
      ],
    };
    const processor = unified()
      .use(rehypeSanitize, GFM_TABLE_SCHEMA_OVERRIDES)
      .use(rehypeStringify);
    const transformed = processor.runSync(tree) as Root;
    const html = String(processor.stringify(transformed));
    expect(html).toContain("<caption>Title</caption>");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("onClick");
    expect(html).not.toContain("alert(1)");
  });

  it("<caption> is STRIPPED under bioSchema baseline (NEW Phase-61 negative control; confirms schema-extension is load-bearing)", () => {
    // Phase-17 base allow-list (bioSchema) does NOT include `caption` in
    // tagNames. Without the Phase-61 schemaOverrides addition, the
    // caption element is stripped by sanitize. Confirms that the Phase-
    // 61 schema-extension is load-bearing for caption survival — without
    // it, captions don't survive sanitize.
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "table",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "caption",
              properties: {},
              children: [{ type: "text", value: "Stripped Title" }],
            },
          ],
        },
      ],
    };
    const processor = unified().use(rehypeSanitize, bioSchema).use(rehypeStringify);
    const transformed = processor.runSync(tree) as Root;
    const html = String(processor.stringify(transformed));
    // bioSchema doesn't allow-list `table` or `caption` either, so both
    // tags get stripped. The text-node content survives.
    expect(html).not.toContain("<caption>");
    expect(html).not.toContain("</caption>");
    expect(html).toContain("Stripped Title");
  });

  it("<caption> + Phase-57 attributes coexist (NEW Phase-61; cumulative schema-extension state preserved)", () => {
    // Validates that Phase-61 caption addition does NOT regress the
    // Phase-57 schema-extension state. A table with both <caption> and
    // <th colspan="2" scope="col"> renders correctly under the Phase-
    // 61 schemaOverrides.
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "table",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "caption",
              properties: {},
              children: [{ type: "text", value: "Combined Phase-57 + Phase-61" }],
            },
            {
              type: "element",
              tagName: "thead",
              properties: {},
              children: [
                {
                  type: "element",
                  tagName: "tr",
                  properties: {},
                  children: [
                    {
                      type: "element",
                      tagName: "th",
                      properties: { colSpan: 2, scope: "col" },
                      children: [{ type: "text", value: "Spanning Header" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const processor = unified()
      .use(rehypeSanitize, GFM_TABLE_SCHEMA_OVERRIDES)
      .use(rehypeStringify);
    const transformed = processor.runSync(tree) as Root;
    const html = String(processor.stringify(transformed));
    expect(html).toContain("<caption>Combined Phase-57 + Phase-61</caption>");
    expect(html).toContain('colspan="2"');
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

describe("GFM_TABLE_SCHEMA_OVERRIDES — Phase-57 multi-attribute + multi-cell edge cases", () => {
  it("<td colspan='2' rowspan='3'> with both span attributes survives sanitize (multi-attribute combination)", () => {
    // Sparse-data table use case: single cell spanning a 2x3 region.
    // Both span attributes on a single <td> must survive sanitize.
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
    expect(html).toContain("Spanning cell");
  });

  it("multi-row table with varying scope + span attributes per row survives sanitize", () => {
    // Real-world multi-row scenario: thead has column headers with
    // scope='col' + first cell with rowspan; tbody has row headers with
    // scope='row' + cells with colspan.
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
              properties: { scope: "col", colSpan: 2 },
              children: [{ type: "text", value: "Combined header" }],
            },
            {
              type: "element",
              tagName: "th",
              properties: { scope: "col" },
              children: [{ type: "text", value: "C3" }],
            },
          ],
        },
      ],
      [
        {
          type: "element",
          tagName: "tr",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "th",
              properties: { scope: "row", rowSpan: 2 },
              children: [{ type: "text", value: "Group A" }],
            },
            {
              type: "element",
              tagName: "td",
              properties: {},
              children: [{ type: "text", value: "x" }],
            },
            {
              type: "element",
              tagName: "td",
              properties: {},
              children: [{ type: "text", value: "y" }],
            },
          ],
        },
      ],
    );
    // Header row: <th scope="col" colspan="2">Combined header</th>
    expect(html).toContain('scope="col"');
    expect(html).toContain('colspan="2"');
    expect(html).toContain("Combined header");
    // Body row: <th scope="row" rowspan="2">Group A</th>
    expect(html).toContain('scope="row"');
    expect(html).toContain('rowspan="2"');
    expect(html).toContain("Group A");
  });

  it("<th scope='all'> (HTML4 legacy value) STRIPS the attribute (HTML5-only literal-enum restriction)", () => {
    // HTML4 supported scope='all' but HTML5 dropped it. Schema enforces
    // HTML5-only via the 4-literal tuple form. Validates that legacy
    // values are rejected.
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
              properties: { scope: "all" },
              children: [{ type: "text", value: "Cell" }],
            },
          ],
        },
      ],
      [],
    );
    expect(html).not.toContain('scope="all"');
    expect(html).not.toContain("scope=");
    expect(html).toContain("Cell");
  });

  it("<td scope='col'> STRIPS the scope attribute (td has no scope per HTML5 spec; td schema entry omits scope)", () => {
    // HTML5 scope attribute is th-only; td schema entry does NOT include
    // scope. A scope='col' on td gets stripped by the schema even though
    // the LITERAL VALUE 'col' would be valid on <th>. Validates that the
    // per-element schema scoping (th vs td) is enforced.
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
              properties: { scope: "col" },
              children: [{ type: "text", value: "Cell" }],
            },
          ],
        },
      ],
    );
    expect(html).not.toContain('scope="col"');
    expect(html).not.toContain("scope=");
    expect(html).toContain("Cell");
  });

  it("<th style='color:red'> STRIPS the style attribute (regression-guard: Phase-57 schema-extension does not widen attribute allow-list beyond colSpan/rowSpan/scope)", () => {
    // Defense-in-depth: adding colSpan/rowSpan/scope must NOT widen the
    // allow-list to include style (a known XSS vector via CSS injection
    // pre-CSP era; defense-in-depth strips at sanitize regardless).
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
              properties: { style: "color:red", colSpan: 2 },
              children: [{ type: "text", value: "Cell" }],
            },
          ],
        },
      ],
      [],
    );
    expect(html).not.toContain("style=");
    expect(html).not.toContain("color:red");
    // The legitimate Phase-57 attribute survives.
    expect(html).toContain('colspan="2"');
    expect(html).toContain("Cell");
  });

  it("colSpan='0' (HTML4 'span all remaining columns' semantics) SURVIVES sanitize as name-only allow per Phase-57 D-12 lean", () => {
    // HTML4 colspan='0' meant "span all remaining columns to the end of
    // the column group"; HTML5 deprecated this semantics (browsers now
    // treat it as 1). The Phase-57 schema-extension allows name-only
    // (no value enumeration) per the D-12 XSS-audit conclusion — non-
    // numeric / edge-case values pass through schema and the browser
    // applies HTML5 parsing semantics. Validates that the deliberate
    // departure from APPEND-D-Q "numeric-only restriction" anticipatory
    // language preserves this flexibility.
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
              properties: { colSpan: 0 },
              children: [{ type: "text", value: "Span-rest" }],
            },
          ],
        },
      ],
      [],
    );
    expect(html).toContain("colspan=");
    expect(html).toContain("Span-rest");
  });
});
