import { afterEach, beforeEach, describe, expect, it } from "vitest";

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

  it("WikilinkExtensionRegistry dispatch enables wikilinks on actionRationale only Phase 38", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks";
    const r = getExtensionRegistry();
    expect(r.getExtensions("actionRationale").rehypePlugins).toBeDefined();
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
  });

  it("TablesExtensionRegistry dispatch enables tables on reviewNotes only Phase 39", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "tables";
    const r = getExtensionRegistry();
    expect(r.getExtensions("reviewNotes").schemaOverrides).toBeDefined();
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
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

  it("returns CompositeExtensionRegistry when MARKDOWN_EXTENSIONS is 'wikilinks,tables' Phase 40", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("returns CompositeExtensionRegistry when MARKDOWN_EXTENSIONS is 'tables,wikilinks' (order-independent)", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "tables,wikilinks";
    expect(getExtensionRegistry()).toBeInstanceOf(CompositeExtensionRegistry);
  });

  it("composite dispatch enables wikilinks on actionRationale AND tables on reviewNotes simultaneously", () => {
    process.env["MARKDOWN_EXTENSIONS"] = "wikilinks,tables";
    const r = getExtensionRegistry();
    expect(r.getExtensions("actionRationale").rehypePlugins).toBeDefined();
    expect(r.getExtensions("reviewNotes").schemaOverrides).toBeDefined();
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
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
