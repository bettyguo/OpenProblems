import type { Root as HastRoot } from "hast";
import type { Plugin as UnifiedPlugin } from "unified";
import { visit as unistVisit } from "unist-util-visit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  __resetRegistryForTests,
  __setRegistryForTests,
  type MarkdownExtensionRegistry,
  type MarkdownExtensionSet,
  type MarkdownSurface,
} from "./extensions";
import { WikilinkExtensionRegistry } from "./extensions/wikilinks";
import {
  __resetMarkdownCachesForTests,
  renderActionRationaleMarkdown,
  renderBioMarkdown,
  renderRationaleMarkdown,
  renderReviewNotesMarkdown,
} from "./index";
import {
  actionRationaleSchema,
  bioSchema,
  rationaleSchema,
  reviewNotesSchema,
} from "./sanitize-schema";

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

// ---------------------------------------------------------------------------
// Phase-27 — `renderRationaleMarkdown` sibling per ADR-0018 D-G inheritance.
// Third call site after `renderBioMarkdown` + `renderReviewNotesMarkdown`.
// Identical pipeline + schema (Phase 27) to siblings; full XSS suite covered
// at the pipeline layer above. These tests cover the sibling helper shape +
// schema parity + the `string → string` signature (rationale is NOT NULL per
// Phase-11 schema; helper has no null-fallback path).
// ---------------------------------------------------------------------------

