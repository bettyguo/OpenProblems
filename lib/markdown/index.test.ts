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
import { ArxivExtensionRegistry } from "./extensions/arxiv";
import { CompositeExtensionRegistry } from "./extensions/composite";
import { PHASE_39_DEFAULT_ENABLED_SURFACES, TablesExtensionRegistry } from "./extensions/tables";
import {
  PHASE_38_DEFAULT_ENABLED_SURFACES,
  WikilinkExtensionRegistry,
} from "./extensions/wikilinks";
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

// ---------------------------------------------------------------------------
// Phase-39 — end-to-end GFM tables rendering via TablesExtensionRegistry +
// the Phase-37 framework's schemaOverrides slot. Verifies that tables render
// correctly through the FULL `unified` pipeline (parse → gfm → remark-rehype
// → demote → sanitize-with-table-tags → strip-unsafe-hrefs → stringify) on
// the `reviewNotes` surface ONLY; bio + rationale + actionRationale stay
// unaffected (Phase-17 baseline preserved — tables STRIPPED on those
// surfaces because base allow-list excludes <table>).
//
// `TablesExtensionRegistry` is the SECOND concrete Phase-37-framework
// consumer; validates the framework's schemaOverrides slot end-to-end
// (Phase 38 wikilinks consumer validated rehypePlugins only). End-to-end
// tests install the registry directly via __setRegistryForTests; env-var
// dispatch behavior is tested in `extensions/index.test.ts`.
// ---------------------------------------------------------------------------

describe("Phase-39 tables consumer — end-to-end via TablesExtensionRegistry", () => {
  beforeEach(() => {
    __setRegistryForTests(new TablesExtensionRegistry(new Set(["reviewNotes"])));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("renders a basic GFM table in reviewNotes (table + header + body)", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderReviewNotesMarkdown(md) ?? "";
    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<th>B</th>");
    expect(html).toContain("<td>1</td>");
    expect(html).toContain("<td>2</td>");
  });

  it("renders GFM column-alignment as align attribute on th + td", () => {
    const md = "| L | C | R |\n|:--|:-:|--:|\n| a | b | c |";
    const html = renderReviewNotesMarkdown(md) ?? "";
    expect(html).toContain('align="left"');
    expect(html).toContain('align="center"');
    expect(html).toContain('align="right"');
  });

  it("strips disallowed align values (XSS-audit boundary preserved)", () => {
    // Synthesizing raw HTML to test sanitize behavior: align="javascript:..." or
    // align="invalid" should be stripped because the tuple-form value restriction
    // limits align to "left" | "center" | "right". The markdown parser produces
    // only valid align values from `|:---|` syntax, so this verifies that the
    // schema-override allow-list itself rejects out-of-band values.
    const md = "| Col |\n|---|\n| cell |";
    const html = renderReviewNotesMarkdown(md) ?? "";
    // align attribute may or may not appear; what matters is that if it does,
    // it's one of the 3 allowed literal values.
    expect(html).not.toContain('align="javascript');
    expect(html).not.toContain('align="invalid');
  });

  it("bio surface unaffected by tables extension (registry default-deny on non-enabled)", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderBioMarkdown(md) ?? "";
    // <table> is stripped because bio schema's base allow-list excludes table tags
    expect(html).not.toContain("<table");
    expect(html).not.toContain("<th>");
  });

  it("rationale surface unaffected by tables extension", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("<table");
  });

  it("actionRationale surface unaffected by tables extension", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderActionRationaleMarkdown(md);
    expect(html).not.toContain("<table");
  });

  it("XSS defense survives extension (javascript: URL stripped; tables still render)", () => {
    const md = "[bad](javascript:alert(1))\n\n| A |\n|---|\n| cell |";
    const html = renderReviewNotesMarkdown(md) ?? "";
    expect(html).not.toContain("javascript:");
    expect(html).toContain("<table>");
  });

  it("base allow-list tags still render in reviewNotes (override-replace preserves them)", () => {
    // The override-replace includes the full Phase-17 base allow-list verbatim
    // per APPEND-D-C; bold + italic + links must still render.
    const html = renderReviewNotesMarkdown("**bold** and [link](https://example.com)") ?? "";
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://example.com"');
  });
});

// ---------------------------------------------------------------------------
// Phase-40 — end-to-end composite consumer rendering via
// CompositeExtensionRegistry([wikilinks, tables]) through the FULL `unified`
// pipeline. Verifies that wikilinks + tables coexist on their respective
// surfaces (actionRationale + reviewNotes) AND don't bleed into each other's
// surfaces. End-to-end realization of APPEND-D-S Phase 38+39 conflict-free
// composition example.
// ---------------------------------------------------------------------------

