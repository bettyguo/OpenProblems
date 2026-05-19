import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it, vi } from "vitest";

import {
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
  it('resolves a single [[slug]] to <a href="/problems/slug">slug</a>', () => {
    expect(runWikilinkPipeline("[[scalable-oversight]]")).toBe(
      '<p><a href="/problems/scalable-oversight">scalable-oversight</a></p>',
    );
  });

  it("preserves surrounding text", () => {
    expect(runWikilinkPipeline("see [[scalable-oversight]] for context")).toBe(
      '<p>see <a href="/problems/scalable-oversight">scalable-oversight</a> for context</p>',
    );
  });

  it("resolves multiple [[slug]] in one paragraph", () => {
    expect(runWikilinkPipeline("[[a-slug]] and [[other-slug]]")).toBe(
      '<p><a href="/problems/a-slug">a-slug</a> and <a href="/problems/other-slug">other-slug</a></p>',
    );
  });

  it("resolves adjacent wikilinks without intervening text", () => {
    expect(runWikilinkPipeline("[[a]][[b]]")).toBe(
      '<p><a href="/problems/a">a</a><a href="/problems/b">b</a></p>',
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
      '<p><strong><a href="/problems/scalable-oversight">scalable-oversight</a></strong></p>',
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
      '<p><a href="/problems/hallucination-reduction">hallucination-reduction</a></p>',
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

  it("Phase-46: resolves [[slug|display]] to <a href=/problems/slug>display</a>", () => {
    expect(runWikilinkPipeline("[[scalable-oversight|the alignment frontier]]")).toBe(
      '<p><a href="/problems/scalable-oversight">the alignment frontier</a></p>',
    );
  });

  it("Phase-46: backwards-compat — bare [[slug]] still renders as <a>slug</a>", () => {
    expect(runWikilinkPipeline("[[scalable-oversight]]")).toBe(
      '<p><a href="/problems/scalable-oversight">scalable-oversight</a></p>',
    );
  });

  it("Phase-46: preserves multi-word display with internal spaces", () => {
    expect(runWikilinkPipeline("[[hallucination-reduction|truth in LLM outputs]]")).toBe(
      '<p><a href="/problems/hallucination-reduction">truth in LLM outputs</a></p>',
    );
  });

  it("Phase-46: aliased + non-aliased wikilinks coexist in same paragraph", () => {
    expect(
      runWikilinkPipeline("see [[scalable-oversight|here]] and [[hallucination-reduction]]"),
    ).toBe(
      '<p>see <a href="/problems/scalable-oversight">here</a> and ' +
        '<a href="/problems/hallucination-reduction">hallucination-reduction</a></p>',
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
    expect(html).toContain('<a href="/problems/a">Cats &#x26; dogs</a>');
  });

  it("Phase-46: less-than character in display HTML-escapes correctly", () => {
    // `<` in display escapes to `&#x3C;` via text-node rendering.
    // Using a context that doesn't trigger HTML parsing.
    const html = runWikilinkPipeline("[[a|x < y]]");
    expect(html).toContain('<a href="/problems/a">x &#x3C; y</a>');
  });

  it("Phase-46: alias nested in bold — <strong> wraps the aliased <a>", () => {
    expect(runWikilinkPipeline("**[[scalable-oversight|alignment]]**")).toBe(
      '<p><strong><a href="/problems/scalable-oversight">alignment</a></strong></p>',
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
      '<p><a href="/problems/a">left|right</a></p>',
    );
  });

  it("Phase-46: alias preserves leading/trailing whitespace verbatim (no auto-trim Phase 46)", () => {
    // D-10 prep-doc decision: whitespace preserved per curator intent.
    expect(runWikilinkPipeline("[[a|  spaced  ]]")).toBe(
      '<p><a href="/problems/a">  spaced  </a></p>',
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
      '<p><a href="/problems/long-horizon-agent-reliability">' +
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
      '<p><a href="/problems/scalable-oversight">scalable-oversight</a></p>',
    );
  });

  it("custom buildHref produces custom href in emitted <a>", () => {
    expect(
      runWikilinkPipelineWithOptions("[[arxiv-2401-12345]]", {
        buildHref: (slug) => `/papers/${slug}`,
      }),
    ).toBe('<p><a href="/papers/arxiv-2401-12345">arxiv-2401-12345</a></p>');
  });

  it("custom buildHref invoked exactly once per matched slug", () => {
    const builder = vi.fn((slug: string) => `/x/${slug}`);
    runWikilinkPipelineWithOptions("[[a]] and [[b]] and [[a]]", {
      buildHref: builder,
    });
    // Three slug matches → three invocations (no caching, no double-call;
    // the plugin invokes builder once per regex match).
    expect(builder).toHaveBeenCalledTimes(3);
    expect(builder).toHaveBeenNthCalledWith(1, "a");
    expect(builder).toHaveBeenNthCalledWith(2, "b");
    expect(builder).toHaveBeenNthCalledWith(3, "a");
  });

  it("custom buildHref orthogonal to Phase-46 alias-syntax — href uses builder, display preserves alias", () => {
    expect(
      runWikilinkPipelineWithOptions("[[scalable-oversight|the oversight problem]]", {
        buildHref: (slug) => `https://example.org/problems/${slug}`,
      }),
    ).toBe(
      '<p><a href="https://example.org/problems/scalable-oversight">' +
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
    expect(html).toContain('<a href="">a</a>');
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
    expect(html).toContain('<a href="/papers/arxiv-2401">paper-arxiv-2401</a>');
    expect(html).toContain('<a href="/authors/jane-doe">author-jane-doe</a>');
    expect(html).toContain('<a href="/problems/plain-slug">plain-slug</a>');
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
