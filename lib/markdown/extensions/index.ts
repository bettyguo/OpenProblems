import { DefaultExtensionRegistry } from "./default";
import type { MarkdownExtensionRegistry } from "./types";

/**
 * Markdown-extension registry factory per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 37).
 *
 * Returns the active `MarkdownExtensionRegistry` for this
 * process; caches the returned instance per-process (lazy
 * singleton; mirrors the `lib/moderation/getModerator()` Phase
 * 35 + `lib/email/` Resend-client Phase 30 lazy-init patterns).
 *
 * Phase 37 (this build) — single dispatch arm:
 *
 *   - default → `DefaultExtensionRegistry` (empty extension
 *     sets for all four surfaces; Day-1 behavioral parity with
 *     Phase-18/27/29 baseline).
 *
 * Future Phase 38+ values (not recognized at Phase 37 ship;
 * documented in ADR-0018 D-G APPEND D-F deferral list):
 *
 *   - env-var dispatch (e.g., `MARKDOWN_EXTENSIONS=wikilinks`)
 *     mapping to per-extension registries.
 *   - per-curator extension preferences (DB-backed registry
 *     override).
 *   - curator-facing extension-enable UI (`/curator/extensions`).
 *
 * Throw-on-unknown discipline (mirrors `getModerator()` D-E)
 * applies once a second dispatch arm exists. Phase 37 has only
 * the default arm; no env-var read at this build.
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
  registryInstance = new DefaultExtensionRegistry();
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
