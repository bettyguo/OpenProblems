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
 * **Phase 48 alias-syntax extension** (since Unit 48.1; closes
 * ADR-0018 APPEND-D-AC item 2 at 3-phase carryover, tying the
 * Phase-44 fastest-closure record): the regex gains a bracketed
 * alternation `\[\[doi:10.NNNN/xxx(?:\|display)?\]\]` matched
 * BEFORE the bare form. **Second dual-form regex in the
 * framework** (after Phase-47 arxiv) — bracketed form (priority)
 * + bare form (fallback) coexist via alternation. **First
 * "selectively-applied lookahead in dual-form regex"**:
 * bracketed alternative has explicit `]]` terminator → no
 * lookahead needed (full Crossref suffix class permissive
 * inside brackets); bare alternative preserves the Phase-45
 * prose-friendly trailing-punctuation lookahead verbatim.
 * Backwards-compatible: every existing bare `doi:10.NNNN/xxx`
 * match preserved via the second alternation arm. No collision
 * with wikilinks plugin (`[a-z0-9-]+` slug class excludes `:`,
 * `.`, `/`); also distinct pipeline stage (`remarkPlugins` runs
 * before `rehypePlugins`). No collision with arxiv plugin
 * (same `remarkPlugins` slot; arxiv requires `\d{4}\.\d{4,5}`
 * with no `/`; doi requires `10.<reg>/<suffix>` with `/`):
 * regex character classes literally cannot match the same
 * string — **regex-disjointness-as-sole-defense discipline** for
 * same-slot composition.
 *
 * Server-only: imported by `DoiExtensionRegistry` returned
 * from `getExtensionRegistry()` per the Phase-45 env-var
 * dispatch arm (Unit 45.1). Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB
 * invariant.
 */

