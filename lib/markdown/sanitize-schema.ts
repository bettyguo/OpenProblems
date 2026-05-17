import type { Options as Schema } from "rehype-sanitize";

/**
 * rehype-sanitize schema for `users.bio` markdown rendering per
 * [ADR-0018](../../docs/adr/0018-markdown-sanitization.md) D-B + D-D.
 *
 * Phase-17 scope: bold / italic / inline-code / fenced-code-blocks /
 * links / autolinks / unordered + ordered + task lists / headings
 * (demoted per D-C in `lib/markdown/index.ts`) / blockquotes /
 * horizontal-rules / GFM strikethrough / paragraphs.
 *
 * Explicitly excluded (Phase 18+ candidates per D-H): tables /
 * footnotes / images / raw HTML / `class` / inline `style` / event
 * handlers / `<iframe>` / `<object>` / `<embed>` / `<script>` /
 * `<style>` / `<base>` / `<a target>` / `<a rel>` / `<a title>`.
 *
 * URL scheme allow-list per D-D: `https:` + `mailto:` ONLY.
 * Bare-URL GFM autolinks pass through this same filter as
 * defense-in-depth.
 *
 * Phase-18+ markdown surfaces (curator review notes per Phase-15
 * Class B B.2 item 5; possibly rating-action `rationale`) inherit
 * via sibling schemas (`reviewNotesSchema`, etc.) — each with its
 * own customization per ADR-0018 D-G. This schema is named
 * `bioSchema` (NOT `defaultSchema`) to signal Phase-17 scope.
 */
const baseSchemaConfig: Schema = {
  tagNames: [
    "p",
    "strong",
    "em",
    "code",
    "pre",
    "a",
    "ul",
    "ol",
    "li",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "hr",
    "del",
    "br",
    "input",
  ],
  attributes: {
    a: ["href"],
    // GFM task lists render as `<input type="checkbox" disabled>` —
    // narrowly allow these attributes to render correctly while
    // staying read-only. `type` is value-restricted to `"checkbox"`
    // via the `[attr, ...allowedValues]` tuple form.
    input: [["type", "checkbox"], "checked", "disabled"],
    "*": [],
  },
  protocols: {
    href: ["https", "mailto"],
  },
  // Disallow all comments + doctypes (XSS surface; conditional
  // comments etc.).
  allowComments: false,
  allowDoctypes: false,
};

/**
 * Schema for `users.bio` markdown rendering (Phase 17 per ADR-0018
 * D-A through D-F).
 */
export const bioSchema: Schema = baseSchemaConfig;

/**
 * Schema for `ratingChallenge.reviewNotes` markdown rendering
 * (Phase 18 per ADR-0018 D-G inheritance contract).
 *
 * **Identical to `bioSchema` Phase-18** per Unit 18.0 D-3
 * scope-cap discipline:
 *   - Audit-boundary consistency at minimum cost (one schema audit
 *     covers both surfaces).
 *   - No observed curator demand for tables / footnotes Phase 12-17.
 *   - Schema divergence opens unbounded design space; promotion
 *     driven by signal.
 *
 * Phase-19+ may diverge if curator demand surfaces (Q72 candidate
 * for curator reviewNotes tables / footnotes per Phase-18 Unit 18.0
 * D-6 + Unit 18.5 OQ-hygiene anticipated note). Explicit shallow
 * copy below signals "intentional parity Phase-18" rather than
 * "same object reference."
 */
export const reviewNotesSchema: Schema = { ...baseSchemaConfig };

/**
 * Schema for `ratingChallenge.rationale` markdown rendering
 * (Phase 27 per ADR-0018 D-G inheritance contract — **third
 * sibling schema** after `bioSchema` Phase-17 + `reviewNotesSchema`
 * Phase-18).
 *
 * **Identical to `bioSchema` Phase-27** per ADR-0018 D-G scope-cap
 * discipline, mirroring the Phase-18 `reviewNotesSchema` precedent:
 *   - Audit-boundary consistency at minimum cost (one schema audit
 *     covers all three surfaces).
 *   - No observed user demand for tables / footnotes in challenge
 *     rationale Phase 11-26 (rationale is 50-2000 chars; submitters
 *     have been writing short prose paragraphs).
 *   - Schema divergence opens unbounded design space; promotion
 *     driven by signal.
 *
 * Phase-28+ may diverge if user demand surfaces (parallels Q72
 * candidate for reviewNotes; could surface as Q73-style candidate
 * for rationale-specific markdown features). Explicit shallow copy
 * below signals "intentional parity Phase-27" rather than "same
 * object reference."
 */
export const rationaleSchema: Schema = { ...baseSchemaConfig };

/**
 * Schema for rating-action `dimensions.<dim>.rationale` markdown
 * rendering (Phase 29 per ADR-0018 D-G inheritance contract —
 * **fourth sibling schema** after `bioSchema` Phase-17 +
 * `reviewNotesSchema` Phase-18 + `rationaleSchema` Phase-27).
 *
 * **First content-side (Velite-validated YAML) markdown render
 * call site** under ADR-0018 D-G. The three prior siblings all
 * consume DB-backed columns via Drizzle; this one consumes
 * `RatingAction.dimensions.<dim>.rationale` from the Velite
 * `RatingActions` collection per ADR-0002. Establishes the
 * convention that ADR-0018 D-G inheritance is **storage-layer-
 * agnostic** — DB-backed and content-backed surfaces share the
 * same sanitization audit boundary.
 *
 * **Identical to `bioSchema` Phase-29** per ADR-0018 D-G scope-cap
 * discipline (mirrors Phase-18 + Phase-27 sibling precedents).
 * Content already contains `[[problem-slug]]` wikilink syntax;
 * markdown promotion does NOT resolve wikilinks (literal-text
 * display preserved; active wikilink resolution is Phase-30+
 * candidate gated on demand signal + cross-surface scope decision
 * + ADR-0018 D-G amendment shape — see Phase-29 Class B.14).
 *
 * Realizes the Phase-17 anticipation in this file's header
 * comment: "possibly rating-action `rationale`" named as a future
 * sibling at the original ADR-0018 D-G author time; **12-phase
 * anticipation → realization gap** (Phase 17 → Phase 29).
 */
export const actionRationaleSchema: Schema = { ...baseSchemaConfig };
