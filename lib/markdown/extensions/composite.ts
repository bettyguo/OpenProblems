import type { Options as Schema } from "rehype-sanitize";
import type { Pluggable } from "unified";

import type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";

/**
 * Composite `MarkdownExtensionRegistry` implementation per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 40 Unit 40.1 — multi-consumer composition
 * infrastructure).
 *
 * Wraps a `ReadonlyArray<MarkdownExtensionRegistry>` of component
 * registries; `getExtensions(surface)` walks all components and
 * merges their per-surface extension sets per APPEND-D-R
 * composition rules:
 *
 *   - `remarkPlugins` — **concatenated** across components in
 *     registration order; preserves plugin invocation order.
 *   - `rehypePlugins` — **concatenated** likewise; preserves
 *     post-sanitize plugin invocation order.
 *   - `schemaOverrides` — **at most one component per surface**;
 *     throws on conflict. Two consumers both providing
 *     `schemaOverrides` (any field) for the same surface
 *     cannot be safely merged under APPEND-D-C override-replace
 *     semantics — the framework explicitly rejects deep-merge.
 *     The throw is the loud-failure analog to
 *     `getExtensionRegistry()` throw-on-unknown (Phase-37
 *     APPEND-D-E discipline) — first such conflict-error within
 *     a registry class.
 *
 * Phase 38 wikilinks + Phase 39 tables compose conflict-free:
 * wikilinks uses `rehypePlugins` only on `actionRationale`;
 * tables uses `schemaOverrides` only on `reviewNotes`; surfaces
 * disjoint per their respective default-enabled sets. The
 * `MARKDOWN_EXTENSIONS=wikilinks,tables` env-var value
 * (Phase 40 Unit 40.2) constructs this composite and both
 * consumers are simultaneously active on their respective
 * surfaces.
 *
 * Server-only: imported by `getExtensionRegistry()` per the
 * Phase-40 multi-value env-var dispatch arm (Unit 40.2). Never
 * include in a `"use client"` boundary. Preserves the Phase 9+
 * First Load JS 103 kB invariant.
 */
export class CompositeExtensionRegistry implements MarkdownExtensionRegistry {
  private readonly components: ReadonlyArray<MarkdownExtensionRegistry>;

  constructor(components: ReadonlyArray<MarkdownExtensionRegistry>) {
    this.components = components;
  }

  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet {
    const remarkPlugins: Pluggable[] = [];
    const rehypePlugins: Pluggable[] = [];
    let schemaOverrides: Partial<Schema> | undefined;
    let schemaOverridesSource: number | undefined;

    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      if (!component) continue;
      const set = component.getExtensions(surface);

      if (set.remarkPlugins) {
        for (const p of set.remarkPlugins) remarkPlugins.push(p);
      }
      if (set.rehypePlugins) {
        for (const p of set.rehypePlugins) rehypePlugins.push(p);
      }
      if (set.schemaOverrides) {
        if (schemaOverrides !== undefined) {
          throw new Error(
            `CompositeExtensionRegistry: schema override conflict on surface ` +
              `"${surface}": both component ${schemaOverridesSource} and ` +
              `component ${i} provide schemaOverrides; only one may. ` +
              `Per ADR-0018 D-G APPEND APPEND-D-C override-replace ` +
              `semantics, the framework does not deep-merge.`,
          );
        }
        schemaOverrides = set.schemaOverrides;
        schemaOverridesSource = i;
      }
    }

    const result: MarkdownExtensionSet = {};
    if (remarkPlugins.length > 0) result.remarkPlugins = remarkPlugins;
    if (rehypePlugins.length > 0) result.rehypePlugins = rehypePlugins;
    if (schemaOverrides !== undefined) result.schemaOverrides = schemaOverrides;
    return result;
  }
}
