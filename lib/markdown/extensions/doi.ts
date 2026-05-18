import { visit } from "unist-util-visit";
import type { Link, PhrasingContent, Root, Text } from "mdast";

import type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";

/**
 * DOI auto-link extension per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 45 — fourth concrete Phase-37-framework
 * consumer; **first second-consumer in any single framework
 * slot** — DOI joins arxiv (Phase 41) in `remarkPlugins`;
 * `rehypePlugins` + `schemaOverrides` slots remain singleton
 * Phase 45).
 *
 * Walks the mdast tree, finds `text`-node substrings matching
 * the Crossref DOI pattern (case-insensitive `doi:` prefix +
 * `10.<registrant>/<suffix>` identifier per Crossref blog
 * "DOIs and matching regular expressions"), and splice-replaces
 * each match with an mdast `link` node:
 *
 *   - `url`: `https://doi.org/10.<registrant>/<suffix>` —
 *     absolute URL on the canonical `doi.org` resolver. The
 *     legacy `dx.doi.org` host redirects to `doi.org` and is
 *     NOT emitted Phase 45 (deferred per ADR-0018 APPEND-D-AC
 *     Phase-46+ deferrals).
 *   - `children`: `[{ type: "text", value: <verbatim-match> }]`
 *     — preserves source casing of the `doi:` prefix and the
 *     DOI suffix character-for-character.
 *
 * The emitted `link` flows through the standard `remark-rehype`
 * mdast→hast bridge and lands as `<a href="https://doi.org/...">doi:...</a>`
 * in HAST. The default `rehype-sanitize` step validates the
 * output against the Phase-17 base allow-list: `<a>` tag,
 * `href` attribute, and `https:` URL scheme are all allow-listed
 * — **NO `schemaOverrides` required** for DOI autolinks
 * (mirrors Phase-41 arxiv discipline; absolute https URLs pass
 * `rehypeStripUnsafeHrefs` naturally).
 *
 * **First compositional same-slot case in project history**
 * (per Phase 45 ship): under `MARKDOWN_EXTENSIONS=arxiv,doi`
 * the `remarkPlugins` slot on shared-enabled surfaces (Phase 45
 * default: `rationale`) carries `[remarkLinkArxivIds, remarkLinkDoiIds]`
 * via `CompositeExtensionRegistry` per APPEND-D-R
 * "concatenated across components in registration order"
 * concatenation rule. The two consumers' regex prefixes are
 * disjoint (`\barxiv:` vs `\bdoi:` lookbehind word-boundary
 * + literal prefix) — plugin invocation order does NOT affect
 * output for these two consumers Phase 45. The framework's
 * concatenation rule, previously trivially satisfied
 * (every slot had exactly one consumer Phase 38-44), is now
 * under real pressure with two consumers in `remarkPlugins`.
 *
 * Pattern strictness: `10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?`
 * matches the Crossref DOI format (4-9-digit registrant +
 * suffix). The trailing lookahead `(?=[\s,;)]|\.(?:\s|$)|$)`
 * bounds the suffix against sentence-terminator punctuation
 * so that "see doi:10.1234/abc.def, also…" correctly matches
 * `doi:10.1234/abc.def` (NOT truncated at the first embedded
 * period) while "cited as doi:10.1234/abc." truncates the
 * trailing sentence-ending period (matches `doi:10.1234/abc`,
 * leaving `.` outside). The disjunction handles the dual role
 * of `.` in DOI suffixes:
 *
 *   - `\s,;)` — these characters are *always* terminators
 *     (whitespace, comma, semicolon, close-paren). DOIs almost
 *     never legitimately contain them mid-suffix in prose.
 *   - `\.(?:\s|$)` — a period is a terminator *only* when
 *     followed by whitespace or end-of-string (sentence-
 *     ending). A period followed by alphanumeric (e.g., `.def`)
 *     is internal to the DOI suffix.
 *   - `$` — end-of-string itself terminates.
 *
 * This is an **explicit Phase-45 ship tradeoff**: most curator-
 * prose DOI citations end on sentence-terminator punctuation;
 * the lookahead favors typical-prose-correctness over edge-
 * case-DOI-correctness. Crossref's full character class allows
 * `;`, `(`, `)` mid-suffix, but these are rare in practice —
 * Phase-45 ship treats them as terminators for prose-
 * correctness; deferred Phase 46+ for stricter context-aware
 * matching via curator-content demand signal.
 *
 * Bare DOIs without `doi:` prefix (numeric-only `10.1234/...`
 * patterns floating in prose) are out of scope Phase 45 —
 * ambiguity is even higher than bare arxiv IDs (the leading
 * `10.` looks identical to generic decimal-then-slash prose).
 * Deferred to Phase 46+ per ADR-0018 APPEND-D-AC.
 *
 * Plugin declaration style: idiomatic remark-plugin function
 * declaration (factory returning a transformer) rather than
 * `Plugin<[], Root>` type alias. Mirrors Phase-41 arxiv
 * discovery: the `Plugin<>` type alias triggers a known
 * TypeScript overload-resolution union-narrowing issue with
 * chained mdast.Root processors that the function-declaration
 * shape avoids.
 *
 * Server-only: imported by `DoiExtensionRegistry` returned
 * from `getExtensionRegistry()` per the Phase-45 env-var
 * dispatch arm (Unit 45.1). Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB
 * invariant.
 */

const DOI_PATTERN = /\bdoi:(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?)(?=[\s,;)]|\.(?:\s|$)|$)/gi;

