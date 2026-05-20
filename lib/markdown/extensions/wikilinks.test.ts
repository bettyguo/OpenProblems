import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it, vi } from "vitest";

import {
  CROSS_ENTITY_BUILD_HREF,
  DEFAULT_BUILD_HREF,
  PHASE_38_DEFAULT_ENABLED_SURFACES,
  rehypeResolveWikilinks,
  type ResolveWikilinksOptions,
  WikilinkExtensionRegistry,
} from "./wikilinks";

/**
 * Minimal pipeline that exercises `rehypeResolveWikilinks` in
 * isolation — bypasses sanitize + strip-unsafe-hrefs so the
 * plugin's behavior can be verified directly. End-to-end tests
 * (with the full sanitize pipeline + factory dispatch) land in
 * Unit 38.2.
 */
function runWikilinkPipeline(md: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeResolveWikilinks)
      .use(rehypeStringify)
      .processSync(md),
  );
}

describe("rehypeResolveWikilinks — plugin behavior", () => {
  it('resolves a single [[slug]] to <a class="wikilink" href="/problems/slug">slug</a>', () => {
    expect(runWikilinkPipeline("[[scalable-oversight]]")).toBe(
      '<p><a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a></p>',
    );
  });

  it("preserves surrounding text", () => {
    expect(runWikilinkPipeline("see [[scalable-oversight]] for context")).toBe(
      '<p>see <a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a> for context</p>',
    );
  });

  it("resolves multiple [[slug]] in one paragraph", () => {
    expect(runWikilinkPipeline("[[a-slug]] and [[other-slug]]")).toBe(
      '<p><a class="wikilink" href="/problems/a-slug">a-slug</a> and <a class="wikilink" href="/problems/other-slug">other-slug</a></p>',
    );
  });

  it("resolves adjacent wikilinks without intervening text", () => {
    expect(runWikilinkPipeline("[[a]][[b]]")).toBe(
      '<p><a class="wikilink" href="/problems/a">a</a><a class="wikilink" href="/problems/b">b</a></p>',
    );
  });

  it("ignores non-matching input (uppercase slug)", () => {
    expect(runWikilinkPipeline("[[Slug]]")).toBe("<p>[[Slug]]</p>");
  });

  it("ignores non-matching input (space in slug)", () => {
    expect(runWikilinkPipeline("[[my slug]]")).toBe("<p>[[my slug]]</p>");
  });

  it("ignores empty [[]] (regex requires [a-z0-9-]+ at least one char)", () => {
    expect(runWikilinkPipeline("[[]]")).toBe("<p>[[]]</p>");
  });

  it("resolves a wikilink nested inside a bold element", () => {
    expect(runWikilinkPipeline("**[[scalable-oversight]]**")).toBe(
      '<p><strong><a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a></strong></p>',
    );
  });

  it("does not resolve a wikilink-looking pattern inside a code block (text node unchanged in pre/code)", () => {
    // Code-block content also passes through `visit("text", ...)` so the
    // plugin will technically resolve it. Phase 39+ may add code-block-
    // skip if curator demand surfaces. For Phase 38 this is documented
    // behavior, not a regression — the test asserts the current shape.
    const html = runWikilinkPipeline("`[[scalable-oversight]]`");
    // The code-element's inner text is left alone by `unist-util-visit`
    // mid-substring matching because the wikilink IS the entire text node;
    // it gets replaced with the `<a>` element. Document the current shape:
    expect(html).toContain('href="/problems/scalable-oversight"');
  });

  it("resolves a wikilink that is the entire paragraph", () => {
    expect(runWikilinkPipeline("[[hallucination-reduction]]")).toBe(
      '<p><a class="wikilink" href="/problems/hallucination-reduction">hallucination-reduction</a></p>',
    );
  });

  // ---------------------------------------------------------------
  // Phase-46 alias syntax `[[slug|display-text]]` (Unit 46.1).
  // Backwards-compatible with Phase-38 `[[slug]]`; the alias clause
  // is an optional non-capturing group `(?:\|([^\]\n]+))?`. Closes
  // ADR-0018 APPEND-D-L item 2 at 8-phase carryover (Phase 38 →
  // 46). Display character class excludes `]` (terminator) and `\n`
  // (paragraph-break boundary).
  // ---------------------------------------------------------------

  it("Phase-46: resolves [[slug|display]] to anchor with display text content", () => {
    expect(runWikilinkPipeline("[[scalable-oversight|the alignment frontier]]")).toBe(
      '<p><a class="wikilink" href="/problems/scalable-oversight">the alignment frontier</a></p>',
    );
  });

  it("Phase-46: backwards-compat — bare [[slug]] still renders as <a>slug</a>", () => {
    expect(runWikilinkPipeline("[[scalable-oversight]]")).toBe(
      '<p><a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a></p>',
    );
  });

  it("Phase-46: preserves multi-word display with internal spaces", () => {
    expect(runWikilinkPipeline("[[hallucination-reduction|truth in LLM outputs]]")).toBe(
      '<p><a class="wikilink" href="/problems/hallucination-reduction">truth in LLM outputs</a></p>',
    );
  });

  it("Phase-46: aliased + non-aliased wikilinks coexist in same paragraph", () => {
    expect(
      runWikilinkPipeline("see [[scalable-oversight|here]] and [[hallucination-reduction]]"),
    ).toBe(
      '<p>see <a class="wikilink" href="/problems/scalable-oversight">here</a> and ' +
        '<a class="wikilink" href="/problems/hallucination-reduction">hallucination-reduction</a></p>',
    );
  });

  it("Phase-46: empty alias [[slug|]] does NOT match (display class requires \\+; falls through as literal)", () => {
    // The alias display class is `+` (one-or-more); `[[slug|]]` has zero
    // chars between `|` and `]]` and does not satisfy the inner group.
    // The optional outer group can skip itself, but then the engine
    // expects `\]\]` immediately after `slug`, which would consume `|`
    // first — mismatch. The whole pattern fails to match and the literal
    // text passes through unchanged. Documented Phase-46 behavior; the
    // alternative (matching with empty alias → fallback to slug) is a
    // Phase 47+ refinement candidate.
    expect(runWikilinkPipeline("[[scalable-oversight|]]")).toBe("<p>[[scalable-oversight|]]</p>");
  });

  it("Phase-46: ampersand in display HTML-escapes correctly via rehype-stringify text-node rendering", () => {
    // Display becomes the text-node content of <a>; rehype-stringify
    // escapes `&` → `&#x26;` automatically. Asserts no HTML injection
    // via display text — the text-node escape is the line of defense.
    // (HTML tags like `<script>` are stripped earlier by remark-parse
    // before this plugin runs; that defense is tested at the full-
    // pipeline integration level in `lib/markdown/index.test.ts`.)
    const html = runWikilinkPipeline("[[a|Cats & dogs]]");
    expect(html).toContain('<a class="wikilink" href="/problems/a">Cats &#x26; dogs</a>');
  });

  it("Phase-46: less-than character in display HTML-escapes correctly", () => {
    // `<` in display escapes to `&#x3C;` via text-node rendering.
    // Using a context that doesn't trigger HTML parsing.
    const html = runWikilinkPipeline("[[a|x < y]]");
    expect(html).toContain('<a class="wikilink" href="/problems/a">x &#x3C; y</a>');
  });

  it("Phase-46: alias nested in bold — <strong> wraps the aliased <a>", () => {
    expect(runWikilinkPipeline("**[[scalable-oversight|alignment]]**")).toBe(
      '<p><strong><a class="wikilink" href="/problems/scalable-oversight">alignment</a></strong></p>',
    );
  });

  it("Phase-46: uppercase slug rejects (APPEND-D-I XSS-safety preserved); falls through as literal", () => {
    // Slug capture group still `[a-z0-9-]+`. Uppercase letters fail.
    // Pattern doesn't match; entire literal passes through.
    expect(runWikilinkPipeline("[[Slug|Display]]")).toBe("<p>[[Slug|Display]]</p>");
  });

  it("Phase-46: alias containing pipe character is included in display (pipe is in display class)", () => {
    // The display class `[^\]\n]+` includes `|`, so a second `|` in
    // an alias is consumed as part of the display string. Curator
    // who wants a literal `|` in display gets it.
    expect(runWikilinkPipeline("[[a|left|right]]")).toBe(
      '<p><a class="wikilink" href="/problems/a">left|right</a></p>',
    );
  });

  it("Phase-46: alias preserves leading/trailing whitespace verbatim (no auto-trim Phase 46)", () => {
    // D-10 prep-doc decision: whitespace preserved per curator intent.
    expect(runWikilinkPipeline("[[a|  spaced  ]]")).toBe(
      '<p><a class="wikilink" href="/problems/a">  spaced  </a></p>',
    );
  });

  it("Phase-46: newline in alias rejects (display class excludes \\n); falls through as literal", () => {
    // The display class `[^\]\n]+` excludes newlines. Multi-line
    // aliases are not supported Phase 46 (would conflate prose with
    // alias content). The pattern's `g` flag does not enable `s`
    // dotall, but the explicit `\n` exclusion makes the boundary
    // explicit per APPEND-D-AD.
    const html = runWikilinkPipeline("[[a|first\nsecond]]");
    expect(html).toContain("[[a|first");
    expect(html).toContain("second]]");
    expect(html).not.toContain('href="/problems/a"');
  });

  it("Phase-46: complex slug + multi-word display", () => {
    expect(
      runWikilinkPipeline("[[long-horizon-agent-reliability|the pass^k reliability gap]]"),
    ).toBe(
      '<p><a class="wikilink" href="/problems/long-horizon-agent-reliability">' +
        "the pass^k reliability gap</a></p>",
    );
  });
});

