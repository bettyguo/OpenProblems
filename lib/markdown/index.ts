import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";
import type { Options as Schema } from "rehype-sanitize";
import type { Plugin, PluggableList } from "unified";

import { getExtensionRegistry } from "./extensions";
import type { MarkdownSurface } from "./extensions";
import {
  actionRationaleSchema,
  bioSchema,
  rationaleSchema,
  reviewNotesSchema,
} from "./sanitize-schema";

/**
 * Server-side markdown rendering pipeline for `users.bio` per
 * [ADR-0018](../../docs/adr/0018-markdown-sanitization.md).
 *
 * Pipeline (D-A):
 *   1. `remark-parse` — markdown source → MDAST.
 *   2. `remark-gfm` — GitHub Flavored Markdown extensions
 *      (strikethrough, autolinks, task lists). Tables + footnotes
 *      ARE parsed here but stripped at the sanitization stage
 *      (their tag names are NOT in `bioSchema.tagNames`).
 *   3. `remark-rehype` with `allowDangerousHtml: false` — MDAST →
 *      HAST; raw HTML in markdown source is stripped at this
 *      boundary (first line of defense).
 *   4. **Heading demotion** (D-C) — `<h1>` → `<h3>`, `<h2>` →
 *      `<h4>`, `<h3>` → `<h5>`, `<h4>`/`<h5>`/`<h6>` → `<h6>`
 *      (page outline preservation; user display name is page-level
 *      `<h1>` on `/u/{handle}` + `/profile`).
 *   5. `rehype-sanitize` with `bioSchema` — defense-in-depth re-
 *      validation against the explicit tag + attribute + URL-
 *      protocol allow-list.
 *   6. `rehype-stringify` — HAST → HTML string.
 *
 * Render path is **server-side only** (D-F): the pipeline runs in
 * async server components at request time; rendered HTML is
 * inlined via `dangerouslySetInnerHTML` in the consumer page.
 * No client-side markdown processing; First Load JS shared chunk
 * UNCHANGED at 103 kB.
 *
 * @param text The raw markdown source string from `users.bio`, or
 *   null when the user has never set a bio (or after explicit
 *   clear per ADR-0016 D-B).
 * @returns Sanitized HTML string, or null when input is null /
 *   whitespace-only. The caller (server component) renders the
 *   HTML via `dangerouslySetInnerHTML`; null caller omits the bio
 *   section entirely per Phase-15 D-F empty-state behavior.
 */
export function renderBioMarkdown(text: string | null): string | null {
  if (text === null) return null;
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;

  const file = getBioProcessor().processSync(trimmed);
  const html = String(file).trim();
  return html.length === 0 ? null : html;
}

/**
 * Server-side markdown rendering for `ratingChallenge.reviewNotes`
 * per [ADR-0018](../../docs/adr/0018-markdown-sanitization.md) D-G
 * inheritance contract (Phase-18 Unit 18.1 sibling of
 * {@link renderBioMarkdown}).
 *
 * Identical pipeline + behavior to {@link renderBioMarkdown}; uses
 * the parallel `reviewNotesSchema` (which is currently identical to
 * `bioSchema` Phase-18 per Unit 18.0 D-3 scope-cap discipline;
 * Phase-19+ may diverge if curator demand surfaces — Q72 candidate).
 * Separate processor instance keeps the schema audit boundary
 * explicit per surface.
 *
 * Consumer surfaces (Phase 18):
 *   - `/[locale]/curator/challenges/[id]/page.tsx` — curator
 *     dashboard; **full render, no clamp** (curator wants full
 *     editorial readability).
 *   - `/[locale]/profile/page.tsx` — user's own challenges listing;
 *     **full render + CSS `line-clamp-3`** for visual truncation
 *     (replaces Phase-12's `truncateRationale()` source-truncation
 *     which is incompatible with markdown — mid-tag truncation risks
 *     breaking formatting).
 *
 * @param text The raw markdown source from `ratingChallenge.reviewNotes`,
 *   or null when no curator review notes were attached.
 * @returns Sanitized HTML string, or null when input is null /
 *   whitespace-only. Caller (server component) renders via
 *   `dangerouslySetInnerHTML`; null caller omits the reviewNotes
 *   block entirely.
 */
export function renderReviewNotesMarkdown(text: string | null): string | null {
  if (text === null) return null;
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;

  const file = getReviewNotesProcessor().processSync(trimmed);
  const html = String(file).trim();
  return html.length === 0 ? null : html;
}

