import { visit } from "unist-util-visit";
import type { Element, ElementContent, Root, Text } from "hast";
import type { Plugin } from "unified";

import type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";

/**
 * Wikilink resolution extension per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 38 — first concrete Phase-37-framework
 * consumer; closes Class B.14 at 9+ phase carryover).
 *
 * Walks the post-sanitize HAST tree, finds text-node substrings
 * matching the kebab-case `[[slug]]` pattern (optionally with
 * `|display-text` alias suffix), and splice-replaces each match
 * with an `<a href={buildHref(slug)}>{display ?? slug}</a>`
 * element node. Slug regex `[a-z0-9-]+` is restrictive by
 * design — the regex IS the validation per APPEND-D-I XSS-
 * safety contract. Anything not matching falls through as
 * literal text.
 *
 * **Phase 46 alias-syntax extension** (since Unit 46.1; closes
 * ADR-0018 APPEND-D-L item 2 at 8-phase carryover): the regex
 * gains an optional non-capturing group `(?:\|([^\]\n]+))?`
 * matching `|display-text` after the slug. Display character
 * class excludes `]` (terminator) and `\n` (paragraph-break
 * boundary). When alias present, the emitted `<a>` element's
 * text content is the display string; when absent (or empty
 * after `|`), the text content falls back to the slug. The
 * `href` resolves via `buildHref(slug)` — only the displayed
 * anchor text varies under default `buildHref`. Display text
 * becomes the text-node content of `<a>` (NOT injected HTML);
 * rehype-stringify's text-node escaping handles HTML-special
 * characters (e.g., `&` → `&amp;`) automatically. **No new XSS
 * surface** introduced — the text-node escape is the line of
 * defense.
 *
 * **Phase 62 plugin parameterization** (since Unit 62.1; closes
 * ADR-0018 APPEND-D-L item 6 at 24-phase carryover — NEW
 * LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE RECORD at the time):
 * plugin signature evolves from `Plugin<[], Root>` to
 * `Plugin<[ResolveWikilinksOptions?], Root>`. The new optional
 * `buildHref?` option lets consumers inject a non-default
 * URL-builder; default-fallback `DEFAULT_BUILD_HREF` (=
 * `(slug) => "/problems/${slug}"`) preserves Phase-38-through-
 * Phase-61 behavior verbatim under bare-plugin invocation.
 * **Third principal axis of zero-rework framework extension
 * introduced** — plugin-option axis joins registry-state axis
 * (Phase 38+) + plugin-body axis (Phase 46+).
 *
 * **Phase 63 cross-entity wikilinks** (since Unit 63.1; closes
 * ADR-0018 APPEND-D-L item 3 at 25-phase carryover — NEW
 * LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE RECORD; third
 * consecutive phase to set the absolute-record): the regex
 * gains an optional non-capturing outer group with inner
 * capture `(?:([a-z0-9-]+):)?` matching `entity-type:` prefix
 * before the slug. The `ResolveWikilinksOptions.buildHref`
 * signature extends from `(slug) => string` to `(slug,
 * entityType?) => string`. A new exported `CROSS_ENTITY_BUILD_HREF`
 * routes per entity-type: `paper` → `/papers/{slug}`, `author`
 * → `/authors/{slug}`, `institution` → `/institutions/{slug}`,
 * fallback (undefined OR unknown entityType) → `/problems/{slug}`
 * (graceful degradation). `DEFAULT_BUILD_HREF` is UNCHANGED
 * (Phase-62 byte-identity contract preserved); receives slug
 * only, silently drops entityType if plugin passes one.
 * **First consumer of a forward-compat plugin-option affordance
 * shipped in a prior phase** in project history (Phase 62
 * affordance → Phase 63 consumer arc). **First registry-level
 * realization of the plugin-option axis** — `WikilinkExtensionRegistry`
 * gains an optional `{ buildHref }` constructor arg; the new
 * `MARKDOWN_EXTENSIONS=wikilinks-cross-entity` arm constructs
 * the cross-entity-aware registry (existing `MARKDOWN_EXTENSIONS=wikilinks`
 * arm continues to emit bare form — Phase 62 invariant
 * preserved).
 *
 * XSS-safety contract preserved across both Phase 62 + Phase 63
 * generations: the captured slug remains constrained to
 * `[a-z0-9-]+` per APPEND-D-I (the regex IS the validation);
 * entityType captured by the same `[a-z0-9-]+` character class
 * (no new XSS surface). Builders that interpolate slug /
 * entityType into URL paths preserve the XSS-safety contract
 * automatically. Builders that produce absolute URLs to
 * untrusted hosts would bypass `rehypeStripUnsafeHrefs` (which
 * runs BEFORE wikilinks per APPEND-D-D); curator-facing builder
 * configuration is a **Phase 64+** concern.
 *
 * Folds AFTER the default `rehype-sanitize` +
 * `rehypeStripUnsafeHrefs` steps per Phase-37 framework's
 * APPEND-D-D plugin-order-after-default discipline. The
 * default-built relative `/problems/{slug}` href bypasses the
 * strip step because the wikilink plugin adds the link AFTER
 * that step runs.
 *
 * Server-only: imported by `WikilinkExtensionRegistry` returned
 * from `getExtensionRegistry()` per the Phase-38 env-var
 * dispatch arm (Unit 38.2). Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB
 * invariant.
 */

