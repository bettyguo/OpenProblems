import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ArxivExtensionRegistry } from "./arxiv";
import { CompositeExtensionRegistry } from "./composite";
import { __resetRegistryForTests, DefaultExtensionRegistry, getExtensionRegistry } from "./index";
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

  it("ArxivExtensionRegistry dispatch enables arxiv on rationale only Phase 41", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv";
    const r = getExtensionRegistry();
    expect(r.getExtensions("rationale").remarkPlugins).toBeDefined();
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
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

  it("3-way composite enables all three consumers on all 4 surfaces (Phase 43: tables expansion)", () => {
    // Phase 42 expansion: wikilinks → all 4 surfaces.
    // Phase 43 expansion: tables → all 4 surfaces.
    // arxiv: rationale-only (Phase 41; un-expanded Phase 43; Phase 44+
    // candidate for analogous cross-surface expansion).
    // Under 3-way `wikilinks,tables,arxiv` Phase-43 default:
    //   - bio: wikilinks(rehypePlugins) + tables(schemaOverrides).
    //   - reviewNotes: wikilinks(rehypePlugins) + tables(schemaOverrides).
    //   - rationale: wikilinks(rehypePlugins) + tables(schemaOverrides)
    //     + arxiv(remarkPlugins). First all-3-slots-on-same-surface case.
    //   - actionRationale: wikilinks(rehypePlugins) + tables(schemaOverrides).
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables,arxiv";
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio").rehypePlugins).toBeDefined();
    expect(r.getExtensions("bio").schemaOverrides).toBeDefined();
    expect(r.getExtensions("reviewNotes").rehypePlugins).toBeDefined();
    expect(r.getExtensions("reviewNotes").schemaOverrides).toBeDefined();
    expect(r.getExtensions("rationale").rehypePlugins).toBeDefined();
    expect(r.getExtensions("rationale").schemaOverrides).toBeDefined();
    expect(r.getExtensions("rationale").remarkPlugins).toBeDefined();
    expect(r.getExtensions("actionRationale").rehypePlugins).toBeDefined();
    expect(r.getExtensions("actionRationale").schemaOverrides).toBeDefined();
  });

  it("3-way composite ordering does not affect outcome (order-independent for disjoint case)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "arxiv,tables,wikilinks";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
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