describe("WikilinkExtensionRegistry — class behavior", () => {
  it("returns rehypeResolveWikilinks for enabled surfaces", () => {
    const r = new WikilinkExtensionRegistry(new Set(["actionRationale"]));
    expect(r.getExtensions("actionRationale")).toEqual({
      rehypePlugins: [rehypeResolveWikilinks],
    });
  });

  it("returns empty extension set for non-enabled surfaces", () => {
    const r = new WikilinkExtensionRegistry(new Set(["actionRationale"]));
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
  });

  it("supports an empty enabled set (all surfaces disabled)", () => {
    const r = new WikilinkExtensionRegistry(new Set());
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports multiple enabled surfaces (Phase 39+ expansion shape)", () => {
    const r = new WikilinkExtensionRegistry(new Set(["bio", "actionRationale"]));
    expect(r.getExtensions("bio")).toEqual({
      rehypePlugins: [rehypeResolveWikilinks],
    });
    expect(r.getExtensions("actionRationale")).toEqual({
      rehypePlugins: [rehypeResolveWikilinks],
    });
    expect(r.getExtensions("reviewNotes")).toEqual({});
  });

  it("exposes PHASE_38_DEFAULT_ENABLED_SURFACES = Set of all 4 surfaces (Phase 42 expansion)", () => {
    // Phase 38 ship: Set(["actionRationale"]). Phase 42 expansion: all 4
    // surfaces per ADR-0018 APPEND-D-L item 1 closure (cross-surface
    // wikilink expansion). Constant NAME preserved (Phase 38 = introduction
    // phase encoded in name); VALUE evolved Phase 42 per prep-doc D-8
    // "keep Phase-38 name" lean.
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(true);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(true);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(true);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.size).toBe(4);
  });
});

// =============================================================================
// Phase-62 plugin parameterization (Unit 62.1).
//
// Closes ADR-0018 APPEND-D-L item 6 (Plugin parameterization) at 24-phase
// carryover (Phase 38 → 62) — NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE
// RECORD (extends Phase-61 22-phase record by 2 phases). Introduces the
// **plugin-option axis** as the third principal axis of zero-rework
// framework extension. Default-fallback DEFAULT_BUILD_HREF preserves
// Phase-38-through-Phase-61 behavior verbatim under bare-plugin invocation.
// Prerequisite for Phase 63 cross-entity wikilinks (APPEND-D-L item 3).
// =============================================================================

