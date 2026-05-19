import type { Options as Schema } from "rehype-sanitize";

import type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";

/**
 * GFM tables extension per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 39 — second concrete Phase-37-framework
 * consumer; validates the framework's `schemaOverrides` slot
 * end-to-end; Phase 38 wikilinks consumer used only the
 * `rehypePlugins` slot).
 *
 * `remark-gfm` (already in the Phase-17 pipeline) parses GFM
 * tables into HAST `<table>` / `<thead>` / `<tbody>` / `<tr>`
 * / `<th>` / `<td>` element nodes. These are currently
 * STRIPPED at sanitize because the Phase-17 base allow-list
 * (`bioSchema.tagNames`) does not include table tags. Phase 39
 * adds the 6 table tags via `schemaOverrides`-replace per
 * Phase-37 framework APPEND-D-C override-replace semantics
 * — **no new runtime dep, no new remark plugin, no plugin-
 * order concerns**.
 *
 * GFM column alignment (`|:---|---:|:---:|`) sets `align`
 * attribute on `<th>` and `<td>`; the override allow-list
 * restricts `align` values to `"left" | "center" | "right"`
 * via the tuple form to preserve the XSS-audit boundary.
 *
 * **Phase-57 schema-extension** (since Unit 57.1): adds
 * `colspan` / `rowspan` (name-only allow; HTML5 parses as
 * non-negative-integer non-injection-vector) and `scope`
 * (literal-enum-restricted to `"row" | "col" | "rowgroup" |
 * "colgroup"` via tuple form) attributes on `<th>` plus
 * `colspan` / `rowspan` on `<td>`. **First schema-override
 * extension on the `schemaOverrides` slot kind** in project
 * history; sibling pattern to the Phase-46/47/48/51/53/55
 * plugin-regex-extension realizations. Closes ADR-0018
 * APPEND-D-Q item 3 at **18-phase carryover** (Phase 39 →
 * Phase 57) — new longest absolute APPEND-deferral closure
 * ever observed at the time (beats prior 12-phase Phase 41
 * → 53 D-Y item 2 record).
 *
 * **Phase-61 schema-extension** (since Unit 61.1): adds
 * `caption` to the `tagNames` allow-list, mirroring the
 * Phase-57 schema-ready-before-plugin discipline. **Second
 * realization of the Phase-57-derived schema-extension
 * phase-shape pattern** in project history; **first 2-
 * realization for that pattern** (extends Phase-57 record
 * 1 → 2). **First state where the schema-extension
 * pattern is observed twice within the same consumer**
 * (tables). **Tables consumer gains 3rd evolution post-
 * first-ship** (Phase 43 cross-surface + Phase 57
 * attributes + Phase 61 caption); **first state where
 * TWO consumers have 3+ evolutions each** (arxiv first via
 * Phase 44 + 47 + 53; tables joins). Closes ADR-0018
 * APPEND-D-Q item 4 at **22-phase carryover** (Phase 39 →
 * Phase 61) — **NEW LONGEST ABSOLUTE APPEND-DEFERRAL
 * CLOSURE EVER OBSERVED** (extends Phase-57 18-phase
 * record by 4 phases). **D-Q becomes first D-clause with
 * 3-of-4 enumerated items closed** (items 1 + 3 + 4;
 * only item 6 surface-specific table schemas remaining).
 * **Schema-ready-before-plugin state extended from
 * attributes (Phase 57) to tags (Phase 61)** — first
 * TAG-addition schema-ready-before-plugin in project
 * history. HTML5 `<caption>` has no caption-specific
 * attributes (the historical `align` attribute is
 * obsolete); minimal XSS surface — text-only element
 * with no event-handler attribute paths.
 *
 * Pipeline-emission caveat (preserved Phase-57 → Phase-61):
 * `remark-gfm` does NOT emit `<caption>` (GFM table syntax
 * has no caption markup) or span/scope (GFM table syntax
 * has no span/scope markup) and `remark-rehype` with
 * `allowDangerousHtml: false` strips raw HTML; therefore
 * NO current Phase-37-framework pipeline emits these
 * attributes or the caption tag — Phase 57 + Phase 61
 * ship the schema-ready-before-plugin state for future
 * plugin authors (e.g., MultiMarkdown-table, HTML-table-
 * pass-through). Schema-isolation tests in
 * `tables.test.ts` exercise the new allow-list entries
 * directly via manual HAST tree construction.
 *
 * Server-only: imported by `TablesExtensionRegistry` returned
 * from `getExtensionRegistry()` per the Phase-39 env-var
 * dispatch arm (Unit 39.2). Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB
 * invariant.
 */

