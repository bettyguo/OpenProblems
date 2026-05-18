import { visit } from "unist-util-visit";
import type { Link, PhrasingContent, Root, Text } from "mdast";

import type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";

/**
 * arXiv ID auto-link extension per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 41 — third concrete Phase-37-framework
 * consumer; **completes 3-of-3 framework slot demonstration via
 * real consumer**: Phase 38 wikilinks exercised `rehypePlugins`;
 * Phase 39 tables exercised `schemaOverrides`; Phase 41 arxiv
 * exercises `remarkPlugins`).
 *
 * Walks the mdast tree, finds `text`-node substrings matching the
 * modern arXiv-ID pattern (case-insensitive `arxiv:` prefix +
 * `NNNN.NNNNN[vN]` identifier), and splice-replaces each match
 * with an mdast `link` node:
 *
 *   - `url`: `https://arxiv.org/abs/<id>[<version>]` — absolute
 *     URL on the arxiv.org domain.
 *   - `children`: `[{ type: "text", value: <verbatim-match> }]`
 *     — preserves source casing of the `arxiv:` prefix and any
 *     version suffix.
 *
 * The emitted `link` flows through the standard `remark-rehype`
 * mdast→hast bridge and lands as `<a href="https://arxiv.org/abs/...">arxiv:...</a>`
 * in HAST. The default `rehype-sanitize` step then validates the
 * output against the Phase-17 base allow-list: `<a>` tag,
 * `href` attribute, and `https:` URL scheme are all allow-listed
 * — **NO `schemaOverrides` required** for arxiv autolinks.
 *
 * This architecturally differs from Phase-38 wikilinks:
 *
 *   - **Wikilinks** emit RELATIVE URLs (`/problems/<slug>`) that
 *     the default `rehypeStripUnsafeHrefs` plugin would strip;
 *     they fold AFTER that step (rehype slot) to bypass.
 *   - **Arxiv autolinks** emit ABSOLUTE `https://` URLs that
 *     pass `rehypeStripUnsafeHrefs` naturally; they fold at the
 *     remark stage and rely on standard mdast→hast bridging.
 *
 * Pattern strictness: `\d{4}\.\d{4,5}` matches the modern
 * (post-2007) arXiv-ID format. Older-style category-prefixed IDs
 * (`math/0211159`, `cs.AI/0501001`) are out of scope Phase 41 —
 * none encountered in the project's existing paper-evidence
 * URLs; demand-signal-first deferral to Phase 42+ per
 * ADR-0018 D-G APPEND Phase-42+ deferrals.
 *
 * Plugin declaration style: idiomatic remark-plugin function
 * declaration (factory returning a transformer) rather than
 * `Plugin<[], Root>` type alias. The function-declaration shape
 * matches `remark-gfm` / `remark-parse` / `remark-rehype` and
 * chains cleanly under `unified().use(remarkParse).use(remarkLinkArxivIds)`
 * — TypeScript's overload resolution under `Plugin<>` typing
 * runs into a known union-type narrowing issue with chained
 * mdast.Root processors that the function-declaration form
 * avoids (the function returns a transformer with explicit Root
 * typing, no type alias indirection).
 *
 * Server-only: imported by `ArxivExtensionRegistry` returned
 * from `getExtensionRegistry()` per the Phase-41 env-var
 * dispatch arm (Unit 41.2). Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB
 * invariant.
 */

const ARXIV_PATTERN = /\barxiv:(\d{4}\.\d{4,5})(v\d+)?\b/gi;

export function remarkLinkArxivIds() {
  return function transformer(tree: Root): undefined {
    visit(tree, "text", (node, index, parent) => {
      if (typeof node.value !== "string") return;
      if (!parent || index === undefined) return;
      if (!/arxiv:/i.test(node.value)) return;

      const text = node.value;
      ARXIV_PATTERN.lastIndex = 0;

      const newNodes: Array<Text | Link> = [];
      let cursor = 0;
      let match: RegExpExecArray | null;

      while ((match = ARXIV_PATTERN.exec(text)) !== null) {
        const matchStart = match.index;
        const display = match[0];
        const id = match[1];
        const version = match[2] ?? "";
        if (id === undefined) continue;

        if (matchStart > cursor) {
          newNodes.push({ type: "text", value: text.slice(cursor, matchStart) });
        }

        newNodes.push({
          type: "link",
          url: `https://arxiv.org/abs/${id}${version}`,
          children: [{ type: "text", value: display }],
        });

        cursor = matchStart + display.length;
      }

      if (newNodes.length === 0) return;

      if (cursor < text.length) {
        newNodes.push({ type: "text", value: text.slice(cursor) });
      }

      parent.children.splice(index, 1, ...(newNodes as PhrasingContent[]));
      return index + newNodes.length;
    });
    return undefined;
  };
}

/**
 * `MarkdownExtensionRegistry` implementation that enables the
 * arxiv-autolink remark plugin on a curator-specified set of
 * surfaces. Phase-41 default enables `rationale` only (the
 * Phase-27 challenge-resolution-rationale surface — natural
 * locus for curator paper-citation prose explaining a rating
 * adjudication).
 *
 * For non-enabled surfaces returns an empty extension set
 * (= `DefaultExtensionRegistry` behavior). **Per-surface
 * differentiation** is the framework's central value: the same
 * registry instance simultaneously enables arxiv autolinks on
 * `rationale` AND preserves baseline on `bio` + `reviewNotes` +
 * `actionRationale`.
 *
 * Composes cleanly with Phase 38 `WikilinkExtensionRegistry` and
 * Phase 39 `TablesExtensionRegistry` under
 * `CompositeExtensionRegistry` (Phase 40 infrastructure):
 *
 *   - vs wikilinks: distinct slots (remark vs rehype) AND
 *     distinct surfaces (rationale vs actionRationale).
 *   - vs tables: distinct slots (remark vs schema) AND distinct
 *     surfaces (rationale vs reviewNotes).
 *
 * `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv` becomes a valid
 * env-var value Phase 41 — **first 3-way composition feasibility**
 * under the Phase-40 composition infrastructure.
 *
 * Phase 42+ may expand the enabled set if cross-surface paper-
 * citation prose surfaces (zero current content evidence in
 * user-prose columns); the expansion is a constructor-arg
 * change with zero plugin or registry rework — same property
 * Phase 38 + 39 documented.
 */
export class ArxivExtensionRegistry implements MarkdownExtensionRegistry {
  private readonly enabledSurfaces: ReadonlySet<MarkdownSurface>;

  constructor(enabledSurfaces: ReadonlySet<MarkdownSurface>) {
    this.enabledSurfaces = enabledSurfaces;
  }

  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet {
    if (this.enabledSurfaces.has(surface)) {
      return { remarkPlugins: [remarkLinkArxivIds] };
    }
    return {};
  }
}

/**
 * Phase-41 default-enabled-surfaces for `ArxivExtensionRegistry`
 * per ADR-0018 D-G APPEND Phase-41 EXTENDED block. Only
 * `rationale` is enabled at Phase 41 ship; the three other
 * markdown surfaces (`bio` + `reviewNotes` + `actionRationale`)
 * continue to receive the empty extension set. Phase 42+ may
 * expand if cross-surface paper-citation prose surfaces.
 *
 * Imported by the factory dispatch arm `MARKDOWN_EXTENSIONS=arxiv`
 * in `./index.ts` (Phase 41 Unit 41.2).
 */
export const PHASE_41_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "rationale",
]);