export function remarkLinkDoiIds() {
  return function transformer(tree: Root): undefined {
    visit(tree, "text", (node, index, parent) => {
      if (typeof node.value !== "string") return;
      if (!parent || index === undefined) return;
      if (!/doi:/i.test(node.value)) return;

      const text = node.value;
      DOI_PATTERN.lastIndex = 0;

      const newNodes: Array<Text | Link> = [];
      let cursor = 0;
      let match: RegExpExecArray | null;

      while ((match = DOI_PATTERN.exec(text)) !== null) {
        const matchStart = match.index;
        const display = match[0];
        const id = match[1];
        if (id === undefined) continue;

        if (matchStart > cursor) {
          newNodes.push({ type: "text", value: text.slice(cursor, matchStart) });
        }

        newNodes.push({
          type: "link",
          url: `https://doi.org/${id}`,
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
 * DOI-autolink remark plugin on a curator-specified set of
 * surfaces.
 *
 * **Phase-45 default** (Unit 45.1 ship):
 * `PHASE_45_DEFAULT_ENABLED_SURFACES` = `Set(["rationale"])` —
 * single-surface scope mirroring the Phase-41 arxiv-first-ship
 * demand-signal-first precedent. `rationale` is the curator
 * paper-citation surface (Phase-27 challenge-resolution
 * rationale text); cross-surface expansion to bio + reviewNotes
 * + actionRationale deferred Phase 46+ per the per-consumer-
 * expansion-as-separate-phase pattern Phase 38→42, Phase 39→43,
 * Phase 41→44 each established.
 *
 * For non-enabled surfaces returns an empty extension set
 * (default-deny). Per-surface differentiation remains the
 * framework's central value — the class is generic over the
 * enabled set.
 *
 * Composes cleanly with:
 *   - Phase 38 `WikilinkExtensionRegistry` (Phase 42 default
 *     all-4): distinct slot (remark vs rehype); conflict-free
 *     on every surface.
 *   - Phase 39 `TablesExtensionRegistry` (Phase 43 default
 *     all-4): distinct slot (remark vs schema); conflict-free
 *     on every surface.
 *   - Phase 41 `ArxivExtensionRegistry` (Phase 44 default
 *     all-4): **SAME slot** (both `remarkPlugins`) — **first
 *     compositional same-slot case** per APPEND-D-R
 *     concatenation rule. Under `CompositeExtensionRegistry`
 *     the `remarkPlugins` array becomes `[remarkLinkArxivIds, remarkLinkDoiIds]`
 *     on shared-enabled surfaces (rationale Phase 45 default).
 *
 * `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi` Phase-45
 * default produces **first 4-consumer composition** under
 * default dispatch:
 *
 *   - bio: wikilinks(rehype) + tables(schema) + arxiv(remark)
 *   - reviewNotes: wikilinks(rehype) + tables(schema) + arxiv(remark)
 *   - rationale: wikilinks(rehype) + tables(schema) + [arxiv, doi](remark)
 *   - actionRationale: wikilinks(rehype) + tables(schema) + arxiv(remark)
 *
 * Only `rationale` carries the doubly-occupied `remarkPlugins`
 * slot Phase 45; the other 3 surfaces match the Phase-44
 * baseline. DOI cross-surface expansion to all 4 surfaces is
 * deferred Phase 46+.
 *
 * Phase 46+ may add DOI cross-surface expansion (APPEND-D-AC
 * Phase-46+ deferrals), DOI display-text alias syntax
 * `[[doi:10.NNNN/xxx|display]]`, bare-DOI matching without
 * `doi:` prefix, or `dx.doi.org` legacy-host parsing.
 */
export class DoiExtensionRegistry implements MarkdownExtensionRegistry {
  private readonly enabledSurfaces: ReadonlySet<MarkdownSurface>;

  constructor(enabledSurfaces: ReadonlySet<MarkdownSurface>) {
    this.enabledSurfaces = enabledSurfaces;
  }

  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet {
    if (this.enabledSurfaces.has(surface)) {
      return { remarkPlugins: [remarkLinkDoiIds] };
    }
    return {};
  }
}

/**
 * Default-enabled-surfaces for `DoiExtensionRegistry` per
 * ADR-0018 D-G APPEND-D-AC (Phase 45 Unit 45.1).
 *
 * **Phase 45 ship** — `rationale`-only (Phase-27 challenge-
 * resolution rationale text). Mirrors the Phase-41 arxiv-first-
 * ship demand-signal-first precedent: curator paper-citation
 * prose lives in `rationale`; cross-surface expansion to bio
 * + reviewNotes + actionRationale deferred Phase 46+ per the
 * per-consumer-expansion-as-separate-phase pattern.
 *
 * Constant's NAME encodes the introduction-phase audit trail
 * (Phase 45 = WHEN the doi consumer first shipped); future
 * cross-surface expansions will evolve the VALUE while
 * preserving the name per Phase-42/43/44 D-8 precedent.
 *
 * Imported by the factory dispatch arm `MARKDOWN_EXTENSIONS=doi`
 * in `./index.ts` — single-value arm + multi-value composition
 * arms `wikilinks,doi` / `tables,doi` / `arxiv,doi` /
 * `wikilinks,tables,doi` / `wikilinks,arxiv,doi` /
 * `tables,arxiv,doi` / `wikilinks,tables,arxiv,doi` all
 * recognized at Phase 45 ship per `buildSingleConsumerRegistry`
 * + `CompositeExtensionRegistry` wrapping.
 */
export const PHASE_45_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "rationale",
]);
