import { visit } from "unist-util-visit";
import type { Link, PhrasingContent, Root, Text } from "mdast";

import type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";

/**
 * PubMed PMID auto-link extension per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 50 — **fifth concrete Phase-37-framework
 * consumer**; **first 3rd-`remarkPlugins` consumer** beyond
 * arxiv (Phase 41) + doi (Phase 45); tests whether the
 * **regex-disjointness-as-sole-defense discipline** (Phase 48
 * established for 2 same-slot consumers; Phase 49 generalized
 * to all 4 surfaces) scales to 3 same-slot consumers).
 *
 * Walks the mdast tree, finds `text`-node substrings matching
 * the PubMed PMID pattern (case-insensitive `pubmed:` OR
 * `pmid:` prefix + 1-9-digit numeric identifier), and splice-
 * replaces each match with an mdast `link` node:
 *
 *   - `url`: `https://pubmed.ncbi.nlm.nih.gov/<id>/` — absolute
 *     URL on the canonical pubmed.ncbi.nlm.nih.gov resolver
 *     (trailing slash per official NCBI URL form).
 *   - `children`: `[{ type: "text", value: <verbatim-match> }]`
 *     — preserves source casing of the `pubmed:` / `pmid:`
 *     prefix character-for-character.
 *
 * The emitted `link` flows through the standard `remark-rehype`
 * mdast→hast bridge and lands as
 * `<a href="https://pubmed.ncbi.nlm.nih.gov/.../">pubmed:...</a>`
 * in HAST. The default `rehype-sanitize` step validates the
 * output against the Phase-17 base allow-list: `<a>` tag,
 * `href` attribute, and `https:` URL scheme are all allow-listed
 * — **NO `schemaOverrides` required** for PubMed autolinks
 * (mirrors Phase-41 arxiv + Phase-45 doi discipline; absolute
 * https URLs pass `rehypeStripUnsafeHrefs` naturally).
 *
 * **First 3-consumer same-slot composition** in project
 * history (per Phase 50 ship): under
 * `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed` the `remarkPlugins`
 * slot on shared-enabled surfaces (Phase 52 default: all 4
 * surfaces; arxiv + doi + pubmed all default-enabled on every
 * surface post-Phase-52) carries `[remarkLinkArxivIds,
 * remarkLinkDoiIds, remarkLinkPubmedIds]` via
 * `CompositeExtensionRegistry` per APPEND-D-R "concatenated
 * across components in registration order" concatenation rule.
 * **First "all 4 surfaces have 3-consumer same-slot composition"
 * state** in project history (Phase 52 ship; Phase-50 ship was
 * rationale-only). The three consumers' regex character classes
 * are pairwise disjoint:
 *
 *   - arxiv `\d{4}\.\d{4,5}` — requires `.` between digits;
 *     lacks `:` and `/`.
 *   - doi `10\.<registrant>/<suffix>` — requires `10.` literal
 *     prefix and `/` separator.
 *   - pubmed `(?:pubmed|pmid):\d{1,9}` — requires literal
 *     `pubmed:` or `pmid:` prefix; pure digit identifier.
 *
 * No string can match more than one of these regexes. Plugin
 * invocation order is immaterial for the triple — the
 * **regex-disjointness-as-sole-defense discipline scales
 * from 2 to 3 same-slot consumers without architectural
 * change**.
 *
 * Two prefix variants supported: `pubmed:` AND `pmid:`. Both
 * are standard scientific-literature conventions — `pmid:` is
 * more common in formal citations; `pubmed:` is more common
 * in conversational/blog-style prose. Single regex alternation
 * `(?:pubmed|pmid):` handles both; single plugin emits the
 * same canonical URL form regardless of source prefix.
 *
 * Pattern strictness: `\d{1,9}` matches 1-9-digit PubMed IDs.
 * Modern PMIDs are 7-9 digits (as of 2025 the highest assigned
 * is ~38 million, 8 digits); historical PMIDs back to PMID 1
 * (~1960s MEDLINE indexing) are short. 10-digit identifiers
 * rejected — no legitimate PMID exceeds 9 digits at current
 * count-growth rate; admitting 10+ would risk matching
 * unrelated decimal sequences in prose.
 *
 * Word-boundary anchors `\b...\b` prevent mid-word matches
 * (`Xpubmed:1234` rejected; `pubmed:1234X` rejected via the
 * trailing `\b` after `\d`). No trailing-lookahead constraint
 * unlike DOI: PubMed IDs are pure digits with no embedded
 * punctuation, so `\b` is sufficient for trailing termination.
 *
 * **Phase 51 alias-syntax extension** (since Unit 51.1; closes
 * new Phase-50 deferral at 1-phase carryover — fastest APPEND-
 * deferral closure ever observed): the regex gains a bracketed
 * alternation `\[\[(?:pubmed|pmid):NNN(?:\|display)?\]\]`
 * matched BEFORE the bare form. **Third dual-form regex in
 * the framework** (after Phase-47 arxiv + Phase-48 doi).
 * **First dual-form regex with inner prefix-alternation inside
 * the bracketed branch** — the `(?:pubmed|pmid):` alternation
 * appears in BOTH the bracketed and bare alternatives,
 * inheriting Phase-50 dual-prefix support. Backwards-compatible:
 * every existing bare `pubmed:NNN` / `pmid:NNN` match preserved
 * via the second alternation arm. No collision with wikilinks
 * (`[a-z0-9-]+` slug class excludes `:`); also distinct
 * pipeline stage (`remarkPlugins` runs before `rehypePlugins`).
 * No collision with arxiv/doi (same `remarkPlugins` slot; all
 * three regex character classes are pairwise disjoint per the
 * regex-disjointness-as-sole-defense discipline Phase 50
 * established for 3 same-slot consumers).
 *
 * Plugin declaration style: idiomatic remark-plugin function
 * declaration (factory returning a transformer) rather than
 * `Plugin<[], Root>` type alias. Mirrors Phase-41 arxiv +
 * Phase-45 doi discovery: the `Plugin<>` type alias triggers a
 * known TypeScript overload-resolution union-narrowing issue
 * with chained mdast.Root processors that the function-
 * declaration shape avoids.
 *
 * Server-only: imported by `PubmedExtensionRegistry` returned
 * from `getExtensionRegistry()` per the Phase-50 env-var
 * dispatch arm (Unit 50.1). Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB
 * invariant.
 */