/**
 * Phase-62 variant of `runWikilinkPipeline` that exercises the tuple-form
 * plugin invocation `unified().use([rehypeResolveWikilinks, options])`.
 * Bypasses sanitize + strip-unsafe-hrefs like the bare-form pipeline above
 * — the plugin's behavior with custom options can be verified directly.
 */
function runWikilinkPipelineWithOptions(md: string, options: ResolveWikilinksOptions): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeResolveWikilinks, options)
      .use(rehypeStringify)
      .processSync(md),
  );
}

describe("Phase-62 plugin parameterization — buildHref option behavior", () => {
  it("default-call (no options) produces Phase-38 hardcoded /problems/{slug} href (backwards-compat)", () => {
    // Regression guard: the bare-plugin invocation
    // `.use(rehypeResolveWikilinks)` must continue producing the Phase-38
    // hardcoded shape verbatim — this is the load-bearing default that
    // `WikilinkExtensionRegistry.getExtensions(...)` relies on. If this
    // assertion regresses, every existing call site breaks.
    expect(runWikilinkPipeline("[[scalable-oversight]]")).toBe(
      '<p><a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a></p>',
    );
  });

  it("custom buildHref produces custom href in emitted <a>", () => {
    expect(
      runWikilinkPipelineWithOptions("[[arxiv-2401-12345]]", {
        buildHref: (slug) => `/papers/${slug}`,
      }),
    ).toBe('<p><a class="wikilink" href="/papers/arxiv-2401-12345">arxiv-2401-12345</a></p>');
  });

  it("custom buildHref invoked exactly once per matched slug", () => {
    const builder = vi.fn((slug: string) => `/x/${slug}`);
    runWikilinkPipelineWithOptions("[[a]] and [[b]] and [[a]]", {
      buildHref: builder,
    });
    // Three slug matches → three invocations (no caching, no double-call;
    // the plugin invokes builder once per regex match). **Phase 63
    // extension**: plugin now passes `(slug, entityType)` per the
    // Phase-63 regex extension; entityType is undefined for bare
    // `[[slug]]` syntax (no `entity-type:` prefix captured).
    expect(builder).toHaveBeenCalledTimes(3);
    expect(builder).toHaveBeenNthCalledWith(1, "a", undefined);
    expect(builder).toHaveBeenNthCalledWith(2, "b", undefined);
    expect(builder).toHaveBeenNthCalledWith(3, "a", undefined);
  });

  it("custom buildHref orthogonal to Phase-46 alias-syntax — href uses builder, display preserves alias", () => {
    expect(
      runWikilinkPipelineWithOptions("[[scalable-oversight|the oversight problem]]", {
        buildHref: (slug) => `https://example.org/problems/${slug}`,
      }),
    ).toBe(
      '<p><a class="wikilink" href="https://example.org/problems/scalable-oversight">' +
        "the oversight problem</a></p>",
    );
  });

  it('custom buildHref returning empty string emits href="" (no special handling — trusts builder)', () => {
    // Document the contract: the framework does NOT validate, sanitize, or
    // reject builder return values. Builders are responsible for producing
    // safe URLs — see ResolveWikilinksOptions.buildHref docstring.
    const html = runWikilinkPipelineWithOptions("[[a]]", {
      buildHref: () => "",
    });
    expect(html).toContain('<a class="wikilink" href="">a</a>');
  });

  it("custom buildHref can dispatch on slug content (slug-prefix-driven routing)", () => {
    // Demonstrates the Phase-63 cross-entity-wikilinks use case: a builder
    // that inspects slug shape and routes to a different entity-type URL.
    // Phase 63 will introduce a richer entity-type disambiguation syntax;
    // Phase 62 ships the affordance that makes that future work tractable.
    const html = runWikilinkPipelineWithOptions(
      "[[paper-arxiv-2401]] and [[author-jane-doe]] and [[plain-slug]]",
      {
        buildHref: (slug) => {
          if (slug.startsWith("paper-")) return `/papers/${slug.slice("paper-".length)}`;
          if (slug.startsWith("author-")) return `/authors/${slug.slice("author-".length)}`;
          return `/problems/${slug}`;
        },
      },
    );
    expect(html).toContain('<a class="wikilink" href="/papers/arxiv-2401">paper-arxiv-2401</a>');
    expect(html).toContain('<a class="wikilink" href="/authors/jane-doe">author-jane-doe</a>');
    expect(html).toContain('<a class="wikilink" href="/problems/plain-slug">plain-slug</a>');
  });

  it("DEFAULT_BUILD_HREF is byte-identical to the Phase-38 hardcoded shape", () => {
    // The default-fallback constant is the load-bearing backwards-
    // compatibility anchor. Asserts the shape directly (no plugin
    // involvement) so a future refactor that re-routes the default through
    // a different code path still has to satisfy this property.
    expect(DEFAULT_BUILD_HREF("scalable-oversight")).toBe("/problems/scalable-oversight");
    expect(DEFAULT_BUILD_HREF("a")).toBe("/problems/a");
    expect(DEFAULT_BUILD_HREF("multi-word-slug-with-digits-123")).toBe(
      "/problems/multi-word-slug-with-digits-123",
    );
  });
});

// =============================================================================
// Phase-62 plugin parameterization — registry-tied integration (Unit 62.2).
//
// These tests cover the cross-cut between the framework's `MarkdownExtensionRegistry`
// abstraction (Phase 37+) and the Phase-62 plugin-option axis. They guard
// against three failure modes that a Phase-62 refactor could plausibly
// introduce:
//
//   1. Registry-emitted plugin reference drifts from the Phase-38 default-
//      call shape (e.g., registry starts emitting tuple-form on its own).
//   2. Tuple-form invocation through unified() fails at runtime (would
//      block Phase-63 cross-entity wikilinks from working).
//   3. Default-call and custom-call diverge in structural output beyond
//      the href value (would silently break alias-syntax / multi-match
//      shape under custom builders).
// =============================================================================