/**
 * Heading demotion plugin per ADR-0018 D-C. Demotes any heading
 * (`<h1>` through `<h6>`) by **2 levels**, clamping at `<h6>`.
 *
 * `<h1>` → `<h3>`
 * `<h2>` → `<h4>`
 * `<h3>` → `<h5>`
 * `<h4>`/`<h5>`/`<h6>` → `<h6>`
 *
 * Page outline (preserved): page-level `<h1>` is user display
 * name on `/u/{handle}` + `/profile`; page-level `<h2>` is section
 * heading ("Edit profile", "Activity"); bio headings nest within.
 */
const rehypeDemoteHeadings: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node: Element) => {
    const tag = node.tagName;
    switch (tag) {
      case "h1":
        node.tagName = "h3";
        break;
      case "h2":
        node.tagName = "h4";
        break;
      case "h3":
        node.tagName = "h5";
        break;
      case "h4":
      case "h5":
      case "h6":
        node.tagName = "h6";
        break;
    }
  });
};

/**
 * Strip `<a href>` attributes that don't match the ADR-0018 D-D
 * URL allow-list (`https:` + `mailto:` ONLY). Defense-in-depth
 * BEYOND rehype-sanitize's `protocols.href` filter — the
 * `protocols` filter only inspects URLs WITH a scheme; schemeless
 * relative URLs (`/path`, `path`, `#anchor`) pass through it. This
 * plugin rejects those explicitly per ADR-0018 D-D's "relative
 * URLs DENIED" clause.
 *
 * Runs AFTER rehype-sanitize in the pipeline so the sanitized tree
 * shape is stable when this plugin walks it.
 */
const ABSOLUTE_HTTPS_OR_MAILTO = /^(https:\/\/|mailto:)/i;

const rehypeStripUnsafeHrefs: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "a") return;
    const href = node.properties?.href;
    if (typeof href !== "string" || !ABSOLUTE_HTTPS_OR_MAILTO.test(href)) {
      if (node.properties) delete node.properties.href;
    }
  });
};

/**
 * Builds a `unified` processor for the given markdown surface per
 * ADR-0018 D-G APPEND (Phase 37 Unit 37.2). Reads
 * `getExtensionRegistry().getExtensions(surface)` once at build
 * time and folds the surface's extensions into the pipeline per
 * APPEND-D-C (override-replace schema semantics: caller-supplied
 * complete replacement for any field they override; framework
 * does NOT deep-merge) + APPEND-D-D (extension plugins fold
 * AFTER the default plugins; sanitization baseline established
 * first; extensions are post-processing).
 *
 * Pipeline shape:
 *   1. `remark-parse` — markdown → MDAST.
 *   2. `remark-gfm` — GFM extensions.
 *   3. `extensions.remarkPlugins` (post-default per APPEND-D-D).
 *   4. `remark-rehype` with `allowDangerousHtml: false` — MDAST
 *      → HAST; raw HTML in source stripped here.
 *   5. `rehypeDemoteHeadings` — D-C heading demotion.
 *   6. `rehype-sanitize` with the surface schema
 *      `{ ...baseSchema, ...(extensions.schemaOverrides ?? {}) }`
 *      — defense-in-depth allow-list.
 *   7. `rehypeStripUnsafeHrefs` — D-D defense-in-depth.
 *   8. `extensions.rehypePlugins` (post-default per APPEND-D-D;
 *      runs AFTER `rehype-sanitize` so extension-generated nodes
 *      enter the post-sanitize tree under explicit caller intent;
 *      future `rehype-wikilink` example documented in APPEND-D-D).
 *   9. `rehype-stringify` — HAST → HTML string.
 *
 * Build cost is amortized via the lazy getters
 * (`getBioProcessor()` + 3 siblings) below; first-call cost is
 * paid on the first render of each surface in a given process,
 * then the cached singleton is returned.
 */
function buildProcessor(surface: MarkdownSurface, baseSchema: Schema) {
  const extensions = getExtensionRegistry().getExtensions(surface);
  const schema: Schema = {
    ...baseSchema,
    ...(extensions.schemaOverrides ?? {}),
  };
  const remarkExtensions: PluggableList = [...(extensions.remarkPlugins ?? [])];
  const rehypeExtensions: PluggableList = [...(extensions.rehypePlugins ?? [])];
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkExtensions)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeDemoteHeadings)
    .use(rehypeSanitize, schema)
    .use(rehypeStripUnsafeHrefs)
    .use(rehypeExtensions)
    .use(rehypeStringify);
}