const PUBMED_PATTERN =
  /\[\[(?:pubmed|pmid):(\d{1,9})(?:\|([^\]\n]+))?\]\]|\b(?:pubmed|pmid):(\d{1,9})\b/gi;

export function remarkLinkPubmedIds() {
  return function transformer(tree: Root): undefined {
    visit(tree, "text", (node, index, parent) => {
      if (typeof node.value !== "string") return;
      if (!parent || index === undefined) return;
      if (!/(?:pubmed|pmid):/i.test(node.value)) return;

      const text = node.value;
      PUBMED_PATTERN.lastIndex = 0;

      const newNodes: Array<Text | Link> = [];
      let cursor = 0;
      let match: RegExpExecArray | null;

      while ((match = PUBMED_PATTERN.exec(text)) !== null) {
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
          // source casing of the prefix variant + identifier (e.g.,
          // `[[PMID:12345678]]` → `<a>PMID:12345678</a>`).
          display = matched.slice(2, -2);
        } else {
          // Bare form (Phase-50 baseline): display source casing
          // verbatim.
          display = matched;
        }

        if (matchStart > cursor) {
          newNodes.push({ type: "text", value: text.slice(cursor, matchStart) });
        }

        newNodes.push({
          type: "link",
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
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
 * PubMed-PMID-autolink remark plugin on a curator-specified set
 * of surfaces.
 *
 * **Phase-52 default** (Unit 52.1 ship): `PHASE_50_DEFAULT_ENABLED_SURFACES`
 * = `Set(["bio", "reviewNotes", "rationale", "actionRationale"])`
 * — all 4 wired markdown surfaces. Cross-surface expansion at
 * **2-phase carryover** (Phase 50 → 52) — **fastest cross-
 * surface-expansion APPEND-deferral closure ever observed**
 * (beats prior 3-phase Phase-41 → 44 record). **Fifth
 * realization of "constructor-arg-only zero-rework expansion"
 * property** (Phase 42 wikilinks + Phase 43 tables + Phase 44
 * arxiv + Phase 49 doi + Phase 52 pubmed); **first 5-
 * realization property in project history**. Pre-Phase-52 ship
 * was `Set(["rationale"])` — Phase-27 challenge-resolution
 * rationale text only.
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
 *
 * **First 3-consumer same-slot composition** in project
 * history under `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed`. The
 * `remarkPlugins` array becomes
 * `[remarkLinkArxivIds, remarkLinkDoiIds, remarkLinkPubmedIds]`
 * on shared-enabled surfaces. Conflict-free via regex-
 * disjointness-as-sole-defense (the three character classes
 * are pairwise disjoint).
 *
 * `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed`
 * Phase-52 default produces **first "all 4 surfaces with 5-
 * consumer composition under default dispatch" state** in
 * project history — every surface carries 5 consumers across
 * 3 slots. **Maximum-consumer-cardinality state generalized
 * to all surfaces** (Phase 50 ship first-realized the 5-
 * consumer composition on rationale only; Phase 52 generalizes
 * to all 4 surfaces).
 *
 * Phase 53+ may add ORCID auto-link consumer (sixth concrete
 * consumer; first 4th-`remarkPlugins` consumer), bioRxiv /
 * OSF preprint consumers, older-style category-prefixed arxiv
 * IDs, bare arxiv / DOI / PubMed IDs without prefix, dx.doi.org
 * legacy host parsing, or table-specific attributes.
 */
export class PubmedExtensionRegistry implements MarkdownExtensionRegistry {
  private readonly enabledSurfaces: ReadonlySet<MarkdownSurface>;

  constructor(enabledSurfaces: ReadonlySet<MarkdownSurface>) {
    this.enabledSurfaces = enabledSurfaces;
  }

  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet {
    if (this.enabledSurfaces.has(surface)) {
      return { remarkPlugins: [remarkLinkPubmedIds] };
    }
    return {};
  }
}

/**
 * Default-enabled-surfaces for `PubmedExtensionRegistry` per
 * ADR-0018 D-G APPEND Phase-52 EXTENDED block (Unit 52.1).
 *
 * **Phase 52 ship** — all 4 wired markdown surfaces enabled.
 * Closes Phase-50 ADR-0018 APPEND-D-AH PubMed PMID cross-
 * surface item at **2-phase carryover** — **fastest cross-
 * surface-expansion APPEND-deferral closure ever observed**
 * (beats prior 3-phase Phase-41 → 44 record). **Fifth prep-/
 * APPEND-doc-level deferral closed by value-only change**
 * (Phase 42 closed D-L item 1; Phase 43 closed D-Q item 2;
 * Phase 44 closed D-Y item 1; Phase 49 closed D-AC cross-
 * surface item; Phase 52 closes D-AH cross-surface item).
 * **Fifth cross-surface-expansion APPEND-deferral closure**
 * in the cadence (Phase 42 + 43 + 44 + 49 + 52). **Fifth real-
 * consumer-expansion realization** of the "constructor-arg-
 * only zero-rework expansion" property (Phase 42 wikilinks +
 * Phase 43 tables + Phase 44 arxiv + Phase 49 doi + Phase 52
 * pubmed). **First 5-realization property in project
 * history** — extends Phase-49 4-realization record to 5.
 * **Generalizes the per-consumer all-4-surfaces arc to ALL 5
 * Phase-37-framework consumers** — every concrete consumer is
 * now default-enabled on every wired markdown surface.
 *
 * **Phase 50 → 51 ship** (historical record) — was
 * `Set(["rationale"])`. The constant's NAME preserves the
 * introduction-phase audit trail (Phase 50 = WHEN the pubmed
 * consumer first shipped); the VALUE evolves Phase 52 per the
 * Phase-42/43/44/49 D-8 precedent. Surface enumeration follows
 * `MarkdownSurface` type-union order per Phase-42/43/44/49 D-9
 * precedent.
 *
 * Imported by the factory dispatch arm
 * `MARKDOWN_EXTENSIONS=pubmed` in `./index.ts` — Phase 52
 * expansion flows through the dispatch arm unchanged
 * (constructor-arg-only change; zero plugin / registry /
 * factory rework per the property each Phase 38/39/41/45/50
 * consumer documented). Fifth-consumer realization of the
 * property after Phase-42 wikilinks + Phase-43 tables + Phase-
 * 44 arxiv + Phase-49 doi.
 *
 * **Phase 52 ship state** — composition matrix under 5-way
 * `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed`
 * default:
 *
 *   - bio: wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed](remark) — 5-consumer + quadruple-alias
 *   - reviewNotes: wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed](remark) — 5-consumer + quadruple-alias
 *   - rationale: wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed](remark) — Phase-50 baseline preserved; quadruple-alias
 *   - actionRationale: wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed](remark) — 5-consumer + quadruple-alias
 *
 * **All 4 surfaces become 5-consumer + 3-slot + 3-consumer-
 * same-slot-in-remark + quadruple-alias** post-Phase-52.
 * **Maximal multi-consumer all-surfaces composition extended
 * to 5-consumer + 3-consumer-same-slot cardinality** —
 * defines the new upper bound for the Phase-37-framework's
 * current capabilities. The regex-disjointness-as-sole-defense
 * discipline (Phase 50 established for 3 same-slot consumers)
 * is now exercised at 3-consumer cardinality on every surface
 * in production default.
 */
export const PHASE_50_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "bio",
  "reviewNotes",
  "rationale",
  "actionRationale",
]);