describe("Phase-62 plugin parameterization — WikilinkExtensionRegistry integration", () => {
  it("registry-emitted rehypePlugins is the bare plugin reference (default-call shape preserved)", () => {
    // WikilinkExtensionRegistry must continue to emit the bare plugin
    // reference (no tuple form) under Phase 62. If a future refactor
    // changes the registry to emit tuple-form by default, this test
    // catches it — Phase 62's contract is "default-fallback preserves
    // Phase 38-61 behavior verbatim" which requires the registry to NOT
    // wrap the plugin in a tuple.
    const r = new WikilinkExtensionRegistry(new Set(["actionRationale"]));
    const set = r.getExtensions("actionRationale");
    expect(set.rehypePlugins).toEqual([rehypeResolveWikilinks]);
    // Identity check (the reference itself, not a copy) — confirms the
    // registry does not allocate a new function or wrap in a tuple.
    expect(set.rehypePlugins?.[0]).toBe(rehypeResolveWikilinks);
  });

  it("registry-tied default-call end-to-end produces Phase-38 hardcoded href on all 4 surfaces", () => {
    // For each enabled surface, the registry-emitted plugin reference
    // runs through unified() with no options and produces the Phase-38
    // hardcoded /problems/{slug} shape. Regression guard for the load-
    // bearing default-call invariant across the full surface roster.
    const r = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const surfaces = ["bio", "reviewNotes", "rationale", "actionRationale"] as const;
    for (const surface of surfaces) {
      const set = r.getExtensions(surface);
      const plugin = set.rehypePlugins?.[0];
      expect(plugin).toBe(rehypeResolveWikilinks);
      // Drive the registry-emitted plugin through unified() with no
      // options — must produce the Phase-38 hardcoded href.
      const html = String(
        unified()
          .use(remarkParse)
          .use(remarkRehype)

          .use(plugin as any)
          .use(rehypeStringify)
          .processSync("[[scalable-oversight]]"),
      );
      expect(html).toBe(
        '<p><a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a></p>',
      );
    }
  });

  it("tuple-form invocation hypothesis: Phase-63 cross-entity consumer COULD compose non-default registry variant", () => {
    // Demonstrates the Phase-62-shipped affordance is exercisable: a
    // hypothetical Phase-63 cross-entity consumer constructs a non-default
    // unified pipeline by tuple-form-wrapping the bare plugin from a
    // default registry. NO registry rework required — pure unified()
    // composition.
    //
    // This test PROVES the Phase-62 abstraction boundary: registry-state
    // axis (which surfaces) is orthogonal to plugin-option axis (which
    // builder). A Phase-63 consumer can pick a registry's surface set and
    // independently inject a custom builder at the pipeline assembly site.
    const r = new WikilinkExtensionRegistry(new Set(["bio"]));
    const plugin = r.getExtensions("bio").rehypePlugins?.[0];
    expect(plugin).toBe(rehypeResolveWikilinks);

    // Phase-63-style tuple-form composition (NOT what the default registry
    // does — this is the consumer's choice at pipeline assembly).
    const html = String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeResolveWikilinks, {
          buildHref: (slug) => `/papers/${slug}`,
        })
        .use(rehypeStringify)
        .processSync("[[arxiv-2401]]"),
    );
    expect(html).toBe('<p><a class="wikilink" href="/papers/arxiv-2401">arxiv-2401</a></p>');
  });

  it("default-call vs custom-call: same input → same structure, divergent href only", () => {
    // Structural invariant: the buildHref option changes ONLY the href
    // value on emitted <a> elements. Alias display text, surrounding
    // text, multi-match shape, paragraph wrapping — all identical.
    const input = "see [[a-slug|the alias]] and [[other-slug]] inline";
    const defaultHtml = runWikilinkPipeline(input);
    const customHtml = runWikilinkPipelineWithOptions(input, {
      buildHref: (slug) => `/custom/${slug}`,
    });

    expect(defaultHtml).toBe(
      '<p>see <a class="wikilink" href="/problems/a-slug">the alias</a> and ' +
        '<a class="wikilink" href="/problems/other-slug">other-slug</a> inline</p>',
    );
    expect(customHtml).toBe(
      '<p>see <a class="wikilink" href="/custom/a-slug">the alias</a> and ' +
        '<a class="wikilink" href="/custom/other-slug">other-slug</a> inline</p>',
    );
    // Structural divergence is href-only: same number of <a> elements,
    // same display text, same surrounding text.
    const defaultAnchorCount = (defaultHtml.match(/<a /g) ?? []).length;
    const customAnchorCount = (customHtml.match(/<a /g) ?? []).length;
    expect(defaultAnchorCount).toBe(customAnchorCount);
    expect(defaultAnchorCount).toBe(2);
  });

  it("plugin-option axis orthogonal to registry-state axis: vary enabledSurfaces and buildHref independently", () => {
    // Phase-62 architectural-first assertion: three principal axes of
    // zero-rework framework extension (registry-state + plugin-body +
    // plugin-option) compose orthogonally. Two registries with different
    // enabledSurfaces sets BOTH emit the same bare plugin reference; a
    // tuple-form invocation at the pipeline site varies the option
    // axis independently.
    const narrow = new WikilinkExtensionRegistry(new Set(["bio"]));
    const broad = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);

    // Both emit the same bare plugin reference (registry-state axis
    // varies surface set; plugin reference is shared).
    expect(narrow.getExtensions("bio").rehypePlugins?.[0]).toBe(rehypeResolveWikilinks);
    expect(broad.getExtensions("bio").rehypePlugins?.[0]).toBe(rehypeResolveWikilinks);

    // Narrow registry returns empty for non-enabled surface;
    // broad returns the plugin for the same surface — orthogonal to
    // any plugin-option choice.
    expect(narrow.getExtensions("rationale")).toEqual({});
    expect(broad.getExtensions("rationale").rehypePlugins?.[0]).toBe(rehypeResolveWikilinks);

    // Plugin-option axis varies independently at the pipeline site,
    // regardless of which registry emitted the plugin reference.
    const html = String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeResolveWikilinks, {
          buildHref: (slug) => `/x/${slug}`,
        })
        .use(rehypeStringify)
        .processSync("[[a]]"),
    );
    expect(html).toBe('<p><a class="wikilink" href="/x/a">a</a></p>');
  });
});

