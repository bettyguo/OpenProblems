import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ArxivExtensionRegistry, remarkLinkArxivIds } from "./arxiv";
import { CompositeExtensionRegistry } from "./composite";
import { DoiExtensionRegistry, remarkLinkDoiIds } from "./doi";
import { __resetRegistryForTests, DefaultExtensionRegistry, getExtensionRegistry } from "./index";
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

  it("PubmedExtensionRegistry dispatch enables pubmed on rationale only Phase 50 (mirrors Phase-41 arxiv-first-ship + Phase-45 doi-first-ship demand-signal-first precedent)", () => {
    // Phase 50 ship: Set(["rationale"]). PubMed PMID consumer first-ship
    // pattern mirrors Phase-41 arxiv + Phase-45 doi — single-surface scope;
    // curator paper-citation surface; cross-surface expansion to all 4
    // surfaces deferred Phase ~54+ per the 4-phase-gap cadence
    // (Phase 38→42, Phase 39→43, Phase 41→44, Phase 45→49 each
    // established).
    process.env["MARKDOWN_EXTENSIONS"] = "pubmed";
    const r = getExtensionRegistry();
    expect(r.getExtensions("rationale").remarkPlugins).toBeDefined();
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("returns CompositeExtensionRegistry for 'arxiv,doi,pubmed' Phase 50 (first 3-consumer same-slot composition)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi,pubmed";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("arxiv,doi,pubmed composite concatenates ALL 3 plugins in remarkPlugins on rationale (first 3-consumer same-slot Phase 50)", () => {
    // **First 3-consumer same-slot composition in project history.** Under
    // `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed` Phase-50 default the
    // `remarkPlugins` slot on rationale (the only surface where all 3
    // consumers share enablement Phase 50 — arxiv + doi default-enabled on
    // all 4 surfaces post-Phase-49; pubmed default-enabled on rationale
    // only) carries ALL 3 plugins via `CompositeExtensionRegistry` per
    // APPEND-D-R "concatenated across components in registration order"
    // rule. **Tests whether the regex-disjointness-as-sole-defense
    // discipline (Phase 48 established for 2 same-slot consumers; Phase
    // 49 generalized to all 4 surfaces) scales to 3 same-slot consumers
    // without architectural change** — the three regex character classes
    // are pairwise disjoint (arxiv `\d{4}\.\d{4,5}` lacks `:`+`/`; doi
    // `10.<reg>/<suffix>` requires `10.`+`/`; pubmed `(?:pubmed|pmid):\d`
    // requires literal `pubmed:` or `pmid:` prefix).
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,doi,pubmed";
    const r = getExtensionRegistry();
    const remarkPlugins = r.getExtensions("rationale").remarkPlugins;
    expect(remarkPlugins).toEqual([remarkLinkArxivIds, remarkLinkDoiIds, remarkLinkPubmedIds]);
    // Other 3 surfaces: arxiv + doi only (pubmed inactive there Phase 50
    // per rationale-only default).
    expect(r.getExtensions("bio").remarkPlugins).toEqual([remarkLinkArxivIds, remarkLinkDoiIds]);
    expect(r.getExtensions("reviewNotes").remarkPlugins).toEqual([
      remarkLinkArxivIds,
      remarkLinkDoiIds,
    ]);
    expect(r.getExtensions("actionRationale").remarkPlugins).toEqual([
      remarkLinkArxivIds,
      remarkLinkDoiIds,
    ]);
  });

  it("returns CompositeExtensionRegistry for 'wikilinks,tables,arxiv,doi,pubmed' (first 5-way Phase 50)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv,doi,pubmed";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("5-way composite enables ALL 5 CONSUMERS on rationale Phase 50 (first 5-consumer composition under default dispatch; maximum-consumer-cardinality state)", () => {
    // **First "5-consumer composition under default dispatch" state in
    // project history.** Pre-Phase-50 max was 4-consumer (Phase-49
    // maximal-activation `wikilinks,tables,arxiv,doi` with all 4
    // consumers on all 4 surfaces). Phase 50 adds PubMed as the fifth
    // consumer on rationale (rationale-only ship per Phase-41/45 first-
    // ship demand-signal-first precedent).
    //
    // Composition matrix at Phase-50 5-way default:
    //   bio:             wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — 4 consumers (Phase-49 baseline)
    //   reviewNotes:     wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — 4 consumers
    //   rationale:       wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed](remark) — 5 consumers ← maximum cardinality
    //   actionRationale: wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — 4 consumers
    //
    // Conflict-free per APPEND-D-R because (a) wikilinks + tables +
    // {arxiv, doi, pubmed} each occupy distinct slots cross-pair; (b)
    // within `remarkPlugins` the arxiv-doi-pubmed triple is collision-
    // free via regex-disjointness-as-sole-defense discipline (3-consumer
    // scaling validation).
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv,doi,pubmed";
    const r = getExtensionRegistry();
    // rationale: 5-consumer composition (3 plugins in remarkPlugins).
    expect(r.getExtensions("rationale").rehypePlugins).toBeDefined();
    expect(r.getExtensions("rationale").schemaOverrides).toBeDefined();
    expect(r.getExtensions("rationale").remarkPlugins).toEqual([
      remarkLinkArxivIds,
      remarkLinkDoiIds,
      remarkLinkPubmedIds,
    ]);
    // Other 3 surfaces: 4-consumer composition (2 plugins in remarkPlugins;
    // pubmed inactive there per rationale-only default).
    for (const surface of ["bio", "reviewNotes", "actionRationale"] as const) {
      expect(r.getExtensions(surface).rehypePlugins).toBeDefined();
      expect(r.getExtensions(surface).schemaOverrides).toBeDefined();
      expect(r.getExtensions(surface).remarkPlugins).toEqual([
        remarkLinkArxivIds,
        remarkLinkDoiIds,
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
