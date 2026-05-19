import { ArxivExtensionRegistry, PHASE_41_DEFAULT_ENABLED_SURFACES } from "./arxiv";
import { BiorxivExtensionRegistry, PHASE_58_DEFAULT_ENABLED_SURFACES } from "./biorxiv";
import { CompositeExtensionRegistry } from "./composite";
import { DefaultExtensionRegistry } from "./default";
import { DoiExtensionRegistry, PHASE_45_DEFAULT_ENABLED_SURFACES } from "./doi";
import { OrcidExtensionRegistry, PHASE_54_DEFAULT_ENABLED_SURFACES } from "./orcid";
import { PHASE_50_DEFAULT_ENABLED_SURFACES, PubmedExtensionRegistry } from "./pubmed";
import { PHASE_39_DEFAULT_ENABLED_SURFACES, TablesExtensionRegistry } from "./tables";
import type { MarkdownExtensionRegistry } from "./types";
import {
  CROSS_ENTITY_BUILD_HREF,
  PHASE_38_DEFAULT_ENABLED_SURFACES,
  WikilinkExtensionRegistry,
} from "./wikilinks";

function buildSingleConsumerRegistry(name: string): MarkdownExtensionRegistry {
  switch (name) {
    case "wikilinks":
      return new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    case "wikilinks-cross-entity":
      // Phase 63 Unit 63.2 — first new MARKDOWN_EXTENSIONS single-value
      // arm since Phase 58 bioRxiv. First registry-level realization of
      // the Phase-62 plugin-option axis: WikilinkExtensionRegistry with
      // CROSS_ENTITY_BUILD_HREF emits tuple-form rehypePlugins per
      // ADR-0018 D-G APPEND-D-AU (Phase 63 cross-entity wikilinks;
      // closes APPEND-D-L item 3 at 25-phase carryover).
      return new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES, {
        buildHref: CROSS_ENTITY_BUILD_HREF,
      });
    case "tables":
      return new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    case "arxiv":
      return new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    case "doi":
      return new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    case "pubmed":
      return new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    case "orcid":
      return new OrcidExtensionRegistry(PHASE_54_DEFAULT_ENABLED_SURFACES);
    case "biorxiv":
      return new BiorxivExtensionRegistry(PHASE_58_DEFAULT_ENABLED_SURFACES);
    default:
      throw new Error(
        `Unknown MARKDOWN_EXTENSIONS value: "${name}". ` +
          `Recognized values at this build: "default" (default), "wikilinks", "wikilinks-cross-entity", "tables", "arxiv", "doi", "pubmed", "orcid", "biorxiv", ` +
          `or a comma-separated combination of non-default values (e.g., "wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv"). ` +
          `Phase 63+ values will extend this list — see ADR-0018 D-G APPEND APPEND-D-AU.`,
      );
  }
}

