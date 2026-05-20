import type { MarkdownSurface } from "./types";
import { WIKILINK_PATTERN } from "./wikilinks";

/**
 * Build-time wikilink validator per
 * [ADR-0018](../../../docs/adr/0018-markdown-sanitization.md)
 * D-G APPEND-D-AX (Phase 66 — closes APPEND-D-L item 5
 * `404 handling for unresolved wikilinks` at 28-phase
 * carryover (Phase 38 → Phase 66) — NEW LONGEST ABSOLUTE
 * APPEND-DEFERRAL CLOSURE EVER OBSERVED; the LAST remaining
 * D-L deferral). Sibling helper to `./wikilinks.ts`; reuses
 * the same `WIKILINK_PATTERN` regex as the plugin body via
 * re-export so the validator catches exactly the cases the
 * plugin would resolve at render time.
 *
 * **404 handling mechanism** (Phase 66 D-1 framework
 * decision): build-time validation is the 404-handling
 * mechanism — curators CANNOT ship unresolved wikilinks past
 * CI (the audit fails). Render-time fallback (rendering
 * unresolved wikilinks with a distinct visual marker) is
 * redundant under build-time validation and is deferred to
 * Phase 67+ as belt-and-suspenders defense against CI-bypass.
 *
 * **Audit-layer extension** (Phase 66 D-1 framework decision):
 * the validator wires into `lib/content/cross-link-audit.ts`
 * as the 8th `AuditCheck` type `wikilink-target-fk`. Sub-
 * pattern within the existing audit-layer machinery; no new
 * principal axis of zero-rework framework extension declared
 * at Phase 66 (Phase 67+ could elevate "build-time-
 * validation" to a recognized principal axis if a second
 * realization ships).
 *
 * **Cross-entity-aware routing** mirrors the Phase-63
 * `CROSS_ENTITY_BUILD_HREF` routing exactly:
 *
 *   - `paper:` → `paperIds` set
 *   - `author:` → `authorSlugs` set
 *   - `institution:` → `institutionSlugs` set
 *   - undefined (bare `[[slug]]`) → `problemSlugs` set
 *   - unknown entity-type → `problemSlugs` set (graceful-
 *     degradation fallback per Phase 63 ship — curators who
 *     typo an entity-type get the same fallback as bare
 *     wikilinks)
 *
 * Identical behavior to the render-time routing — curators
 * who write `[[author:percy-liang]]` get validated against
 * `content/authors/`; curators who write
 * `[[unknown-entity:slug]]` get validated against
 * `content/problems/` (fallback). This guarantees the
 * validator catches exactly the cases that would produce a
 * 404 at render time.
 *
 * **XSS-safety contract**: the validator reads the same
 * `WIKILINK_PATTERN` regex used by the plugin — both slug
 * and entity-type are constrained to `[a-z0-9-]+` per
 * APPEND-D-I. The validator emits findings into the audit
 * report (strings only); no rendering, no HTML interpolation.
 * No new XSS surface introduced. The validator is read-only.
 *
 * Server-only: imported by `lib/content/cross-link-audit.ts`
 * (server-side audit script invoked from
 * `scripts/cross-link-audit.ts` via `pnpm audit-content`).
 * Never include in a `"use client"` boundary.
 */

export interface WikilinkReference {
  /**
   * Captured entity-type prefix from `[[entity-type:slug]]`
   * syntax (Phase 63+); `undefined` for bare `[[slug]]`
   * syntax (Phase 38+). Regex-constrained to `[a-z0-9-]+`
   * per APPEND-D-I.
   */
  entityType: string | undefined;
  /**
   * Captured kebab-case slug (always defined). Regex-
   * constrained to `[a-z0-9-]+` per APPEND-D-I.
   */
  slug: string;
  /**
   * Full `[[...]]` match text including any alias suffix.
   * Used for audit-finding citation so curators can locate
   * the offending wikilink in the source markdown.
   */
  matchText: string;
  /**
   * Surface where the reference was found, for finding-
   * context. Caller-supplied; the validator does not infer
   * surface from text. Matches the `MarkdownSurface` union
   * exposed by the Phase-37 framework.
   */
  surface: MarkdownSurface;
}

export interface ValidWikilinkTargets {
  problemSlugs: ReadonlySet<string>;
  paperIds: ReadonlySet<string>;
  authorSlugs: ReadonlySet<string>;
  institutionSlugs: ReadonlySet<string>;
}

/**
 * Extract every wikilink reference from a markdown string.
 * Reuses the same `WIKILINK_PATTERN` regex as the render-time
 * plugin body (re-exported from `./wikilinks.ts` for drift-
 * free consistency).
 *
 * Returns references in source-order; alias suffixes (Phase
 * 46+) are preserved in `matchText` but do not affect the
 * captured slug.
 */
export function extractWikilinkReferences(
  markdown: string,
  surface: MarkdownSurface,
): WikilinkReference[] {
  if (typeof markdown !== "string" || markdown.length === 0) return [];
  if (!markdown.includes("[[")) return [];

  WIKILINK_PATTERN.lastIndex = 0;
  const refs: WikilinkReference[] = [];
  let match: RegExpExecArray | null;

  while ((match = WIKILINK_PATTERN.exec(markdown)) !== null) {
    const entityType = match[1];
    const slug = match[2];
    if (slug === undefined) continue;
    refs.push({
      entityType,
      slug,
      matchText: match[0],
      surface,
    });
  }

  return refs;
}

/**
 * Resolve a captured `(entityType, slug)` tuple against the
 * appropriate slug-set per the Phase-63
 * `CROSS_ENTITY_BUILD_HREF` routing convention. Returns
 * `true` iff the target resolves to an existing entity in
 * the supplied `validTargets` sets.
 *
 * **Routing parity with `CROSS_ENTITY_BUILD_HREF`** (load-
 * bearing — the validator must catch exactly the cases the
 * plugin would 404 on at render time):
 *
 *   - `entityType === "paper"` → `validTargets.paperIds`
 *   - `entityType === "author"` → `validTargets.authorSlugs`
 *   - `entityType === "institution"` →
 *     `validTargets.institutionSlugs`
 *   - `entityType === undefined` (bare wikilink) →
 *     `validTargets.problemSlugs`
 *   - any other `entityType` → `validTargets.problemSlugs`
 *     (graceful-degradation fallback per Phase 63 ship)
 */
export function isValidWikilinkTarget(
  ref: WikilinkReference,
  validTargets: ValidWikilinkTargets,
): boolean {
  if (ref.entityType === "paper") return validTargets.paperIds.has(ref.slug);
  if (ref.entityType === "author") return validTargets.authorSlugs.has(ref.slug);
  if (ref.entityType === "institution") return validTargets.institutionSlugs.has(ref.slug);
  return validTargets.problemSlugs.has(ref.slug);
}
