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
 * surfaces.
 *
 * **Phase-44 default** (since Unit 44.1):
 * `PHASE_41_DEFAULT_ENABLED_SURFACES` = `Set(["bio",
 * "reviewNotes", "rationale", "actionRationale"])` — all 4
 * wired markdown surfaces enabled. Closes Phase-41 ADR-0018
 * APPEND-D-Y item 1 ("Cross-surface arxiv expansion") at 3-
 * phase carryover; **third real-consumer-expansion realization**
 * of the "constructor-arg-only zero-rework expansion" property
 * (Phase 42 wikilinks first; Phase 43 tables second; Phase 44
 * arxiv third). **Completes the per-consumer expansion arc**:
 * all 3 Phase-37-framework consumers ship default-enabled on
 * all 4 surfaces.
 *
 * **Phase-41 default** (Unit 41.1 ship through Phase-43 close):
 * was `Set(["rationale"])` — single-surface scope (Phase-27
 * challenge-resolution-rationale surface as the natural locus
 * for curator paper-citation prose). Phase 44 generalizes to
 * all 4 surfaces under the audit-trail-preserving constant-name
 * discipline (Phase 41 = introduction phase encoded in name;
 * VALUE evolves Phase 44).
 *
 * For non-enabled surfaces (none at Phase 44 default; future
 * curator constructs may pass a narrower set) returns an empty
 * extension set. Per-surface differentiation remains the
 * framework's central value — the class is generic over the
 * enabled set.
 *
 * Composes cleanly with Phase 38 `WikilinkExtensionRegistry`
 * (Phase 42 default all-4) and Phase 39 `TablesExtensionRegistry`
 * (Phase 43 default all-4) under `CompositeExtensionRegistry`:
 *
 *   - vs wikilinks: distinct slots (remark vs rehype);
 *     conflict-free on every surface.
 *   - vs tables: distinct slots (remark vs schema); conflict-
 *     free on every surface.
 *
 * `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv` Phase-44 default
 * produces **all 3 framework slots active on all 4 surfaces**
 * — maximal multi-consumer all-surfaces composition.
 *
 * Phase 45+ may add older-style category-prefixed arxiv IDs
 * (APPEND-D-Y item 2), bare arxiv IDs without prefix (item 3),
 * DOI sibling consumer (item 4; first compositional same-slot
 * case), display-text alias syntax (item 5), or paper-card
 * hover-preview (item 6).
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
 * Default-enabled-surfaces for `ArxivExtensionRegistry` per
 * ADR-0018 D-G APPEND Phase-44 EXTENDED block (Unit 44.1).
 *
 * **Phase 44 ship** — all 4 wired markdown surfaces enabled.
 * Closes Phase-41 APPEND-D-Y item 1 ("Cross-surface arxiv
 * expansion") at 3-phase carryover. **Third prep-/APPEND-doc-
 * level deferral closed by value-only change** (Phase 42 closed
 * D-L item 1; Phase 43 closed D-Q item 2; Phase 44 closes D-Y
 * item 1). **Completes the per-consumer expansion arc**: all
 * 3 Phase-37-framework consumers ship default-enabled on all 4
 * surfaces.
 *
 * **Phase 41 → 43 ship** (historical record) — was
 * `Set(["rationale"])`. The constant's NAME preserves the
 * introduction-phase audit trail (Phase 41 = WHEN the arxiv
 * consumer first shipped); the VALUE evolves Phase 44 per the
 * Phase-42 D-8 + Phase-43 D-8 precedent. Surface enumeration
 * follows `MarkdownSurface` type-union order per Phase-42 D-9
 * + Phase-43 D-9 precedent.
 *
 * Imported by the factory dispatch arm `MARKDOWN_EXTENSIONS=arxiv`
 * in `./index.ts` — Phase 44 expansion flows through the
 * dispatch arm unchanged (constructor-arg-only change; zero
 * plugin / registry / factory rework per the property each
 * Phase 38/39/41 consumer documented). Third-consumer
 * realization of the property after Phase-42 wikilinks +
 * Phase-43 tables.
 */
export const PHASE_41_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "bio",
  "reviewNotes",
  "rationale",
  "actionRationale",
]);
