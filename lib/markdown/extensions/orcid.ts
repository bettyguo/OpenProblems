import { visit } from "unist-util-visit";
import type { Link, PhrasingContent, Root, Text } from "mdast";

import type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";

/**
 * ORCID auto-link extension per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 54 — **sixth concrete Phase-37-framework
 * consumer**; **first 4th-`remarkPlugins` consumer** beyond
 * arxiv (Phase 41) + doi (Phase 45) + pubmed (Phase 50); tests
 * whether the **regex-disjointness-as-sole-defense discipline**
 * (Phase 48 established for 2 same-slot consumers; Phase 49
 * generalized to all 4 surfaces; Phase 50 scaled to 3 same-slot
 * consumers; Phase 52 generalized to all 4 surfaces) scales to
 * 4 same-slot consumers).
 *
 * Walks the mdast tree, finds `text`-node substrings matching
 * the ORCID pattern (case-insensitive `orcid:` prefix + 16-
 * character ORCID iD), and splice-replaces each match with an
 * mdast `link` node:
 *
 *   - `url`: `https://orcid.org/<id>` — absolute URL on the
 *     canonical orcid.org resolver (no trailing slash; matches
 *     official ORCID URL form).
 *   - `children`: `[{ type: "text", value: <verbatim-match> }]`
 *     — preserves source casing of the `orcid:` prefix
 *     character-for-character.
 *
 * The emitted `link` flows through the standard `remark-rehype`
 * mdast→hast bridge and lands as
 * `<a href="https://orcid.org/...">orcid:...</a>` in HAST. The
 * default `rehype-sanitize` step validates the output against
 * the Phase-17 base allow-list: `<a>` tag, `href` attribute, and
 * `https:` URL scheme are all allow-listed — **NO
 * `schemaOverrides` required** for ORCID autolinks (mirrors
 * Phase-41 arxiv + Phase-45 doi + Phase-50 pubmed discipline;
 * absolute https URLs pass `rehypeStripUnsafeHrefs` naturally).
 *
 * **First 4-consumer same-slot composition** in project history
 * (per Phase 54 ship); **first all-4-surfaces 4-consumer same-
 * slot composition** post-Phase-56 (per cross-surface expansion
 * of `PHASE_54_DEFAULT_ENABLED_SURFACES` to all 4 surfaces).
 * Under `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed,orcid` the
 * `remarkPlugins` slot on shared-enabled surfaces (Phase 56
 * default: all 4 surfaces; arxiv + doi + pubmed default-enabled
 * on shared surfaces per Phase 44 / Phase 49 / Phase 52; orcid
 * default-enabled on all 4 surfaces per Phase 56) carries
 * `[remarkLinkArxivIds, remarkLinkDoiIds, remarkLinkPubmedIds, remarkLinkOrcidIds]`
 * via `CompositeExtensionRegistry` per APPEND-D-R "concatenated
 * across components in registration order" concatenation rule.
 * The four consumers' regex character classes are pairwise
 * disjoint via distinct literal prefixes:
 *
 *   - arxiv `arxiv:` + modern `\d{4}\.\d{4,5}` or legacy
 *     `[a-z]+(?:-[a-z]+)*(?:\.[A-Z-]+)?/\d{7}` ID.
 *   - doi `doi:` + `10.<registrant>/<suffix>` ID.
 *   - pubmed `(?:pubmed|pmid):` + `\d{1,9}` ID.
 *   - orcid `orcid:` + `\d{4}-\d{4}-\d{4}-\d{3}[\dX]` ID.
 *
 * No string can match more than one of these regexes via the
 * distinct prefix discriminator. Plugin invocation order is
 * immaterial for the 4-tuple — **regex-disjointness-as-sole-
 * defense discipline scales from 3 to 4 same-slot consumers
 * without architectural change**.
 *
 * Pattern strictness: `\d{4}-\d{4}-\d{4}-\d{3}[\dX]` matches the
 * canonical ORCID iD format — 16 characters total, 4 groups of 4
 * digits separated by hyphens, last character is a digit or
 * uppercase `X` (the ISO/IEC 7064 MOD 11-2 checksum character).
 * Example identifiers: `0000-0002-1825-0097`, `0000-0001-5109-3700`,
 * `0000-0002-9079-593X`. The `[\dX]` checksum class includes `X`
 * to accommodate ORCID's MOD 11-2 checksum, which produces `X`
 * for residue 10. With the `/i` flag the `X` matches case-
 * insensitively (canonical ORCIDs use uppercase `X`; source
 * casing preserved in display).
 *
 * Word-boundary anchors `\b...\b` prevent mid-word matches
 * (`Xorcid:0000-...` rejected; `orcid:0000-...Y` rejected via
 * the trailing `\b` after the checksum character). No trailing-
 * lookahead constraint: the trailing character is `[\dX]` (word
 * char), and `\b` triggers at non-word boundary.
 *
 * **Phase 55 alias-syntax extension** (since Unit 55.1; closes
 * new Phase-54 deferral at 1-phase carryover — ties Phase-51
 * pubmed alias 1-phase fastest-closure record): the regex gains
 * a bracketed alternation `\[\[orcid:NNNN-NNNN-NNNN-NNNN(?:\|display)?\]\]`
 * matched BEFORE the bare form. **Fourth dual-form regex in the
 * framework** (after Phase-47 arxiv + Phase-48 doi + Phase-51
 * pubmed). **Sixth realization of Phase-46 plugin-regex-
 * extension phase-shape pattern** — first 6-realization phase-
 * shape pattern in project history. **All 4 `remarkPlugins`
 * consumers exhibit dual-form regex post-Phase 55** — first
 * state where every consumer in the 4-consumer-cardinality
 * same-slot has been extended with alias-syntax via the dual-
 * form regex pattern. Backwards-compatible: every existing bare
 * `orcid:NNNN-NNNN-NNNN-NNNN` match preserved via the second
 * alternation arm. No collision with wikilinks (`[a-z0-9-]+`
 * slug class excludes `:`); also distinct pipeline stage
 * (`remarkPlugins` runs before `rehypePlugins`). No collision
 * with arxiv/doi/pubmed (same `remarkPlugins` slot; all four
 * regex character classes are pairwise disjoint per the regex-
 * disjointness-as-sole-defense discipline Phase 54 established
 * for 4 same-slot consumers).
 *
 * Plugin declaration style: idiomatic remark-plugin function
 * declaration (factory returning a transformer) rather than
 * `Plugin<[], Root>` type alias. Mirrors Phase-41 arxiv + Phase-
 * 45 doi + Phase-50 pubmed discovery: the `Plugin<>` type alias
 * triggers a known TypeScript overload-resolution union-narrowing
 * issue with chained mdast.Root processors that the function-
 * declaration shape avoids.
 *
 * Server-only: imported by `OrcidExtensionRegistry` returned
 * from `getExtensionRegistry()` per the Phase-54 env-var
 * dispatch arm (Unit 54.1). Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB
 * invariant.
 */