/**
 * Markdown-extension registry factory per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 37 framework; Phase 38 Unit 38.2 adds the
 * first non-default env-var dispatch arm).
 *
 * Returns the active `MarkdownExtensionRegistry` for this
 * process; caches the returned instance per-process (lazy
 * singleton; mirrors the `lib/moderation/getModerator()` Phase
 * 35 + `lib/email/` Resend-client Phase 30 lazy-init patterns).
 *
 * Reads `process.env.MARKDOWN_EXTENSIONS` lazily on first call;
 * dispatches:
 *
 *   - unset / empty-string / `"default"` → `DefaultExtensionRegistry`
 *     (empty extension sets for all four surfaces; Day-1
 *     behavioral parity with Phase-18/27/29 baseline; the
 *     pre-Phase-38 default).
 *   - `"wikilinks"` → `WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES)`
 *     (wikilinks enabled on `actionRationale` only Phase 38; the
 *     three other surfaces continue to receive empty extension
 *     sets via `WikilinkExtensionRegistry`'s default-deny).
 *   - `"tables"` → `TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES)`
 *     (GFM tables enabled on `reviewNotes` only Phase 39; second
 *     concrete Phase-37-framework consumer; exercises the
 *     `schemaOverrides` slot per ADR-0018 D-G APPEND APPEND-D-N).
 *   - `"arxiv"` → `ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES)`
 *     (arXiv ID auto-link enabled on `rationale` only Phase 41;
 *     third concrete Phase-37-framework consumer; exercises the
 *     `remarkPlugins` slot per ADR-0018 D-G APPEND APPEND-D-U;
 *     **completes 3-of-3 framework slot demonstration via real
 *     consumer**).
 *   - `"doi"` → `DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES)`
 *     (DOI auto-link enabled on `rationale` only Phase 45;
 *     **fourth concrete Phase-37-framework consumer**;
 *     **first second-consumer in any single framework slot** —
 *     DOI joins arxiv in `remarkPlugins`; per ADR-0018 D-G
 *     APPEND APPEND-D-AC. Phase 49 expanded to all 4 surfaces).
 *   - `"pubmed"` → `PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES)`
 *     (PubMed PMID auto-link enabled on `rationale` only Phase
 *     50; **fifth concrete Phase-37-framework consumer**; **first
 *     3rd-`remarkPlugins` consumer** beyond arxiv + doi — tests
 *     whether the regex-disjointness-as-sole-defense discipline
 *     scales to 3 same-slot consumers; per ADR-0018 D-G APPEND
 *     APPEND-D-AH).
 *
 *   - `"wikilinks,tables"` / `"wikilinks,arxiv"` / `"tables,arxiv"`
 *     / `"wikilinks,tables,arxiv"` / `"arxiv,doi"` /
 *     `"wikilinks,tables,arxiv,doi"` / `"arxiv,doi,pubmed"` /
 *     `"wikilinks,tables,arxiv,doi,pubmed"` (or any comma-
 *     separated combination of recognized non-default values) →
 *     `CompositeExtensionRegistry` wrapping the listed component
 *     registries per ADR-0018 D-G APPEND APPEND-D-R composition
 *     rules. Phase 50 enables **5-way composition** —
 *     `wikilinks` + `tables` + `arxiv` + `doi` + `pubmed`
 *     coexist on their respective surfaces. **First 3-consumer
 *     same-slot composition Phase 50**: `arxiv,doi,pubmed` puts
 *     three plugins in the `remarkPlugins` slot on shared-enabled
 *     surfaces (Phase 50 default: `rationale`); the three regex
 *     character classes are pairwise disjoint, so the regex-
 *     disjointness-as-sole-defense discipline (Phase 48
 *     established for 2 same-slot consumers; Phase 49
 *     generalized to all 4 surfaces) scales to 3 without
 *     architectural change. Duplicates rejected; `"default"`
 *     cannot combine with other values.
 *
 * Future Phase 46+ values (not recognized at Phase 45 ship):
 *
 *   - per-curator extension preferences (DB-backed registry
 *     override).
 *   - curator-facing extension-enable UI (`/curator/extensions`).
 *   - additional concrete consumers (e.g., DOI auto-link as
 *     sibling of arxiv in the `remarkPlugins` slot; @mention
 *     resolution; footnotes; smart-quotes).
 *   - surface-list-as-env-var (e.g.,
 *     `MARKDOWN_EXTENSIONS_WIKILINKS_SURFACES=actionRationale,bio`).
 *
 * Unknown values throw at first `getExtensionRegistry()` call
 * (not at module load) with a clear message listing recognized
 * values. The throw is deliberate per Phase-37 framework's
 * APPEND-D-E throw-on-unknown discipline (mirrors `getModerator()`
 * D-E): a curator who typos `MARKDOWN_EXTENSIONS=wikilinkx`
 * would otherwise silently fall through to the default — the
 * wrong default for a mis-typed enable intent.
 *
 * Server-only: composes server-side plugin types from `unified`
 * + `rehype-sanitize`. Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB
 * invariant.
 */

