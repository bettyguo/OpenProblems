import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import {
  ArxivExtensionRegistry,
  PHASE_41_DEFAULT_ENABLED_SURFACES,
  remarkLinkArxivIds,
} from "./arxiv";

/**
 * Minimal pipeline that exercises `remarkLinkArxivIds` in
 * isolation — bypasses sanitize so the plugin's behavior can
 * be verified directly. End-to-end tests (with the full
 * sanitize pipeline + factory dispatch) land in Unit 41.2.
 */
function runArxivPipeline(md: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkLinkArxivIds)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(md),
  );
}

describe("remarkLinkArxivIds — plugin behavior", () => {
  it("resolves a single arxiv:NNNN.NNNNN to absolute https://arxiv.org/abs/... link", () => {
    expect(runArxivPipeline("arxiv:1909.03004")).toBe(
      '<p><a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a></p>',
    );
  });

  it("preserves version suffix in both href and display text", () => {
    expect(runArxivPipeline("arxiv:1909.03004v3")).toBe(
      '<p><a href="https://arxiv.org/abs/1909.03004v3">arxiv:1909.03004v3</a></p>',
    );
  });

  it("matches case-insensitively on the `arxiv:` prefix; display preserves source casing", () => {
    expect(runArxivPipeline("ArXiv:2024.12345")).toBe(
      '<p><a href="https://arxiv.org/abs/2024.12345">ArXiv:2024.12345</a></p>',
    );
    expect(runArxivPipeline("ARXIV:2024.12345")).toBe(
      '<p><a href="https://arxiv.org/abs/2024.12345">ARXIV:2024.12345</a></p>',
    );
  });

  it("preserves surrounding text", () => {
    expect(runArxivPipeline("see arxiv:1909.03004 for context")).toBe(
      '<p>see <a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a> for context</p>',
    );
  });

  it("resolves multiple matches in one paragraph", () => {
    expect(runArxivPipeline("arxiv:1909.03004 and arxiv:2024.12345v2")).toBe(
      '<p><a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a> and ' +
        '<a href="https://arxiv.org/abs/2024.12345v2">arxiv:2024.12345v2</a></p>',
    );
  });

  it("resolves adjacent matches separated only by punctuation", () => {
    expect(runArxivPipeline("(arxiv:1909.03004; arxiv:2024.12345)")).toBe(
      '<p>(<a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>; ' +
        '<a href="https://arxiv.org/abs/2024.12345">arxiv:2024.12345</a>)</p>',
    );
  });

  it("resolves an arxiv reference nested inside a bold element", () => {
    expect(runArxivPipeline("**arxiv:1909.03004**")).toBe(
      '<p><strong><a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a></strong></p>',
    );
  });

  it("rejects 6-digit suffix (\\d{4,5} regex caps at 5 digits)", () => {
    expect(runArxivPipeline("arxiv:1909.030045")).toBe("<p>arxiv:1909.030045</p>");
  });

  it("rejects 3-digit suffix (\\d{4,5} regex requires at least 4 digits)", () => {
    expect(runArxivPipeline("arxiv:1909.030")).toBe("<p>arxiv:1909.030</p>");
  });

  it("rejects 3-digit prefix (\\d{4} regex requires exactly 4 digits before dot)", () => {
    expect(runArxivPipeline("arxiv:190.03004")).toBe("<p>arxiv:190.03004</p>");
  });

  it("rejects trailing-letter version typo (`arxiv:1909.03004v` with no digits after v)", () => {
    expect(runArxivPipeline("arxiv:1909.03004v")).toBe("<p>arxiv:1909.03004v</p>");
  });

  it("rejects mid-word match (word-boundary anchor prevents `Xarxiv:NNNN.NNNNN`)", () => {
    expect(runArxivPipeline("Xarxiv:1909.03004")).toBe("<p>Xarxiv:1909.03004</p>");
  });

  it("rejects older-style category-prefixed IDs (out of scope Phase 41)", () => {
    expect(runArxivPipeline("arxiv:math/0211159")).toBe("<p>arxiv:math/0211159</p>");
  });

  it("rejects bare IDs without `arxiv:` prefix (out of scope Phase 41)", () => {
    expect(runArxivPipeline("1909.03004")).toBe("<p>1909.03004</p>");
  });

  it("resolves an arxiv reference that is the entire paragraph", () => {
    expect(runArxivPipeline("arxiv:2024.01234")).toBe(
      '<p><a href="https://arxiv.org/abs/2024.01234">arxiv:2024.01234</a></p>',
    );
  });

  it("preserves trailing punctuation outside the match", () => {
    expect(runArxivPipeline("cited as arxiv:1909.03004.")).toBe(
      '<p>cited as <a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>.</p>',
    );
  });

  it("handles three arxiv references in a single paragraph", () => {
    const html = runArxivPipeline("arxiv:1909.03004, arxiv:2024.12345v1, and arxiv:2305.10160");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://arxiv.org/abs/2024.12345v1"');
    expect(html).toContain('href="https://arxiv.org/abs/2305.10160"');
  });
});

describe("ArxivExtensionRegistry — class behavior", () => {
  it("returns remarkLinkArxivIds for enabled surfaces", () => {
    const r = new ArxivExtensionRegistry(new Set(["rationale"]));
    expect(r.getExtensions("rationale")).toEqual({
      remarkPlugins: [remarkLinkArxivIds],
    });
  });

  it("returns empty extension set for non-enabled surfaces", () => {
    const r = new ArxivExtensionRegistry(new Set(["rationale"]));
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports an empty enabled set (all surfaces disabled)", () => {
    const r = new ArxivExtensionRegistry(new Set());
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports multiple enabled surfaces (Phase 42+ expansion shape)", () => {
    const r = new ArxivExtensionRegistry(new Set(["rationale", "actionRationale"]));
    expect(r.getExtensions("rationale")).toEqual({
      remarkPlugins: [remarkLinkArxivIds],
    });
    expect(r.getExtensions("actionRationale")).toEqual({
      remarkPlugins: [remarkLinkArxivIds],
    });
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
  });

  it("exposes PHASE_41_DEFAULT_ENABLED_SURFACES = Set(['rationale'])", () => {
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(false);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(false);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(false);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.size).toBe(1);
  });
});
