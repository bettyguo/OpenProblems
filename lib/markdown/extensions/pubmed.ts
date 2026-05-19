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
 * slot on shared-enabled surfaces (Phase 50 default: `rationale`;
 * arxiv + doi default-enabled on all 4 surfaces post-Phase-49)
 * carries `[remarkLinkArxivIds, remarkLinkDoiIds, remarkLinkPubmedIds]`
 * via `CompositeExtensionRegistry` per APPEND-D-R
 * "concatenated across components in registration order"
 * concatenation rule. The three consumers' regex character
 * classes are pairwise disjoint:
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
 * **Phase 50 ship is bare-only** — no alias syntax. Mirrors
 * Phase-41 arxiv-first-ship + Phase-45 doi-first-ship demand-
 * signal-first precedent. Bracketed alias form
 * `[[pubmed:NNN|display]]` / `[[pmid:NNN|display]]` is a Phase
 * 51+ candidate (would mirror Phase-47 arxiv + Phase-48 doi
 * dual-form regex extension verbatim).
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

const PUBMED_PATTERN = /\b(?:pubmed|pmid):(\d{1,9})\b/gi;

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
        const id = match[1];
        if (id === undefined) continue;

        if (matchStart > cursor) {
          newNodes.push({ type: "text", value: text.slice(cursor, matchStart) });
        }

        newNodes.push({
          type: "link",
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          children: [{ type: "text", value: matched }],
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
 * **Phase-50 default** (Unit 50.1 ship):
 * `PHASE_50_DEFAULT_ENABLED_SURFACES` = `Set(["rationale"])` —
 * single-surface scope mirroring the Phase-41 arxiv-first-ship
 * + Phase-45 doi-first-ship demand-signal-first precedent.
 * `rationale` is the curator paper-citation surface (Phase-27
 * challenge-resolution rationale text); cross-surface expansion
 * to bio + reviewNotes + actionRationale deferred Phase ~54+
 * per the per-consumer-expansion-as-separate-phase pattern
 * (Phase 38→42, Phase 39→43, Phase 41→44, Phase 45→49 each
 * established 4-phase gaps).
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
 * Phase-50 default produces **first 5-consumer composition**
 * under default dispatch — `rationale` carries 5 consumers
 * across 3 slots; other 3 surfaces carry 4 consumers (arxiv +
 * doi + wikilinks + tables; pubmed inactive there per Phase-50
 * rationale-only default). Maximum-consumer-cardinality state
 * in project history.
 *
 * Phase 51+ may add PubMed PMID display-text alias syntax
 * `[[pubmed:NNN|display]]` / `[[pmid:NNN|display]]` (mirrors
 * Phase-47/Phase-48 alias extensions), PubMed PMID cross-
 * surface expansion to all 4 surfaces (Phase ~54 at 4-phase-
 * gap cadence), ORCID auto-link consumer, or bioRxiv preprint
 * consumer.
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
 * ADR-0018 D-G APPEND-D-AH (Phase 50 Unit 50.1).
 *
 * **Phase 50 ship** — `rationale`-only (Phase-27 challenge-
 * resolution rationale text). Mirrors the Phase-41 arxiv-first-
 * ship + Phase-45 doi-first-ship demand-signal-first precedent:
 * curator paper-citation prose lives in `rationale`; cross-
 * surface expansion to bio + reviewNotes + actionRationale
 * deferred Phase ~54+ per the per-consumer-expansion-as-
 * separate-phase pattern.
 *
 * Constant's NAME encodes the introduction-phase audit trail
 * (Phase 50 = WHEN the pubmed consumer first shipped); future
 * cross-surface expansions will evolve the VALUE while
 * preserving the name per Phase-42/43/44/49 D-8 precedent.
 *
 * Imported by the factory dispatch arm
 * `MARKDOWN_EXTENSIONS=pubmed` in `./index.ts` — single-value
 * arm + multi-value composition arms all recognized at Phase
 * 50 ship per `buildSingleConsumerRegistry` +
 * `CompositeExtensionRegistry` wrapping. **6th single-value
 * arm** for `MARKDOWN_EXTENSIONS`; first expansion of the
 * recognized-arms set since Phase 45 (`doi`).
 */
export const PHASE_50_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "rationale",
]);