type BuiltProcessor = ReturnType<typeof buildProcessor>;

/**
 * Lazy-built singleton `unified` processor instance for
 * `renderBioMarkdown`. Build cost is amortized across requests
 * (server-side cache across the module's lifetime); first call
 * pays the `unified()` chain build cost + the
 * `getExtensionRegistry()` read.
 *
 * Renamed-and-promoted-to-lazy from the Phase-17 module-level
 * `const bioProcessor = unified()...` per Unit 37.2: the lazy
 * shape lets tests swap the registry (via
 * `__setRegistryForTests` in `./extensions`) then call
 * `__resetMarkdownCachesForTests` to force a fresh build that
 * picks up the swapped extensions. Zero behavioral change
 * Day 1 with `DefaultExtensionRegistry` returning empty
 * extension sets.
 */
let bioProcessor: BuiltProcessor | null = null;
function getBioProcessor(): BuiltProcessor {
  if (bioProcessor) return bioProcessor;
  bioProcessor = buildProcessor("bio", bioSchema);
  return bioProcessor;
}

/**
 * Lazy-built singleton `unified` processor instance for
 * `renderReviewNotesMarkdown` per ADR-0018 D-G inheritance
 * contract (Phase 18; promoted to lazy Phase 37 Unit 37.2 for
 * extension-framework integration). Uses `reviewNotesSchema`
 * (currently identical to `bioSchema` Phase-18 per Unit 18.0
 * D-3 scope-cap discipline). Separate cache keeps the schema
 * audit boundary explicit per surface.
 */
let reviewNotesProcessor: BuiltProcessor | null = null;
function getReviewNotesProcessor(): BuiltProcessor {
  if (reviewNotesProcessor) return reviewNotesProcessor;
  reviewNotesProcessor = buildProcessor("reviewNotes", reviewNotesSchema);
  return reviewNotesProcessor;
}

/**
 * Lazy-built singleton `unified` processor instance for
 * `renderRationaleMarkdown` per ADR-0018 D-G inheritance contract
 * (Phase 27 — **third sibling processor** after `bioProcessor`
 * Phase-17 + `reviewNotesProcessor` Phase-18; promoted to lazy
 * Phase 37 Unit 37.2). Uses `rationaleSchema` (currently identical
 * to `bioSchema` Phase-27 per ADR-0018 D-G scope-cap discipline).
 */
let rationaleProcessor: BuiltProcessor | null = null;
function getRationaleProcessor(): BuiltProcessor {
  if (rationaleProcessor) return rationaleProcessor;
  rationaleProcessor = buildProcessor("rationale", rationaleSchema);
  return rationaleProcessor;
}

/**
 * Server-side markdown rendering pipeline for
 * `ratingChallenges.rationale` per ADR-0018 D-G inheritance
 * contract (Phase 27 — third call site after `renderBioMarkdown`
 * + `renderReviewNotesMarkdown`).
 *
 * **Differs from siblings in input shape**: rationale is `NOT NULL`
 * per Phase-11 schema (50-2000 chars required; column has no
 * nullable case). Signature is `string → string` rather than
 * `string | null → string | null`. Caller (server component on
 * detail page + 3 listing pages) renders the returned HTML via
 * `dangerouslySetInnerHTML`; no null-fallback path needed.
 *
 * Render surfaces:
 *   - `app/[locale]/u/[handle]/challenges/[id]/page.tsx` — full
 *     render (Phase-26 detail page; closes Phase-26 B.10 item 1).
 *   - `app/[locale]/u/[handle]/challenges/page.tsx` — full render +
 *     CSS `line-clamp-3` (per-user listing; replaces Phase-14
 *     `truncateRationale` source-truncation per Phase-18
 *     line-clamp precedent).
 *   - `app/[locale]/profile/page.tsx` — full render + `line-clamp-3`
 *     (user's own challenges; replaces Phase-12 source-truncation).
 *   - `app/[locale]/problems/[slug]/challenges/page.tsx` — full
 *     render + `line-clamp-3` (per-problem listing; replaces
 *     Phase-13 source-truncation).
 *
 * @param text Raw markdown source from `ratingChallenges.rationale`.
 *   Caller-guaranteed non-empty per Phase-11 schema; helper does
 *   not need to handle null / empty fallback.
 * @returns Sanitized HTML string. Always non-empty when input
 *   contains at least one non-whitespace character (which the
 *   schema guarantees).
 */