/**
 * `Partial<Schema>` adding GFM table tag + attribute support
 * over the Phase-17 base allow-list. Per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND APPEND-D-C **override-replace semantics**: this
 * override supplies the FULL replacement for `tagNames` and
 * `attributes` — the framework does NOT deep-merge. Callers
 * must include the full base list verbatim plus new entries.
 *
 * Phase 39 + parity test in `tables.test.ts` asserts that
 * every entry in `bioSchema.tagNames` appears in this
 * override's `tagNames`, so a future ADR-0018 D-B base allow-
 * list expansion that omits this override will surface as a
 * test failure (divergence-detector pattern).
 *
 * Sanitization audit boundary preserved: 7 table tags added
 * are well-understood HTML semantic structure with no XSS-
 * vector-by-name concerns; `align` attribute is value-
 * restricted to 3 literal values via the
 * `[attrName, ...allowedValues]` tuple form. Phase-57
 * adds `colspan` / `rowspan` (name-only allow; non-
 * injection-vector per HTML5 spec) and `scope` (4-literal
 * enum restriction matching the HTML5 `scope` attribute
 * spec) per APPEND-D-AO. Phase-61 adds `caption` to
 * `tagNames` (HTML5 `<caption>` has no caption-specific
 * attributes; text-only element; no XSS-vector-by-name
 * concerns) per APPEND-D-AS.
 */
export const GFM_TABLE_SCHEMA_OVERRIDES: Partial<Schema> = {
  tagNames: [
    // Phase-17 base allow-list (verbatim copy per APPEND-D-C override-replace)
    "p",
    "strong",
    "em",
    "code",
    "pre",
    "a",
    "ul",
    "ol",
    "li",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "hr",
    "del",
    "br",
    "input",
    // Phase-39 GFM table additions + Phase-61 caption
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "caption",
  ],
  attributes: {
    // Phase-17 base attributes (verbatim copy per override-replace)
    a: ["href"],
    input: [["type", "checkbox"], "checked", "disabled"],
    // Phase-39 GFM column-alignment + Phase-57 table-specific attributes.
    // Schema uses PROPERTY names (camelCase per `property-information`),
    // not HTML attribute names — `colSpan`/`rowSpan` are the JSX-style
    // property names emitted into HAST by remark-rehype + future plugins.
    th: [
      ["align", "left", "center", "right"],
      "colSpan",
      "rowSpan",
      ["scope", "row", "col", "rowgroup", "colgroup"],
    ],
    td: [["align", "left", "center", "right"], "colSpan", "rowSpan"],
    "*": [],
  },
};

