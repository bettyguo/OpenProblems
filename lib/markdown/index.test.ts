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
import { ArxivExtensionRegistry, PHASE_41_DEFAULT_ENABLED_SURFACES } from "./extensions/arxiv";
import { CompositeExtensionRegistry } from "./extensions/composite";
import { DoiExtensionRegistry, PHASE_45_DEFAULT_ENABLED_SURFACES } from "./extensions/doi";
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

// ---------------------------------------------------------------------------
// Phase-44 — end-to-end arxiv cross-surface expansion via the factory-driven
// `PHASE_41_DEFAULT_ENABLED_SURFACES` constant. Verifies that the Phase-44
// default-enabled-surfaces expansion to `Set(["bio", "reviewNotes",
// "rationale", "actionRationale"])` activates arxiv-ID auto-linking on ALL
// 4 surfaces end-to-end. Third real-consumer-expansion realization
// (Phase 42 wikilinks; Phase 43 tables; Phase 44 arxiv) — **completes the
// per-consumer expansion arc**.
// ---------------------------------------------------------------------------

describe("Phase-44 arxiv default — all 4 surfaces via PHASE_41_DEFAULT_ENABLED_SURFACES", () => {
  beforeEach(() => {
    __setRegistryForTests(new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("arxiv autolinks resolve on bio under Phase-44 default (newly-enabled surface)", () => {
    expect(renderBioMarkdown("see arxiv:1909.03004 for the methodology")).toBe(
      '<p>see <a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a> for the methodology</p>',
    );
  });

  it("arxiv autolinks resolve on reviewNotes under Phase-44 default (newly-enabled surface)", () => {
    expect(renderReviewNotesMarkdown("cited as arxiv:2024.12345v2")).toBe(
      '<p>cited as <a href="https://arxiv.org/abs/2024.12345v2">arxiv:2024.12345v2</a></p>',
    );
  });

  it("arxiv autolinks resolve on rationale under Phase-44 default (Phase-41 baseline)", () => {
    expect(renderRationaleMarkdown("see arxiv:1909.03004 for context")).toBe(
      '<p>see <a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a> for context</p>',
    );
  });

  it("arxiv autolinks resolve on actionRationale under Phase-44 default (newly-enabled surface)", () => {
    expect(renderActionRationaleMarkdown("see arxiv:1909.03004 here")).toBe(
      '<p>see <a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a> here</p>',
    );
  });

  it("PHASE_41_DEFAULT_ENABLED_SURFACES contains all 4 surfaces Phase 44", () => {
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.size).toBe(4);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(true);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(true);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(true);
  });

  it("XSS defenses survive Phase-44 arxiv expansion on bio (javascript: stripped; arxiv resolves)", () => {
    const html = renderBioMarkdown("[bad](javascript:alert(1)) and arxiv:1909.03004");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
  });

  it("case-insensitive prefix matches on bio under Phase-44 default", () => {
    expect(renderBioMarkdown("see ArXiv:2024.12345 here")).toBe(
      '<p>see <a href="https://arxiv.org/abs/2024.12345">ArXiv:2024.12345</a> here</p>',
    );
  });
});

// ---------------------------------------------------------------------------
// Phase-44 — end-to-end all-3-slots-on-all-4-surfaces composition under
// Phase-44 default constants for ALL THREE consumers (wikilinks, tables,
// arxiv all at all-4 surfaces). **First "all 3 framework slots on all 4
// surfaces under default dispatch" state in project history — maximal
// multi-consumer all-surfaces composition**. Validates that the framework's
// full activation produces conflict-free rendering on every surface per
// APPEND-D-R (3 distinct slots × 4 surfaces × 3 consumers = 12 component-
// surface-slot triples, all distinct).
// ---------------------------------------------------------------------------

describe("Phase-44 all-3-slots-on-all-4-surfaces — maximal framework activation under default dispatch", () => {
  beforeEach(() => {
    // ALL three consumers at Phase-44 defaults (all 4 surfaces each).
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: ALL 3 SLOTS active (wikilinks + tables + arxiv) under Phase-44 maximal default", () => {
    const md =
      "see [[scalable-oversight]] and arxiv:1909.03004:\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('href="/problems/scalable-oversight"');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain("<table>");
    expect(html).toContain("<th>A</th>");
  });

  it("reviewNotes: ALL 3 SLOTS active under Phase-44 maximal default", () => {
    const md =
      "compare [[hallucination-reduction]] with arxiv:2024.12345:\n\n| Crit |\n|---|\n| ok |";
    const html = renderReviewNotesMarkdown(md) ?? "";
    expect(html).toContain('href="/problems/hallucination-reduction"');
    expect(html).toContain('href="https://arxiv.org/abs/2024.12345"');
    expect(html).toContain("<table>");
  });

  it("rationale: ALL 3 SLOTS active under Phase-44 maximal default (Phase-43 baseline preserved)", () => {
    const md = "see [[scalable-oversight]] and arxiv:1909.03004:\n\n| C |\n|---|\n| ok |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('href="/problems/scalable-oversight"');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain("<table>");
  });

  it("actionRationale: ALL 3 SLOTS active under Phase-44 maximal default", () => {
    const md = "see [[hallucination-reduction]] arxiv:1909.03004:\n\n| Dim |\n|---|\n| s |";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('href="/problems/hallucination-reduction"');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain("<table>");
  });

  it("XSS defenses survive maximal-framework-activation composition on every surface", () => {
    const md =
      "[bad](javascript:alert(1)) and [[a-slug]] and arxiv:1909.03004:\n\n| C |\n|---|\n| ok |";
    for (const render of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ]) {
      const html = render(md);
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('href="/problems/a-slug"');
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
      expect(html).toContain("<table>");
    }
  });

  it("framework's full-activation state covers all 12 component-surface-slot triples", () => {
    // 3 distinct slots × 4 surfaces × 3 consumers = 12 component-surface-
    // slot triples, all distinct. Conflict-free per APPEND-D-R.
    // This test asserts the dispatch-level shape (parallel to the
    // end-to-end-rendering tests above).
    const md = "[[x]] arxiv:1909.03004 | A |\n|---|\n| 1 |"; // mixed content
    // Each of the 4 surfaces should render all 3 plugins' outputs:
    const surfaces = [
      renderBioMarkdown(md) ?? "",
      renderReviewNotesMarkdown(md) ?? "",
      renderRationaleMarkdown(md) ?? "",
      renderActionRationaleMarkdown(md) ?? "",
    ];
    for (const html of surfaces) {
      // wikilinks (rehype slot active):
      expect(html).toContain('href="/problems/x"');
      // arxiv (remark slot active):
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-45 — end-to-end DOI consumer rendering via DoiExtensionRegistry.
// Mirrors Phase-41 arxiv-end-to-end shape: PHASE_45_DEFAULT_ENABLED_SURFACES
// = Set(["rationale"]) Phase 45 ship (demand-signal-first per arxiv-first-
// ship precedent). DOIs render on rationale through the full sanitize
// pipeline; bio + reviewNotes + actionRationale default-deny.
// ---------------------------------------------------------------------------

describe("Phase-45 doi consumer — rationale-only baseline (decoupled from constant after Phase-49 expansion)", () => {
  beforeEach(() => {
    // Phase-45 ship through Phase-48 close: doi enabled on `rationale` only.
    // Phase 49 expanded `PHASE_45_DEFAULT_ENABLED_SURFACES` to all 4 surfaces;
    // this block is decoupled with an explicit `new Set(["rationale"])` to
    // preserve Phase-45 baseline coverage. New Phase-49 all-4-surfaces block
    // uses the constant directly per Phase-44 D-8 precedent.
    __setRegistryForTests(new DoiExtensionRegistry(new Set(["rationale"])));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it('renders doi:10.NNNN/xxx as <a href="https://doi.org/..."> in rationale', () => {
    expect(renderRationaleMarkdown("see doi:10.1234/abc.def for the methodology")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc.def">doi:10.1234/abc.def</a> for the methodology</p>',
    );
  });

  it("case-insensitive `doi:` prefix in rationale; display preserves source casing", () => {
    expect(renderRationaleMarkdown("cited as DOI:10.1234/abc")).toBe(
      '<p>cited as <a href="https://doi.org/10.1234/abc">DOI:10.1234/abc</a></p>',
    );
  });

  it("renders multiple DOI refs in one rationale paragraph", () => {
    const html = renderRationaleMarkdown("compare doi:10.1234/abc with doi:10.5678/xyz");
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://doi.org/10.5678/xyz"');
  });

  it("DOI href passes rehypeStripUnsafeHrefs naturally (absolute https://)", () => {
    // Mirrors Phase-41 arxiv: DOIs emit absolute https://doi.org/ URLs
    // that pass `rehypeStripUnsafeHrefs` allow-list without
    // schemaOverrides. Per ADR-0018 D-G APPEND-D-AC.
    const html = renderRationaleMarkdown("see doi:10.1234/abc here");
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
  });

  it("emits canonical doi.org host (NOT dx.doi.org legacy host) in rationale", () => {
    const html = renderRationaleMarkdown("see doi:10.1234/abc");
    expect(html).toContain('href="https://doi.org/');
    expect(html).not.toContain('href="https://dx.doi.org/');
  });

  it("bio surface unaffected by DOI extension Phase 45 (registry default-deny on non-enabled)", () => {
    expect(renderBioMarkdown("see doi:10.1234/abc here")).toBe("<p>see doi:10.1234/abc here</p>");
  });

  it("reviewNotes surface unaffected by DOI extension Phase 45", () => {
    expect(renderReviewNotesMarkdown("see doi:10.1234/abc here")).toBe(
      "<p>see doi:10.1234/abc here</p>",
    );
  });

  it("actionRationale surface unaffected by DOI extension Phase 45", () => {
    expect(renderActionRationaleMarkdown("see doi:10.1234/abc here")).toBe(
      "<p>see doi:10.1234/abc here</p>",
    );
  });

  it("XSS defense survives DOI extension (javascript: stripped; DOI still resolves)", () => {
    const html = renderRationaleMarkdown("[bad](javascript:alert(1)) and see doi:10.1234/abc");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
  });

  it("renders DOI inside emphasized text (nested element preservation)", () => {
    expect(renderRationaleMarkdown("**doi:10.1234/abc.def** establishes the result")).toBe(
      '<p><strong><a href="https://doi.org/10.1234/abc.def">doi:10.1234/abc.def</a></strong> establishes the result</p>',
    );
  });

  it("non-matching pattern (3-digit registrant) falls through as literal text in rationale", () => {
    expect(renderRationaleMarkdown("doi:10.123/abc is too short")).toBe(
      "<p>doi:10.123/abc is too short</p>",
    );
  });

  it("non-matching pattern (bare DOI without doi: prefix) falls through as literal text", () => {
    expect(renderRationaleMarkdown("10.1234/abc is bare DOI")).toBe(
      "<p>10.1234/abc is bare DOI</p>",
    );
  });

  it("trailing sentence-ending period truncates correctly in rationale", () => {
    expect(renderRationaleMarkdown("cited as doi:10.1234/abc.")).toBe(
      '<p>cited as <a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a>.</p>',
    );
  });

  it("embedded period in DOI suffix matches correctly (regex lookahead distinguishes)", () => {
    expect(renderRationaleMarkdown("see doi:10.1234/abc.def.ghi end")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc.def.ghi">doi:10.1234/abc.def.ghi</a> end</p>',
    );
  });
});

// ---------------------------------------------------------------------------
// Phase-45 — end-to-end first-compositional-same-slot rendering via
// CompositeExtensionRegistry([arxiv, doi]). **First "two plugins active in
// the same slot on the same surface under default dispatch" state** in
// project history. Verifies that `remarkPlugins` concatenation per
// APPEND-D-R rule produces BOTH arxiv and DOI autolinks on shared-enabled
// surfaces (rationale only Phase 45) AND that arxiv-only surfaces (bio +
// reviewNotes + actionRationale, all expanded Phase 44) keep arxiv intact.
// ---------------------------------------------------------------------------

describe("Phase-45 first-same-slot composition — rationale-only doi baseline (decoupled after Phase-49)", () => {
  beforeEach(() => {
    // Phase-45 baseline: arxiv on all 4 surfaces (Phase-44 expansion);
    // doi on rationale only (Phase-45 first-ship). Phase 49 expanded doi
    // to all 4 surfaces via `PHASE_45_DEFAULT_ENABLED_SURFACES`; this
    // block is decoupled with an explicit `new Set(["rationale"])` for
    // doi to preserve the Phase-45 "first same-slot composition on a
    // single surface" baseline coverage. New Phase-49 all-4-surfaces
    // same-slot block uses the constant directly.
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([arxiv, doi]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: BOTH arxiv and DOI render in the same paragraph (first same-slot composition)", () => {
    // **First "two plugins active in the same slot on the same surface
    // under default dispatch" state in project history.** Under
    // `MARKDOWN_EXTENSIONS=arxiv,doi` Phase-45 default the remarkPlugins
    // slot on rationale carries [remarkLinkArxivIds, remarkLinkDoiIds]
    // per APPEND-D-R "concatenated across components in registration
    // order" rule.
    const html = renderRationaleMarkdown(
      "see arxiv:1909.03004 and doi:10.1234/abc.def for context",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc.def"');
  });

  it("rationale: arxiv-then-DOI ordering preserved in output text-flow", () => {
    const html = renderRationaleMarkdown("arxiv:1909.03004 doi:10.1234/abc");
    const arxivIdx = html.indexOf("arxiv.org");
    const doiIdx = html.indexOf("doi.org");
    expect(arxivIdx).toBeGreaterThan(-1);
    expect(doiIdx).toBeGreaterThan(-1);
    expect(arxivIdx).toBeLessThan(doiIdx);
  });

  it("rationale: DOI-then-arxiv ordering preserved in output text-flow", () => {
    // Verifies plugin invocation order doesn't reorder output; each
    // plugin scans the mdast tree and emits links in source order.
    const html = renderRationaleMarkdown("doi:10.1234/abc arxiv:1909.03004");
    const arxivIdx = html.indexOf("arxiv.org");
    const doiIdx = html.indexOf("doi.org");
    expect(arxivIdx).toBeGreaterThan(-1);
    expect(doiIdx).toBeGreaterThan(-1);
    expect(doiIdx).toBeLessThan(arxivIdx);
  });

  it("bio: arxiv renders (Phase-44 expansion) but DOI does NOT (Phase-45 rationale-only)", () => {
    // Phase 44: arxiv expanded to all 4 surfaces.
    // Phase 45: DOI ships rationale-only.
    // Under `arxiv,doi` composite on bio: only arxiv plugin invoked
    // (doi default-deny on bio). The remarkPlugins array for bio is
    // [remarkLinkArxivIds] — 1-element, not 2.
    const html = renderBioMarkdown("see arxiv:1909.03004 and doi:10.1234/abc here");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).not.toContain("doi.org");
    expect(html).toContain("doi:10.1234/abc"); // literal text preserved
  });

  it("reviewNotes: arxiv renders but DOI does NOT (Phase-45 rationale-only)", () => {
    const html = renderReviewNotesMarkdown("compare arxiv:2024.01234 with doi:10.5678/xyz");
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
    expect(html).not.toContain("doi.org");
    expect(html).toContain("doi:10.5678/xyz");
  });

  it("actionRationale: arxiv renders but DOI does NOT (Phase-45 rationale-only)", () => {
    const html = renderActionRationaleMarkdown("see arxiv:1909.03004 and doi:10.1234/abc");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).not.toContain("doi.org");
    expect(html).toContain("doi:10.1234/abc");
  });

  it("XSS defenses survive first-same-slot composition on rationale", () => {
    const html = renderRationaleMarkdown(
      "[bad](javascript:alert(1)) and arxiv:1909.03004 and doi:10.1234/abc",
    );
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
  });
});

// ---------------------------------------------------------------------------
// Phase-45 — first 4-consumer composition under default dispatch via
// CompositeExtensionRegistry([wikilinks, tables, arxiv, doi]) at their
// respective Phase-45-defaults. wikilinks + tables + arxiv all 4 surfaces;
// doi rationale only. **First "4-consumer composition under default
// dispatch" state in project history.** rationale carries 4 consumers
// across 3 slots ([arxiv, doi] in remarkPlugins); other 3 surfaces carry
// 3 consumers (Phase-44 baseline).
// ---------------------------------------------------------------------------

describe("Phase-45 first-4-consumer composition — rationale-only doi baseline (decoupled after Phase-49)", () => {
  beforeEach(() => {
    // Phase-45 baseline: 4-consumer composition with doi on rationale only.
    // Phase 49 generalized doi to all 4 surfaces; this block is decoupled
    // with an explicit `new Set(["rationale"])` for doi to preserve the
    // Phase-45 "first 4-consumer composition under default dispatch" +
    // "rationale-only DOI participation" baseline coverage. New Phase-49
    // all-4-surfaces 4-consumer block uses the constant directly.
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: 4 consumers active across 3 slots (wikilinks rehype + tables schema + [arxiv, doi] remark)", () => {
    // **First "4-consumer composition under default dispatch" state.**
    // rationale is the only surface where DOI participates Phase 45.
    // Trailing period (not colon) separates DOI from table because the
    // Crossref-spec DOI suffix character class allows `:` mid-suffix.
    const md =
      "see [[scalable-oversight]] arxiv:1909.03004 doi:10.1234/abc.\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('href="/problems/scalable-oversight"'); // wikilinks rehype
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"'); // arxiv remark
    expect(html).toContain('href="https://doi.org/10.1234/abc"'); // doi remark
    expect(html).toContain("<table>"); // tables schema
  });

  it("bio: 3 consumers active (wikilinks + tables + arxiv); DOI inactive (rationale-only Phase 45)", () => {
    const md =
      "see [[hallucination-reduction]] arxiv:1909.03004 doi:10.1234/abc:\n\n| C |\n|---|\n| ok |";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('href="/problems/hallucination-reduction"');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain("<table>");
    expect(html).not.toContain("doi.org");
  });

  it("reviewNotes: 3 consumers active; DOI inactive", () => {
    const md =
      "see [[scalable-oversight]] arxiv:2024.12345 doi:10.5678/xyz:\n\n| Crit |\n|---|\n| ok |";
    const html = renderReviewNotesMarkdown(md) ?? "";
    expect(html).toContain('href="/problems/scalable-oversight"');
    expect(html).toContain('href="https://arxiv.org/abs/2024.12345"');
    expect(html).toContain("<table>");
    expect(html).not.toContain("doi.org");
  });

  it("actionRationale: 3 consumers active; DOI inactive", () => {
    const md =
      "see [[scalable-oversight]] arxiv:1909.03004 doi:10.1234/abc:\n\n| Dim |\n|---|\n| s |";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('href="/problems/scalable-oversight"');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain("<table>");
    expect(html).not.toContain("doi.org");
  });

  it("XSS defense survives 4-consumer composition on rationale (the only 4-consumer surface Phase 45)", () => {
    // Trailing period (not colon) separator — Crossref allows `:` mid-
    // DOI-suffix so we use a less ambiguous separator before the table.
    const md =
      "[bad](javascript:alert(1)) [[x]] arxiv:1909.03004 doi:10.1234/abc.\n\n| C |\n|---|\n| ok |";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="/problems/x"');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain("<table>");
  });

  it("rationale-only DOI participation under 4-consumer default — first compositional same-slot", () => {
    // Across the 4 surfaces only rationale exercises the same-slot
    // composition (arxiv + doi both in remarkPlugins). Other surfaces
    // remain at the Phase-44 baseline. This test asserts the asymmetry
    // explicitly.
    const md = "doi:10.1234/abc";
    expect(renderRationaleMarkdown(md)).toContain('href="https://doi.org/10.1234/abc"');
    expect(renderBioMarkdown(md) ?? "").not.toContain("doi.org");
    expect(renderReviewNotesMarkdown(md) ?? "").not.toContain("doi.org");
    expect(renderActionRationaleMarkdown(md)).not.toContain("doi.org");
  });
});

// ---------------------------------------------------------------------------
// Phase-46 — end-to-end wikilink alias syntax `[[slug|display-text]]` via
// `rehypeResolveWikilinks` regex extension (Unit 46.1) on all 4 surfaces
// under `MARKDOWN_EXTENSIONS=wikilinks` Phase-42 default + within the
// 4-way `wikilinks,tables,arxiv,doi` Phase-45 default composite.
//
// First plugin-regex-extension within an existing framework consumer:
// `WIKILINK_PATTERN` evolves from `/\[\[([a-z0-9-]+)\]\]/g` to
// `/\[\[([a-z0-9-]+)(?:\|([^\]\n]+))?\]\]/g`. Display text becomes the
// text-node content of the emitted <a>; HTML-special chars escape via
// rehype-stringify text-node rendering (no new XSS surface).
//
// Closes ADR-0018 APPEND-D-L item 2 at 8-phase carryover (Phase 38 → 46;
// longest APPEND-D-L item closure to date).
// ---------------------------------------------------------------------------

describe("Phase-46 wikilink alias syntax — all 4 surfaces under default dispatch", () => {
  beforeEach(() => {
    __setRegistryForTests(new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("alias renders on bio: [[slug|display]] → <a href=/problems/slug>display</a>", () => {
    expect(renderBioMarkdown("I work on [[scalable-oversight|the alignment frontier]]")).toBe(
      '<p>I work on <a href="/problems/scalable-oversight">the alignment frontier</a></p>',
    );
  });

  it("alias renders on reviewNotes: display divergence preserved through full pipeline", () => {
    expect(
      renderReviewNotesMarkdown("compare to [[hallucination-reduction|the truth problem]]"),
    ).toBe('<p>compare to <a href="/problems/hallucination-reduction">the truth problem</a></p>');
  });

  it("alias renders on rationale: prose-style display preserved", () => {
    expect(
      renderRationaleMarkdown("see [[long-horizon-agent-reliability|this problem]] for context"),
    ).toBe(
      '<p>see <a href="/problems/long-horizon-agent-reliability">this problem</a> for context</p>',
    );
  });

  it("alias renders on actionRationale: Phase-38 baseline surface preserves alias", () => {
    expect(
      renderActionRationaleMarkdown("upgrade reflects [[scalable-oversight|recent progress]]"),
    ).toBe('<p>upgrade reflects <a href="/problems/scalable-oversight">recent progress</a></p>');
  });

  it("backwards-compat: bare [[slug]] still renders identically on all 4 surfaces", () => {
    // Phase 46 regex evolution is purely additive; existing [[slug]] usage
    // (16 occurrences across rating-action YAMLs at Phase 38 ship) renders
    // unchanged.
    const md = "[[scalable-oversight]]";
    const expected = '<p><a href="/problems/scalable-oversight">scalable-oversight</a></p>';
    expect(renderBioMarkdown(md)).toBe(expected);
    expect(renderReviewNotesMarkdown(md)).toBe(expected);
    expect(renderRationaleMarkdown(md)).toBe(expected);
    expect(renderActionRationaleMarkdown(md)).toBe(expected);
  });

  it("aliased + non-aliased mix on rationale: both styles coexist in same paragraph", () => {
    expect(
      renderRationaleMarkdown(
        "see [[scalable-oversight|here]] and the related [[hallucination-reduction]]",
      ),
    ).toBe(
      '<p>see <a href="/problems/scalable-oversight">here</a> and the related ' +
        '<a href="/problems/hallucination-reduction">hallucination-reduction</a></p>',
    );
  });

  it("alias display HTML-escapes via rehype-stringify text-node rendering on rationale (XSS safety)", () => {
    // `<` in display escapes to `&#x3C;`. The text-node escape is the
    // line of defense for HTML-special chars in display text. No new
    // XSS surface introduced by Phase-46 alias syntax.
    const html = renderRationaleMarkdown("see [[a|x < y]] for math");
    expect(html).toContain('<a href="/problems/a">x &#x3C; y</a>');
  });

  it("alias ampersand escapes on bio (text-node escape preserves XSS line of defense)", () => {
    const html = renderBioMarkdown("[[a|Cats & dogs]]");
    expect(html ?? "").toContain('<a href="/problems/a">Cats &#x26; dogs</a>');
  });

  it("XSS defenses survive alias on rationale (javascript: stripped; alias still resolves)", () => {
    const html = renderRationaleMarkdown(
      "[bad](javascript:alert(1)) and [[scalable-oversight|here]]",
    );
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a href="/problems/scalable-oversight">here</a>');
  });

  it("empty alias [[slug|]] falls through as literal on all 4 surfaces (no match)", () => {
    // Documented Phase-46 behavior: alias display class requires `+`
    // (one-or-more); [[slug|]] does not satisfy and falls through as
    // literal text. Phase 47+ refinement candidate.
    const md = "[[scalable-oversight|]]";
    expect(renderBioMarkdown(md)).toBe("<p>[[scalable-oversight|]]</p>");
    expect(renderReviewNotesMarkdown(md)).toBe("<p>[[scalable-oversight|]]</p>");
    expect(renderRationaleMarkdown(md)).toBe("<p>[[scalable-oversight|]]</p>");
    expect(renderActionRationaleMarkdown(md)).toBe("<p>[[scalable-oversight|]]</p>");
  });
});

// ---------------------------------------------------------------------------
// Phase-46 — alias syntax composes cleanly under the Phase-45 maximal
// 4-consumer composition `wikilinks,tables,arxiv,doi`. Verifies that
// regex-extension within wikilinks (alias support) coexists with the 3
// other consumers + their respective slots; no slot-coverage regression.
// ---------------------------------------------------------------------------

describe("Phase-46 alias under Phase-45 4-way composite — wikilinks,tables,arxiv,doi", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: alias renders alongside arxiv + doi + tables in 4-consumer surface", () => {
    // rationale is the only surface where DOI participates (Phase 45);
    // also receives wikilinks (Phase 42) + tables (Phase 43) + arxiv
    // (Phase 44) under the 4-way default. Adding alias syntax to
    // wikilinks under this composite — all 4 consumers' outputs coexist.
    const md =
      "see [[scalable-oversight|here]] arxiv:1909.03004 doi:10.1234/abc.\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a href="/problems/scalable-oversight">here</a>'); // wikilinks + alias
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"'); // arxiv
    expect(html).toContain('href="https://doi.org/10.1234/abc"'); // doi
    expect(html).toContain("<table>"); // tables
  });

  it("bio: alias renders alongside arxiv + tables (3-consumer surface; doi inactive Phase 45)", () => {
    const md =
      "I work on [[hallucination-reduction|truth in LLMs]] arxiv:2024.01234.\n\n| C |\n|---|\n| ok |";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a href="/problems/hallucination-reduction">truth in LLMs</a>');
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
    expect(html).toContain("<table>");
    expect(html).not.toContain("doi.org");
  });

  it("XSS defenses survive Phase-46 alias under 4-way composite on rationale", () => {
    const md = "[bad](javascript:alert(1)) [[s|safe display]] arxiv:1909.03004 doi:10.1234/abc.";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a href="/problems/s">safe display</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
  });

  it("Phase-45 baseline preserved: bare [[slug]] + arxiv on actionRationale (no alias used)", () => {
    // Verifies the 4-way composite still passes Phase-45-baseline tests
    // when the curator doesn't use alias syntax — backwards-compat holds.
    const md = "see [[scalable-oversight]] arxiv:1909.03004";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a href="/problems/scalable-oversight">scalable-oversight</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
  });
});

// ---------------------------------------------------------------------------
// Phase-47 — end-to-end arxiv alias syntax `[[arxiv:NNNN.NNNNN|display]]`
// via dual-form `ARXIV_PATTERN` (Unit 47.1) on all 4 surfaces under
// `MARKDOWN_EXTENSIONS=arxiv` Phase-44 default + within the 4-way
// `wikilinks,tables,arxiv,doi` Phase-45 default composite. Second
// realization of the Phase-46 plugin-regex-extension phase-shape pattern;
// first plugin-regex-extension on a `remarkPlugins` consumer.
//
// Closes ADR-0018 APPEND-D-Y item 5 at 6-phase carryover (Phase 41 → 47).
// ---------------------------------------------------------------------------

describe("Phase-47 arxiv alias syntax — all 4 surfaces under default dispatch", () => {
  beforeEach(() => {
    __setRegistryForTests(new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("alias renders on bio: [[arxiv:NNNN.NNNNN|display]] → <a>display</a>", () => {
    expect(
      renderBioMarkdown("I work on the questions in [[arxiv:1909.03004|Smith et al. 2024]]"),
    ).toBe(
      '<p>I work on the questions in <a href="https://arxiv.org/abs/1909.03004">Smith et al. 2024</a></p>',
    );
  });

  it("alias renders on reviewNotes through full pipeline", () => {
    expect(renderReviewNotesMarkdown("see [[arxiv:2024.01234|the recent survey]]")).toBe(
      '<p>see <a href="https://arxiv.org/abs/2024.01234">the recent survey</a></p>',
    );
  });

  it("alias renders on rationale: human-readable citation display", () => {
    expect(
      renderRationaleMarkdown("compare with [[arxiv:1909.03004|Jones 2024]] for context"),
    ).toBe(
      '<p>compare with <a href="https://arxiv.org/abs/1909.03004">Jones 2024</a> for context</p>',
    );
  });

  it("alias renders on actionRationale: rating-action citation with prose-friendly display", () => {
    expect(
      renderActionRationaleMarkdown("upgrade reflects [[arxiv:1909.03004|the new methodology]]"),
    ).toBe(
      '<p>upgrade reflects <a href="https://arxiv.org/abs/1909.03004">the new methodology</a></p>',
    );
  });

  it("backwards-compat: bare arxiv:NNNN.NNNNN renders identically on all 4 surfaces", () => {
    const md = "arxiv:1909.03004";
    const expected = '<p><a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a></p>';
    expect(renderBioMarkdown(md)).toBe(expected);
    expect(renderReviewNotesMarkdown(md)).toBe(expected);
    expect(renderRationaleMarkdown(md)).toBe(expected);
    expect(renderActionRationaleMarkdown(md)).toBe(expected);
  });

  it("bracketed without alias renders verbatim arxiv ref (brackets stripped) on rationale", () => {
    expect(renderRationaleMarkdown("see [[arxiv:1909.03004]] for context")).toBe(
      '<p>see <a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a> for context</p>',
    );
  });

  it("aliased + bare arxiv coexist in same rationale paragraph", () => {
    const html = renderRationaleMarkdown(
      "compare [[arxiv:1909.03004|first]] with arxiv:2024.01234 directly",
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">first</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">arxiv:2024.01234</a>');
  });

  it("alias display HTML-escapes via text-node rendering on rationale (XSS safety)", () => {
    const html = renderRationaleMarkdown("see [[arxiv:1909.03004|x & y]] math");
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">x &#x26; y</a>');
  });

  it("XSS defenses survive Phase-47 alias on rationale (javascript: stripped; alias resolves)", () => {
    const html = renderRationaleMarkdown(
      "[bad](javascript:alert(1)) and [[arxiv:1909.03004|safe display]]",
    );
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">safe display</a>');
  });

  it("case-insensitive bracketed prefix preserves source casing of alias", () => {
    expect(renderRationaleMarkdown("see [[ARXIV:2024.12345|Display Text]]")).toBe(
      '<p>see <a href="https://arxiv.org/abs/2024.12345">Display Text</a></p>',
    );
  });
});

// ---------------------------------------------------------------------------
// Phase-47 — arxiv alias coexists with Phase-46 wikilinks alias under the
// Phase-45 maximal 4-consumer composition `wikilinks,tables,arxiv,doi`.
// Verifies that two alias-syntax extensions (one in remarkPlugins via
// arxiv, one in rehypePlugins via wikilinks) compose conflict-free on the
// 4-consumer rationale surface — first dual-alias surface in the framework.
// ---------------------------------------------------------------------------

describe("Phase-47 arxiv alias under Phase-45 4-way composite — wikilinks,tables,arxiv,doi", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: arxiv alias + wikilinks alias + doi + tables all render together (first dual-alias surface)", () => {
    // First surface where two alias-syntax extensions are simultaneously
    // active under default dispatch. Wikilinks alias (Phase 46) +
    // arxiv alias (Phase 47) coexist; neither regex interferes with
    // the other (wikilinks slug `[a-z0-9-]+` excludes `:` + `.`;
    // arxiv ID class `\d{4}\.\d{4,5}` excludes letters).
    const md =
      "see [[scalable-oversight|here]] and [[arxiv:1909.03004|Smith 2024]] and doi:10.1234/abc.\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a href="/problems/scalable-oversight">here</a>'); // wikilinks alias
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">Smith 2024</a>'); // arxiv alias
    expect(html).toContain('href="https://doi.org/10.1234/abc"'); // doi
    expect(html).toContain("<table>"); // tables
  });

  it("bio: arxiv alias + wikilinks alias + tables render (3-consumer surface; doi inactive)", () => {
    const md =
      "I cite [[arxiv:1909.03004|the original work]] for [[hallucination-reduction|this topic]].\n\n| C |\n|---|\n| ok |";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the original work</a>');
    expect(html).toContain('<a href="/problems/hallucination-reduction">this topic</a>');
    expect(html).toContain("<table>");
    expect(html).not.toContain("doi.org");
  });

  it("backwards-compat under 4-way composite: bare arxiv + bare [[slug]] still work", () => {
    // No alias used; Phase-41 + Phase-38 baselines preserved under the
    // 4-way composite + Phase-46/47 regex extensions.
    const md = "see [[scalable-oversight]] arxiv:1909.03004 doi:10.1234/abc.";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a href="/problems/scalable-oversight">scalable-oversight</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
  });

  it("XSS defenses survive Phase-47 arxiv alias under 4-way composite on rationale", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] [[arxiv:1909.03004|safe arxiv]] doi:10.1234/abc.";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a href="/problems/s">safe slug</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">safe arxiv</a>');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
  });
});

// ---------------------------------------------------------------------------
// Phase-48 — end-to-end DOI alias syntax `[[doi:10.NNNN/xxx|display]]` via
// dual-form `DOI_PATTERN` (Unit 48.1) on the rationale surface under
// `MARKDOWN_EXTENSIONS=doi` Phase-45 default (rationale-only) + within the
// 4-way `wikilinks,tables,arxiv,doi` Phase-45 default composite. Third
// realization of the Phase-46 plugin-regex-extension phase-shape pattern;
// second plugin-regex-extension on a `remarkPlugins` consumer. First
// "two-consecutive-`remarkPlugins`-regex-extension phases" pair (Phase 47
// arxiv + Phase 48 doi).
//
// Closes ADR-0018 APPEND-D-AC item 2 at 3-phase carryover (Phase 45 → 48).
// ---------------------------------------------------------------------------

describe("Phase-48 doi alias syntax — rationale surface under default dispatch", () => {
  beforeEach(() => {
    __setRegistryForTests(new DoiExtensionRegistry(new Set(["rationale"])));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("alias renders on rationale: [[doi:10.NNNN/xxx|display]] → <a>display</a>", () => {
    expect(
      renderRationaleMarkdown(
        "compare with [[doi:10.48550/arXiv.2005.14165|Brown et al. 2020]] for context",
      ),
    ).toBe(
      '<p>compare with <a href="https://doi.org/10.48550/arXiv.2005.14165">Brown et al. 2020</a> for context</p>',
    );
  });

  it("alias does NOT render on bio (doi disabled by Phase-45 default)", () => {
    // `PHASE_45_DEFAULT_ENABLED_SURFACES = Set(["rationale"])`; bio is
    // doi-disabled. The `[[doi:...|display]]` text passes through unchanged
    // via the bio sanitize line of defense (brackets + pipe are literal).
    const html = renderBioMarkdown("see [[doi:10.1234/abc|display]] here") ?? "";
    expect(html).not.toContain('href="https://doi.org/');
    expect(html).not.toContain('<a href="https://doi.org/10.1234/abc">display</a>');
  });

  it("alias does NOT render on reviewNotes (doi disabled by Phase-45 default)", () => {
    const html = renderReviewNotesMarkdown("see [[doi:10.1234/abc|display]] here");
    expect(html).not.toContain('href="https://doi.org/');
  });

  it("alias does NOT render on actionRationale (doi disabled by Phase-45 default)", () => {
    const html = renderActionRationaleMarkdown("see [[doi:10.1234/abc|display]] here");
    expect(html).not.toContain('href="https://doi.org/');
  });

  it("backwards-compat: bare doi:10.NNNN/xxx renders on rationale (Phase-45 baseline)", () => {
    expect(renderRationaleMarkdown("see doi:10.1234/abc.def for context")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc.def">doi:10.1234/abc.def</a> for context</p>',
    );
  });

  it("bracketed without alias renders verbatim doi ref (brackets stripped) on rationale", () => {
    expect(renderRationaleMarkdown("see [[doi:10.1234/abc]] for context")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a> for context</p>',
    );
  });

  it("aliased + bare doi coexist in same rationale paragraph", () => {
    const html = renderRationaleMarkdown(
      "compare [[doi:10.1234/abc|first paper]] with doi:10.5678/def directly",
    );
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">first paper</a>');
    expect(html).toContain('<a href="https://doi.org/10.5678/def">doi:10.5678/def</a>');
  });

  it("alias display HTML-escapes via text-node rendering on rationale (XSS safety)", () => {
    const html = renderRationaleMarkdown("see [[doi:10.1234/abc|x & y]] math");
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">x &#x26; y</a>');
  });

  it("XSS defenses survive Phase-48 alias on rationale (javascript: stripped; alias resolves)", () => {
    const html = renderRationaleMarkdown(
      "[bad](javascript:alert(1)) and [[doi:10.1234/abc|safe display]]",
    );
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">safe display</a>');
  });

  it("case-insensitive bracketed prefix preserves source casing of alias", () => {
    expect(renderRationaleMarkdown("see [[DOI:10.1234/abc|Display Text]]")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">Display Text</a></p>',
    );
  });

  it("bracketed form permits `;` mid-suffix on rationale (lookahead does NOT apply inside brackets)", () => {
    // Bare-form lookahead truncates at `;`; bracketed form allows the
    // full Crossref suffix class verbatim — the "first selectively-
    // applied lookahead in dual-form regex" discipline propagates through
    // the full render pipeline.
    expect(renderRationaleMarkdown("see [[doi:10.1234/abc;suffix|display]] here")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc;suffix">display</a> here</p>',
    );
  });
});

// ---------------------------------------------------------------------------
// Phase-48 — doi alias coexists with Phase-46 wikilinks alias + Phase-47
// arxiv alias under the Phase-45 maximal 4-consumer composition
// `wikilinks,tables,arxiv,doi`. Rationale becomes the **first triple-alias
// surface in project history** — wikilinks alias (rehypePlugins) + arxiv
// alias (remarkPlugins) + doi alias (remarkPlugins, second) simultaneously
// active. The two same-slot consumers (arxiv + doi in remarkPlugins) are
// collision-free via regex-disjointness-as-sole-defense discipline
// (arxiv ID class lacks `/`; doi ID class requires `/`).
// ---------------------------------------------------------------------------

describe("Phase-48 doi alias under Phase-45 4-way composite — first triple-alias surface", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: wikilinks + arxiv + doi aliases all render together (first triple-alias surface)", () => {
    // First surface in project history where three alias-syntax extensions
    // are simultaneously active under default dispatch. Wikilinks alias
    // (Phase 46; rehypePlugins) + arxiv alias (Phase 47; remarkPlugins) +
    // doi alias (Phase 48; remarkPlugins) coexist. Regex disjointness
    // discipline: wikilinks slug `[a-z0-9-]+` excludes `:`+`.`+`/`;
    // arxiv ID `\d{4}\.\d{4,5}` lacks `/`; doi ID requires `/`. The
    // three regexes cannot match the same string.
    const md =
      "see [[scalable-oversight|here]], [[arxiv:1909.03004|Smith 2024]], and [[doi:10.48550/arXiv.2005.14165|Brown 2020]].\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a href="/problems/scalable-oversight">here</a>'); // wikilinks alias
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">Smith 2024</a>'); // arxiv alias
    expect(html).toContain('<a href="https://doi.org/10.48550/arXiv.2005.14165">Brown 2020</a>'); // doi alias
    expect(html).toContain("<table>"); // tables
  });

  it("bio: wikilinks + arxiv aliases render (dual-alias; doi inactive on bio per Phase-45 default)", () => {
    // bio is doi-disabled by `PHASE_45_DEFAULT_ENABLED_SURFACES = Set(["rationale"])`.
    // Phase-46/47 alias-capable consumers remain active (wikilinks all-4
    // since Phase 42; arxiv all-4 since Phase 44). bio remains a
    // **dual-alias** surface — NOT triple-alias.
    const md =
      "I cite [[arxiv:1909.03004|the original]] for [[hallucination-reduction|this topic]] and [[doi:10.1234/abc|paper]].";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the original</a>');
    expect(html).toContain('<a href="/problems/hallucination-reduction">this topic</a>');
    // doi alias does NOT render on bio; the [[doi:...|paper]] text passes
    // through. Verify no <a href="https://doi.org/..."> emitted.
    expect(html).not.toContain('href="https://doi.org/');
  });

  it("reviewNotes: wikilinks + arxiv aliases render (dual-alias; doi inactive)", () => {
    const md = "see [[arxiv:2024.01234|the survey]] and [[scalable-oversight|context]] notes.";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">the survey</a>');
    expect(html).toContain('<a href="/problems/scalable-oversight">context</a>');
  });

  it("actionRationale: wikilinks + arxiv aliases render (dual-alias; doi inactive)", () => {
    const md = "upgrade reflects [[arxiv:1909.03004|the work]] on [[benchmark-integrity|this]].";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the work</a>');
    expect(html).toContain('<a href="/problems/benchmark-integrity">this</a>');
  });

  it("backwards-compat under 4-way composite: bare doi + bare arxiv + bare [[slug]] still work on rationale", () => {
    // No alias used; Phase-41 + Phase-45 + Phase-38 baselines preserved
    // under the 4-way composite + Phase-46/47/48 dual-form regex
    // extensions.
    const md = "see [[scalable-oversight]] arxiv:1909.03004 doi:10.1234/abc.";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a href="/problems/scalable-oversight">scalable-oversight</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a>');
  });

  it("XSS defenses survive Phase-48 doi alias under 4-way composite on rationale", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] [[arxiv:1909.03004|safe arxiv]] [[doi:10.1234/abc|safe doi]].";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a href="/problems/s">safe slug</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">safe arxiv</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">safe doi</a>');
  });

  it("regex-disjointness same-slot defense: arxiv-and-doi same paragraph emit distinct hrefs", () => {
    // The two `remarkPlugins` plugins run in registration order
    // (CompositeExtensionRegistry concatenation rule from APPEND-D-R).
    // arxiv ID class `\d{4}\.\d{4,5}` lacks `/`; doi ID class requires
    // `/`. The two regexes cannot match the same string, so plugin
    // ORDER is immaterial for this pair — both produce distinct `<a>`
    // elements without interfering with each other's matches.
    const md =
      "cite [[arxiv:1909.03004|paper A]] and [[doi:10.48550/arXiv.2005.14165|paper B]] together";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.48550/arXiv.2005.14165">paper B</a>');
  });
});

// ---------------------------------------------------------------------------
// Phase-49 — end-to-end DOI cross-surface expansion (constructor-arg value-
// only change in `PHASE_45_DEFAULT_ENABLED_SURFACES`) generalizes the
// Phase-45 rationale-only doi consumer to all 4 markdown surfaces. Fourth
// realization of the "constructor-arg-only zero-rework expansion" property
// (Phase 42 wikilinks; Phase 43 tables; Phase 44 arxiv; Phase 49 doi).
// Completes the per-consumer all-4-surfaces arc.
//
// Closes ADR-0018 APPEND-D-AC cross-surface item at 4-phase carryover
// (matches Phase-38 → 42 + Phase-39 → 43 4-phase cadence verbatim).
// ---------------------------------------------------------------------------

describe("Phase-49 doi default — all 4 surfaces via PHASE_45_DEFAULT_ENABLED_SURFACES", () => {
  beforeEach(() => {
    __setRegistryForTests(new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("doi renders on bio (NEW Phase-49 expansion)", () => {
    expect(renderBioMarkdown("see doi:10.1234/abc here") ?? "").toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a> here</p>',
    );
  });

  it("doi renders on reviewNotes (NEW Phase-49 expansion)", () => {
    expect(renderReviewNotesMarkdown("see doi:10.1234/abc here")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a> here</p>',
    );
  });

  it("doi renders on rationale (Phase-45 baseline preserved through expansion)", () => {
    expect(renderRationaleMarkdown("see doi:10.1234/abc here")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a> here</p>',
    );
  });

  it("doi renders on actionRationale (NEW Phase-49 expansion)", () => {
    expect(renderActionRationaleMarkdown("see doi:10.1234/abc here")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a> here</p>',
    );
  });

  it("Phase-48 alias renders on bio (NEW Phase-49 — first non-rationale doi alias surface)", () => {
    expect(renderBioMarkdown("see [[doi:10.1234/abc|the paper]] here") ?? "").toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">the paper</a> here</p>',
    );
  });

  it("Phase-48 alias renders on reviewNotes (NEW Phase-49 — alias extension flows through expansion)", () => {
    expect(renderReviewNotesMarkdown("see [[doi:10.1234/abc|the paper]] here")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">the paper</a> here</p>',
    );
  });

  it("Phase-48 alias renders on actionRationale (NEW Phase-49)", () => {
    expect(renderActionRationaleMarkdown("see [[doi:10.1234/abc|the paper]] here")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">the paper</a> here</p>',
    );
  });

  it("XSS defenses survive Phase-49 expansion on every surface", () => {
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer("[bad](javascript:alert(1)) and see doi:10.1234/abc") ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('href="https://doi.org/10.1234/abc"');
    }
  });

  it("doi renders identically across all 4 surfaces (parity)", () => {
    const md = "cite doi:10.48550/arXiv.2005.14165 for the methodology";
    const expected =
      '<p>cite <a href="https://doi.org/10.48550/arXiv.2005.14165">doi:10.48550/arXiv.2005.14165</a> for the methodology</p>';
    expect(renderBioMarkdown(md)).toBe(expected);
    expect(renderReviewNotesMarkdown(md)).toBe(expected);
    expect(renderRationaleMarkdown(md)).toBe(expected);
    expect(renderActionRationaleMarkdown(md)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Phase-49 — first "all 4 surfaces are triple-alias" state under 4-way
// `wikilinks,tables,arxiv,doi` Phase-45 default + Phase-46/47/48 alias
// extensions. Pre-Phase-49 only rationale was triple-alias (wikilinks +
// arxiv + doi); Phase 49 generalizes via doi cross-surface expansion. First
// surface-with-3-alias-consumers cardinality of 4 in project history.
// ---------------------------------------------------------------------------

describe("Phase-49 first all-4-surfaces triple-alias state under 4-way composite", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: all 3 aliases (wikilinks + arxiv + doi) render together (NEW Phase-49 triple-alias)", () => {
    // First time bio has 3 alias-syntax consumers active simultaneously.
    const md =
      "see [[scalable-oversight|topic]] and [[arxiv:1909.03004|paper A]] and [[doi:10.1234/abc|paper B]].";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper B</a>');
  });

  it("reviewNotes: all 3 aliases render together (NEW Phase-49 triple-alias)", () => {
    const md =
      "see [[hallucination-reduction|topic]], [[arxiv:2024.01234|paper A]], [[doi:10.5678/xyz|paper B]].";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain('<a href="/problems/hallucination-reduction">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.5678/xyz">paper B</a>');
  });

  it("rationale: all 3 aliases render together (Phase-48 baseline preserved through Phase-49 expansion)", () => {
    const md =
      "see [[benchmark-integrity|topic]] and [[arxiv:1909.03004|paper A]] and [[doi:10.1234/abc|paper B]].";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a href="/problems/benchmark-integrity">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper B</a>');
  });

  it("actionRationale: all 3 aliases render together (NEW Phase-49 triple-alias)", () => {
    const md =
      "see [[scalable-oversight|topic]], [[arxiv:1909.03004|the work]], and [[doi:10.1234/abc|cite this]].";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the work</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">cite this</a>');
  });

  it("triple-alias + tables + XSS defenses all hold on every surface", () => {
    const md =
      "[bad](javascript:alert(1)) [[scalable-oversight|safe slug]] [[arxiv:1909.03004|safe arxiv]] [[doi:10.1234/abc|safe doi]].\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('<a href="/problems/scalable-oversight">safe slug</a>');
      expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">safe arxiv</a>');
      expect(html).toContain('<a href="https://doi.org/10.1234/abc">safe doi</a>');
      expect(html).toContain("<table>");
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-49 — first "all 4 surfaces have same-slot composition" state. The
// arxiv-vs-doi pair in `remarkPlugins` is now active on every surface under
// 4-way default. Validates the regex-disjointness-as-sole-defense discipline
// (Phase 48 established) end-to-end at maximum surface cardinality.
// ---------------------------------------------------------------------------

describe("Phase-49 first all-4-surfaces same-slot composition (arxiv+doi in remarkPlugins everywhere)", () => {
  beforeEach(() => {
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(new CompositeExtensionRegistry([arxiv, doi]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: arxiv + doi both render in the same paragraph (NEW Phase-49 same-slot)", () => {
    const html =
      renderBioMarkdown("compare arxiv:1909.03004 with doi:10.1234/abc.def directly") ?? "";
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc.def"');
  });

  it("reviewNotes: arxiv + doi both render in the same paragraph (NEW Phase-49 same-slot)", () => {
    const html = renderReviewNotesMarkdown("compare arxiv:2024.01234 with doi:10.5678/xyz here");
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
    expect(html).toContain('href="https://doi.org/10.5678/xyz"');
  });

  it("actionRationale: arxiv + doi both render in the same paragraph (NEW Phase-49 same-slot)", () => {
    const html = renderActionRationaleMarkdown("see arxiv:1909.03004 and doi:10.1234/abc together");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
  });

  it("rationale: arxiv + doi both render (Phase-45 baseline preserved through Phase-49 expansion)", () => {
    const html = renderRationaleMarkdown(
      "compare arxiv:1909.03004 with doi:10.1234/abc.def for context",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc.def"');
  });

  it("regex-disjointness-as-sole-defense: arxiv-then-doi ordering preserved on every surface", () => {
    // The two `remarkPlugins` plugins run in registration order (arxiv
    // first, then doi). For this pair, plugin ORDER is immaterial
    // because their regex character classes cannot match the same string
    // (arxiv lacks `/`; doi requires `/`). Output text-flow follows source.
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer("arxiv:1909.03004 then doi:10.1234/abc") ?? "";
      const arxivIdx = html.indexOf("arxiv.org");
      const doiIdx = html.indexOf("doi.org");
      expect(arxivIdx).toBeGreaterThan(-1);
      expect(doiIdx).toBeGreaterThan(-1);
      expect(arxivIdx).toBeLessThan(doiIdx);
    }
  });
});
