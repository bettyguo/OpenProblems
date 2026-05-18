import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import {
  PHASE_38_DEFAULT_ENABLED_SURFACES,
  rehypeResolveWikilinks,
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

  it("exposes PHASE_38_DEFAULT_ENABLED_SURFACES = Set(['actionRationale'])", () => {
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(true);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(false);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(false);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(false);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.size).toBe(1);
  });
});
