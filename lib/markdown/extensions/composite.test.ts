import { describe, expect, it } from "vitest";

import { CompositeExtensionRegistry } from "./composite";
import { TablesExtensionRegistry } from "./tables";
import type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";
import { WikilinkExtensionRegistry } from "./wikilinks";

function fakeRegistry(
  fn: (surface: MarkdownSurface) => MarkdownExtensionSet,
): MarkdownExtensionRegistry {
  return { getExtensions: fn };
}

describe("CompositeExtensionRegistry — composition rules", () => {
  it("returns empty set when components array is empty", () => {
    const r = new CompositeExtensionRegistry([]);
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("single-component composite mirrors the component's output", () => {
    const wikilinks = new WikilinkExtensionRegistry(new Set(["actionRationale"]));
    const composite = new CompositeExtensionRegistry([wikilinks]);
    expect(composite.getExtensions("actionRationale")).toEqual(
      wikilinks.getExtensions("actionRationale"),
    );
    expect(composite.getExtensions("bio")).toEqual({});
  });

  it("concatenates remarkPlugins across components in registration order", () => {
    const pluginA = () => () => {};
    const pluginB = () => () => {};
    const a = fakeRegistry(() => ({ remarkPlugins: [pluginA] }));
    const b = fakeRegistry(() => ({ remarkPlugins: [pluginB] }));
    const composite = new CompositeExtensionRegistry([a, b]);
    const set = composite.getExtensions("bio");
    expect(set.remarkPlugins).toEqual([pluginA, pluginB]);
  });

  it("concatenates rehypePlugins across components in registration order", () => {
    const pluginA = () => () => {};
    const pluginB = () => () => {};
    const a = fakeRegistry(() => ({ rehypePlugins: [pluginA] }));
    const b = fakeRegistry(() => ({ rehypePlugins: [pluginB] }));
    const composite = new CompositeExtensionRegistry([a, b]);
    const set = composite.getExtensions("bio");
    expect(set.rehypePlugins).toEqual([pluginA, pluginB]);
  });

  it("passes through schemaOverrides when exactly one component provides it", () => {
    const tables = new TablesExtensionRegistry(new Set(["reviewNotes"]));
    const composite = new CompositeExtensionRegistry([tables]);
    const set = composite.getExtensions("reviewNotes");
    expect(set.schemaOverrides).toBeDefined();
  });

  it("throws on schemaOverrides conflict (two components on same surface)", () => {
    const a = fakeRegistry(() => ({ schemaOverrides: { tagNames: ["p"] } }));
    const b = fakeRegistry(() => ({ schemaOverrides: { tagNames: ["table"] } }));
    const composite = new CompositeExtensionRegistry([a, b]);
    expect(() => composite.getExtensions("bio")).toThrow(/schema override conflict/);
    expect(() => composite.getExtensions("bio")).toThrow(/component 0/);
    expect(() => composite.getExtensions("bio")).toThrow(/component 1/);
  });

  it("error message names the surface in the conflict description", () => {
    const a = fakeRegistry(() => ({ schemaOverrides: { tagNames: ["p"] } }));
    const b = fakeRegistry(() => ({ schemaOverrides: { tagNames: ["q"] } }));
    const composite = new CompositeExtensionRegistry([a, b]);
    expect(() => composite.getExtensions("reviewNotes")).toThrow(/"reviewNotes"/);
  });

  it("conflict per-surface: surfaces where only one component provides schemaOverrides do not throw", () => {
    // Component a provides schemaOverrides on "bio"; component b on "reviewNotes".
    // No conflict per surface even though both have schemaOverrides on different surfaces.
    const a = fakeRegistry((s) => (s === "bio" ? { schemaOverrides: { tagNames: ["p"] } } : {}));
    const b = fakeRegistry((s) =>
      s === "reviewNotes" ? { schemaOverrides: { tagNames: ["q"] } } : {},
    );
    const composite = new CompositeExtensionRegistry([a, b]);
    expect(composite.getExtensions("bio").schemaOverrides).toEqual({ tagNames: ["p"] });
    expect(composite.getExtensions("reviewNotes").schemaOverrides).toEqual({
      tagNames: ["q"],
    });
  });

  it("combines remarkPlugins + rehypePlugins + schemaOverrides from different components", () => {
    const remarkP = () => () => {};
    const rehypeP = () => () => {};
    const a = fakeRegistry(() => ({ remarkPlugins: [remarkP] }));
    const b = fakeRegistry(() => ({ rehypePlugins: [rehypeP] }));
    const c = fakeRegistry(() => ({ schemaOverrides: { tagNames: ["p"] } }));
    const composite = new CompositeExtensionRegistry([a, b, c]);
    const set = composite.getExtensions("bio");
    expect(set.remarkPlugins).toEqual([remarkP]);
    expect(set.rehypePlugins).toEqual([rehypeP]);
    expect(set.schemaOverrides).toEqual({ tagNames: ["p"] });
  });

  it("empty-set components contribute nothing to merged result", () => {
    const empty = fakeRegistry(() => ({}));
    const wikilinks = new WikilinkExtensionRegistry(new Set(["actionRationale"]));
    const composite = new CompositeExtensionRegistry([empty, wikilinks, empty]);
    expect(composite.getExtensions("actionRationale")).toEqual(
      wikilinks.getExtensions("actionRationale"),
    );
  });

  it("Phase 38 wikilinks + Phase 39 tables compose conflict-free (canonical Phase-40 case)", () => {
    const wikilinks = new WikilinkExtensionRegistry(new Set(["actionRationale"]));
    const tables = new TablesExtensionRegistry(new Set(["reviewNotes"]));
    const composite = new CompositeExtensionRegistry([wikilinks, tables]);

    // actionRationale: wikilinks plugin only, no schemaOverrides
    expect(composite.getExtensions("actionRationale").rehypePlugins).toBeDefined();
    expect(composite.getExtensions("actionRationale").schemaOverrides).toBeUndefined();

    // reviewNotes: tables schemaOverrides only, no plugins
    expect(composite.getExtensions("reviewNotes").schemaOverrides).toBeDefined();
    expect(composite.getExtensions("reviewNotes").rehypePlugins).toBeUndefined();

    // bio + rationale: nothing
    expect(composite.getExtensions("bio")).toEqual({});
    expect(composite.getExtensions("rationale")).toEqual({});
  });

  it("composition order does not change outcome when consumers target disjoint surfaces", () => {
    // wikilinks + tables in either order produces the same result for any surface.
    const wikilinks = new WikilinkExtensionRegistry(new Set(["actionRationale"]));
    const tables = new TablesExtensionRegistry(new Set(["reviewNotes"]));
    const ab = new CompositeExtensionRegistry([wikilinks, tables]);
    const ba = new CompositeExtensionRegistry([tables, wikilinks]);
    expect(ab.getExtensions("actionRationale")).toEqual(ba.getExtensions("actionRationale"));
    expect(ab.getExtensions("reviewNotes")).toEqual(ba.getExtensions("reviewNotes"));
  });

  it("conflict error message references ADR-0018 D-G APPEND-D-C for context", () => {
    const a = fakeRegistry(() => ({ schemaOverrides: { tagNames: ["p"] } }));
    const b = fakeRegistry(() => ({ schemaOverrides: { tagNames: ["q"] } }));
    const composite = new CompositeExtensionRegistry([a, b]);
    expect(() => composite.getExtensions("bio")).toThrow(/APPEND-D-C/);
  });
});