const WIKILINK_PATTERN = /\[\[(?:([a-z0-9-]+):)?([a-z0-9-]+)(?:\|([^\]\n]+))?\]\]/g;

/**
 * Default href-builder for `rehypeResolveWikilinks` per
 * ADR-0018 D-G APPEND-D-AT (Phase 62 Unit 62.1). Receives the
 * kebab-case slug captured from `[[slug]]` or `[[slug|display]]`
 * syntax; returns the absolute path `/problems/{slug}`.
 *
 * Byte-identical to the Phase-38-through-Phase-61 hardcoded
 * shape `properties: { href: `/problems/${slug}` }`. Hoisted as
 * an exported constant so tests can assert byte-identity
 * against the Phase-38 baseline without re-implementing the
 * builder. **Phase 63 contract preserved**: 1-arg signature
 * UNCHANGED; entityType captured by the Phase-63 regex
 * extension is silently dropped when the plugin invokes a
 * 1-arg builder (TypeScript optional-param widening allows
 * `(slug) => string` to satisfy `(slug, entityType?) =>
 * string`).
 */
export const DEFAULT_BUILD_HREF = (slug: string): string => `/problems/${slug}`;

/**
 * Cross-entity href-builder for `rehypeResolveWikilinks` per
 * ADR-0018 D-G APPEND-D-AU (Phase 63 Unit 63.1; closes
 * APPEND-D-L item 3 at 25-phase carryover — NEW LONGEST
 * ABSOLUTE APPEND-DEFERRAL CLOSURE RECORD; third consecutive
 * phase to set the absolute-record).
 *
 * Routes per `entityType` captured from regex
 * `(?:([a-z0-9-]+):)?` group:
 * - `paper` → `/papers/{slug}`
 * - `author` → `/authors/{slug}`
 * - `institution` → `/institutions/{slug}`
 * - `undefined` (bare `[[slug]]` syntax) → `/problems/{slug}`
 * - unknown entityType → `/problems/{slug}` (graceful
 *   degradation; curators who typo an entity-type get the same
 *   fallback as bare wikilinks)
 *
 * **First consumer of a forward-compat plugin-option affordance
 * shipped in a prior phase** in project history — Phase 62
 * shipped the `ResolveWikilinksOptions.buildHref` affordance as
 * plugin-option-ready-before-consumer-demand realization; this
 * constant IS the first consumer. Wired into the framework via
 * the new `MARKDOWN_EXTENSIONS=wikilinks-cross-entity` factory
 * arm (Unit 63.2).
 *
 * **XSS-safety contract**: both `slug` and `entityType` are
 * regex-validated to `[a-z0-9-]+` per APPEND-D-I; this builder
 * interpolates them into relative paths only (no external host
 * injection). Mirrors `DEFAULT_BUILD_HREF` XSS-safety posture.
 */
export const CROSS_ENTITY_BUILD_HREF = (slug: string, entityType?: string): string => {
  if (entityType === "paper") return `/papers/${slug}`;
  if (entityType === "author") return `/authors/${slug}`;
  if (entityType === "institution") return `/institutions/${slug}`;
  return `/problems/${slug}`;
};

/**
 * Optional plugin-option interface for `rehypeResolveWikilinks`
 * per ADR-0018 D-G APPEND-D-AT (Phase 62 Unit 62.1; closes
 * APPEND-D-L item 6 at 24-phase carryover) + APPEND-D-AU
 * (Phase 63 Unit 63.1; closes APPEND-D-L item 3 at 25-phase
 * carryover; signature extension).
 *
 * Phase 62 introduces the **plugin-option axis** as the third
 * principal axis of zero-rework framework extension (after the
 * Phase-38+ registry-state axis and Phase-46+ plugin-body
 * axis). Phase 63 extends the `buildHref` signature with an
 * optional second `entityType?` param (captured from the Phase-
 * 63 regex extension); existing Phase-62 1-arg builders
 * continue to work via TypeScript optional-param widening.
 */
