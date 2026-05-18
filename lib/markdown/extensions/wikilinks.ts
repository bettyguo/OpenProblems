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
 * Phase 43+ may add cross-entity wikilinks (`[[paper-id]]` /
 * `[[author-slug]]` / `[[institution-slug]]`) via plugin
 * parameterization (Phase-38 APPEND-D-L items 3 + 6); the
 * expansion is a plugin-option change (NOT a registry rework).
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