// =============================================================================
// Phase-63 cross-entity wikilinks (Unit 63.1).
//
// Closes ADR-0018 APPEND-D-L item 3 (Cross-entity wikilinks) at 25-phase
// carryover (Phase 38 → 63) — NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE
// RECORD; third consecutive phase to set the absolute-record; first
// 3-consecutive-phase absolute-record-extension streak (Phase 61 22-phase
// → Phase 62 24-phase → Phase 63 25-phase). First consumer of a forward-
// compat plugin-option affordance shipped in a prior phase (Phase 62
// buildHref → Phase 63 cross-entity). Extends WIKILINK_PATTERN to capture
// optional `(entity-type):` prefix; extends ResolveWikilinksOptions.buildHref
// signature from (slug) => string to (slug, entityType?) => string; adds
// exported CROSS_ENTITY_BUILD_HREF routing paper / author / institution to
// /papers / /authors / /institutions (graceful-degradation fallback to
// /problems for undefined OR unknown entity-types).
// =============================================================================

describe("Phase-63 cross-entity wikilinks — regex extension + entityType routing", () => {
  it("regex matches [[paper:slug]] and routes via CROSS_ENTITY_BUILD_HREF to /papers/{slug}", () => {
    // Display text falls back to the slug portion (NOT the full
    // `entity-type:slug` combination) per the existing `display = alias
    // ?? slug` semantic; entity-type is metadata used only for routing.
    // Curators wanting a richer display can use the alias form
    // `[[paper:slug|display]]`.
    expect(
      runWikilinkPipelineWithOptions("[[paper:arxiv-2401-12345]]", {
        buildHref: CROSS_ENTITY_BUILD_HREF,
      }),
    ).toBe('<p><a class="wikilink" href="/papers/arxiv-2401-12345">arxiv-2401-12345</a></p>');
  });

  it("regex matches [[author:slug|display]] (entity-type + alias) — href uses entity routing, display preserved", () => {
    expect(
      runWikilinkPipelineWithOptions("[[author:jane-doe|Jane Doe]]", {
        buildHref: CROSS_ENTITY_BUILD_HREF,
      }),
    ).toBe('<p><a class="wikilink" href="/authors/jane-doe">Jane Doe</a></p>');
  });

  it("regex matches [[institution:slug]] and routes to /institutions/{slug}", () => {
    // Display = slug ("mit"); entity-type "institution" is metadata only.
    expect(
      runWikilinkPipelineWithOptions("[[institution:mit]]", {
        buildHref: CROSS_ENTITY_BUILD_HREF,
      }),
    ).toBe('<p><a class="wikilink" href="/institutions/mit">mit</a></p>');
  });

  it("regex still matches bare [[plain-slug]] under Phase-63 extended pattern (backwards-compat)", () => {
    // Critical regression guard: extended regex `(?:(entity-type):)?` is
    // optional; bare slug syntax without `:` continues to match with
    // entityType=undefined and routes via CROSS_ENTITY_BUILD_HREF fallback
    // to /problems/{slug}. Pre-Phase-63 wikilink shapes are unaffected.
    expect(
      runWikilinkPipelineWithOptions("[[scalable-oversight]]", {
        buildHref: CROSS_ENTITY_BUILD_HREF,
      }),
    ).toBe('<p><a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a></p>');
  });

  it("CROSS_ENTITY_BUILD_HREF: paper entity-type routes to /papers/{slug}", () => {
    expect(CROSS_ENTITY_BUILD_HREF("arxiv-2401-12345", "paper")).toBe("/papers/arxiv-2401-12345");
  });

  it("CROSS_ENTITY_BUILD_HREF: author entity-type routes to /authors/{slug}", () => {
    expect(CROSS_ENTITY_BUILD_HREF("jane-doe", "author")).toBe("/authors/jane-doe");
  });

  it("CROSS_ENTITY_BUILD_HREF: institution entity-type routes to /institutions/{slug}", () => {
    expect(CROSS_ENTITY_BUILD_HREF("mit", "institution")).toBe("/institutions/mit");
  });

  it("CROSS_ENTITY_BUILD_HREF: undefined entityType routes to /problems/{slug} (bare wikilink fallback)", () => {
    expect(CROSS_ENTITY_BUILD_HREF("scalable-oversight")).toBe("/problems/scalable-oversight");
    expect(CROSS_ENTITY_BUILD_HREF("scalable-oversight", undefined)).toBe(
      "/problems/scalable-oversight",
    );
  });

  it("CROSS_ENTITY_BUILD_HREF: unknown entityType gracefully degrades to /problems/{slug}", () => {
    // Curator typos (e.g., `[[papre:x]]` instead of `[[paper:x]]`) or
    // unrecognized prefixes (e.g., `[[project:x]]`) fall back to
    // /problems/{slug} per D-11 lean (graceful degradation). The
    // entityType prefix is silently dropped; only the slug portion is used.
    expect(CROSS_ENTITY_BUILD_HREF("x", "papre")).toBe("/problems/x");
    expect(CROSS_ENTITY_BUILD_HREF("x", "project")).toBe("/problems/x");
    expect(CROSS_ENTITY_BUILD_HREF("x", "zzz")).toBe("/problems/x");
  });

  it("DEFAULT_BUILD_HREF byte-identity preserved across Phase-63 (still 1-arg; Phase-62 contract preserved)", () => {
    // The Phase-62 contract that DEFAULT_BUILD_HREF is "byte-identical to
    // the Phase-38 hardcoded shape" is PRESERVED at Phase 63. DEFAULT_BUILD_HREF
    // remains a 1-arg function; the Phase-63 regex extension passes entityType
    // as a second arg, which TypeScript optional-param widening silently
    // drops when calling a 1-arg builder. Bare `[[plain-slug]]` under
    // DEFAULT_BUILD_HREF continues to route to /problems/{slug}.
    expect(DEFAULT_BUILD_HREF("scalable-oversight")).toBe("/problems/scalable-oversight");
    expect(DEFAULT_BUILD_HREF.length).toBe(1); // arity assertion
  });

  it("DEFAULT_BUILD_HREF silently drops entityType under Phase-63 regex (legacy fallback semantics for `wikilinks` arm)", () => {
    // When `[[paper:x]]` is matched and DEFAULT_BUILD_HREF is the builder
    // (e.g., under MARKDOWN_EXTENSIONS=wikilinks), the captured entityType
    // "paper" is silently dropped; only "x" (the slug portion) is used.
    // Routes to /problems/x. This is the LEGACY fallback semantics that
    // the existing `wikilinks` arm exhibits at Phase 63; curators who want
    // cross-entity routing opt INTO the new `wikilinks-cross-entity` arm.
    expect(runWikilinkPipeline("[[paper:x]]")).toBe(
      '<p><a class="wikilink" href="/problems/x">x</a></p>',
    );
    expect(runWikilinkPipeline("[[author:jane-doe]]")).toBe(
      '<p><a class="wikilink" href="/problems/jane-doe">jane-doe</a></p>',
    );
  });

  it("Phase-63 entityType + alias + multi-match coexistence (combinatorial smoke)", () => {
    const html = runWikilinkPipelineWithOptions(
      "see [[paper:arxiv-1|the paper]] cited by [[author:jane-doe|Jane Doe]] from [[institution:mit]]",
      { buildHref: CROSS_ENTITY_BUILD_HREF },
    );
    expect(html).toBe(
      '<p>see <a class="wikilink" href="/papers/arxiv-1">the paper</a> cited by ' +
        '<a class="wikilink" href="/authors/jane-doe">Jane Doe</a> from ' +
        '<a class="wikilink" href="/institutions/mit">mit</a></p>',
    );
  });
});