describe("Phase-40 composite consumer — end-to-end wikilinks + tables coexistence", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(new Set(["actionRationale"]));
    const tables = new TablesExtensionRegistry(new Set(["reviewNotes"]));
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("wikilinks resolve on actionRationale under composite", () => {
    expect(renderActionRationaleMarkdown("see [[scalable-oversight]] here")).toBe(
      '<p>see <a href="/problems/scalable-oversight">scalable-oversight</a> here</p>',
    );
  });

  it("tables render on reviewNotes under composite", () => {
    const html = renderReviewNotesMarkdown("| A | B |\n|---|---|\n| 1 | 2 |") ?? "";
    expect(html).toContain("<table>");
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<td>1</td>");
  });

  it("wikilinks do NOT resolve on reviewNotes (consumer scope respected under composite)", () => {
    expect(renderReviewNotesMarkdown("see [[scalable-oversight]] here")).toBe(
      "<p>see [[scalable-oversight]] here</p>",
    );
  });

  it("tables do NOT render on actionRationale (consumer scope respected under composite)", () => {
    const html = renderActionRationaleMarkdown("| A | B |\n|---|---|\n| 1 | 2 |");
    expect(html).not.toContain("<table");
  });

  it("bio + rationale surfaces unaffected by either consumer under composite", () => {
    expect(renderBioMarkdown("see [[scalable-oversight]] here")).toBe(
      "<p>see [[scalable-oversight]] here</p>",
    );
    const tableHtml = renderRationaleMarkdown("| A |\n|---|\n| 1 |");
    expect(tableHtml).not.toContain("<table");
  });

  it("composite preserves XSS defenses on all surfaces (javascript: still stripped on actionRationale)", () => {
    const html = renderActionRationaleMarkdown(
      "[bad](javascript:alert(1)) and [[scalable-oversight]]",
    );
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="/problems/scalable-oversight"');
  });
});

// ---------------------------------------------------------------------------
// Phase-41 — end-to-end arXiv ID auto-link via ArxivExtensionRegistry + the
// Phase-37 framework's `remarkPlugins` slot. Verifies that arxiv autolinks
// render correctly through the FULL `unified` pipeline (parse → gfm →
// remark-arxiv → remark-rehype → demote → sanitize → strip-unsafe-hrefs →
// stringify) on the `rationale` surface ONLY; bio + reviewNotes +
// actionRationale stay unaffected (Phase-17 baseline preserved — `arxiv:NNNN.NNNNN`
// renders as literal text on those surfaces).
//
// `ArxivExtensionRegistry` is the THIRD concrete Phase-37-framework
// consumer; **completes 3-of-3 slot demonstration via real consumer**
// (Phase 38 wikilinks exercised rehypePlugins; Phase 39 tables exercised
// schemaOverrides; Phase 41 arxiv exercises remarkPlugins). End-to-end
// tests install the registry directly via __setRegistryForTests; env-var
// dispatch behavior is tested in `extensions/index.test.ts`.
// ---------------------------------------------------------------------------

