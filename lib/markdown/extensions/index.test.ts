import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ArxivExtensionRegistry, remarkLinkArxivIds } from "./arxiv";
import { BiorxivExtensionRegistry, remarkLinkBiorxivIds } from "./biorxiv";
import { CompositeExtensionRegistry } from "./composite";
import { DoiExtensionRegistry, remarkLinkDoiIds } from "./doi";
import { __resetRegistryForTests, DefaultExtensionRegistry, getExtensionRegistry } from "./index";
import { OrcidExtensionRegistry, remarkLinkOrcidIds } from "./orcid";
import { PubmedExtensionRegistry, remarkLinkPubmedIds } from "./pubmed";
import { TablesExtensionRegistry } from "./tables";
import { WikilinkExtensionRegistry } from "./wikilinks";

const ORIGINAL_PROVIDER = process.env["MARKDOWN_EXTENSIONS"];

beforeEach(() => {
  __resetRegistryForTests();
});

afterEach(() => {
  __resetRegistryForTests();
  if (ORIGINAL_PROVIDER === undefined) {
    delete process.env["MARKDOWN_EXTENSIONS"];
  } else {
    process.env["MARKDOWN_EXTENSIONS"] = ORIGINAL_PROVIDER;
  }
});

describe("getExtensionRegistry (factory) — env-var dispatch", () => {
  it("returns DefaultExtensionRegistry when MARKDOWN_EXTENSIONS is unset", () => {
    delete process.env["MARKDOWN_EXTENSIONS"];
    expect(getExtensionRegistry()).toBeInstanceOf(DefaultExtensionRegistry);
  });

  it("returns DefaultExtensionRegistry when MARKDOWN_EXTENSIONS is empty-string", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "";
    expect(getExtensionRegistry()).toBeInstanceOf(DefaultExtensionRegistry);
  });

  it("returns DefaultExtensionRegistry when MARKDOWN_EXTENSIONS is the literal 'default'", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "default";
    expect(getExtensionRegistry()).toBeInstanceOf(DefaultExtensionRegistry);
  });

  it("returns WikilinkExtensionRegistry when MARKDOWN_EXTENSIONS is 'wikilinks'", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks";
    expect(getExtensionRegistry()).toBeInstanceOf(WikilinkExtensionRegistry);
  });

  it("returns TablesExtensionRegistry when MARKDOWN_EXTENSIONS is 'tables' Phase 39", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "tables";
    expect(getExtensionRegistry()).toBeInstanceOf(TablesExtensionRegistry);
  });

  it("returns ArxivExtensionRegistry when MARKDOWN_EXTENSIONS is 'arxiv' Phase 41", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv";
    expect(getExtensionRegistry()).toBeInstanceOf(ArxivExtensionRegistry);
  });

  it("ArxivExtensionRegistry dispatch enables arxiv on ALL 4 surfaces Phase 44 (was rationale-only Phase 41-43)", () => {
    // Phase 41 ship through Phase-43 close: Set(["rationale"]). Phase 44
    // ship (Unit 44.1): all 4 surfaces enabled per
    // PHASE_41_DEFAULT_ENABLED_SURFACES expansion (closes ADR-0018
    // APPEND-D-Y item 1 at 3-phase carryover; third real-consumer-
    // expansion realization after Phase-42 wikilinks and Phase-43 tables;
    // completes per-consumer expansion arc).
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv";
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio").remarkPlugins).toBeDefined();
    expect(r.getExtensions("reviewNotes").remarkPlugins).toBeDefined();
    expect(r.getExtensions("rationale").remarkPlugins).toBeDefined();
    expect(r.getExtensions("actionRationale").remarkPlugins).toBeDefined();
  });

  it("WikilinkExtensionRegistry dispatch enables wikilinks on ALL 4 surfaces Phase 42 (was actionRationale-only Phase 38-41)", () => {
    // Phase 38 ship through Phase-41 close: Set(["actionRationale"]).
    // Phase 42 ship (Unit 42.1): all 4 surfaces enabled per
    // PHASE_38_DEFAULT_ENABLED_SURFACES expansion (closes ADR-0018
    // APPEND-D-L item 1 at 4-phase carryover).
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks";
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio").rehypePlugins).toBeDefined();
    expect(r.getExtensions("reviewNotes").rehypePlugins).toBeDefined();
    expect(r.getExtensions("rationale").rehypePlugins).toBeDefined();
    expect(r.getExtensions("actionRationale").rehypePlugins).toBeDefined();
  });

  it("TablesExtensionRegistry dispatch enables tables on ALL 4 surfaces Phase 43 (was reviewNotes-only Phase 39-42)", () => {
    // Phase 39 ship through Phase-42 close: Set(["reviewNotes"]). Phase 43
    // ship (Unit 43.1): all 4 surfaces enabled per
    // PHASE_39_DEFAULT_ENABLED_SURFACES expansion (closes ADR-0018
    // APPEND-D-Q item 2 at 4-phase carryover; mirrors Phase-42 wikilinks
    // pattern verbatim).
    process.env["MARKDOWN_EXTENSIONS"] = "tables";
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio").schemaOverrides).toBeDefined();
    expect(r.getExtensions("reviewNotes").schemaOverrides).toBeDefined();
    expect(r.getExtensions("rationale").schemaOverrides).toBeDefined();
    expect(r.getExtensions("actionRationale").schemaOverrides).toBeDefined();
  });

  it("caches the singleton across calls within the same env (default dispatch)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "default";
    const a = getExtensionRegistry();
    const b = getExtensionRegistry();
    expect(a).toBe(b);
  });

  it("caches the singleton across calls within the same env (wikilinks dispatch)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks";
    const a = getExtensionRegistry();
    const b = getExtensionRegistry();
    expect(a).toBe(b);
  });

  it("throws a clear error on an unknown provider value", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinkx";
    expect(() => getExtensionRegistry()).toThrow(/Unknown MARKDOWN_EXTENSIONS/);
    expect(() => getExtensionRegistry()).toThrow(/wikilinkx/);
    expect(() => getExtensionRegistry()).toThrow(/wikilinks/);
  });

  it("error message lists all recognized values including 'tables' Phase 39", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "unknown";
    expect(() => getExtensionRegistry()).toThrow(/tables/);
  });

  it("error message lists 'arxiv' Phase 41", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "unknown";
    expect(() => getExtensionRegistry()).toThrow(/arxiv/);
  });

  it("error message lists 'doi' Phase 45", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "unknown";
    expect(() => getExtensionRegistry()).toThrow(/doi/);
  });

  it("returns DoiExtensionRegistry when MARKDOWN_EXTENSIONS is 'doi' Phase 45", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "doi";
    expect(getExtensionRegistry()).toBeInstanceOf(DoiExtensionRegistry);
  });

  it("DoiExtensionRegistry dispatch enables doi on all 4 surfaces Phase 49 (cross-surface expansion mirrors Phase-44 arxiv expansion verbatim)", () => {
    // Phase 45 ship through Phase-48 close: Set(["rationale"]) — single-
    // surface scope mirroring Phase-41 arxiv-first-ship. Phase 49
    // expansion: all 4 surfaces per ADR-0018 APPEND-D-AC cross-surface
    // closure (4-phase carryover Phase 45 → 49; matches Phase-38 → 42 +
    // Phase-39 → 43 4-phase cadence verbatim). **Fourth real-consumer-
    // expansion realization** of the "constructor-arg-only zero-rework
    // expansion" property — completes the per-consumer all-4-surfaces arc.
    process.env["MARKDOWN_EXTENSIONS"] = "doi";
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio").remarkPlugins).toBeDefined();
    expect(r.getExtensions("reviewNotes").remarkPlugins).toBeDefined();
    expect(r.getExtensions("rationale").remarkPlugins).toBeDefined();
    expect(r.getExtensions("actionRationale").remarkPlugins).toBeDefined();
  });

  it("error message lists 'pubmed' Phase 50", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "unknown";
    expect(() => getExtensionRegistry()).toThrow(/pubmed/);
  });

  it("returns PubmedExtensionRegistry when MARKDOWN_EXTENSIONS is 'pubmed' Phase 50", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "pubmed";
    expect(getExtensionRegistry()).toBeInstanceOf(PubmedExtensionRegistry);
  });

  it("PubmedExtensionRegistry dispatch enables pubmed on ALL 4 surfaces Phase 52 (cross-surface expansion mirrors Phase-44 arxiv + Phase-49 doi expansion verbatim; fifth realization of constructor-arg-only zero-rework expansion property)", () => {
    // Phase 50 ship through Phase-51 close: Set(["rationale"]) — single-
    // surface scope mirroring Phase-41 arxiv-first-ship + Phase-45 doi-
    // first-ship demand-signal-first precedent. Phase 52 expansion: all 4
    // surfaces per ADR-0018 APPEND-D-AJ cross-surface closure (2-phase
    // carryover Phase 50 → 52 — fastest cross-surface-expansion APPEND-
    // deferral closure ever observed; beats prior 3-phase Phase-41 → 44
    // record). **Fifth real-consumer-expansion realization** of the
    // "constructor-arg-only zero-rework expansion" property — completes
    // the per-consumer all-4-surfaces arc for ALL 5 Phase-37-framework
    // consumers. **First 5-realization property in project history**.
    process.env["MARKDOWN_EXTENSIONS"] = "pubmed";
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio").remarkPlugins).toBeDefined();
    expect(r.getExtensions("reviewNotes").remarkPlugins).toBeDefined();
    expect(r.getExtensions("rationale").remarkPlugins).toBeDefined();
    expect(r.getExtensions("actionRationale").remarkPlugins).toBeDefined();
  });

  it("returns CompositeExtensionRegistry for 'arxiv,doi,pubmed' Phase 50 (first 3-consumer same-slot composition)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi,pubmed";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("arxiv,doi,pubmed composite concatenates ALL 3 plugins in remarkPlugins on ALL 4 surfaces Phase 52 (first all-4-surfaces 3-consumer same-slot composition)", () => {
    // **First "all 4 surfaces have 3-consumer same-slot composition"
    // state in project history.** Pre-Phase-52 only rationale carried
    // `[arxiv, doi, pubmed]` in `remarkPlugins` under
    // `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed` (Phase-50 ship: pubmed
    // rationale-only; arxiv + doi all-4 post-Phase-49). Phase 52 pubmed
    // cross-surface expansion generalizes the 3-consumer same-slot
    // composition to all 4 surfaces. **First state where regex-
    // disjointness-as-sole-defense discipline at 3-consumer cardinality
    // (Phase 50 established) is exercised on every surface in production
    // default**. The three regex character classes are pairwise disjoint
    // (arxiv `\d{4}\.\d{4,5}` lacks `:`+`/`; doi `10.<reg>/<suffix>`
    // requires `10.`+`/`; pubmed `(?:pubmed|pmid):\d` requires literal
    // `pubmed:` or `pmid:` prefix).
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi,pubmed";
    const r = getExtensionRegistry();
    for (const surface of ["bio", "reviewNotes", "rationale", "actionRationale"] as const) {
      expect(r.getExtensions(surface).remarkPlugins).toEqual([
        remarkLinkArxivIds,
        remarkLinkDoiIds,
        remarkLinkPubmedIds,
      ]);
    }
  });

  it("returns CompositeExtensionRegistry for 'wikilinks,tables,arxiv,doi,pubmed' (first 5-way Phase 50)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv,doi,pubmed";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("5-way composite enables ALL 5 CONSUMERS on ALL 4 SURFACES Phase 52 (first all-4-surfaces 5-consumer composition; maximum-consumer-cardinality state generalized to all surfaces)", () => {
    // **First "all 4 surfaces with 5-consumer composition under default
    // dispatch" state in project history.** Phase 50 ship first-realized
    // the 5-consumer composition on rationale only (other 3 surfaces
    // carried 4 consumers per pubmed rationale-only default). Phase 52
    // pubmed cross-surface expansion generalizes the 5-consumer
    // composition to all 4 surfaces — **maximum-consumer-cardinality
    // state generalized to all surfaces**.
    //
    // Composition matrix at Phase-52 5-way default:
    //   bio:             wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed](remark) — 5 consumers + quadruple-alias
    //   reviewNotes:     wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed](remark) — 5 consumers + quadruple-alias
    //   rationale:       wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed](remark) — Phase-50 baseline preserved; quadruple-alias
    //   actionRationale: wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed](remark) — 5 consumers + quadruple-alias
    //
    // Conflict-free per APPEND-D-R because (a) wikilinks + tables +
    // {arxiv, doi, pubmed} each occupy distinct slots cross-pair; (b)
    // within `remarkPlugins` the arxiv-doi-pubmed triple is collision-
    // free via regex-disjointness-as-sole-defense discipline at 3-
    // consumer cardinality (Phase 50 established) exercised on every
    // surface.
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv,doi,pubmed";
    const r = getExtensionRegistry();
    // All 4 surfaces: 5-consumer composition with 3-consumer same-slot
    // in remark.
    for (const surface of ["bio", "reviewNotes", "rationale", "actionRationale"] as const) {
      expect(r.getExtensions(surface).rehypePlugins).toBeDefined();
      expect(r.getExtensions(surface).schemaOverrides).toBeDefined();
      expect(r.getExtensions(surface).remarkPlugins).toEqual([
        remarkLinkArxivIds,
        remarkLinkDoiIds,
        remarkLinkPubmedIds,
      ]);
    }
  });

  it("returns CompositeExtensionRegistry when MARKDOWN_EXTENSIONS is 'wikilinks,tables' Phase 40", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("returns CompositeExtensionRegistry when MARKDOWN_EXTENSIONS is 'tables,wikilinks' (order-independent)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "tables,wikilinks";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("composite dispatch enables wikilinks + tables on all 4 surfaces (Phase 43 tables expansion)", () => {
    // Phase 42: wikilinks expanded to all 4 surfaces.
    // Phase 43: tables expanded to all 4 surfaces.
    // Under `wikilinks,tables` Phase-43 default: every surface gets
    // wikilinks(rehypePlugins) + tables(schemaOverrides) — first "all 4
    // surfaces with same-surface different-slot composition" state under
    // default dispatch (conflict-free per APPEND-D-R; distinct slots).
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables";
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio").rehypePlugins).toBeDefined();
    expect(r.getExtensions("bio").schemaOverrides).toBeDefined();
    expect(r.getExtensions("reviewNotes").rehypePlugins).toBeDefined();
    expect(r.getExtensions("reviewNotes").schemaOverrides).toBeDefined();
    expect(r.getExtensions("rationale").rehypePlugins).toBeDefined();
    expect(r.getExtensions("rationale").schemaOverrides).toBeDefined();
    expect(r.getExtensions("actionRationale").rehypePlugins).toBeDefined();
    expect(r.getExtensions("actionRationale").schemaOverrides).toBeDefined();
  });

  it("multi-value parsing tolerates whitespace around commas", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks , tables";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("single-value comma-form returns the direct registry (no composite wrapping)", () => {
    // "wikilinks," → ["wikilinks"] after filter; should return
    // WikilinkExtensionRegistry directly, not a 1-component composite.
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,";
    expect(getExtensionRegistry()).toBeInstanceOf(WikilinkExtensionRegistry);
  });

  it("throws when 'default' is combined with other values", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "default,wikilinks";
    expect(() => getExtensionRegistry()).toThrow(/cannot be combined/);
  });

  it("throws when duplicate extensions appear in the list", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,wikilinks";
    expect(() => getExtensionRegistry()).toThrow(/Duplicate extension/);
  });

  it("throws when an unknown extension appears in a multi-value list", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,unknownext";
    expect(() => getExtensionRegistry()).toThrow(/unknownext/);
  });

  it("composite cache survives across calls (singleton)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables";
    const a = getExtensionRegistry();
    const b = getExtensionRegistry();
    expect(a).toBe(b);
  });

  it("returns CompositeExtensionRegistry for 'wikilinks,arxiv' Phase 41 pair", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,arxiv";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("returns CompositeExtensionRegistry for 'tables,arxiv' Phase 41 pair", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "tables,arxiv";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("returns CompositeExtensionRegistry for 'wikilinks,tables,arxiv' (first 3-way Phase 41)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("3-way composite enables ALL 3 SLOTS on ALL 4 SURFACES (Phase 44: arxiv expansion completes the arc)", () => {
    // Phase 42 expansion: wikilinks → all 4 surfaces.
    // Phase 43 expansion: tables → all 4 surfaces.
    // Phase 44 expansion: arxiv → all 4 surfaces (completes the
    // per-consumer expansion arc).
    // Under 3-way `wikilinks,tables,arxiv` Phase-44 default: every surface
    // has wikilinks(rehypePlugins) + tables(schemaOverrides) + arxiv(remarkPlugins)
    // — all 3 framework slots simultaneously active on all 4 surfaces.
    // **First "all 3 framework slots on all 4 surfaces under default
    // dispatch" state in project history.** Maximal multi-consumer
    // all-surfaces composition. Conflict-free per APPEND-D-R because each
    // surface has at most one component per slot (3 distinct slots × 4
    // surfaces × 3 consumers = 12 component-surface-slot triples all
    // distinct).
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv";
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio").rehypePlugins).toBeDefined();
    expect(r.getExtensions("bio").schemaOverrides).toBeDefined();
    expect(r.getExtensions("bio").remarkPlugins).toBeDefined();
    expect(r.getExtensions("reviewNotes").rehypePlugins).toBeDefined();
    expect(r.getExtensions("reviewNotes").schemaOverrides).toBeDefined();
    expect(r.getExtensions("reviewNotes").remarkPlugins).toBeDefined();
    expect(r.getExtensions("rationale").rehypePlugins).toBeDefined();
    expect(r.getExtensions("rationale").schemaOverrides).toBeDefined();
    expect(r.getExtensions("rationale").remarkPlugins).toBeDefined();
    expect(r.getExtensions("actionRationale").rehypePlugins).toBeDefined();
    expect(r.getExtensions("actionRationale").schemaOverrides).toBeDefined();
    expect(r.getExtensions("actionRationale").remarkPlugins).toBeDefined();
  });

  it("3-way composite ordering does not affect outcome (order-independent for disjoint case)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,tables,wikilinks";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("returns CompositeExtensionRegistry for 'arxiv,doi' Phase 45 first-same-slot pair", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("arxiv,doi composite concatenates BOTH plugins in remarkPlugins on rationale (first same-slot case Phase 45)", () => {
    // **First compositional same-slot case in project history.** Under
    // `MARKDOWN_EXTENSIONS=arxiv,doi` Phase-45 default the `remarkPlugins`
    // slot on `rationale` (the only surface both consumers default-enable
    // Phase 45) carries BOTH plugins via `CompositeExtensionRegistry`
    // per APPEND-D-R "concatenated across components in registration
    // order" rule. Pre-Phase-45 every slot had exactly one consumer
    // (trivially satisfied); Phase 45 puts the concatenation rule under
    // real pressure.
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi";
    const r = getExtensionRegistry();
    const remarkPlugins = r.getExtensions("rationale").remarkPlugins;
    expect(remarkPlugins).toBeDefined();
    expect(remarkPlugins).toHaveLength(2);
    expect(remarkPlugins).toEqual([remarkLinkArxivIds, remarkLinkDoiIds]);
  });

  it("doi,arxiv composite preserves registration order in remarkPlugins (env-var-comma-order)", () => {
    // Order reversal: env-var `doi,arxiv` puts DOI first. Plugin
    // invocation order is `[remarkLinkDoiIds, remarkLinkArxivIds]`.
    // Plugin order is behaviorally equivalent for these two consumers
    // because their regex prefixes (`\bdoi:` vs `\barxiv:`) are disjoint
    // — neither plugin's emitted link text matches the other's regex.
    // The framework's registration-order discipline holds regardless.
    process.env["MARKDOWN_EXTENSIONS"] = "doi,arxiv";
    const r = getExtensionRegistry();
    const remarkPlugins = r.getExtensions("rationale").remarkPlugins;
    expect(remarkPlugins).toBeDefined();
    expect(remarkPlugins).toHaveLength(2);
    expect(remarkPlugins).toEqual([remarkLinkDoiIds, remarkLinkArxivIds]);
  });

  it("arxiv,doi composite enables BOTH arxiv and doi on all 4 surfaces Phase 49 (first all-4-surfaces same-slot composition)", () => {
    // Phase-44 close: arxiv enabled on all 4 surfaces.
    // Phase-45 ship through Phase-48 close: doi enabled on `rationale` only.
    // Phase 49 expansion: doi enabled on all 4 surfaces. Under `arxiv,doi`
    // composite Phase 49: every surface carries `[remarkLinkArxivIds,
    // remarkLinkDoiIds]` in `remarkPlugins`. **First state where the
    // regex-disjointness-as-sole-defense discipline (arxiv ID class lacks
    // `/`; doi ID class requires `/`) is exercised on every surface in
    // production default**.
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi";
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio").remarkPlugins).toEqual([remarkLinkArxivIds, remarkLinkDoiIds]);
    expect(r.getExtensions("reviewNotes").remarkPlugins).toEqual([
      remarkLinkArxivIds,
      remarkLinkDoiIds,
    ]);
    expect(r.getExtensions("actionRationale").remarkPlugins).toEqual([
      remarkLinkArxivIds,
      remarkLinkDoiIds,
    ]);
    expect(r.getExtensions("rationale").remarkPlugins).toEqual([
      remarkLinkArxivIds,
      remarkLinkDoiIds,
    ]);
  });

  it("returns CompositeExtensionRegistry for 'wikilinks,tables,arxiv,doi' (first 4-way Phase 45)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv,doi";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("4-way composite enables ALL 4 CONSUMERS on ALL 4 SURFACES Phase 49 (maximal multi-consumer all-surfaces composition under default dispatch)", () => {
    // **First "maximal multi-consumer all-surfaces composition" state
    // in project history.** Phase 45 introduced the 4-consumer
    // composition with doi rationale-only; Phase 49 generalizes doi
    // to all 4 surfaces. Every surface now carries 4 consumers across
    // 3 slots, with the doubly-occupied `remarkPlugins` slot active
    // everywhere.
    //
    // Composition matrix at Phase-49 default:
    //   bio:             wikilinks(rehype) + tables(schema) + [arxiv, doi](remark)
    //   reviewNotes:     wikilinks(rehype) + tables(schema) + [arxiv, doi](remark)
    //   rationale:       wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — Phase-45 baseline preserved
    //   actionRationale: wikilinks(rehype) + tables(schema) + [arxiv, doi](remark)
    //
    // Conflict-free per APPEND-D-R because (a) wikilinks + tables +
    // {arxiv, doi} each occupy distinct slots cross-pair; (b) within
    // `remarkPlugins` the arxiv-vs-doi pair is collision-free via
    // regex-disjointness-as-sole-defense discipline on every surface.
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv,doi";
    const r = getExtensionRegistry();
    // All 4 surfaces: 4-consumer composition with same-slot in remark.
    for (const surface of ["bio", "reviewNotes", "rationale", "actionRationale"] as const) {
      expect(r.getExtensions(surface).rehypePlugins).toBeDefined();
      expect(r.getExtensions(surface).schemaOverrides).toBeDefined();
      expect(r.getExtensions(surface).remarkPlugins).toEqual([
        remarkLinkArxivIds,
        remarkLinkDoiIds,
      ]);
    }
  });

  // -----------------------------------------------------------------------
  // Phase-54 ORCID dispatch tests — sixth concrete consumer; first 4th-
  // remarkPlugins consumer; first 4-consumer same-slot composition; first
  // 6-consumer composition under default dispatch (maximum-consumer-
  // cardinality state).
  // -----------------------------------------------------------------------

  it("error message lists 'orcid' Phase 54", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "unknown";
    expect(() => getExtensionRegistry()).toThrow(/orcid/);
  });

  it("returns OrcidExtensionRegistry when MARKDOWN_EXTENSIONS is 'orcid' Phase 54", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "orcid";
    expect(getExtensionRegistry()).toBeInstanceOf(OrcidExtensionRegistry);
  });

  it("OrcidExtensionRegistry dispatch enables orcid on ALL 4 surfaces Phase 56 (cross-surface expansion mirrors Phase-44 arxiv + Phase-49 doi + Phase-52 pubmed expansion verbatim; sixth realization of constructor-arg-only zero-rework expansion property — first 6-realization for that pattern; first state with TWO coexisting 6-realization framework patterns)", () => {
    // Phase 56 ship: cross-surface expansion to all 4 markdown surfaces.
    // Constructor-arg value-only change in PHASE_54_DEFAULT_ENABLED_SURFACES;
    // class + factory + plugin body + regex ORCID_PATTERN UNCHANGED.
    // Mirrors Phase-44 arxiv + Phase-49 doi + Phase-52 pubmed expansion
    // pattern verbatim. Closes ADR-0018 APPEND-D-AL ORCID cross-surface
    // item at 2-phase carryover (Phase 54 → 56) — ties Phase-52 pubmed-
    // cross-surface 2-phase fastest-closure record.
    process.env["MARKDOWN_EXTENSIONS"] = "orcid";
    const r = getExtensionRegistry();
    for (const surface of ["bio", "reviewNotes", "rationale", "actionRationale"] as const) {
      expect(r.getExtensions(surface).remarkPlugins).toBeDefined();
    }
  });

  it("returns CompositeExtensionRegistry for 'arxiv,doi,pubmed,orcid' Phase 54 (first 4-consumer same-slot composition)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi,pubmed,orcid";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("arxiv,doi,pubmed,orcid composite concatenates ALL 4 plugins in remarkPlugins on ALL 4 surfaces Phase 56 (first all-4-surfaces 4-consumer same-slot composition)", () => {
    // **First all-4-surfaces 4-consumer same-slot composition in project
    // history.** Under `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed,orcid` Phase-
    // 56 default ALL 4 surfaces carry `[arxiv, doi, pubmed, orcid]` in
    // `remarkPlugins` via `CompositeExtensionRegistry` per APPEND-D-R
    // "concatenated across components in registration order" rule. Phase
    // 54 ship was rationale-only (only surface where all 4 consumers
    // shared enablement). Phase 56 cross-surface expansion generalizes
    // the 4-consumer same-slot composition to every surface. **First
    // state where the regex-disjointness-as-sole-defense discipline at
    // 4-consumer cardinality (Phase 54 established) is exercised on
    // every surface in production default** — the four regex character
    // classes are pairwise disjoint via distinct literal prefixes
    // (arxiv:, doi:, pubmed:/pmid:, orcid:).
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi,pubmed,orcid";
    const r = getExtensionRegistry();
    for (const surface of ["bio", "reviewNotes", "rationale", "actionRationale"] as const) {
      expect(r.getExtensions(surface).remarkPlugins).toEqual([
        remarkLinkArxivIds,
        remarkLinkDoiIds,
        remarkLinkPubmedIds,
        remarkLinkOrcidIds,
      ]);
    }
  });

  it("returns CompositeExtensionRegistry for 'wikilinks,tables,arxiv,doi,pubmed,orcid' (first 6-way Phase 54)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv,doi,pubmed,orcid";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("6-way composite enables ALL 6 CONSUMERS on ALL 4 surfaces Phase 56 (first all-4-surfaces 6-consumer composition under default dispatch; maximum-consumer-cardinality state generalized to all surfaces; first 'all-surfaces saturated at maximum-consumer-cardinality' state)", () => {
    // **First "all-4-surfaces 6-consumer composition under default
    // dispatch" state in project history.** Pre-Phase-56 only rationale
    // carried 6-consumer composition (Phase 54 maximum-consumer-cardinality
    // state; asymmetric [rationale=6, others=5]). Phase 56 cross-surface
    // expansion generalizes the maximum-consumer-cardinality state to
    // every surface (symmetric [all=6]). **First "all-surfaces saturated
    // at maximum-consumer-cardinality" state** in project history.
    //
    // Composition matrix at Phase-56 6-way default:
    //   bio:             wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed, orcid](remark) — 6 consumers
    //   reviewNotes:     wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed, orcid](remark) — 6 consumers
    //   rationale:       wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed, orcid](remark) — Phase-54 baseline preserved; 6 consumers
    //   actionRationale: wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed, orcid](remark) — 6 consumers
    //
    // Conflict-free per APPEND-D-R because (a) wikilinks + tables +
    // {arxiv, doi, pubmed, orcid} each occupy distinct slots cross-pair;
    // (b) within `remarkPlugins` the arxiv-doi-pubmed-orcid 4-tuple is
    // collision-free via regex-disjointness-as-sole-defense (4-consumer
    // scaling validation on every surface).
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv,doi,pubmed,orcid";
    const r = getExtensionRegistry();
    for (const surface of ["bio", "reviewNotes", "rationale", "actionRationale"] as const) {
      expect(r.getExtensions(surface).rehypePlugins).toBeDefined();
      expect(r.getExtensions(surface).schemaOverrides).toBeDefined();
      expect(r.getExtensions(surface).remarkPlugins).toEqual([
        remarkLinkArxivIds,
        remarkLinkDoiIds,
        remarkLinkPubmedIds,
        remarkLinkOrcidIds,
      ]);
    }
  });

  // -----------------------------------------------------------------------
  // Phase-58 bioRxiv dispatch tests — seventh concrete consumer; first 5th-
  // remarkPlugins consumer; first 5-consumer same-slot composition; first
  // 7-consumer composition under default dispatch (new maximum-consumer-
  // cardinality state).
  // -----------------------------------------------------------------------

  it("error message lists 'biorxiv' Phase 58", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "unknown";
    expect(() => getExtensionRegistry()).toThrow(/biorxiv/);
  });

  it("returns BiorxivExtensionRegistry when MARKDOWN_EXTENSIONS is 'biorxiv' Phase 58", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "biorxiv";
    expect(getExtensionRegistry()).toBeInstanceOf(BiorxivExtensionRegistry);
  });

  it("BiorxivExtensionRegistry dispatch enables biorxiv on ALL 4 surfaces Phase 59 (cross-surface expansion mirrors Phase-44 arxiv + Phase-49 doi + Phase-52 pubmed + Phase-56 orcid expansion verbatim; seventh realization of constructor-arg-only zero-rework expansion property; first 7-realization for that pattern)", () => {
    // Phase 58 ship: Set(["rationale"]) — single-surface scope per Phase-
    // 41/45/50/54 first-ship demand-signal-first precedent. Phase 59 ship:
    // Set(["bio", "reviewNotes", "rationale", "actionRationale"]) — cross-
    // surface expansion to all 4 surfaces via constructor-arg value-only
    // change. **Seventh realization of "constructor-arg-only zero-rework
    // expansion" property** — first 7-realization for that pattern in
    // project history (extends Phase-56 record 6 → 7). Closes ADR-0018
    // APPEND-D-AP bioRxiv cross-surface item at 1-phase carryover (Phase
    // 58 → 59) — NEW FASTEST cross-surface-expansion APPEND-deferral
    // closure record (extends prior 2-phase record from Phase 52 + 56).
    process.env["MARKDOWN_EXTENSIONS"] = "biorxiv";
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio").remarkPlugins).toBeDefined();
    expect(r.getExtensions("reviewNotes").remarkPlugins).toBeDefined();
    expect(r.getExtensions("rationale").remarkPlugins).toBeDefined();
    expect(r.getExtensions("actionRationale").remarkPlugins).toBeDefined();
  });

  it("returns CompositeExtensionRegistry for 'arxiv,doi,pubmed,orcid,biorxiv' Phase 58 (first 5-consumer same-slot composition)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi,pubmed,orcid,biorxiv";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("arxiv,doi,pubmed,orcid,biorxiv composite concatenates ALL 5 plugins in remarkPlugins on ALL 4 surfaces Phase 59 (first all-4-surfaces 5-consumer same-slot composition)", () => {
    // **First "all 4 surfaces have 5-consumer same-slot composition"
    // state in project history.** Pre-Phase-59 only rationale carried
    // ALL 5 plugins (Phase 58 first-ship rationale-only). Phase 59
    // cross-surface expansion of biorxiv to all 4 surfaces generalizes
    // the 5-consumer same-slot composition to every surface under
    // `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed,orcid,biorxiv` composite
    // default. **Regex-disjointness-as-sole-defense discipline at
    // 5-consumer cardinality (Phase 58 established) is exercised on
    // every surface in production default** — five regex character
    // classes pairwise disjoint via distinct literal prefixes (arxiv:,
    // doi:, pubmed:/pmid:, orcid:, biorxiv:); all 10 pairs collision-
    // free on every surface.
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi,pubmed,orcid,biorxiv";
    const r = getExtensionRegistry();
    for (const surface of ["bio", "reviewNotes", "rationale", "actionRationale"] as const) {
      expect(r.getExtensions(surface).remarkPlugins).toEqual([
        remarkLinkArxivIds,
        remarkLinkDoiIds,
        remarkLinkPubmedIds,
        remarkLinkOrcidIds,
        remarkLinkBiorxivIds,
      ]);
    }
  });

  it("returns CompositeExtensionRegistry for 'wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv' (first 7-way Phase 58)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("7-way composite enables ALL 7 CONSUMERS on ALL 4 surfaces Phase 59 (first all-4-surfaces 7-consumer composition under default dispatch; second 'all-surfaces saturated at maximum-consumer-cardinality' state — first was Phase 56 at 6-consumer)", () => {
    // **First "all 4 surfaces with 7-consumer composition under default
    // dispatch" state in project history.** Pre-Phase-59 only rationale
    // carried 7-consumer composition (Phase 58 ship; maximum-consumer-
    // cardinality state); post-Phase-59 every surface does. **Maximum-
    // consumer-cardinality state generalized to all surfaces** — the
    // Phase-58 asymmetric `[rationale=7, others=6]` state becomes
    // symmetric `[all=7]`. **Second "all-surfaces saturated at maximum-
    // consumer-cardinality" state in project history** (first was Phase
    // 56 at 6-consumer; Phase 59 elevates to 7-consumer).
    //
    // Composition matrix at Phase-59 7-way default:
    //   bio:             wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed, orcid, biorxiv](remark) — 7 consumers
    //   reviewNotes:     wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed, orcid, biorxiv](remark) — 7 consumers
    //   rationale:       wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed, orcid, biorxiv](remark) — 7 consumers (Phase-58 baseline preserved)
    //   actionRationale: wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed, orcid, biorxiv](remark) — 7 consumers
    //
    // Conflict-free per APPEND-D-R because (a) wikilinks + tables +
    // {arxiv, doi, pubmed, orcid, biorxiv} each occupy distinct slots
    // cross-pair; (b) within `remarkPlugins` the 5-tuple is collision-free
    // via regex-disjointness-as-sole-defense (5-consumer scaling
    // validation; 10 pairs validated on every surface).
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv";
    const r = getExtensionRegistry();
    // All 4 surfaces: 7-consumer composition (5 plugins in remarkPlugins
    // + rehype wikilinks + schema tables).
    for (const surface of ["bio", "reviewNotes", "rationale", "actionRationale"] as const) {
      expect(r.getExtensions(surface).rehypePlugins).toBeDefined();
      expect(r.getExtensions(surface).schemaOverrides).toBeDefined();
      expect(r.getExtensions(surface).remarkPlugins).toEqual([
        remarkLinkArxivIds,
        remarkLinkDoiIds,
        remarkLinkPubmedIds,
        remarkLinkOrcidIds,
        remarkLinkBiorxivIds,
      ]);
    }
  });

  it("__resetRegistryForTests clears the singleton so subsequent calls re-read env", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "default";
    const first = getExtensionRegistry();
    __resetRegistryForTests();
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks";
    const second = getExtensionRegistry();
    expect(first).not.toBe(second);
    expect(second).toBeInstanceOf(WikilinkExtensionRegistry);
  });
});