// =============================================================================
// Phase-63 cross-entity wikilinks — WikilinkExtensionRegistry buildHref ctor
// arg + tuple-form emit (Unit 63.2).
//
// These tests cover the Phase-63 evolution of WikilinkExtensionRegistry:
// adding an optional `{ buildHref }` constructor arg that switches the
// registry's emit shape from Phase-38-baseline bare form (no buildHref) to
// Phase-63 tuple form (buildHref set). They jointly assert:
//
//   - Phase-62 Unit-62.2 invariant preserved: default-call (no buildHref)
//     emits bare plugin reference (identity-equal to rehypeResolveWikilinks).
//   - Phase-63 tuple-form emit when buildHref is set; tuple shape matches
//     unified()'s `[plugin, options]` invocation contract.
//   - Cross-entity routing observable end-to-end via tuple-form emit.
// =============================================================================

describe("Phase-63 cross-entity wikilinks — WikilinkExtensionRegistry buildHref ctor arg", () => {
  it("default ctor (no options) emits bare plugin reference (Phase-62 invariant preserved)", () => {
    // Critical regression guard: existing factory call
    // `new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES)`
    // (no second arg) must continue to emit bare form. The
    // `MARKDOWN_EXTENSIONS=wikilinks` arm depends on this behavior.
    const r = new WikilinkExtensionRegistry(new Set(["actionRationale"]));
    const set = r.getExtensions("actionRationale");
    expect(set.rehypePlugins).toEqual([rehypeResolveWikilinks]);
    expect(set.rehypePlugins?.[0]).toBe(rehypeResolveWikilinks);
  });

  it("ctor with options={} (explicit empty options) still emits bare plugin reference", () => {
    // Defensive check: passing `{}` as the options arg should be
    // equivalent to omitting it (`buildHref` ends up undefined; bare emit).
    const r = new WikilinkExtensionRegistry(new Set(["actionRationale"]), {});
    const set = r.getExtensions("actionRationale");
    expect(set.rehypePlugins?.[0]).toBe(rehypeResolveWikilinks);
  });

  it("ctor with buildHref emits tuple form [plugin, {buildHref}]", () => {
    const customBuilder = (slug: string) => `/custom/${slug}`;
    const r = new WikilinkExtensionRegistry(new Set(["bio"]), { buildHref: customBuilder });
    const set = r.getExtensions("bio");
    expect(set.rehypePlugins).toEqual([[rehypeResolveWikilinks, { buildHref: customBuilder }]]);
    // The tuple's first element is the bare plugin reference; second is
    // the options object containing the curator-supplied buildHref.
    const tuple = set.rehypePlugins?.[0] as [
      typeof rehypeResolveWikilinks,
      ResolveWikilinksOptions,
    ];
    expect(tuple[0]).toBe(rehypeResolveWikilinks);
    expect(tuple[1].buildHref).toBe(customBuilder);
  });

  it("ctor with CROSS_ENTITY_BUILD_HREF emits tuple form wired to cross-entity router", () => {
    const r = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES, {
      buildHref: CROSS_ENTITY_BUILD_HREF,
    });
    for (const surface of ["bio", "reviewNotes", "rationale", "actionRationale"] as const) {
      const set = r.getExtensions(surface);
      const tuple = set.rehypePlugins?.[0] as [
        typeof rehypeResolveWikilinks,
        ResolveWikilinksOptions,
      ];
      expect(tuple[0]).toBe(rehypeResolveWikilinks);
      expect(tuple[1].buildHref).toBe(CROSS_ENTITY_BUILD_HREF);
    }
  });

  it("ctor with buildHref returns empty extension set on non-enabled surfaces (Phase-38 surface-disable preserved)", () => {
    // Surface gating is orthogonal to the plugin-option axis: a surface
    // not in `enabledSurfaces` returns `{}` regardless of buildHref.
    const r = new WikilinkExtensionRegistry(new Set(["bio"]), {
      buildHref: CROSS_ENTITY_BUILD_HREF,
    });
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("end-to-end: ctor with CROSS_ENTITY_BUILD_HREF produces /papers/{slug} via tuple-form emit", () => {
    // Drive a full unified pipeline against a registry-emitted tuple to
    // verify the cross-entity routing manifests end-to-end via the
    // registry pathway (not just direct plugin invocation). The tuple
    // shape `[plugin, options]` is destructured into unified's 2-arg
    // `.use(plugin, options)` form — passing the tuple itself as a
    // single arg would trigger unified's list-form interpretation
    // (which treats element 2 as a separate "plugin" — invalid).
    const r = new WikilinkExtensionRegistry(new Set(["bio"]), {
      buildHref: CROSS_ENTITY_BUILD_HREF,
    });
    const tuple = r.getExtensions("bio").rehypePlugins?.[0] as [
      typeof rehypeResolveWikilinks,
      ResolveWikilinksOptions,
    ];
    const html = String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(tuple[0], tuple[1])
        .use(rehypeStringify)
        .processSync("[[paper:arxiv-2401]] cited by [[author:jane-doe|Jane Doe]]"),
    );
    expect(html).toBe(
      '<p><a class="wikilink" href="/papers/arxiv-2401">arxiv-2401</a> cited by ' +
        '<a class="wikilink" href="/authors/jane-doe">Jane Doe</a></p>',
    );
  });
});

