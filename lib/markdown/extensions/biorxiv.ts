import { visit } from "unist-util-visit";
import type { Link, PhrasingContent, Root, Text } from "mdast";

import type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";

/**
 * bioRxiv preprint auto-link extension per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 58 — **seventh concrete Phase-37-framework
 * consumer**; **first 5th-`remarkPlugins` consumer** beyond
 * arxiv (Phase 41) + doi (Phase 45) + pubmed (Phase 50) +
 * orcid (Phase 54); tests whether the **regex-disjointness-as-
 * sole-defense discipline** (Phase 48 established for 2 same-
 * slot consumers; Phase 50 scaled to 3; Phase 54 scaled to 4)
 * scales to 5 same-slot consumers).
 *
 * Walks the mdast tree, finds `text`-node substrings matching
 * the bioRxiv pattern (case-insensitive `biorxiv:` prefix +
 * modern bioRxiv ID format `YYYY.MM.DD.NNNNNN` with optional
 * version suffix `vN`), and splice-replaces each match with an
 * mdast `link` node:
 *
 *   - `url`: `https://www.biorxiv.org/content/10.1101/<id>[<vN>]`
 *     — canonical bioRxiv URL form. The `10.1101/` prefix is
 *     bioRxiv's stable DOI registrant namespace (synthesized
 *     server-side from the curator's bare ID).
 *   - `children`: `[{ type: "text", value: <verbatim-match> }]`
 *     — preserves source casing of the `biorxiv:` prefix
 *     character-for-character.
 *
 * The emitted `link` flows through the standard `remark-rehype`
 * mdast→hast bridge and lands as
 * `<a href="https://www.biorxiv.org/content/...">biorxiv:...</a>`
 * in HAST. The default `rehype-sanitize` step validates the
 * output against the Phase-17 base allow-list: `<a>` tag,
 * `href` attribute, and `https:` URL scheme are all allow-
 * listed — **NO `schemaOverrides` required** for bioRxiv
 * autolinks (mirrors Phase-41 arxiv + Phase-45 doi + Phase-50
 * pubmed + Phase-54 orcid discipline; absolute https URLs pass
 * `rehypeStripUnsafeHrefs` naturally).
 *
 * **First 5-consumer same-slot composition** in project history
 * (per Phase 58 ship; rationale-only initially): under
 * `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed,orcid,biorxiv` the
 * `remarkPlugins` slot on `rationale` (the only surface where
 * all 5 consumers share enablement at Phase 58 first-ship —
 * arxiv + doi + pubmed default-enabled all-4 post-Phase-52;
 * orcid default-enabled all-4 post-Phase-56; biorxiv default-
 * enabled on rationale only at Phase 58 first-ship per the
 * demand-signal-first precedent) carries
 * `[remarkLinkArxivIds, remarkLinkDoiIds, remarkLinkPubmedIds, remarkLinkOrcidIds, remarkLinkBiorxivIds]`
 * via `CompositeExtensionRegistry` per APPEND-D-R "concatenated
 * across components in registration order" concatenation rule.
 * The five consumers' regex character classes are pairwise
 * disjoint via distinct literal prefixes:
 *
 *   - arxiv `arxiv:` + modern `\d{4}\.\d{4,5}` or legacy
 *     `[a-z]+(?:-[a-z]+)*(?:\.[A-Z-]+)?/\d{7}` ID.
 *   - doi `doi:` + `10.<registrant>/<suffix>` ID.
 *   - pubmed `(?:pubmed|pmid):` + `\d{1,9}` ID.
 *   - orcid `orcid:` + `\d{4}-\d{4}-\d{4}-\d{3}[\dX]` ID.
 *   - biorxiv `biorxiv:` + `\d{4}\.\d{2}\.\d{2}\.\d{6}(v\d+)?` ID.
 *
 * No string can match more than one of these regexes via the
 * distinct prefix discriminator. Plugin invocation order is
 * immaterial for the 5-tuple — **regex-disjointness-as-sole-
 * defense discipline scales from 4 to 5 same-slot consumers
 * without architectural change**. All 10 pairs of 5 consumers
 * (arxiv-doi, arxiv-pubmed, arxiv-orcid, arxiv-biorxiv, doi-
 * pubmed, doi-orcid, doi-biorxiv, pubmed-orcid, pubmed-biorxiv,
 * orcid-biorxiv) are pairwise collision-free.
 *
 * **DOI-overlap concern resolution**: bioRxiv preprints have
 * DOIs of the form `10.1101/<id>` (`10.1101` is bioRxiv's DOI
 * registrant prefix). However, the curator references bioRxiv
 * preprints via `biorxiv:<id>` (literal `biorxiv:` prefix +
 * bare YYYY.MM.DD.NNNNNN ID WITHOUT the `10.1101/` DOI-
 * namespace prefix). The doi consumer's regex requires a
 * literal `doi:` prefix to match — so curators writing
 * `doi:10.1101/<id>` get the generic doi.org resolver URL
 * (which redirects to bioRxiv via DOI resolution); curators
 * writing `biorxiv:<id>` get the direct biorxiv.org URL form.
 * No regex collision; curators choose the citation form based
 * on URL preference.
 *
 * Pattern strictness: `\d{4}\.\d{2}\.\d{2}\.\d{6}` matches the
 * modern bioRxiv ID format introduced ~2019 — 8-character date
 * prefix (`YYYY.MM.DD`) + 6-digit submission number. Example
 * identifiers: `2024.01.15.575678`, `2023.12.05.570123`.
 * Optional `(v\d+)?` version suffix captures explicit versions
 * (`v1`, `v2`, `v10`, etc.) mirroring Phase-41 arxiv version
 * suffix shape. Older numeric-only IDs from pre-2019 bioRxiv
 * format are NOT matched by this regex — Phase 59+ deferral
 * if curator content surfaces older preprint citations.
 *
 * Word-boundary anchors `\b...\b` prevent mid-word matches
 * (`Xbiorxiv:2024...` rejected; `biorxiv:2024.01.15.575678Y`
 * rejected via the trailing `\b` after the version-or-number).
 * No trailing-lookahead constraint: the trailing character is
 * `\d` (word char), and `\b` triggers at non-word boundary.
 *
 * Plugin declaration style: idiomatic remark-plugin function
 * declaration (factory returning a transformer) rather than
 * `Plugin<[], Root>` type alias. Mirrors Phase-41 arxiv +
 * Phase-45 doi + Phase-50 pubmed + Phase-54 orcid discovery:
 * the `Plugin<>` type alias triggers a known TypeScript
 * overload-resolution union-narrowing issue with chained
 * mdast.Root processors that the function-declaration shape
 * avoids.
 *
 * Server-only: imported by `BiorxivExtensionRegistry` returned
 * from `getExtensionRegistry()` per the Phase-58 env-var
 * dispatch arm (Unit 58.1). Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB
 * invariant.
 */

