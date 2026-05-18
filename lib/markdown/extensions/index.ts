import { DefaultExtensionRegistry } from "./default";
import { PHASE_39_DEFAULT_ENABLED_SURFACES, TablesExtensionRegistry } from "./tables";
import type { MarkdownExtensionRegistry } from "./types";
import { PHASE_38_DEFAULT_ENABLED_SURFACES, WikilinkExtensionRegistry } from "./wikilinks";

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
 *
 * Phase 39 mutually-exclusive dispatch: operator picks `"wikilinks"`
 * OR `"tables"` OR the default — NOT a composition of both.
 * Multi-value `MARKDOWN_EXTENSIONS=wikilinks,tables` composition
 * deferred to Phase 40+ per Phase-38-prep D-11 deferral; requires
 * a `CompositeExtensionRegistry` that merges per-surface
 * extension sets from multiple component registries.
 *
 * Future Phase 40+ values (not recognized at Phase 39 ship):
 *
 *   - per-curator extension preferences (DB-backed registry
 *     override).
 *   - curator-facing extension-enable UI (`/curator/extensions`).
 *   - multi-value `MARKDOWN_EXTENSIONS=wikilinks,tables`
 *     composition of multiple framework consumers.
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

  switch (provider) {
    case "":
    case "default":
      registryInstance = new DefaultExtensionRegistry();
      return registryInstance;
    case "wikilinks":
      registryInstance = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
      return registryInstance;
    case "tables":
      registryInstance = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
      return registryInstance;
    default:
      throw new Error(
        `Unknown MARKDOWN_EXTENSIONS value: "${provider}". ` +
          `Recognized values at this build: "default" (default), "wikilinks", "tables". ` +
          `Phase 40+ values will extend this list — see ADR-0018 D-G APPEND APPEND-D-Q.`,
      );
  }
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