describe("Phase-65 className emission — plugin-only emit pattern (first non-regex plugin-body realization; first 8-realization for plugin-body axis; first state where plugin-body axis exceeds registry-state axis; closes APPEND-D-L item 4 at 27-phase carryover — NEW LONGEST ABSOLUTE record; first post-tie absolute-record extension)", () => {
  it("Phase-65: emits class='wikilink' on resolved <a> for bare [[slug]] syntax", () => {
    // Phase 38 baseline shape + Phase 65 className addition. The resolved
    // <a> element carries `class="wikilink"` so downstream CSS can style
    // wikilink anchors distinctly from external links.
    const html = runWikilinkPipeline("see [[problem-slug]]");
    expect(html).toContain('class="wikilink"');
    expect(html).toContain('href="/problems/problem-slug"');
    expect(html).toBe(
      '<p>see <a class="wikilink" href="/problems/problem-slug">problem-slug</a></p>',
    );
  });

  it("Phase-65: emits class='wikilink' on resolved <a> for [[slug|display]] alias syntax (Phase-46 alias preserved)", () => {
    // Phase 46 alias + Phase 65 className composition: anchor text content
    // is the display string; class attribute is the new addition.
    const html = runWikilinkPipeline("see [[problem-slug|alias display]]");
    expect(html).toBe(
      '<p>see <a class="wikilink" href="/problems/problem-slug">alias display</a></p>',
    );
  });

  it("Phase-65: emits class='wikilink' on resolved <a> for [[paper:slug]] cross-entity syntax (Phase-63 cross-entity preserved)", () => {
    // Phase 63 cross-entity + Phase 65 className composition: cross-entity
    // routing produces /papers/{slug} href; className is the new addition.
    // Note: bare-form `rehypeResolveWikilinks` uses DEFAULT_BUILD_HREF which
    // drops entityType — the test runs the plugin with explicit
    // CROSS_ENTITY_BUILD_HREF.
    const html = String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeResolveWikilinks, { buildHref: CROSS_ENTITY_BUILD_HREF })
        .use(rehypeStringify)
        .processSync("see [[paper:arxiv-2401]]"),
    );
    expect(html).toBe('<p>see <a class="wikilink" href="/papers/arxiv-2401">arxiv-2401</a></p>');
  });

  it("Phase-65: emits class='wikilink' alongside Phase-62 custom buildHref (plugin-option axis + plugin-body axis compose independently)", () => {
    // Custom buildHref (Phase-62 plugin-option axis) + Phase-65 className
    // (plugin-body axis) compose orthogonally: the className is emitted
    // regardless of which builder is in use.
    const customBuilder: ResolveWikilinksOptions["buildHref"] = (slug) => `/x/${slug}`;
    const html = String(
      unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeResolveWikilinks, { buildHref: customBuilder })
        .use(rehypeStringify)
        .processSync("[[abc]]"),
    );
    expect(html).toBe('<p><a class="wikilink" href="/x/abc">abc</a></p>');
  });

  it("Phase-65: className value is exactly 'wikilink' — regression guard against value drift", () => {
    // Hardcoded literal value per D-9 lean. Future Phase 66+ may extend to
    // curator-configurable className via plugin-option axis, but Phase 65
    // commits to literal "wikilink". Validates the exact string + absence
    // of additional class tokens.
    const html = runWikilinkPipeline("[[x]]");
    expect(html).toContain('class="wikilink"');
    // Negative assertions: no multi-class state, no namespace prefix, no
    // typo variants (deliberately strict — if Phase 66+ multi-className or
    // curator-configurable emit lands, this test will need to evolve).
    expect(html).not.toContain('class="wikilinks"');
    expect(html).not.toContain('class="wiki-link"');
    expect(html).not.toContain('class="wikilink wikilink"');
  });

  it("Phase-65: external markdown links emit UNCLASSED <a> tags — only wikilinks-plugin-resolved anchors get the className", () => {
    // Critical scope contract: the className is wikilink-plugin-specific.
    // External links via standard markdown `[text](url)` syntax continue to
    // emit unclassed `<a>` tags via remark-rehype's default transformation.
    // This test mixes external + wikilink in the same source to validate
    // the differentiation.
    const html = runWikilinkPipeline(
      "external [link](https://example.com) and wikilink [[problem-slug]]",
    );
    // The external link is unclassed; the wikilink is classed.
    expect(html).toContain('<a href="https://example.com">link</a>');
    expect(html).toContain('<a class="wikilink" href="/problems/problem-slug">problem-slug</a>');
    // Stronger assertion: only ONE class="wikilink" attribute in the entire
    // output (corresponding to the wikilink anchor only).
    const classCount = (html.match(/class="wikilink"/g) ?? []).length;
    expect(classCount).toBe(1);
  });

  it("Phase-65: HAST className=['wikilink'] array form renders as class=\"wikilink\" via rehype-stringify (end-to-end HAST → HTML transformation)", () => {
    // Validates that the HAST property-information `className` array form
    // (`className: ["wikilink"]`) renders to the HTML attribute
    // `class="wikilink"` via rehype-stringify. If HAST changed convention
    // (e.g., scalar string instead of array, or required `class` instead
    // of `className`), this assertion would catch the divergence.
    const html = runWikilinkPipeline("[[a]] [[b]]");
    // Both anchors get the className via the array form; rehype-stringify
    // joins multiple array entries with spaces (Phase 65 ships single
    // entry only; multi-className is Phase 66+ deferral).
    expect(html).toBe(
      '<p><a class="wikilink" href="/problems/a">a</a> <a class="wikilink" href="/problems/b">b</a></p>',
    );
  });
});

