import { describe, expect, it } from "vitest";

import { renderBioMarkdown, renderReviewNotesMarkdown } from "./index";
import { bioSchema, reviewNotesSchema } from "./sanitize-schema";

/**
 * Tests for `renderBioMarkdown` per [ADR-0018](../../docs/adr/0018-markdown-sanitization.md).
 *
 * Organized into four sections:
 *
 *   1. Happy-path formatting (Phase-17 allowed subset per D-B).
 *   2. XSS-vector defense (sanitization line of defense per D-D
 *      + D-B denials; ~10 attack vectors).
 *   3. Outline / heading-demotion (D-C: `#` → `<h3>`).
 *   4. Null + empty edge cases (Phase-15 D-F empty-state behavior
 *      preserved).
 */

describe("renderBioMarkdown — happy path (D-B allowed subset)", () => {
  it("renders bold via `<strong>`", () => {
    expect(renderBioMarkdown("**bold**")).toBe("<p><strong>bold</strong></p>");
  });

  it("renders italic via `<em>`", () => {
    expect(renderBioMarkdown("*italic*")).toBe("<p><em>italic</em></p>");
  });

  it("renders inline code via `<code>`", () => {
    expect(renderBioMarkdown("`code`")).toBe("<p><code>code</code></p>");
  });

  it("renders fenced code blocks via `<pre><code>`", () => {
    const html = renderBioMarkdown("```\nblock\n```");
    expect(html).toContain("<pre><code>");
    expect(html).toContain("block");
  });

  it("renders https links preserving href", () => {
    expect(renderBioMarkdown("[link](https://example.com)")).toBe(
      '<p><a href="https://example.com">link</a></p>',
    );
  });

  it("renders mailto links preserving href", () => {
    expect(renderBioMarkdown("[email](mailto:test@example.com)")).toBe(
      '<p><a href="mailto:test@example.com">email</a></p>',
    );
  });

  it("renders unordered lists", () => {
    const html = renderBioMarkdown("- a\n- b");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>a</li>");
    expect(html).toContain("<li>b</li>");
  });

  it("renders ordered lists", () => {
    const html = renderBioMarkdown("1. first\n2. second");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>first</li>");
  });

  it("renders blockquotes", () => {
    const html = renderBioMarkdown("> quoted");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("quoted");
  });

  it("renders horizontal rules", () => {
    const html = renderBioMarkdown("---");
    expect(html).toContain("<hr>");
  });

  it("renders GFM strikethrough via `<del>`", () => {
    expect(renderBioMarkdown("~~strike~~")).toBe("<p><del>strike</del></p>");
  });

  it("renders plain text passthrough (Phase-15 backward compat)", () => {
    expect(renderBioMarkdown("plain text only")).toBe("<p>plain text only</p>");
  });

  it("renders task lists read-only with disabled checkbox", () => {
    const html = renderBioMarkdown("- [x] done");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("disabled");
    expect(html).toContain("checked");
  });

  it("renders GFM bare-URL autolinks for https", () => {
    const html = renderBioMarkdown("see https://example.com");
    expect(html).toContain('<a href="https://example.com">https://example.com</a>');
  });
});

describe("renderBioMarkdown — XSS defense (D-D URL allow-list + D-B denials)", () => {
  it("strips href on javascript: URL", () => {
    const html = renderBioMarkdown("[bad](javascript:alert(1))") ?? "";
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("alert(1)");
  });

  it("strips href on data: URL", () => {
    const html = renderBioMarkdown("[bad](data:text/html,xss)") ?? "";
    expect(html).not.toContain("data:");
    expect(html).not.toContain("text/html");
  });

  it("strips href on file: URL", () => {
    const html = renderBioMarkdown("[bad](file:///etc/passwd)") ?? "";
    expect(html).not.toContain("file:");
    expect(html).not.toContain("/etc/passwd");
  });

  it("strips href on http: URL (require TLS)", () => {
    const html = renderBioMarkdown("[bad](http://insecure.example)") ?? "";
    expect(html).not.toContain("http://");
  });

  it("strips href on vbscript: URL", () => {
    const html = renderBioMarkdown("[bad](vbscript:msgbox(1))") ?? "";
    expect(html).not.toContain("vbscript:");
  });

  it("strips raw HTML script tags", () => {
    const html = renderBioMarkdown("<script>alert(1)</script>") ?? "";
    expect(html).not.toContain("<script");
    expect(html).not.toContain("alert(1)");
  });

  it("strips raw HTML iframe tags", () => {
    const html = renderBioMarkdown('<iframe src="evil.example"></iframe>') ?? "";
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("evil.example");
  });

  it("strips raw HTML style tags", () => {
    const html = renderBioMarkdown("<style>body{display:none}</style>") ?? "";
    expect(html).not.toContain("<style");
    expect(html).not.toContain("display:none");
  });

  it("strips raw HTML img tag with onerror handler", () => {
    const html = renderBioMarkdown('<img onerror="alert(1)" src="x">') ?? "";
    expect(html).not.toContain("<img");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("alert(1)");
  });

  it("strips title attribute on markdown links", () => {
    // Markdown `[text](url "title")` produces `<a href="url" title="title">text</a>`;
    // sanitization must strip the title attribute (XSS-vector-by-name).
    const html = renderBioMarkdown('[link](https://example.com "tooltip")') ?? "";
    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain("title=");
    expect(html).not.toContain("tooltip");
  });

  it("strips relative URLs in href (require absolute)", () => {
    const html = renderBioMarkdown("[bad](/local/path)") ?? "";
    expect(html).not.toContain('href="/local/path"');
  });

  it("strips images (Phase-18+ deferral per D-B)", () => {
    const html = renderBioMarkdown("![alt](https://example.com/img.png)") ?? "";
    expect(html).not.toContain("<img");
    expect(html).not.toContain("img.png");
  });
});