const ORCID_PATTERN =
  /\[\[orcid:(\d{4}-\d{4}-\d{4}-\d{3}[\dX])(?:\|([^\]\n]+))?\]\]|\borcid:(\d{4}-\d{4}-\d{4}-\d{3}[\dX])\b/gi;

export function remarkLinkOrcidIds() {
  return function transformer(tree: Root): undefined {
    visit(tree, "text", (node, index, parent) => {
      if (typeof node.value !== "string") return;
      if (!parent || index === undefined) return;
      if (!/orcid:/i.test(node.value)) return;

      const text = node.value;
      ORCID_PATTERN.lastIndex = 0;

      const newNodes: Array<Text | Link> = [];
      let cursor = 0;
      let match: RegExpExecArray | null;

      while ((match = ORCID_PATTERN.exec(text)) !== null) {
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
          // source casing (e.g., `[[ORCID:0000-0002-1825-0097]]` →
          // `<a>ORCID:0000-0002-1825-0097</a>`).
          display = matched.slice(2, -2);
        } else {
          // Bare form (Phase-54 baseline): display source casing
          // verbatim.
          display = matched;
        }

        if (matchStart > cursor) {
          newNodes.push({ type: "text", value: text.slice(cursor, matchStart) });
        }

        newNodes.push({
          type: "link",
          url: `https://orcid.org/${id}`,
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
 * ORCID-autolink remark plugin on a curator-specified set of
 * surfaces.
 *
 * **Phase-56 default** (Unit 56.1 ship):
 * `PHASE_54_DEFAULT_ENABLED_SURFACES` = `Set(["bio", "reviewNotes", "rationale", "actionRationale"])` —
 * all 4 markdown surfaces, post-cross-surface-expansion (sixth
 * realization of constructor-arg-only zero-rework expansion
 * property; ties Phase-52 fastest cross-surface-closure record
 * at 2-phase carryover Phase 54 → Phase 56). Phase-54 ship was
 * `rationale`-only (single-surface scope mirroring Phase-41
 * arxiv-first-ship + Phase-45 doi-first-ship + Phase-50 pubmed-
 * first-ship demand-signal-first precedent). Constant NAME
 * preserved per Phase-42/43/44/49/52 D-8 precedent — name
 * encodes the introduction-phase audit trail (Phase 54 = WHEN
 * the consumer first shipped); VALUE evolves Phase 56.
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
 *     all-4): **SAME slot** (both `remarkPlugins`).
 *   - Phase 45 `DoiExtensionRegistry` (Phase 49 default
 *     all-4): **SAME slot** (both `remarkPlugins`).
 *   - Phase 50 `PubmedExtensionRegistry` (Phase 52 default
 *     all-4): **SAME slot** (both `remarkPlugins`).
 *
 * **First 4-consumer same-slot composition** in project history
 * under `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed,orcid`. The
 * `remarkPlugins` array becomes
 * `[remarkLinkArxivIds, remarkLinkDoiIds, remarkLinkPubmedIds, remarkLinkOrcidIds]`
 * on shared-enabled surfaces. Conflict-free via regex-
 * disjointness-as-sole-defense (the four character classes are
 * pairwise disjoint via distinct literal prefixes).
 *
 * `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid`
 * Phase-56 default produces **first all-4-surfaces 6-consumer
 * composition** under default dispatch — every surface carries
 * 6 consumers across 3 slots (post-cross-surface expansion of
 * orcid default to all 4 surfaces). Pre-Phase-56 only
 * `rationale` carried 6-consumer composition; Phase 56
 * generalizes the maximum-consumer-cardinality state to all
 * surfaces (Phase-54 asymmetric `[rationale=6, others=5]`
 * becomes symmetric `[all=6]`). **First "all-surfaces saturated
 * at maximum-consumer-cardinality" state** in project history.
 *
 * Phase 55 ships ORCID display-text alias syntax (Unit 55.1;
 * closes new Phase-54 deferral at 1-phase carryover — ties
 * Phase-51 pubmed alias fastest-closure record). The regex
 * dual-form is plugin-internal; class + factory + default-set
 * unchanged. Phase 56 ships ORCID cross-surface expansion
 * (Unit 56.1; closes APPEND-D-AL ORCID cross-surface item at
 * 2-phase carryover — ties Phase-52 fastest cross-surface-
 * expansion closure record). Constructor-arg value-only change
 * in `PHASE_54_DEFAULT_ENABLED_SURFACES`; class + factory +
 * plugin body + regex `ORCID_PATTERN` unchanged.
 *
 * Phase 57+ may add bioRxiv preprint consumer, OSF preprint
 * consumer, or bare ORCID IDs without prefix.
 */
export class OrcidExtensionRegistry implements MarkdownExtensionRegistry {
  private readonly enabledSurfaces: ReadonlySet<MarkdownSurface>;

  constructor(enabledSurfaces: ReadonlySet<MarkdownSurface>) {
    this.enabledSurfaces = enabledSurfaces;
  }

  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet {
    if (this.enabledSurfaces.has(surface)) {
      return { remarkPlugins: [remarkLinkOrcidIds] };
    }
    return {};
  }
}

/**
 * Default-enabled-surfaces for `OrcidExtensionRegistry` per
 * ADR-0018 D-G APPEND-D-AL (Phase 54 Unit 54.1) + APPEND-D-AN
 * (Phase 56 Unit 56.1 cross-surface expansion).
 *
 * **Phase 56 ship** — all 4 markdown surfaces (bio, reviewNotes,
 * rationale, actionRationale). Constructor-arg value-only
 * change in `PHASE_54_DEFAULT_ENABLED_SURFACES`; **sixth
 * realization of "constructor-arg-only zero-rework expansion"
 * property** in project history (Phase 42 wikilinks + Phase 43
 * tables + Phase 44 arxiv + Phase 49 doi + Phase 52 pubmed +
 * Phase 56 orcid). **First 6-realization for the constructor-
 * arg-only-expansion pattern**. **First state with TWO
 * coexisting 6-realization framework patterns** (plugin-regex-
 * extension at 6 from Phase 55 + constructor-arg-only-
 * expansion at 6 from Phase 56). Closes APPEND-D-AL ORCID
 * cross-surface item at 2-phase carryover (Phase 54 → 56) —
 * ties Phase-52 pubmed-cross-surface 2-phase fastest-closure
 * record.
 *
 * **Phase 54 ship** was `rationale`-only (Phase-27 challenge-
 * resolution rationale text). Mirrors the Phase-41 arxiv-first-
 * ship + Phase-45 doi-first-ship + Phase-50 pubmed-first-ship
 * demand-signal-first precedent: curator paper-citation prose
 * lives in `rationale`; cross-surface expansion deferred Phase
 * ~56+ per the per-consumer-expansion-as-separate-phase pattern
 * (closed Phase 56).
 *
 * Constant's NAME encodes the introduction-phase audit trail
 * (Phase 54 = WHEN the orcid consumer first shipped); VALUE
 * evolves Phase 56 per Phase-42/43/44/49/52 D-8 precedent
 * (name preservation + value evolution).
 *
 * Imported by the factory dispatch arm
 * `MARKDOWN_EXTENSIONS=orcid` in `./index.ts` — single-value
 * arm + multi-value composition arms all recognized at Phase
 * 54 ship per `buildSingleConsumerRegistry` +
 * `CompositeExtensionRegistry` wrapping. **7th single-value
 * arm** for `MARKDOWN_EXTENSIONS` (first expansion of the
 * recognized-arms set since Phase 50 `pubmed`).
 */
export const PHASE_54_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "bio",
  "reviewNotes",
  "rationale",
  "actionRationale",
]);