describe("renderRationaleMarkdown — sibling helper (D-G inheritance; Phase 27)", () => {
  it("renders bold via `<strong>`", () => {
    expect(renderRationaleMarkdown("**recent results**")).toBe(
      "<p><strong>recent results</strong></p>",
    );
  });

  it("renders https links preserving href (D-D allow-list shared)", () => {
    expect(renderRationaleMarkdown("[paper](https://arxiv.org/abs/2401.00001)")).toBe(
      '<p><a href="https://arxiv.org/abs/2401.00001">paper</a></p>',
    );
  });

  it("strips javascript: URL (Phase-17 XSS defense inherited)", () => {
    const html = renderRationaleMarkdown("[bad](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("alert(1)");
  });

  it("strips raw HTML script tags (Phase-17 sanitization inherited)", () => {
    const html = renderRationaleMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script");
  });

  it("demotes `#` to `<h3>` (D-C shared)", () => {
    expect(renderRationaleMarkdown("# evidence")).toBe("<h3>evidence</h3>");
  });

  it("renders unordered list via `<ul><li>`", () => {
    expect(renderRationaleMarkdown("- a\n- b")).toContain("<ul>");
  });

  it("returns string type even on whitespace-only input (Phase-11 schema guarantees 50-char minimum but helper is defensive)", () => {
    // Caller-guaranteed non-empty per Phase-11; this asserts the helper's
    // signature is `string → string`, not `string | null`.
    expect(typeof renderRationaleMarkdown("a")).toBe("string");
  });
});

describe("Phase-27 schema parity — `rationaleSchema` ≡ `bioSchema`", () => {
  it("shares the same tag allowlist Phase-27", () => {
    expect(rationaleSchema.tagNames).toEqual(bioSchema.tagNames);
  });

  it("shares the same URL protocol allow-list Phase-27", () => {
    expect(rationaleSchema.protocols).toEqual(bioSchema.protocols);
  });

  it("shares the same attribute allowlist Phase-27", () => {
    expect(rationaleSchema.attributes).toEqual(bioSchema.attributes);
  });
});

// ---------------------------------------------------------------------------
// Phase-29 — `renderActionRationaleMarkdown` sibling per ADR-0018 D-G
// inheritance. Fourth call site after `renderBioMarkdown` +
// `renderReviewNotesMarkdown` + `renderRationaleMarkdown`. **First content-
// side (Velite-validated YAML) markdown render call site** under D-G — the
// three prior siblings consume DB-backed Drizzle reads. Identical pipeline +
// schema (Phase 29) to siblings; full XSS suite covered at the pipeline
// layer above. These tests cover the sibling helper shape + schema parity +
// the `string → string` signature (rating-action rationale required per
// `rating-action.ts` Zod schema; helper has no null-fallback path).
// ---------------------------------------------------------------------------

describe("renderActionRationaleMarkdown — sibling helper (D-G inheritance; Phase 29)", () => {
  it("renders bold via `<strong>`", () => {
    expect(renderActionRationaleMarkdown("**unchanged**")).toBe(
      "<p><strong>unchanged</strong></p>",
    );
  });

  it("renders https links preserving href (D-D allow-list shared)", () => {
    expect(renderActionRationaleMarkdown("[paper](https://arxiv.org/abs/2401.00001)")).toBe(
      '<p><a href="https://arxiv.org/abs/2401.00001">paper</a></p>',
    );
  });

  it("strips javascript: URL (Phase-17 XSS defense inherited)", () => {
    const html = renderActionRationaleMarkdown("[bad](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("alert(1)");
  });

  it("strips raw HTML script tags (Phase-17 sanitization inherited)", () => {
    const html = renderActionRationaleMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script");
  });

  it("demotes `#` to `<h3>` (D-C shared)", () => {
    expect(renderActionRationaleMarkdown("# evidence")).toBe("<h3>evidence</h3>");
  });

  it("renders unordered list via `<ul><li>`", () => {
    expect(renderActionRationaleMarkdown("- a\n- b")).toContain("<ul>");
  });

  it("preserves wikilink syntax as literal text (Phase 30+ resolution; B.14)", () => {
    // Existing YAML content contains `[[problem-slug]]` wikilinks (e.g.,
    // `hallucination-reduction/2026-05-14-initial.yaml` value rationale
    // references `[[scalable-oversight]]`). Markdown promotion does NOT
    // resolve wikilinks — `remark-parse` lacks native wikilink support
    // and the pipeline has no `remark-wiki-link` plugin. Active
    // resolution is Phase-30+ candidate (Class B.14 hygiene item).
    const html = renderActionRationaleMarkdown("see [[scalable-oversight]] for context");
    expect(html).toContain("[[scalable-oversight]]");
    expect(html).not.toContain("<a href=");
  });

  it("returns string type (Phase-29 signature regression guard)", () => {
    // Caller-guaranteed non-empty per `rating-action.ts` Zod schema; this
    // asserts the helper's signature is `string → string`, not
    // `string | null`.
    expect(typeof renderActionRationaleMarkdown("a")).toBe("string");
  });
});

describe("Phase-29 schema parity — `actionRationaleSchema` ≡ `bioSchema`", () => {
  it("shares the same tag allowlist Phase-29", () => {
    expect(actionRationaleSchema.tagNames).toEqual(bioSchema.tagNames);
  });

  it("shares the same URL protocol allow-list Phase-29", () => {
    expect(actionRationaleSchema.protocols).toEqual(bioSchema.protocols);
  });

  it("shares the same attribute allowlist Phase-29", () => {
    expect(actionRationaleSchema.attributes).toEqual(bioSchema.attributes);
  });
});

// ---------------------------------------------------------------------------
// Phase-37 — `MarkdownExtensionRegistry` framework integration per ADR-0018
// D-G APPEND. Verifies the four `render*` helpers fold extensions from the
// active registry into the unified pipeline per APPEND-D-C (override-replace
// schema semantics) + APPEND-D-D (extension plugins after default plugins).
// Each test installs a custom registry via `__setRegistryForTests`, clears
// the lazy processor caches via `__resetMarkdownCachesForTests`, then
// exercises the affected helper. `afterEach` resets both so subsequent
// suites see the default empty registry.
// ---------------------------------------------------------------------------

function makeRegistry(
  fn: (surface: MarkdownSurface) => MarkdownExtensionSet,
): MarkdownExtensionRegistry {
  return { getExtensions: fn };
}

const rehypeUppercaseText: UnifiedPlugin<[], HastRoot> = () => (tree) => {
  unistVisit(tree, "text", (node) => {
    if (typeof node.value === "string") node.value = node.value.toUpperCase();
  });
};

describe("Phase-37 framework integration — default empty registry (Day-1 parity)", () => {
  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("renderBioMarkdown produces unchanged output (default registry)", () => {
    expect(renderBioMarkdown("**bold**")).toBe("<p><strong>bold</strong></p>");
  });

  it("renderReviewNotesMarkdown produces unchanged output (default registry)", () => {
    expect(renderReviewNotesMarkdown("**bold**")).toBe("<p><strong>bold</strong></p>");
  });

  it("renderRationaleMarkdown produces unchanged output (default registry)", () => {
    expect(renderRationaleMarkdown("**bold**")).toBe("<p><strong>bold</strong></p>");
  });

  it("renderActionRationaleMarkdown produces unchanged output (default registry)", () => {
    expect(renderActionRationaleMarkdown("**bold**")).toBe("<p><strong>bold</strong></p>");
  });
});

describe("Phase-37 framework integration — rehype-plugin extension folds AFTER default plugins (APPEND-D-D)", () => {
  beforeEach(() => {
    __setRegistryForTests(
      makeRegistry((surface) =>
        surface === "bio" ? { rehypePlugins: [rehypeUppercaseText] } : {},
      ),
    );
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio extension uppercases text (rehype plugin runs after sanitize)", () => {
    expect(renderBioMarkdown("hello world")).toBe("<p>HELLO WORLD</p>");
  });

  it("other surfaces are unaffected (registry differentiation)", () => {
    expect(renderReviewNotesMarkdown("hello world")).toBe("<p>hello world</p>");
    expect(renderRationaleMarkdown("hello world")).toBe("<p>hello world</p>");
    expect(renderActionRationaleMarkdown("hello world")).toBe("<p>hello world</p>");
  });

  it("bio sanitization defense survives the extension (href stripped before uppercase)", () => {
    // `[bad](javascript:...)` keeps the link text but strips the href in
    // sanitize; the rehype-uppercase extension then runs over the post-
    // sanitize tree, uppercasing the surviving text. This proves both
    // (a) sanitization still applies under the framework AND
    // (b) extension plugins fold AFTER `rehype-sanitize` per APPEND-D-D.
    const html = renderBioMarkdown("[bad](javascript:alert(1)) and text") ?? "";
    expect(html).not.toContain("javascript:");
    expect(html).toContain("AND TEXT");
  });
});

describe("Phase-37 framework integration — schema override-replace semantics (APPEND-D-C)", () => {
  beforeEach(() => {
    __setRegistryForTests(
      makeRegistry((surface) =>
        surface === "reviewNotes"
          ? {
              schemaOverrides: {
                tagNames: ["p", "strong"],
              },
            }
          : {},
      ),
    );
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("override-replaces tagNames — surface allows only the supplied tags", () => {
    expect(renderReviewNotesMarkdown("**bold**")).toBe("<p><strong>bold</strong></p>");
  });

  it("override-replaces tagNames — non-overridden tags from base list are dropped", () => {
    // Base `bioSchema.tagNames` includes `<em>`; the override replaces the
    // entire list with `["p", "strong"]` — APPEND-D-C override-replace
    // semantics. `<em>` content survives as text but the tag is stripped.
    const html = renderReviewNotesMarkdown("*italic*") ?? "";
    expect(html).toContain("italic");
    expect(html).not.toContain("<em>");
  });

  it("other surfaces use their base schema unchanged", () => {
    expect(renderBioMarkdown("*italic*")).toBe("<p><em>italic</em></p>");
  });
});

// ---------------------------------------------------------------------------
// Phase-38 — end-to-end wikilink resolution via WikilinkExtensionRegistry +
// the Phase-37 framework. Verifies that wikilinks render correctly through
// the FULL `unified` pipeline (parse → gfm → remark-rehype → demote → sanitize
// → strip-unsafe-hrefs → wikilink → stringify) on the `actionRationale`
// surface ONLY; bio + reviewNotes + rationale stay unaffected.
//
// `WikilinkExtensionRegistry` is the first non-default Phase-37 framework
// consumer. These tests install the registry directly (bypassing the env-
// var dispatch arm in `getExtensionRegistry`) to exercise the integration.
// Env-var dispatch behavior itself is tested in `extensions/index.test.ts`.
// ---------------------------------------------------------------------------

describe("Phase-38 wikilinks consumer — end-to-end via WikilinkExtensionRegistry", () => {
  beforeEach(() => {
    __setRegistryForTests(new WikilinkExtensionRegistry(new Set(["actionRationale"])));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it('renders [[problem-slug]] as <a href="/problems/{slug}">{slug}</a> in actionRationale', () => {
    expect(renderActionRationaleMarkdown("see [[scalable-oversight]] for context")).toBe(
      '<p>see <a href="/problems/scalable-oversight">scalable-oversight</a> for context</p>',
    );
  });

  it("renders multiple wikilinks in one actionRationale paragraph", () => {
    expect(
      renderActionRationaleMarkdown("[[hallucination-reduction]] and [[long-context-rag]]"),
    ).toBe(
      '<p><a href="/problems/hallucination-reduction">hallucination-reduction</a> and <a href="/problems/long-context-rag">long-context-rag</a></p>',
    );
  });

  it("wikilink href survives rehypeStripUnsafeHrefs because plugin folds AFTER strip step", () => {
    // The wikilink-emitted href starts with `/` (relative URL). The default
    // pipeline's `rehypeStripUnsafeHrefs` would strip it, but the wikilink
    // plugin folds AFTER that step per APPEND-D-D — so the href survives.
    // First framework-emitted relative URLs in markdown output in project
    // history; this test asserts the plugin-order discipline's design value.
    const html = renderActionRationaleMarkdown("[[scalable-oversight]]");
    expect(html).toContain('href="/problems/scalable-oversight"');
  });

  it("non-matching [[Slug]] (uppercase) falls through as literal text — XSS regex contract", () => {
    expect(renderActionRationaleMarkdown("[[Slug]]")).toContain("[[Slug]]");
  });

  it("bio surface unaffected by wikilink extension (registry default-deny on non-enabled)", () => {
    expect(renderBioMarkdown("see [[scalable-oversight]] here")).toBe(
      "<p>see [[scalable-oversight]] here</p>",
    );
  });

  it("reviewNotes surface unaffected by wikilink extension", () => {
    expect(renderReviewNotesMarkdown("see [[scalable-oversight]] here")).toBe(
      "<p>see [[scalable-oversight]] here</p>",
    );
  });

  it("rationale surface unaffected by wikilink extension", () => {
    expect(renderRationaleMarkdown("see [[scalable-oversight]] here")).toBe(
      "<p>see [[scalable-oversight]] here</p>",
    );
  });

  it("XSS defense survives extension (javascript: URL stripped; wikilinks still resolve)", () => {
    const html = renderActionRationaleMarkdown(
      "[bad](javascript:alert(1)) and see [[scalable-oversight]]",
    );
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="/problems/scalable-oversight"');
  });

  it("renders wikilink inside emphasized text (nested element preservation)", () => {
    expect(renderActionRationaleMarkdown("**[[hallucination-reduction]]** is the work")).toBe(
      '<p><strong><a href="/problems/hallucination-reduction">hallucination-reduction</a></strong> is the work</p>',
    );
  });
});