let registryInstance: MarkdownExtensionRegistry | null = null;
let registryOverride: MarkdownExtensionRegistry | null = null;

export function getExtensionRegistry(): MarkdownExtensionRegistry {
  if (registryOverride) return registryOverride;
  if (registryInstance) return registryInstance;

  const provider = process.env["MARKDOWN_EXTENSIONS"] ?? "";

  if (provider === "" || provider === "default") {
    registryInstance = new DefaultExtensionRegistry();
    return registryInstance;
  }

  const parts = provider
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length === 0) {
    throw new Error(
      `Invalid MARKDOWN_EXTENSIONS value: "${provider}" parsed to empty list ` +
        `after splitting on commas + trimming. Use "default" (or unset) for ` +
        `the default registry; otherwise one or more recognized non-default ` +
        `values comma-separated (e.g., "wikilinks", "tables", or "wikilinks,tables").`,
    );
  }

  if (parts.includes("default")) {
    throw new Error(
      `Invalid MARKDOWN_EXTENSIONS value: "${provider}". The "default" value ` +
        `cannot be combined with other extensions; use it alone or unset the ` +
        `env-var entirely.`,
    );
  }

  const seen = new Set<string>();
  for (const part of parts) {
    if (seen.has(part)) {
      throw new Error(
        `Invalid MARKDOWN_EXTENSIONS value: "${provider}". Duplicate extension ` +
          `"${part}" in the comma-separated list.`,
      );
    }
    seen.add(part);
  }

  if (parts.length === 1) {
    const part = parts[0];
    if (part === undefined) {
      registryInstance = new DefaultExtensionRegistry();
      return registryInstance;
    }
    registryInstance = buildSingleConsumerRegistry(part);
    return registryInstance;
  }

  const components = parts.map((part) => buildSingleConsumerRegistry(part));
  registryInstance = new CompositeExtensionRegistry(components);
  return registryInstance;
}

/**
 * Test-only override hook for the active registry per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 37 Unit 37.2).
 *
 * Vitest tests need per-suite control over which extension
 * registry is active so the Unit-37.2 integration in
 * `lib/markdown/index.ts` can be verified against a non-default
 * registry (e.g., one with non-empty `schemaOverrides` or
 * `rehypePlugins`). This hook installs the given registry as
 * the active one; pass `null` to remove the override (the
 * `__resetRegistryForTests` hook does this and also clears the
 * default singleton).
 *
 * After calling `__setRegistryForTests`, tests that exercise
 * `renderBioMarkdown` etc. should also call
 * `__resetMarkdownCachesForTests` in `lib/markdown/index.ts`
 * so the lazily-cached processor singletons rebuild against
 * the swapped registry.
 *
 * Not exported via a "test-only" runtime convention because
 * Phase 37 has no test/index runtime split; callers in
 * production code should not invoke this.
 */
export function __setRegistryForTests(r: MarkdownExtensionRegistry | null): void {
  registryOverride = r;
}

/**
 * Test-only reset hook for the lazily-initialized registry
 * singleton per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 37).
 *
 * Mirrors `__resetModeratorForTests` (Phase 35
 * `lib/moderation/index.ts`) + `__resetResendClientForTests`
 * (Phase 30 `lib/email/index.ts`). Clears the default singleton
 * AND the test override (set via `__setRegistryForTests`); next
 * `getExtensionRegistry()` call returns a fresh
 * `DefaultExtensionRegistry`.
 *
 * Not exported via a "test-only" runtime convention because
 * Phase 37 has no test/index runtime split; callers in
 * production code should not invoke this.
 */
export function __resetRegistryForTests(): void {
  registryInstance = null;
  registryOverride = null;
}

export { DefaultExtensionRegistry } from "./default";
export type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";