export interface ResolveWikilinksOptions {
  /**
   * Optional href-builder. Receives the kebab-case slug
   * captured from `[[slug]]` / `[[slug|display]]` /
   * `[[entity-type:slug]]` / `[[entity-type:slug|display]]`
   * syntax. When the Phase-63 `entity-type:` prefix is present,
   * `entityType` is the captured prefix (`paper` / `author` /
   * `institution` / arbitrary curator-supplied identifier);
   * otherwise `entityType` is `undefined`.
   *
   * Defaults to `DEFAULT_BUILD_HREF` (= `(slug) =>
   * "/problems/${slug}"`) — byte-identical to the Phase
   * 38-through-Phase-61 hardcoded shape; entityType silently
   * dropped (1-arg builder satisfies the 2-arg interface via
   * TypeScript optional-param widening).
   *
   * The Phase-63 `CROSS_ENTITY_BUILD_HREF` exported constant is
   * the canonical 2-arg builder routing per entity-type
   * (`paper` → `/papers`, `author` → `/authors`, `institution`
   * → `/institutions`; fallback `/problems`); wired in by the
   * `MARKDOWN_EXTENSIONS=wikilinks-cross-entity` arm.
   *
   * **XSS-safety contract**: the captured slug AND entityType
   * are constrained to `[a-z0-9-]+` per APPEND-D-I; builders
   * that interpolate the slug / entityType into a URL preserve
   * the XSS-safety contract automatically. Builders that
   * produce absolute URLs to untrusted hosts would bypass the
   * Phase-37 framework's `rehypeStripUnsafeHrefs` step (which
   * runs BEFORE this plugin per APPEND-D-D); curator-facing
   * builder configuration is therefore a **Phase 64+**
   * concern.
   */
  buildHref?: (slug: string, entityType?: string) => string;
}

export const rehypeResolveWikilinks: Plugin<[ResolveWikilinksOptions?], Root> =
  (options = {}) =>
  (tree) => {
    const buildHref = options.buildHref ?? DEFAULT_BUILD_HREF;

    visit(tree, "text", (node, index, parent) => {
      if (typeof node.value !== "string") return;
      if (!parent || index === undefined) return;
      if (!node.value.includes("[[")) return;

      const text = node.value;
      WIKILINK_PATTERN.lastIndex = 0;

      const newNodes: Array<Text | Element> = [];
      let cursor = 0;
      let match: RegExpExecArray | null;

      while ((match = WIKILINK_PATTERN.exec(text)) !== null) {
        const matchStart = match.index;
        // Phase 63 regex captures: (1) optional entity-type, (2) slug,
        // (3) optional alias. Pre-Phase-63 baselines captured (1) slug,
        // (2) alias only. entityType is undefined for bare `[[slug]]`
        // syntax; defined for `[[entity-type:slug]]` syntax.
        const entityType = match[1];
        const slug = match[2];
        const alias = match[3];
        if (slug === undefined) continue;

        if (matchStart > cursor) {
          newNodes.push({ type: "text", value: text.slice(cursor, matchStart) });
        }

        // Display falls back to slug when alias absent. Empty alias
        // `[[slug|]]` cannot match (display class is `+`, requiring
        // at least one char); curator-authored whitespace in alias
        // preserved verbatim (no auto-trim Phase 46).
        const display = alias ?? slug;

        newNodes.push({
          type: "element",
          tagName: "a",
          properties: { href: buildHref(slug, entityType) },
          children: [{ type: "text", value: display }],
        });

        cursor = matchStart + match[0].length;
      }

      if (newNodes.length === 0) return;

      if (cursor < text.length) {
        newNodes.push({ type: "text", value: text.slice(cursor) });
      }

      parent.children.splice(index, 1, ...(newNodes as ElementContent[]));
      return index + newNodes.length;
    });
  };