const BIORXIV_PATTERN = /\bbiorxiv:(\d{4}\.\d{2}\.\d{2}\.\d{6})(v\d+)?\b/gi;

export function remarkLinkBiorxivIds() {
  return function transformer(tree: Root): undefined {
    visit(tree, "text", (node, index, parent) => {
      if (typeof node.value !== "string") return;
      if (!parent || index === undefined) return;
      if (!/biorxiv:/i.test(node.value)) return;

      const text = node.value;
      BIORXIV_PATTERN.lastIndex = 0;

      const newNodes: Array<Text | Link> = [];
      let cursor = 0;
      let match: RegExpExecArray | null;

      while ((match = BIORXIV_PATTERN.exec(text)) !== null) {
        const matchStart = match.index;
        const matched = match[0];
        const id = match[1];
        const version = match[2] ?? "";
        if (id === undefined) continue;

        if (matchStart > cursor) {
          newNodes.push({ type: "text", value: text.slice(cursor, matchStart) });
        }

        newNodes.push({
          type: "link",
          url: `https://www.biorxiv.org/content/10.1101/${id}${version}`,
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
 * bioRxiv-preprint-autolink remark plugin on a curator-
 * specified set of surfaces.
 *
 * **Phase-58 default** (Unit 58.1 ship):
 * `PHASE_58_DEFAULT_ENABLED_SURFACES` = `Set(["rationale"])` —
 * single-surface scope mirroring the Phase-41 arxiv-first-ship
 * + Phase-45 doi-first-ship + Phase-50 pubmed-first-ship +
 * Phase-54 orcid-first-ship demand-signal-first precedent.
 * `rationale` is the curator paper-citation surface (Phase-27
 * challenge-resolution rationale text); cross-surface expansion
 * to bio + reviewNotes + actionRationale deferred Phase ~60+
 * per the per-consumer-expansion-as-separate-phase pattern
 * (Phase 38→42, Phase 39→43, Phase 41→44, Phase 45→49, Phase
 * 50→52, Phase 54→56 each established 2-to-4-phase gaps).
 *
 * For non-enabled surfaces returns an empty extension set
 * (default-deny). Per-surface differentiation remains the
 * framework's central value — the class is generic over the
 * enabled set.
 *
 * Composes cleanly with:
 *   - Phase 38 `WikilinkExtensionRegistry` (Phase 42 default
 *     all-4): distinct slot (remark vs rehype); conflict-free.
 *   - Phase 39 `TablesExtensionRegistry` (Phase 43 default
 *     all-4; Phase 57 schema-extension): distinct slot (remark
 *     vs schema); conflict-free.
 *   - Phase 41 `ArxivExtensionRegistry` (Phase 44 default
 *     all-4): **SAME slot** (both `remarkPlugins`).
 *   - Phase 45 `DoiExtensionRegistry` (Phase 49 default
 *     all-4): **SAME slot** (both `remarkPlugins`).
 *   - Phase 50 `PubmedExtensionRegistry` (Phase 52 default
 *     all-4): **SAME slot** (both `remarkPlugins`).
 *   - Phase 54 `OrcidExtensionRegistry` (Phase 56 default
 *     all-4): **SAME slot** (both `remarkPlugins`).
 *
 * **First 5-consumer same-slot composition** in project history
 * under `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed,orcid,biorxiv`
 * on rationale (Phase 58 first-ship). The `remarkPlugins`
 * array becomes
 * `[remarkLinkArxivIds, remarkLinkDoiIds, remarkLinkPubmedIds, remarkLinkOrcidIds, remarkLinkBiorxivIds]`
 * on rationale. Conflict-free via regex-disjointness-as-sole-
 * defense (the five character classes are pairwise disjoint
 * via distinct literal prefixes; all 10 pairs validated).
 *
 * `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv`
 * Phase-58 default produces **first 7-consumer composition**
 * under default dispatch — `rationale` carries 7 consumers
 * across 3 slots; other 3 surfaces carry 6 consumers (orcid
 * default-enabled all-4 per Phase 56; biorxiv inactive there
 * per Phase-58 rationale-only default). **New maximum-
 * consumer-cardinality state** in project history (mirrors
 * Phase-54 introduction of 6-consumer cardinality).
 *
 * Phase 59+ may add bioRxiv cross-surface expansion to all 4
 * surfaces (constructor-arg value-only change in
 * `PHASE_58_DEFAULT_ENABLED_SURFACES`; **seventh realization
 * of constructor-arg-only zero-rework expansion property**;
 * would extend Phase-56 6-realization record to 7), bioRxiv
 * display-text alias syntax (`[[biorxiv:YYYY.MM.DD.NNNNNN|display]]`;
 * mirrors Phase-47/Phase-48/Phase-51/Phase-55 alias-syntax
 * pattern), legacy numeric-only bioRxiv IDs (pre-2019 format),
 * OSF preprint consumer (eighth concrete consumer), or bare
 * bioRxiv IDs without prefix.
 */
export class BiorxivExtensionRegistry implements MarkdownExtensionRegistry {
  private readonly enabledSurfaces: ReadonlySet<MarkdownSurface>;

  constructor(enabledSurfaces: ReadonlySet<MarkdownSurface>) {
    this.enabledSurfaces = enabledSurfaces;
  }

  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet {
    if (this.enabledSurfaces.has(surface)) {
      return { remarkPlugins: [remarkLinkBiorxivIds] };
    }
    return {};
  }
}

/**
 * Default-enabled-surfaces for `BiorxivExtensionRegistry` per
 * ADR-0018 D-G APPEND-D-AP (Phase 58 Unit 58.1).
 *
 * **Phase 58 ship** — `rationale`-only (Phase-27 challenge-
 * resolution rationale text). Mirrors the Phase-41 arxiv-first-
 * ship + Phase-45 doi-first-ship + Phase-50 pubmed-first-ship
 * + Phase-54 orcid-first-ship demand-signal-first precedent:
 * curator paper-citation prose lives in `rationale`; cross-
 * surface expansion to bio + reviewNotes + actionRationale
 * deferred Phase ~60+ per the per-consumer-expansion-as-
 * separate-phase pattern.
 *
 * Constant's NAME encodes the introduction-phase audit trail
 * (Phase 58 = WHEN the biorxiv consumer first shipped); future
 * cross-surface expansions will evolve the VALUE while
 * preserving the name per Phase-42/43/44/49/52/56 D-8
 * precedent.
 *
 * Imported by the factory dispatch arm
 * `MARKDOWN_EXTENSIONS=biorxiv` in `./index.ts` — single-value
 * arm + multi-value composition arms all recognized at Phase
 * 58 ship per `buildSingleConsumerRegistry` +
 * `CompositeExtensionRegistry` wrapping. **8th single-value
 * arm** for `MARKDOWN_EXTENSIONS`; first expansion of the
 * recognized-arms set since Phase 54 (`orcid`).
 */
export const PHASE_58_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> = new Set([
  "rationale",
]);