/**
 * `MarkdownExtensionRegistry` implementation that enables GFM
 * tables on a curator-specified set of surfaces via
 * `schemaOverrides`.
 *
 * **Phase-43 default** (since Unit 43.1):
 * `PHASE_39_DEFAULT_ENABLED_SURFACES` = `Set(["bio",
 * "reviewNotes", "rationale", "actionRationale"])` — all 4
 * wired markdown surfaces enabled. Closes Phase-39 ADR-0018
 * APPEND-D-Q item 2 ("Cross-surface table expansion") at 4-
 * phase carryover; demand-signal-first relaxation noted in
 * Phase-43 ADR-0018 D-G APPEND (mirrors Phase-42 wikilinks
 * expansion pattern).
 *
 * **Phase-39 default** (Unit 39.1 ship through Phase-42 close):
 * was `Set(["reviewNotes"])` — single-surface scope (4000-char
 * curator review notes field as natural surface for tabular
 * COI comparisons / multi-criterion scoring / structured
 * editorial reasoning per Phase-12 ADR-0014). Phase 43
 * generalizes to all 4 surfaces under the audit-trail-preserving
 * constant-name discipline (`PHASE_39_DEFAULT_ENABLED_SURFACES`
 * retains its name to encode WHEN it was introduced; VALUE
 * evolves Phase 43).
 *
 * For non-enabled surfaces (none at Phase 43 default; future
 * curator constructs may pass a narrower set) returns an empty
 * extension set — Phase-18/27/29 baseline preserved on
 * non-enabled surfaces. Per-surface differentiation remains
 * the framework's central value — the class is generic over
 * the enabled set.
 *
 * Composes cleanly with `WikilinkExtensionRegistry` (Phase 42
 * default all-4) under `CompositeExtensionRegistry`: tables's
 * `schemaOverrides` slot + wikilinks's `rehypePlugins` slot
 * are distinct; conflict-free on every surface per APPEND-D-R.
 * Composes with `ArxivExtensionRegistry` similarly (arxiv's
 * `remarkPlugins` slot is also distinct).
 *
 * Phase 57 ships table-specific attributes (`colspan` /
 * `rowspan` on `<th>` / `<td>`; `scope` on `<th>`; APPEND-
 * D-Q item 3 closed at 18-phase carryover — new longest
 * absolute APPEND-deferral closure ever observed) via in-
 * place schema-extension on `GFM_TABLE_SCHEMA_OVERRIDES`.
 * Phase 58+ may add `<caption>` element (APPEND-D-Q item 4)
 * or surface-specific table schemas (APPEND-D-Q item 6)
 * via per-surface enabled-set differentiation.
 */
export class TablesExtensionRegistry implements MarkdownExtensionRegistry {
  private readonly enabledSurfaces: ReadonlySet<MarkdownSurface>;

  constructor(enabledSurfaces: ReadonlySet<MarkdownSurface>) {
    this.enabledSurfaces = enabledSurfaces;
  }

  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet {
    if (this.enabledSurfaces.has(surface)) {
      return { schemaOverrides: GFM_TABLE_SCHEMA_OVERRIDES };
    }
    return {};
  }
}

/**
 * Default-enabled-surfaces for `TablesExtensionRegistry` per
 * ADR-0018 D-G APPEND Phase-43 EXTENDED block (Unit 43.1).
 *
 * **Phase 43 ship** — all 4 wired markdown surfaces enabled.
 * Closes Phase-39 APPEND-D-Q item 2 ("Cross-surface table
 * expansion") at 4-phase carryover; second prep-/APPEND-doc-
 * level deferral closed by a later phase via value-only change
 * (first was Phase-42 closure of APPEND-D-L item 1 wikilinks
 * cross-surface expansion). Establishes per-phase APPEND-
 * deferral closure cadence: one APPEND-deferral resolved per
 * phase, oldest first.
 *
 * **Phase 39 → 42 ship** (historical record) — was
 * `Set(["reviewNotes"])`. The constant's NAME preserves the
 * introduction-phase audit trail (Phase 39 = WHEN the tables
 * consumer first shipped); the VALUE evolves Phase 43 to
 * reflect demand-signal-relaxed cross-surface ship. Surface
 * enumeration follows `MarkdownSurface` type-union order from
 * `./types.ts`: `bio, reviewNotes, rationale, actionRationale`
 * (mirrors Phase-42 D-9 precedent).
 *
 * Imported by the factory dispatch arm `MARKDOWN_EXTENSIONS=tables`
 * in `./index.ts` — Phase 43 expansion flows through the
 * dispatch arm unchanged (constructor-arg-only change; zero
 * plugin / registry / factory rework per the property each
 * Phase 38/39/41 consumer documented; second-consumer
 * realization of the property after Phase-42 wikilinks).
 */
export const PHASE_39_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "bio",
  "reviewNotes",
  "rationale",
  "actionRationale",
]);