/**
 * `MarkdownExtensionRegistry` implementation that enables the
 * wikilink-resolution rehype plugin on a curator-specified set
 * of surfaces.
 *
 * **Phase-42 default** (since Unit 42.1):
 * `PHASE_38_DEFAULT_ENABLED_SURFACES` = `Set(["bio",
 * "reviewNotes", "rationale", "actionRationale"])` — all 4
 * wired markdown surfaces enabled. Closes Phase-38 ADR-0018
 * APPEND-D-L item 1 ("Cross-surface wikilink expansion") at 4-
 * phase carryover; demand-signal-first relaxation noted in
 * Phase-42 ADR-0018 D-G APPEND.
 *
 * **Phase-38 default** (Unit 38.1 ship through Phase-41 close):
 * was `Set(["actionRationale"])` — single-surface scope. 16
 * `[[problem-slug]]` occurrences across rating-action YAMLs
 * were the demand-signal that motivated the initial single-
 * surface scope; Phase 42 generalizes to all 4 surfaces under
 * the audit-trail-preserving constant-name discipline
 * (`PHASE_38_DEFAULT_ENABLED_SURFACES` retains its name to
 * encode WHEN it was introduced; the value evolves Phase 42).
 *
 * For non-enabled surfaces (none at Phase 42 default; future
 * curator constructs may pass a narrower set) returns an empty
 * extension set `{}` (= `DefaultExtensionRegistry` behavior).
 * Per-surface differentiation remains the framework's central
 * value — the class is generic over the enabled set.
 *
 * Phase 62 ships the **plugin parameterization affordance**
 * (`ResolveWikilinksOptions.buildHref` — closes APPEND-D-L
 * item 6 at 24-phase carryover); the registry continues to
 * return `{ rehypePlugins: [rehypeResolveWikilinks] }` (bare
 * plugin, no tuple form) so the default-fallback
 * `DEFAULT_BUILD_HREF` preserves Phase-38-through-Phase-61
 * behavior verbatim. **Phase 63+** cross-entity wikilinks
 * (`[[paper-id]]` / `[[author-slug]]` / `[[institution-slug]]`;
 * APPEND-D-L item 3) will compose a non-default registry
 * variant via tuple-form invocation `[rehypeResolveWikilinks,
 * { buildHref }]` — pure plugin-option change, NO registry
 * rework required.
 */
export class WikilinkExtensionRegistry implements MarkdownExtensionRegistry {
  private readonly enabledSurfaces: ReadonlySet<MarkdownSurface>;
  private readonly buildHref: ResolveWikilinksOptions["buildHref"];

  constructor(
    enabledSurfaces: ReadonlySet<MarkdownSurface>,
    options: { buildHref?: ResolveWikilinksOptions["buildHref"] } = {},
  ) {
    this.enabledSurfaces = enabledSurfaces;
    this.buildHref = options.buildHref;
  }

  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet {
    if (!this.enabledSurfaces.has(surface)) return {};
    if (this.buildHref === undefined) {
      // Phase 38-62 bare-form emit preserved when no buildHref is set
      // (the existing `MARKDOWN_EXTENSIONS=wikilinks` arm behavior is
      // byte-identical to Phase 62). The Phase-62 Unit 62.2 invariant
      // "registry-emitted rehypePlugins is the bare plugin reference"
      // is load-bearing here.
      return { rehypePlugins: [rehypeResolveWikilinks] };
    }
    // Phase 63+ tuple-form emit when buildHref is set (Phase 63 Unit
    // 63.2; first registry-level realization of the plugin-option axis;
    // wired via the `MARKDOWN_EXTENSIONS=wikilinks-cross-entity` arm
    // with `CROSS_ENTITY_BUILD_HREF`).
    return { rehypePlugins: [[rehypeResolveWikilinks, { buildHref: this.buildHref }]] };
  }
}

/**
 * Default-enabled-surfaces for `WikilinkExtensionRegistry` per
 * ADR-0018 D-G APPEND Phase-42 EXTENDED block (Unit 42.1).
 *
 * **Phase 42 ship** — all 4 wired markdown surfaces enabled.
 * Closes Phase-38 APPEND-D-L item 1 ("Cross-surface wikilink
 * expansion") at 4-phase carryover; second prep-/APPEND-doc-
 * level deferral closed by a later phase (first was Phase-40
 * closure of Phase-38-prep D-11).
 *
 * **Phase 38 → 41 ship** (historical record) — was
 * `Set(["actionRationale"])`. The constant's NAME preserves
 * audit trail (Phase 38 = introduction phase); the VALUE
 * evolves Phase 42 per the prep-doc D-8 "keep Phase-38 name"
 * lean. Surface enumeration follows `MarkdownSurface` type-
 * union order in `./types.ts` per prep-doc D-9 lean.
 *
 * Imported by the factory dispatch arm `MARKDOWN_EXTENSIONS=wikilinks`
 * in `./index.ts` — Phase 42 expansion flows through the
 * dispatch arm unchanged (constructor-arg-only change; zero
 * plugin / registry / factory rework per the property each
 * Phase 38/39/41 consumer documented).
 */
export const PHASE_38_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "bio",
  "reviewNotes",
  "rationale",
  "actionRationale",
]);
