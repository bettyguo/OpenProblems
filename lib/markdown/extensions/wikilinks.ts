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
 * matching the kebab-case `[[slug]]` pattern, and splice-replaces
 * each match with an `<a href="/problems/{slug}">{slug}</a>`
 * element node. Slug regex `[a-z0-9-]+` is restrictive by
 * design — the regex IS the validation per APPEND-D-I XSS-
 * safety contract. Anything not matching falls through as
 * literal text.
 *
 * Folds AFTER the default `rehype-sanitize` +
 * `rehypeStripUnsafeHrefs` steps per Phase-37 framework's
 * APPEND-D-D plugin-order-after-default discipline. The
 * relative `/problems/{slug}` href bypasses the strip step
 * because the wikilink plugin adds the link AFTER that step
 * runs.
 *
 * Server-only: imported by `WikilinkExtensionRegistry` returned
 * from `getExtensionRegistry()` per the Phase-38 env-var
 * dispatch arm (Unit 38.2). Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB
 * invariant.
 */

const WIKILINK_PATTERN = /\[\[([a-z0-9-]+)\]\]/g;

export const rehypeResolveWikilinks: Plugin<[], Root> = () => (tree) => {
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
      if (slug === undefined) continue;

      if (matchStart > cursor) {
        newNodes.push({ type: "text", value: text.slice(cursor, matchStart) });
      }

      newNodes.push({
        type: "element",
        tagName: "a",
        properties: { href: `/problems/${slug}` },
        children: [{ type: "text", value: slug }],
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
 * of surfaces. Phase-38 default enables `actionRationale` only
 * (the surface where existing content evidence demands
 * resolution — 16 `[[problem-slug]]` occurrences across rating-
 * action YAMLs at Phase-38 ship).
 *
 * For non-enabled surfaces returns an empty extension set
 * `{}` (= `DefaultExtensionRegistry` behavior). This per-surface
 * differentiation is the framework's central value: the same
 * registry instance simultaneously enables wikilinks on
 * `actionRationale` AND preserves Phase-18/27/29 baseline on
 * `bio` + `reviewNotes` + `rationale`.
 *
 * Phase 39+ may expand the enabled set if cross-surface
 * wikilink content emerges (zero current content evidence in
 * the other three surfaces); the expansion is a constructor-
 * arg change with zero plugin or registry rework.
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
 * Phase-38 default-enabled-surfaces for `WikilinkExtensionRegistry`
 * per ADR-0018 D-G APPEND Phase-38 EXTENDED block. Only
 * `actionRationale` is enabled at Phase 38 ship; the three
 * other markdown surfaces (`bio` + `reviewNotes` + `rationale`)
 * continue to receive the empty extension set. Phase 39+ may
 * expand if cross-surface demand surfaces (no current content
 * evidence outside actionRationale).
 *
 * Imported by the factory dispatch arm `MARKDOWN_EXTENSIONS=wikilinks`
 * in `./index.ts` (Phase 38 Unit 38.2).
 */
export const PHASE_38_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "actionRationale",
]);
