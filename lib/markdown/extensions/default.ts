import type { MarkdownExtensionRegistry, MarkdownExtensionSet, MarkdownSurface } from "./types";

/**
 * Default `MarkdownExtensionRegistry` implementation per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND (Phase 37).
 *
 * Returns an empty extension set (`{}`) for all four wired
 * surfaces. Zero behavioral change vs Phase-18/27/29 baseline
 * once Unit 37.2 wires the registry into the four markdown
 * helpers — folding empty plugin lists + empty schema overrides
 * into the existing `unified` pipelines is a no-op.
 *
 * Pre-Phase-38 production deploys ship with this registry.
 * Concrete extensions (wikilinks per-bio; tables per-
 * reviewNotes; footnotes per-rationale; tel-URLs per-
 * actionRationale; etc.) land Phase 38+ as new files in this
 * directory + new dispatch arms in the factory (`./index.ts`).
 *
 * Returns a fresh object each call (not a shared mutable
 * reference) so accidental caller mutation of one surface's
 * extension set cannot leak into another surface's call. This
 * matches the audit-friendly "framework does not deep-merge"
 * discipline of ADR-0018 D-G APPEND D-11 override-replace
 * semantics.
 */
export class DefaultExtensionRegistry implements MarkdownExtensionRegistry {
  getExtensions(surface: MarkdownSurface): MarkdownExtensionSet {
    switch (surface) {
      case "bio":
      case "reviewNotes":
      case "rationale":
      case "actionRationale":
        return {};
    }
  }
}