describe("renderBioMarkdown — heading demotion (D-C)", () => {
  it("demotes `#` to `<h3>`", () => {
    expect(renderBioMarkdown("# Heading")).toBe("<h3>Heading</h3>");
  });

  it("demotes `##` to `<h4>`", () => {
    expect(renderBioMarkdown("## Heading")).toBe("<h4>Heading</h4>");
  });

  it("demotes `###` to `<h5>`", () => {
    expect(renderBioMarkdown("### Heading")).toBe("<h5>Heading</h5>");
  });

  it("demotes `####` / `#####` / `######` to `<h6>` (clamp)", () => {
    expect(renderBioMarkdown("#### Heading")).toBe("<h6>Heading</h6>");
    expect(renderBioMarkdown("##### Heading")).toBe("<h6>Heading</h6>");
    expect(renderBioMarkdown("###### Heading")).toBe("<h6>Heading</h6>");
  });
});

describe("renderBioMarkdown — null + empty edge cases", () => {
  it("returns null for null input", () => {
    expect(renderBioMarkdown(null)).toBeNull();
  });

  it("returns null for empty-string input", () => {
    expect(renderBioMarkdown("")).toBeNull();
  });

  it("returns null for whitespace-only input", () => {
    expect(renderBioMarkdown("   \n\n  ")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Phase-18 — `renderReviewNotesMarkdown` sibling per ADR-0018 D-G inheritance.
// Identical pipeline + schema (Phase 18) to `renderBioMarkdown`; full XSS
// suite covered at the pipeline layer above. These tests cover the sibling
// helper shape + schema parity + happy-path consumer ergonomics.
// ---------------------------------------------------------------------------

describe("renderReviewNotesMarkdown — sibling helper (D-G inheritance)", () => {
  it("renders bold via `<strong>`", () => {
    expect(renderReviewNotesMarkdown("**reviewed**")).toBe("<p><strong>reviewed</strong></p>");
  });

  it("renders https links preserving href (D-D allow-list shared)", () => {
    expect(renderReviewNotesMarkdown("[paper](https://arxiv.org/abs/2401.00001)")).toBe(
      '<p><a href="https://arxiv.org/abs/2401.00001">paper</a></p>',
    );
  });

  it("strips javascript: URL (Phase-17 XSS defense inherited)", () => {
    const html = renderReviewNotesMarkdown("[bad](javascript:alert(1))") ?? "";
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("alert(1)");
  });

  it("strips raw HTML script tags (Phase-17 sanitization inherited)", () => {
    const html = renderReviewNotesMarkdown("<script>alert(1)</script>") ?? "";
    expect(html).not.toContain("<script");
  });

  it("demotes `#` to `<h3>` (D-C shared)", () => {
    expect(renderReviewNotesMarkdown("# COI finding")).toBe("<h3>COI finding</h3>");
  });

  it("returns null for null input", () => {
    expect(renderReviewNotesMarkdown(null)).toBeNull();
  });

  it("returns null for whitespace-only input", () => {
    expect(renderReviewNotesMarkdown("   \n\n  ")).toBeNull();
  });
});

describe("Phase-18 schema parity — `reviewNotesSchema` ≡ `bioSchema`", () => {
  it("shares the same tag allowlist Phase-18", () => {
    expect(reviewNotesSchema.tagNames).toEqual(bioSchema.tagNames);
  });

  it("shares the same URL protocol allow-list Phase-18", () => {
    expect(reviewNotesSchema.protocols).toEqual(bioSchema.protocols);
  });

  it("shares the same attribute allowlist Phase-18", () => {
    expect(reviewNotesSchema.attributes).toEqual(bioSchema.attributes);
  });
});
