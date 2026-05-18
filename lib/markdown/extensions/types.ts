import type { Options as Schema } from "rehype-sanitize";
import type { Pluggable } from "unified";

/**
 * Markdown-extension framework types per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 37 — Q72 markdown schema-divergence
 * framework as ADR-0018 D-G framework-only-pattern reuse from
 * Phase 35 `lib/moderation/` shape).
 *
 * Framework-only Phase 37: defines the `MarkdownExtensionRegistry`
 * interface + `MarkdownExtensionSet` per-surface configuration
 * shape + `MarkdownSurface` literal union. The default registry
 * (`./default.ts`) returns empty extension sets for all four
 * surfaces — Day-1 behavioral parity with Phase-18/27/29 baseline.
 *
 * Concrete extension implementations (wikilinks per-bio; tables
 * per-reviewNotes; footnotes per-rationale; tel-URLs per-
 * actionRationale; etc.) deferred to Phase 38+ per ADR-0018 D-G
 * APPEND F-list.
 *
 * Server-only: callers run inside server components / async
 * server actions. Never include in a `"use client"` boundary.
 * Preserves the Phase 9+ First Load JS 103 kB invariant.
 */

/**
 * Four wired markdown surfaces under ADR-0018 D-G inheritance
 * contract. Order mirrors chronological introduction:
 *
 *   - `"bio"` — `users.bio` (Phase 17 / ADR-0018 D-E).
 *   - `"reviewNotes"` — `ratingChallenge.reviewNotes`
 *     (Phase 18 / ADR-0018 D-G REALIZED block).
 *   - `"rationale"` — `ratingChallenge.rationale`
 *     (Phase 27 / ADR-0018 D-G REALIZED block).
 *   - `"actionRationale"` — `RatingAction.dimensions.<dim>.rationale`
 *     (Phase 29 / ADR-0018 D-G REALIZED block; first content-side
 *     Velite-validated markdown surface).
 *
 * Phase 38+ additions append to this union (e.g., `"about"` for
 * a future static-page markdown surface). The
 * `DefaultExtensionRegistry.getExtensions` switch is exhaustive
 * over this union — TypeScript will flag missing arms when
 * extending.
 */
export type MarkdownSurface = "bio" | "reviewNotes" | "rationale" | "actionRationale";

/**
 * Per-surface extension configuration returned by
 * `MarkdownExtensionRegistry.getExtensions(surface)`.
 *
 *   - `remarkPlugins` — additional `remark` plugins folded into
 *     the unified pipeline AFTER the default `remark-parse` +
 *     `remark-gfm` plugins (per ADR-0018 D-G APPEND D-12 lean
 *     plugin-order discipline).
 *   - `rehypePlugins` — additional `rehype` plugins folded into
 *     the pipeline AFTER the default `rehype-sanitize` + the
 *     `rehypeDemoteHeadings` + `rehypeStripUnsafeHrefs` defense-
 *     in-depth steps (same after-default ordering).
 *   - `schemaOverrides` — `Partial<Schema>` diff against the
 *     surface's base sanitize schema. **Override-replace
 *     semantics** per ADR-0018 D-G APPEND D-11 lean: a future
 *     override with `tagNames: ["p", "table", ...]` replaces the
 *     entire base `tagNames` array; callers supply the COMPLETE
 *     replacement for any field they override. The framework
 *     does NOT deep-merge.
 *
 * All three fields are optional; an empty `{}` is a valid
 * `MarkdownExtensionSet` representing "no extensions for this
 * surface" — exactly what `DefaultExtensionRegistry` returns for
 * all four surfaces Phase 37.
 */
export interface MarkdownExtensionSet {
  remarkPlugins?: ReadonlyArray<Pluggable>;
  rehypePlugins?: ReadonlyArray<Pluggable>;
  schemaOverrides?: Partial<Schema>;
}

/**
 * Provider-agnostic markdown-extension registry interface. All
 * four wired markdown helpers (`renderBioMarkdown` +
 * `renderReviewNotesMarkdown` + `renderRationaleMarkdown` +
 * `renderActionRationaleMarkdown`) depend on this type, not on
 * the `DefaultExtensionRegistry` concrete class.
 *
 * Implementations return an extension set per surface. The
 * default returns `{}` (empty) for every surface. Future Phase
 * 38+ concrete-extension registries compose per-surface logic
 * inside this single method per ADR-0018 D-G APPEND D-10 lean
 * (single-method-vs-per-surface-methods).
 */
export interface MarkdownExtensionRegistry {
  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet;
}