const DOI_PATTERN =
  /\[\[doi:(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?)(?:\|([^\]\n]+))?\]\]|\bdoi:(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?)(?=[\s,;)]|\.(?:\s|$)|$)/gi;

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
        const matched = match[0];
        const isBracketed = matched.startsWith("[[");

        const id = isBracketed ? match[1] : match[3];
        const alias = match[2]; // only defined for bracketed form
        if (id === undefined) continue;

        let display: string;
        if (alias !== undefined) {
          display = alias;
        } else if (isBracketed) {
          // Bracketed without alias: drop brackets while preserving
          // source casing (e.g., `[[DOI:10.1234/abc]]` →
          // `<a>DOI:10.1234/abc</a>`).
          display = matched.slice(2, -2);
        } else {
          // Bare form (Phase-45 baseline): display source casing
          // verbatim (e.g., `Doi:10.1234/abc.def`).
          display = matched;
        }

        if (matchStart > cursor) {
          newNodes.push({ type: "text", value: text.slice(cursor, matchStart) });
        }

        newNodes.push({
          type: "link",
          url: `https://doi.org/${id}`,
          children: [{ type: "text", value: display }],
        });

        cursor = matchStart + matched.length;
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
 * **Phase-49 default** (since Unit 49.1):
 * `PHASE_45_DEFAULT_ENABLED_SURFACES` = `Set(["bio",
 * "reviewNotes", "rationale", "actionRationale"])` — all 4
 * wired markdown surfaces enabled. Closes Phase-45 ADR-0018
 * APPEND-D-AC cross-surface item at 4-phase carryover
 * (matches Phase-38 → 42 + Phase-39 → 43 4-phase cadence
 * verbatim). **Fourth real-consumer-expansion realization**
 * of the "constructor-arg-only zero-rework expansion" property
 * (Phase 42 wikilinks first; Phase 43 tables second; Phase 44
 * arxiv third; Phase 49 doi fourth). **Completes the per-
 * consumer all-4-surfaces arc**: all 4 Phase-37-framework
 * consumers ship default-enabled on all 4 surfaces.
 *
 * **Phase-45 default** (Unit 45.1 ship through Phase-48 close):
 * was `Set(["rationale"])` — single-surface scope (Phase-27
 * challenge-resolution-rationale surface as the natural locus
 * for curator paper-citation prose). Phase 49 generalizes to
 * all 4 surfaces under the audit-trail-preserving constant-name
 * discipline (Phase 45 = introduction phase encoded in name;
 * VALUE evolves Phase 49).
 *
 * For non-enabled surfaces (none at Phase 49 default; future
 * curator constructs may pass a narrower set) returns an empty
 * extension set. Per-surface differentiation remains the
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
 *     all-4): **SAME slot** (both `remarkPlugins`) — same-slot
 *     composition per APPEND-D-R concatenation rule. Under
 *     `CompositeExtensionRegistry` the `remarkPlugins` array
 *     becomes `[remarkLinkArxivIds, remarkLinkDoiIds]` on
 *     shared-enabled surfaces. Phase 49 generalizes this state
 *     from rationale-only (Phase 45 first same-slot case) to
 *     ALL 4 surfaces — **first "all 4 surfaces have same-slot
 *     composition" state** in project history. Regex-
 *     disjointness-as-sole-defense discipline (arxiv ID class
 *     `\d{4}\.\d{4,5}` lacks `/`; doi ID class requires `/`)
 *     becomes the production collision-freedom guarantee on
 *     every surface, not just rationale.
 *
 * `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi` Phase-49
 * default produces **maximal multi-consumer all-surfaces
 * composition under default dispatch**:
 *
 *   - bio: wikilinks(rehype) + tables(schema) + [arxiv, doi](remark)
 *   - reviewNotes: wikilinks(rehype) + tables(schema) + [arxiv, doi](remark)
 *   - rationale: wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — Phase-45 baseline preserved
 *   - actionRationale: wikilinks(rehype) + tables(schema) + [arxiv, doi](remark)
 *
 * **All 4 surfaces carry the doubly-occupied `remarkPlugins`
 * slot** post-Phase-49 + the Phase-46/47/48 alias-syntax
 * extensions on wikilinks + arxiv + doi → **first "all 4
 * surfaces are triple-alias" state** in project history.
 *
 * Phase 50+ may add bare-DOI matching without `doi:` prefix,
 * `dx.doi.org` legacy-host parsing, or stricter trailing-
 * lookahead for legitimate trailing-period DOIs (APPEND-D-AC
 * Phase-50+ deferrals).
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
 * ADR-0018 D-G APPEND Phase-49 EXTENDED block (Unit 49.1).
 *
 * **Phase 49 ship** — all 4 wired markdown surfaces enabled.
 * Closes Phase-45 ADR-0018 APPEND-D-AC cross-surface item at
 * 4-phase carryover (matches Phase-38 → 42 + Phase-39 → 43
 * 4-phase cadence verbatim). **Fourth prep-/APPEND-doc-level
 * deferral closed by value-only change** (Phase 42 closed D-L
 * item 1; Phase 43 closed D-Q item 2; Phase 44 closed D-Y item
 * 1; Phase 49 closes D-AC cross-surface item). **Fifth cross-
 * surface-expansion APPEND-deferral closure** in the cadence
 * (Phase 42 + 43 + 44 + 49). **Completes the per-consumer all-
 * 4-surfaces arc**: all 4 Phase-37-framework consumers ship
 * default-enabled on all 4 surfaces.
 *
 * **Phase 45 → 48 ship** (historical record) — was
 * `Set(["rationale"])`. The constant's NAME preserves the
 * introduction-phase audit trail (Phase 45 = WHEN the doi
 * consumer first shipped); the VALUE evolves Phase 49 per the
 * Phase-42/43/44 D-8 precedent. Surface enumeration follows
 * `MarkdownSurface` type-union order per Phase-42/43/44 D-9
 * precedent.
 *
 * Imported by the factory dispatch arm `MARKDOWN_EXTENSIONS=doi`
 * in `./index.ts` — Phase 49 expansion flows through the
 * dispatch arm unchanged (constructor-arg-only change; zero
 * plugin / registry / factory rework per the property each
 * Phase 38/39/41/45 consumer documented). Fourth-consumer
 * realization of the property after Phase-42 wikilinks +
 * Phase-43 tables + Phase-44 arxiv.
 */
export const PHASE_45_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "bio",
  "reviewNotes",
  "rationale",
  "actionRationale",
]);