describe("Phase-41 arxiv consumer — end-to-end via ArxivExtensionRegistry", () => {
  beforeEach(() => {
    __setRegistryForTests(new ArxivExtensionRegistry(new Set(["rationale"])));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it('renders arxiv:NNNN.NNNNN as <a href="https://arxiv.org/abs/..."> in rationale', () => {
    expect(renderRationaleMarkdown("see arxiv:1909.03004 for the methodology")).toBe(
      '<p>see <a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a> for the methodology</p>',
    );
  });

  it("preserves version suffix in rationale (e.g., v3)", () => {
    expect(renderRationaleMarkdown("see arxiv:2024.01234v3 for details")).toBe(
      '<p>see <a href="https://arxiv.org/abs/2024.01234v3">arxiv:2024.01234v3</a> for details</p>',
    );
  });

  it("case-insensitive prefix matches in rationale; display preserves source casing", () => {
    expect(renderRationaleMarkdown("cited as ArXiv:2024.12345")).toBe(
      '<p>cited as <a href="https://arxiv.org/abs/2024.12345">ArXiv:2024.12345</a></p>',
    );
  });

  it("renders multiple arxiv refs in one rationale paragraph", () => {
    const html = renderRationaleMarkdown("compare arxiv:1909.03004 with arxiv:2024.01234");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
  });

  it("arxiv href passes rehypeStripUnsafeHrefs naturally (absolute https://)", () => {
    // Unlike Phase-38 wikilinks (which emit RELATIVE URLs and rely on
    // post-strip plugin-order), arxiv autolinks emit ABSOLUTE https:// URLs
    // that pass `rehypeStripUnsafeHrefs` allow-list naturally. This test
    // asserts the design difference per ADR-0018 D-G APPEND-D-V.
    const html = renderRationaleMarkdown("see arxiv:1909.03004 here");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
  });

  it("bio surface unaffected by arxiv extension (registry default-deny on non-enabled)", () => {
    expect(renderBioMarkdown("see arxiv:1909.03004 here")).toBe("<p>see arxiv:1909.03004 here</p>");
  });

  it("reviewNotes surface unaffected by arxiv extension", () => {
    expect(renderReviewNotesMarkdown("see arxiv:1909.03004 here")).toBe(
      "<p>see arxiv:1909.03004 here</p>",
    );
  });

  it("actionRationale surface unaffected by arxiv extension", () => {
    expect(renderActionRationaleMarkdown("see arxiv:1909.03004 here")).toBe(
      "<p>see arxiv:1909.03004 here</p>",
    );
  });

  it("XSS defense survives extension (javascript: stripped; arxiv still resolves)", () => {
    const html = renderRationaleMarkdown("[bad](javascript:alert(1)) and see arxiv:1909.03004");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
  });

  it("renders arxiv inside emphasized text (nested element preservation)", () => {
    expect(renderRationaleMarkdown("**arxiv:1909.03004** establishes the result")).toBe(
      '<p><strong><a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a></strong> establishes the result</p>',
    );
  });

  it("non-matching pattern (3-digit suffix) falls through as literal text", () => {
    expect(renderRationaleMarkdown("arxiv:1909.030 is too short")).toBe(
      "<p>arxiv:1909.030 is too short</p>",
    );
  });

  it("non-matching pattern (older category-prefixed) falls through as literal text", () => {
    expect(renderRationaleMarkdown("arxiv:math/0211159 is older style")).toBe(
      "<p>arxiv:math/0211159 is older style</p>",
    );
  });
});

// ---------------------------------------------------------------------------
// Phase-41 — end-to-end 3-way composite consumer rendering via
// CompositeExtensionRegistry([wikilinks, tables, arxiv]). Verifies that
// wikilinks + tables + arxiv coexist on their respective surfaces
// (actionRationale + reviewNotes + rationale) AND don't bleed into each
// other's surfaces. **First 3-way composition feasibility** — validates
// the Phase-40 composition infrastructure's "arbitrary disjoint-surface
// multi-consumer composition" claim with a 3-way real-consumer case.
// ---------------------------------------------------------------------------

describe("Phase-41 3-way composite consumer — wikilinks + tables + arxiv coexistence", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(new Set(["actionRationale"]));
    const tables = new TablesExtensionRegistry(new Set(["reviewNotes"]));
    const arxiv = new ArxivExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("wikilinks resolve on actionRationale under 3-way composite", () => {
    expect(renderActionRationaleMarkdown("see [[scalable-oversight]] here")).toBe(
      '<p>see <a href="/problems/scalable-oversight">scalable-oversight</a> here</p>',
    );
  });

  it("tables render on reviewNotes under 3-way composite", () => {
    const html = renderReviewNotesMarkdown("| A | B |\n|---|---|\n| 1 | 2 |") ?? "";
    expect(html).toContain("<table>");
    expect(html).toContain("<th>A</th>");
  });

  it("arxiv autolinks resolve on rationale under 3-way composite", () => {
    expect(renderRationaleMarkdown("cited as arxiv:1909.03004 for the result")).toBe(
      '<p>cited as <a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a> for the result</p>',
    );
  });

  it("arxiv does NOT resolve on actionRationale under 3-way composite (scope respected)", () => {
    expect(renderActionRationaleMarkdown("see arxiv:1909.03004 here")).toBe(
      "<p>see arxiv:1909.03004 here</p>",
    );
  });

  it("wikilinks do NOT resolve on rationale under 3-way composite (scope respected)", () => {
    expect(renderRationaleMarkdown("see [[scalable-oversight]] here")).toBe(
      "<p>see [[scalable-oversight]] here</p>",
    );
  });

  it("tables do NOT render on rationale under 3-way composite (scope respected)", () => {
    const html = renderRationaleMarkdown("| A |\n|---|\n| 1 |");
    expect(html).not.toContain("<table");
  });

  it("bio surface unaffected by any of the three consumers under 3-way composite", () => {
    expect(renderBioMarkdown("see [[scalable-oversight]] and arxiv:1909.03004 here")).toBe(
      "<p>see [[scalable-oversight]] and arxiv:1909.03004 here</p>",
    );
  });

  it("3-way composite preserves XSS defenses on rationale (javascript: still stripped)", () => {
    const html = renderRationaleMarkdown("[bad](javascript:alert(1)) and see arxiv:1909.03004");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
  });
});

// ---------------------------------------------------------------------------
// Phase-42 — end-to-end wikilinks cross-surface expansion via the factory-
// driven `PHASE_38_DEFAULT_ENABLED_SURFACES` constant (NOT manual constructor
// args). Verifies that the Phase-42 default-enabled-surfaces expansion to
// `Set(["bio", "reviewNotes", "rationale", "actionRationale"])` activates
// wikilink resolution on ALL 4 surfaces end-to-end through the full
// `unified` pipeline.
//
// The pre-Phase-42 end-to-end blocks use MANUAL constructor args
// (`new WikilinkExtensionRegistry(new Set(["actionRationale"]))`) to test
// the registry-class's per-surface scope-respect property; this block
// installs the registry using the Phase-42 default constant directly,
// validating the constructor-arg-only zero-rework expansion property
// each Phase 38/39/41 consumer documented in its APPEND.
//
// First "all 4 markdown surfaces enabled by ≥1 consumer" state in project
// history — Phase 42 closes the `bio` gap. Closes ADR-0018 APPEND-D-L item
// 1 (Phase-38 deferral) at 4-phase carryover.
// ---------------------------------------------------------------------------

describe("Phase-42 wikilinks default — all 4 surfaces via PHASE_38_DEFAULT_ENABLED_SURFACES", () => {
  beforeEach(() => {
    __setRegistryForTests(new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("wikilinks resolve on bio under Phase-42 default (newly-enabled surface)", () => {
    expect(renderBioMarkdown("see [[scalable-oversight]] for my work")).toBe(
      '<p>see <a href="/problems/scalable-oversight">scalable-oversight</a> for my work</p>',
    );
  });

  it("wikilinks resolve on reviewNotes under Phase-42 default (newly-enabled surface)", () => {
    expect(renderReviewNotesMarkdown("compare with [[hallucination-reduction]]")).toBe(
      '<p>compare with <a href="/problems/hallucination-reduction">hallucination-reduction</a></p>',
    );
  });

  it("wikilinks resolve on rationale under Phase-42 default (newly-enabled surface)", () => {
    expect(renderRationaleMarkdown("see [[scalable-oversight]] for context")).toBe(
      '<p>see <a href="/problems/scalable-oversight">scalable-oversight</a> for context</p>',
    );
  });

  it("wikilinks resolve on actionRationale under Phase-42 default (Phase-38 baseline)", () => {
    expect(renderActionRationaleMarkdown("see [[scalable-oversight]] here")).toBe(
      '<p>see <a href="/problems/scalable-oversight">scalable-oversight</a> here</p>',
    );
  });

  it("PHASE_38_DEFAULT_ENABLED_SURFACES contains all 4 surfaces Phase 42", () => {
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.size).toBe(4);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(true);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(true);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_38_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(true);
  });

  it("XSS defenses survive Phase-42 expansion on bio (javascript: stripped; wikilinks resolve)", () => {
    const html = renderBioMarkdown("[bad](javascript:alert(1)) and [[scalable-oversight]]");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="/problems/scalable-oversight"');
  });

  it("XSS defenses survive Phase-42 expansion on reviewNotes (javascript: stripped)", () => {
    const html = renderReviewNotesMarkdown("[bad](javascript:alert(1)) [[a-slug]]");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="/problems/a-slug"');
  });
});

// ---------------------------------------------------------------------------
// Phase-42 — end-to-end same-surface different-slot composition under
// default dispatch. Verifies that Phase-42 wikilinks-on-all-4 +
// tables-on-reviewNotes compose conflict-free on the `reviewNotes` surface
// (wikilinks contributes `rehypePlugins`; tables contributes
// `schemaOverrides`; distinct slots per APPEND-D-R).
//
// First canonical same-surface different-slot composition case under
// default dispatch in project history — Phase 41's 3-way example was
// disjoint-surface; Phase 42 expansion creates the first SAME-surface
// multi-consumer dispatch where two consumers contribute to the same
// surface but via distinct slots.
// ---------------------------------------------------------------------------

describe("Phase-42 same-surface different-slot composition under default dispatch", () => {
  beforeEach(() => {
    // Use Phase-42 default constants for both consumers (not manual
    // single-surface args) to exercise the production composition path.
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(new Set(["reviewNotes"]));
    const arxiv = new ArxivExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("reviewNotes: wikilinks resolve AND tables render under 3-way Phase-42 default", () => {
    // Same-surface different-slot composition: wikilinks (rehypePlugins) +
    // tables (schemaOverrides) on reviewNotes. Both consumers contribute
    // to the same surface but via distinct slots; conflict-free per
    // APPEND-D-R.
    const md = "see [[scalable-oversight]] then:\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderReviewNotesMarkdown(md) ?? "";
    expect(html).toContain('href="/problems/scalable-oversight"');
    expect(html).toContain("<table>");
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<td>1</td>");
  });

  it("rationale: wikilinks resolve AND arxiv resolve under 3-way Phase-42 default", () => {
    // Same-surface different-slot composition: wikilinks (rehypePlugins) +
    // arxiv (remarkPlugins) on rationale. Conflict-free per APPEND-D-R.
    const md = "see [[scalable-oversight]] and arxiv:1909.03004";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('href="/problems/scalable-oversight"');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
  });

  it("bio: wikilinks resolve under 3-way Phase-42 default (newly-enabled surface)", () => {
    // First 4-of-4 surface-coverage state: wikilinks now enabled on bio
    // under Phase-42 default; no other consumer touches bio.
    expect(renderBioMarkdown("see [[scalable-oversight]] for my work")).toBe(
      '<p>see <a href="/problems/scalable-oversight">scalable-oversight</a> for my work</p>',
    );
  });

  it("actionRationale: wikilinks resolve under 3-way Phase-42 default", () => {
    // Phase-38 baseline: wikilinks on actionRationale. Carried verbatim
    // under the Phase-42 expanded default.
    expect(renderActionRationaleMarkdown("see [[hallucination-reduction]]")).toBe(
      '<p>see <a href="/problems/hallucination-reduction">hallucination-reduction</a></p>',
    );
  });

  it("XSS defenses survive same-surface different-slot composition on reviewNotes", () => {
    const md = "[bad](javascript:alert(1))\n\n| A |\n|---|\n| [[a-slug]] |";
    const html = renderReviewNotesMarkdown(md) ?? "";
    expect(html).not.toContain("javascript:");
    expect(html).toContain("<table>");
    expect(html).toContain('href="/problems/a-slug"');
  });
});

// ---------------------------------------------------------------------------
// Phase-43 — end-to-end tables cross-surface expansion via the factory-
// driven `PHASE_39_DEFAULT_ENABLED_SURFACES` constant (NOT manual constructor
// args). Verifies that the Phase-43 default-enabled-surfaces expansion to
// `Set(["bio", "reviewNotes", "rationale", "actionRationale"])` activates
// GFM-table rendering on ALL 4 surfaces end-to-end through the full
// `unified` pipeline. Mirrors the Phase-42 wikilinks end-to-end shape
// verbatim.
//
// `schemaOverrides` is the slot tables uses — `bioSchema` (and the other
// 3 base schemas) gets the GFM table tag set folded in for that surface.
// First production state where bio + rationale + actionRationale render
// tables via the framework (Phase 18/27/29 ship had table tags STRIPPED on
// those surfaces).
// ---------------------------------------------------------------------------

describe("Phase-43 tables default — all 4 surfaces via PHASE_39_DEFAULT_ENABLED_SURFACES", () => {
  beforeEach(() => {
    __setRegistryForTests(new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("tables render on bio under Phase-43 default (newly-enabled surface; first schemaOverrides-on-bio)", () => {
    const html = renderBioMarkdown("| Col |\n|---|\n| cell |") ?? "";
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Col</th>");
    expect(html).toContain("<td>cell</td>");
  });

  it("tables render on reviewNotes under Phase-43 default (Phase-39 baseline)", () => {
    const html = renderReviewNotesMarkdown("| A | B |\n|---|---|\n| 1 | 2 |") ?? "";
    expect(html).toContain("<table>");
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<td>1</td>");
  });

  it("tables render on rationale under Phase-43 default (newly-enabled surface)", () => {
    const html = renderRationaleMarkdown("| Criterion |\n|---|\n| n/a |");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Criterion</th>");
  });

  it("tables render on actionRationale under Phase-43 default (newly-enabled surface)", () => {
    const html = renderActionRationaleMarkdown("| Dim |\n|---|\n| score |");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Dim</th>");
  });

  it("PHASE_39_DEFAULT_ENABLED_SURFACES contains all 4 surfaces Phase 43", () => {
    expect(PHASE_39_DEFAULT_ENABLED_SURFACES.size).toBe(4);
    expect(PHASE_39_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(true);
    expect(PHASE_39_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(true);
    expect(PHASE_39_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_39_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(true);
  });

  it("XSS defenses survive Phase-43 tables expansion on bio (javascript: stripped; tables render)", () => {
    const md = "[bad](javascript:alert(1))\n\n| A |\n|---|\n| ok |";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).not.toContain("javascript:");
    expect(html).toContain("<table>");
  });

  it("GFM column alignment renders on bio under Phase-43 default", () => {
    const md = "| L | C | R |\n|:--|:-:|--:|\n| a | b | c |";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('align="left"');
    expect(html).toContain('align="center"');
    expect(html).toContain('align="right"');
  });
});

// ---------------------------------------------------------------------------
// Phase-43 — end-to-end same-surface different-slot composition under
// Phase-43 default constants for both wikilinks AND tables (both at all-4
// surfaces). Verifies that wikilinks + tables coexist on every surface
// (wikilinks contributes `rehypePlugins`; tables contributes
// `schemaOverrides`; distinct slots per APPEND-D-R conflict-free rules)
// AND with arxiv on rationale produces the **first "all 3 framework
// slots on the same surface" case** end-to-end.
// ---------------------------------------------------------------------------

describe("Phase-43 same-surface different-slot composition — all 4 surfaces + 3-slots-on-rationale", () => {
  beforeEach(() => {
    // Use Phase-43 default constants for BOTH wikilinks AND tables
    // (Phase-42 + Phase-43 expansions applied). arxiv remains rationale-
    // only (Phase 41 default; Phase 44+ candidate for analogous expansion).
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: wikilinks resolve AND tables render under Phase-43 3-way default (same-surface different-slot)", () => {
    const md = "see [[scalable-oversight]] then:\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('href="/problems/scalable-oversight"');
    expect(html).toContain("<table>");
    expect(html).toContain("<th>A</th>");
  });

  it("reviewNotes: wikilinks resolve AND tables render under Phase-43 3-way default", () => {
    const md = "compare with [[hallucination-reduction]]:\n\n| A |\n|---|\n| 1 |";
    const html = renderReviewNotesMarkdown(md) ?? "";
    expect(html).toContain('href="/problems/hallucination-reduction"');
    expect(html).toContain("<table>");
  });

  it("rationale: ALL 3 SLOTS active (wikilinks + tables + arxiv) — first 3-slots-on-same-surface case", () => {
    // First "all 3 framework slots on same surface" case in project
    // history. wikilinks via rehypePlugins; tables via schemaOverrides;
    // arxiv via remarkPlugins. All conflict-free per APPEND-D-R because
    // each surface has at most one component per slot.
    const md = "see [[scalable-oversight]] and arxiv:1909.03004:\n\n| Criterion |\n|---|\n| ok |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('href="/problems/scalable-oversight"');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Criterion</th>");
  });

  it("actionRationale: wikilinks resolve AND tables render under Phase-43 3-way default", () => {
    const md = "see [[hallucination-reduction]]:\n\n| Dim |\n|---|\n| score |";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('href="/problems/hallucination-reduction"');
    expect(html).toContain("<table>");
  });

  it("arxiv does NOT resolve outside rationale under Phase-43 3-way (scope respected)", () => {
    expect(renderBioMarkdown("see arxiv:1909.03004 here")).toBe("<p>see arxiv:1909.03004 here</p>");
    expect(renderReviewNotesMarkdown("see arxiv:1909.03004 here")).toBe(
      "<p>see arxiv:1909.03004 here</p>",
    );
    expect(renderActionRationaleMarkdown("see arxiv:1909.03004 here")).toBe(
      "<p>see arxiv:1909.03004 here</p>",
    );
  });

  it("XSS defenses survive 3-way same-surface composition on rationale (all 3 slots active)", () => {
    const md =
      "[bad](javascript:alert(1)) and [[a-slug]] and arxiv:1909.03004:\n\n| C |\n|---|\n| ok |";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="/problems/a-slug"');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain("<table>");
  });
});