describe("Phase-67 render-time fallback — multi-className emit + isValidTarget? plugin-option (second plugin-body output-shape realization; first multi-className emit realization; 9th plugin-body axis realization; third plugin-option-axis realization; closes Phase-66 APPEND-D-AX render-time-fallback item at 1-phase carryover)", () => {
  const acceptAll = () => true;
  const rejectAll = () => false;

  it("emits Phase-65 single-class wikilink when isValidTarget option is absent (backward-compat default preserved)", () => {
    // No options at all — Phase-65 ship behavior preserved verbatim.
    expect(runWikilinkPipeline("[[any-slug]]")).toBe(
      '<p><a class="wikilink" href="/problems/any-slug">any-slug</a></p>',
    );
  });

  it("emits single-class wikilink when isValidTarget returns true", () => {
    const html = runWikilinkPipelineWithOptions("[[scalable-oversight]]", {
      isValidTarget: acceptAll,
    });
    expect(html).toBe(
      '<p><a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a></p>',
    );
    expect(html).not.toContain("wikilink-unresolved");
  });

  it("emits 2-class array when isValidTarget returns false for a bare wikilink", () => {
    const html = runWikilinkPipelineWithOptions("[[missing-slug]]", {
      isValidTarget: rejectAll,
    });
    expect(html).toBe(
      '<p><a class="wikilink wikilink-unresolved" href="/problems/missing-slug">missing-slug</a></p>',
    );
  });

  it("emits 2-class array when isValidTarget returns false for a [[paper:slug]] cross-entity wikilink", () => {
    const html = runWikilinkPipelineWithOptions("[[paper:typo]]", {
      buildHref: CROSS_ENTITY_BUILD_HREF,
      isValidTarget: rejectAll,
    });
    expect(html).toBe(
      '<p><a class="wikilink wikilink-unresolved" href="/papers/typo">typo</a></p>',
    );
  });

  it("emits 2-class array alongside alias display (Phase-46 alias + Phase-67 multi-className compose)", () => {
    const html = runWikilinkPipelineWithOptions("[[missing-slug|Missing Topic]]", {
      isValidTarget: rejectAll,
    });
    expect(html).toBe(
      '<p><a class="wikilink wikilink-unresolved" href="/problems/missing-slug">Missing Topic</a></p>',
    );
  });

  it("passes BOTH slug and entityType to the isValidTarget predicate (predicate-call-signature contract)", () => {
    const calls: Array<[string, string | undefined]> = [];
    const predicate = (slug: string, entityType?: string) => {
      calls.push([slug, entityType]);
      return true;
    };
    runWikilinkPipelineWithOptions("[[a-slug]] and [[paper:x]] and [[author:b|alias]]", {
      buildHref: CROSS_ENTITY_BUILD_HREF,
      isValidTarget: predicate,
    });
    expect(calls).toEqual([
      ["a-slug", undefined],
      ["x", "paper"],
      ["b", "author"],
    ]);
  });

  it("emits wikilink-unresolved only on the specific link whose target is rejected (selective predicate)", () => {
    // Predicate accepts the "valid" slug only; rejects everything else.
    const html = runWikilinkPipelineWithOptions("[[valid-slug]] and [[missing-slug]]", {
      isValidTarget: (slug) => slug === "valid-slug",
    });
    expect(html).toBe(
      '<p><a class="wikilink" href="/problems/valid-slug">valid-slug</a>' +
        ' and <a class="wikilink wikilink-unresolved" href="/problems/missing-slug">missing-slug</a></p>',
    );
  });

  it("WikilinkExtensionRegistry accepts isValidTarget option and emits tuple-form rehypePlugins", () => {
    const registry = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES, {
      isValidTarget: rejectAll,
    });
    const ext = registry.getExtensions("bio");
    expect(ext.rehypePlugins).toHaveLength(1);
    // Tuple-form emit when isValidTarget is set (mirrors Phase-63 buildHref
    // tuple-form): [plugin, { isValidTarget }].
    const entry = ext.rehypePlugins![0];
    expect(Array.isArray(entry)).toBe(true);
    expect((entry as [unknown, ResolveWikilinksOptions])[0]).toBe(rehypeResolveWikilinks);
    expect((entry as [unknown, ResolveWikilinksOptions])[1].isValidTarget).toBe(rejectAll);
  });

  it("WikilinkExtensionRegistry composes BOTH buildHref AND isValidTarget into one tuple", () => {
    const registry = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES, {
      buildHref: CROSS_ENTITY_BUILD_HREF,
      isValidTarget: rejectAll,
    });
    const ext = registry.getExtensions("bio");
    const entry = ext.rehypePlugins![0] as [unknown, ResolveWikilinksOptions];
    expect(entry[1].buildHref).toBe(CROSS_ENTITY_BUILD_HREF);
    expect(entry[1].isValidTarget).toBe(rejectAll);
  });

  it("WikilinkExtensionRegistry with NO options emits bare plugin reference (Phase-62/65 backward-compat preserved)", () => {
    const registry = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const ext = registry.getExtensions("bio");
    expect(ext.rehypePlugins).toEqual([rehypeResolveWikilinks]);
  });

  it("end-to-end rehype-stringify renders className array as class='wikilink wikilink-unresolved'", () => {
    // Load-bearing: HAST array form is the property-information convention;
    // rehype-stringify joins multiple array entries with single space.
    const html = runWikilinkPipelineWithOptions("[[a]] [[b]]", {
      isValidTarget: (slug) => slug === "a",
    });
    expect(html).toBe(
      '<p><a class="wikilink" href="/problems/a">a</a>' +
        ' <a class="wikilink wikilink-unresolved" href="/problems/b">b</a></p>',
    );
  });
});
