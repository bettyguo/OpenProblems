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
 * LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE RECORD): plugin
 * signature evolves from `Plugin<[], Root>` to
 * `Plugin<[ResolveWikilinksOptions?], Root>`. The new optional
 * `buildHref?: (slug: string) => string` option lets consumers
 * inject a non-default URL-builder; default-fallback
 * `DEFAULT_BUILD_HREF` (= `(slug) => "/problems/${slug}"`)
 * preserves Phase-38-through-Phase-61 behavior verbatim under
 * bare-plugin invocation. **Third principal axis of zero-rework
 * framework extension introduced** — plugin-option axis joins
 * registry-state axis (Phase 38+) + plugin-body axis (Phase
 * 46+). **Prerequisite for Phase 63 cross-entity wikilinks**
 * (APPEND-D-L item 3). XSS-safety contract preserved: the
 * captured slug remains constrained to `[a-z0-9-]+` per
 * APPEND-D-I; builders that interpolate the slug into a URL
 * preserve the XSS-safety contract automatically. Builders
 * that produce absolute URLs to untrusted hosts would bypass
 * `rehypeStripUnsafeHrefs` (which runs BEFORE wikilinks per
 * APPEND-D-D); curator-facing builder configuration is a
 * **Phase 63+** concern.
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

const WIKILINK_PATTERN = /\[\[([a-z0-9-]+)(?:\|([^\]\n]+))?\]\]/g;

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
 * builder.
 */
export const DEFAULT_BUILD_HREF = (slug: string): string => `/problems/${slug}`;

/**
 * Optional plugin-option interface for `rehypeResolveWikilinks`
 * per ADR-0018 D-G APPEND-D-AT (Phase 62 Unit 62.1; closes
 * APPEND-D-L item 6 at 24-phase carryover).
 *
 * Phase 62 introduces the **plugin-option axis** as the third
 * principal axis of zero-rework framework extension (after the
 * Phase-38+ registry-state axis and Phase-46+ plugin-body
 * axis). Future Phase-63 cross-entity wikilinks consumer
 * (APPEND-D-L item 3) will pass a `buildHref` that inspects
 * slug shape / prefix to route per entity-type (paper / author
 * / institution / problem).
 */
export interface ResolveWikilinksOptions {
  /**
   * Optional href-builder. Receives the kebab-case slug
   * captured from `[[slug]]` or `[[slug|display]]` syntax;
   * returns the absolute or relative URL string to use as the
   * emitted `<a href="...">` value.
   *
   * Defaults to `DEFAULT_BUILD_HREF` (= `(slug) =>
   * "/problems/${slug}"`) — byte-identical to the Phase
   * 38-through-Phase-61 hardcoded shape.
   *
   * **XSS-safety contract**: the captured slug is constrained
   * to `[a-z0-9-]+` per APPEND-D-I; builders that interpolate
   * the slug into a URL preserve the XSS-safety contract
   * automatically. Builders that produce absolute URLs to
   * untrusted hosts would bypass the Phase-37 framework's
   * `rehypeStripUnsafeHrefs` step (which runs BEFORE this
   * plugin per APPEND-D-D); curator-facing builder
   * configuration is therefore a **Phase 63+** concern, NOT a
   * Phase 62 affordance.
   */
  buildHref?: (slug: string) => string;
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
        const slug = match[1];
        const alias = match[2];
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
          properties: { href: buildHref(slug) },
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

  constructor(enabledSurfaces: ReadonlySet<MarkdownSurface>) {
    this.enabledSurfaces = enabledSurfaces;
  }

  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet {
    if (this.enabledSurfaces.has(surface)) {
      return { rehypePlugins: [rehypeResolveWikilinks] };
    }
    return {};
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
