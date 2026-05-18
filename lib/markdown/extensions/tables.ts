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
 * Sanitization audit boundary preserved: 6 table tags added
 * are well-understood HTML semantic structure with no XSS-
 * vector-by-name concerns; `align` attribute is value-
 * restricted to 3 literal values via the
 * `[attrName, ...allowedValues]` tuple form.
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
    // Phase-39 GFM table additions
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  attributes: {
    // Phase-17 base attributes (verbatim copy per override-replace)
    a: ["href"],
    input: [["type", "checkbox"], "checked", "disabled"],
    // Phase-39 GFM column-alignment attributes (value-restricted)
    th: [["align", "left", "center", "right"]],
    td: [["align", "left", "center", "right"]],
    "*": [],
  },
};

/**
 * `MarkdownExtensionRegistry` implementation that enables GFM
 * tables on a curator-specified set of surfaces via
 * `schemaOverrides`. Phase-39 default enables `reviewNotes` only
 * (4000-char curator review notes field is the natural surface
 * for tabular COI comparisons / multi-criterion scoring /
 * structured editorial reasoning per Phase-12 ADR-0014).
 *
 * For non-enabled surfaces returns an empty extension set —
 * Phase-18/27/29 baseline preserved on `bio` + `rationale` +
 * `actionRationale`. **Per-surface differentiation** is the
 * framework's central value: the same registry instance
 * simultaneously enables tables on `reviewNotes` AND preserves
 * baseline on the three other surfaces.
 *
 * Mutually exclusive with `WikilinkExtensionRegistry` Phase 39
 * — `getExtensionRegistry()` dispatch arms `wikilinks` and
 * `tables` are alternatives, not composable Phase 39. Multi-
 * value composition deferred to Phase 40+ per Phase-38-prep
 * D-11 deferral.
 *
 * Phase 40+ may expand the enabled set if cross-surface table
 * demand surfaces (zero current content evidence on any
 * surface; Phase-39-prep flagged demand-signal-first weakness
 * as trade-off).
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
 * Phase-39 default-enabled-surfaces for `TablesExtensionRegistry`
 * per ADR-0018 D-G APPEND Phase-39 EXTENDED block. Only
 * `reviewNotes` is enabled at Phase 39 ship; the three other
 * markdown surfaces (`bio` + `rationale` + `actionRationale`)
 * continue to receive the empty extension set. Phase 40+ may
 * expand if cross-surface demand surfaces.
 *
 * Imported by the factory dispatch arm `MARKDOWN_EXTENSIONS=tables`
 * in `./index.ts` (Phase 39 Unit 39.2).
 */
export const PHASE_39_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "reviewNotes",
]);