export function renderRationaleMarkdown(text: string): string {
  const file = getRationaleProcessor().processSync(text);
  return String(file).trim();
}

/**
 * Lazy-built singleton `unified` processor instance for
 * `renderActionRationaleMarkdown` per ADR-0018 D-G inheritance
 * contract (Phase 29 — **fourth sibling processor** after
 * `bioProcessor` Phase-17 + `reviewNotesProcessor` Phase-18 +
 * `rationaleProcessor` Phase-27; promoted to lazy Phase 37 Unit
 * 37.2). Uses `actionRationaleSchema` (currently identical to
 * `bioSchema` Phase-29 per ADR-0018 D-G scope-cap discipline).
 */
let actionRationaleProcessor: BuiltProcessor | null = null;
function getActionRationaleProcessor(): BuiltProcessor {
  if (actionRationaleProcessor) return actionRationaleProcessor;
  actionRationaleProcessor = buildProcessor("actionRationale", actionRationaleSchema);
  return actionRationaleProcessor;
}

/**
 * Test-only reset hook for the four lazily-built processor
 * singletons per
 * [ADR-0018](../../docs/adr/0018-markdown-sanitization.md) D-G
 * APPEND (Phase 37 Unit 37.2). Clears all four caches so the
 * next call to a `render*` helper rebuilds the processor
 * against the active registry (typically swapped via
 * `__setRegistryForTests` in `./extensions`).
 *
 * Vitest tests verifying the framework-integration path should
 * call this hook in `beforeEach`/`afterEach` alongside
 * `__resetRegistryForTests` to guarantee per-suite isolation.
 *
 * Not exported via a "test-only" runtime convention because
 * Phase 37 has no test/index runtime split; callers in
 * production code should not invoke this.
 */
export function __resetMarkdownCachesForTests(): void {
  bioProcessor = null;
  reviewNotesProcessor = null;
  rationaleProcessor = null;
  actionRationaleProcessor = null;
}

/**
 * Server-side markdown rendering pipeline for rating-action
 * `dimensions.<dim>.rationale` per ADR-0018 D-G inheritance
 * contract (Phase 29 — fourth call site after `renderBioMarkdown`
 * + `renderReviewNotesMarkdown` + `renderRationaleMarkdown`).
 *
 * **First content-side (Velite-validated YAML) markdown render
 * call site under ADR-0018 D-G**. The three prior helpers consume
 * DB-backed Drizzle reads; this consumer reads from the Velite
 * `RatingActions` collection at build time. Establishes the
 * convention that ADR-0018 D-G inheritance is storage-layer-
 * agnostic.
 *
 * **Signature mirrors Phase-27 `renderRationaleMarkdown`**:
 * `string → string`. Rating-action rationale is required per the
 * `rating-action.ts` Zod schema (ADR-0005 every-action-is-
 * complete-snapshot principle); helper has no null-fallback path.
 *
 * Render surface (Phase 29):
 *   - `app/[locale]/problems/[slug]/ratings/page.tsx` — full
 *     render in `DimensionCard` (instantiated 5× per rating
 *     action via `DimensionsBlock`; difficulty + saturation +
 *     urgency + value + industry_call). Closes Phase-27 Class
 *     B.12 carryover (rating-action rationale markdown
 *     promotion).
 *
 * Wikilink handling: content already contains `[[problem-slug]]`
 * syntax in some action rationales (e.g.,
 * `hallucination-reduction/2026-05-14-initial.yaml` value
 * rationale references `[[scalable-oversight]]`). After markdown
 * promotion these continue to render as literal text — neither
 * `remark-parse` nor `remark-gfm` resolves wikilinks. **No
 * regression** vs the Phase-3 `whitespace-pre-line` renderer.
 * Active wikilink resolution is Phase-30+ candidate (Phase-29
 * Class B.14 hygiene item; gated on demand signal).
 *
 * @param text Raw markdown source from
 *   `RatingAction.dimensions.<dim>.rationale` (Velite-validated
 *   YAML). Caller-guaranteed non-empty per `rating-action.ts`
 *   Zod schema; helper does not handle null / empty fallback.
 * @returns Sanitized HTML string.
 */
export function renderActionRationaleMarkdown(text: string): string {
  const file = getActionRationaleProcessor().processSync(text);
  return String(file).trim();
}
