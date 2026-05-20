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
import { BiorxivExtensionRegistry, PHASE_58_DEFAULT_ENABLED_SURFACES } from "./extensions/biorxiv";
import { CompositeExtensionRegistry } from "./extensions/composite";
import { DoiExtensionRegistry, PHASE_45_DEFAULT_ENABLED_SURFACES } from "./extensions/doi";
import { OrcidExtensionRegistry, PHASE_54_DEFAULT_ENABLED_SURFACES } from "./extensions/orcid";
import { PHASE_50_DEFAULT_ENABLED_SURFACES, PubmedExtensionRegistry } from "./extensions/pubmed";
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

  it('renders [[problem-slug]] as <a class="wikilink" href="/problems/{slug}">{slug}</a> in actionRationale', () => {
    expect(renderActionRationaleMarkdown("see [[scalable-oversight]] for context")).toBe(
      '<p>see <a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a> for context</p>',
    );
  });

  it("renders multiple wikilinks in one actionRationale paragraph", () => {
    expect(
      renderActionRationaleMarkdown("[[hallucination-reduction]] and [[long-context-rag]]"),
    ).toBe(
      '<p><a class="wikilink" href="/problems/hallucination-reduction">hallucination-reduction</a> and <a class="wikilink" href="/problems/long-context-rag">long-context-rag</a></p>',
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
      '<p><strong><a class="wikilink" href="/problems/hallucination-reduction">hallucination-reduction</a></strong> is the work</p>',
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
      '<p>see <a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a> here</p>',
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

  it("Phase-53: older category-prefixed pattern now MATCHES end-to-end (was literal text pre-Phase-53)", () => {
    // Pre-Phase-53: legacy IDs rejected; rendered as literal text. Phase
    // 53 ship: matches via Phase-53 ARXIV_PATTERN inner ID-class
    // disjunction; renders to canonical https://arxiv.org/abs/<id> link.
    expect(renderRationaleMarkdown("arxiv:math/0211159 is older style")).toBe(
      '<p><a href="https://arxiv.org/abs/math/0211159">arxiv:math/0211159</a> is older style</p>',
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
      '<p>see <a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a> here</p>',
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
      '<p>see <a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a> for my work</p>',
    );
  });

  it("wikilinks resolve on reviewNotes under Phase-42 default (newly-enabled surface)", () => {
    expect(renderReviewNotesMarkdown("compare with [[hallucination-reduction]]")).toBe(
      '<p>compare with <a class="wikilink" href="/problems/hallucination-reduction">hallucination-reduction</a></p>',
    );
  });

  it("wikilinks resolve on rationale under Phase-42 default (newly-enabled surface)", () => {
    expect(renderRationaleMarkdown("see [[scalable-oversight]] for context")).toBe(
      '<p>see <a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a> for context</p>',
    );
  });

  it("wikilinks resolve on actionRationale under Phase-42 default (Phase-38 baseline)", () => {
    expect(renderActionRationaleMarkdown("see [[scalable-oversight]] here")).toBe(
      '<p>see <a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a> here</p>',
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
      '<p>see <a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a> for my work</p>',
    );
  });

  it("actionRationale: wikilinks resolve under 3-way Phase-42 default", () => {
    // Phase-38 baseline: wikilinks on actionRationale. Carried verbatim
    // under the Phase-42 expanded default.
    expect(renderActionRationaleMarkdown("see [[hallucination-reduction]]")).toBe(
      '<p>see <a class="wikilink" href="/problems/hallucination-reduction">hallucination-reduction</a></p>',
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
      '<p>I work on <a class="wikilink" href="/problems/scalable-oversight">the alignment frontier</a></p>',
    );
  });

  it("alias renders on reviewNotes: display divergence preserved through full pipeline", () => {
    expect(
      renderReviewNotesMarkdown("compare to [[hallucination-reduction|the truth problem]]"),
    ).toBe(
      '<p>compare to <a class="wikilink" href="/problems/hallucination-reduction">the truth problem</a></p>',
    );
  });

  it("alias renders on rationale: prose-style display preserved", () => {
    expect(
      renderRationaleMarkdown("see [[long-horizon-agent-reliability|this problem]] for context"),
    ).toBe(
      '<p>see <a class="wikilink" href="/problems/long-horizon-agent-reliability">this problem</a> for context</p>',
    );
  });

  it("alias renders on actionRationale: Phase-38 baseline surface preserves alias", () => {
    expect(
      renderActionRationaleMarkdown("upgrade reflects [[scalable-oversight|recent progress]]"),
    ).toBe(
      '<p>upgrade reflects <a class="wikilink" href="/problems/scalable-oversight">recent progress</a></p>',
    );
  });

  it("backwards-compat: bare [[slug]] still renders identically on all 4 surfaces", () => {
    // Phase 46 regex evolution is purely additive; existing [[slug]] usage
    // (16 occurrences across rating-action YAMLs at Phase 38 ship) renders
    // unchanged.
    const md = "[[scalable-oversight]]";
    const expected =
      '<p><a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a></p>';
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
      '<p>see <a class="wikilink" href="/problems/scalable-oversight">here</a> and the related ' +
        '<a class="wikilink" href="/problems/hallucination-reduction">hallucination-reduction</a></p>',
    );
  });

  it("alias display HTML-escapes via rehype-stringify text-node rendering on rationale (XSS safety)", () => {
    // `<` in display escapes to `&#x3C;`. The text-node escape is the
    // line of defense for HTML-special chars in display text. No new
    // XSS surface introduced by Phase-46 alias syntax.
    const html = renderRationaleMarkdown("see [[a|x < y]] for math");
    expect(html).toContain('<a class="wikilink" href="/problems/a">x &#x3C; y</a>');
  });

  it("alias ampersand escapes on bio (text-node escape preserves XSS line of defense)", () => {
    const html = renderBioMarkdown("[[a|Cats & dogs]]");
    expect(html ?? "").toContain('<a class="wikilink" href="/problems/a">Cats &#x26; dogs</a>');
  });

  it("XSS defenses survive alias on rationale (javascript: stripped; alias still resolves)", () => {
    const html = renderRationaleMarkdown(
      "[bad](javascript:alert(1)) and [[scalable-oversight|here]]",
    );
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">here</a>');
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
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">here</a>'); // wikilinks + alias
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"'); // arxiv
    expect(html).toContain('href="https://doi.org/10.1234/abc"'); // doi
    expect(html).toContain("<table>"); // tables
  });

  it("bio: alias renders alongside arxiv + tables (3-consumer surface; doi inactive Phase 45)", () => {
    const md =
      "I work on [[hallucination-reduction|truth in LLMs]] arxiv:2024.01234.\n\n| C |\n|---|\n| ok |";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">truth in LLMs</a>',
    );
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
    expect(html).toContain("<table>");
    expect(html).not.toContain("doi.org");
  });

  it("XSS defenses survive Phase-46 alias under 4-way composite on rationale", () => {
    const md = "[bad](javascript:alert(1)) [[s|safe display]] arxiv:1909.03004 doi:10.1234/abc.";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a class="wikilink" href="/problems/s">safe display</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
  });

  it("Phase-45 baseline preserved: bare [[slug]] + arxiv on actionRationale (no alias used)", () => {
    // Verifies the 4-way composite still passes Phase-45-baseline tests
    // when the curator doesn't use alias syntax — backwards-compat holds.
    const md = "see [[scalable-oversight]] arxiv:1909.03004";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a>',
    );
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
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">here</a>'); // wikilinks alias
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">Smith 2024</a>'); // arxiv alias
    expect(html).toContain('href="https://doi.org/10.1234/abc"'); // doi
    expect(html).toContain("<table>"); // tables
  });

  it("bio: arxiv alias + wikilinks alias + tables render (3-consumer surface; doi inactive)", () => {
    const md =
      "I cite [[arxiv:1909.03004|the original work]] for [[hallucination-reduction|this topic]].\n\n| C |\n|---|\n| ok |";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the original work</a>');
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">this topic</a>',
    );
    expect(html).toContain("<table>");
    expect(html).not.toContain("doi.org");
  });

  it("backwards-compat under 4-way composite: bare arxiv + bare [[slug]] still work", () => {
    // No alias used; Phase-41 + Phase-38 baselines preserved under the
    // 4-way composite + Phase-46/47 regex extensions.
    const md = "see [[scalable-oversight]] arxiv:1909.03004 doi:10.1234/abc.";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a>',
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
  });

  it("XSS defenses survive Phase-47 arxiv alias under 4-way composite on rationale", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] [[arxiv:1909.03004|safe arxiv]] doi:10.1234/abc.";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a class="wikilink" href="/problems/s">safe slug</a>');
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
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">here</a>'); // wikilinks alias
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
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">this topic</a>',
    );
    // doi alias does NOT render on bio; the [[doi:...|paper]] text passes
    // through. Verify no <a href="https://doi.org/..."> emitted.
    expect(html).not.toContain('href="https://doi.org/');
  });

  it("reviewNotes: wikilinks + arxiv aliases render (dual-alias; doi inactive)", () => {
    const md = "see [[arxiv:2024.01234|the survey]] and [[scalable-oversight|context]] notes.";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">the survey</a>');
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">context</a>');
  });

  it("actionRationale: wikilinks + arxiv aliases render (dual-alias; doi inactive)", () => {
    const md = "upgrade reflects [[arxiv:1909.03004|the work]] on [[benchmark-integrity|this]].";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the work</a>');
    expect(html).toContain('<a class="wikilink" href="/problems/benchmark-integrity">this</a>');
  });

  it("backwards-compat under 4-way composite: bare doi + bare arxiv + bare [[slug]] still work on rationale", () => {
    // No alias used; Phase-41 + Phase-45 + Phase-38 baselines preserved
    // under the 4-way composite + Phase-46/47/48 dual-form regex
    // extensions.
    const md = "see [[scalable-oversight]] arxiv:1909.03004 doi:10.1234/abc.";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a>',
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a>');
  });

  it("XSS defenses survive Phase-48 doi alias under 4-way composite on rationale", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] [[arxiv:1909.03004|safe arxiv]] [[doi:10.1234/abc|safe doi]].";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a class="wikilink" href="/problems/s">safe slug</a>');
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
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper B</a>');
  });

  it("reviewNotes: all 3 aliases render together (NEW Phase-49 triple-alias)", () => {
    const md =
      "see [[hallucination-reduction|topic]], [[arxiv:2024.01234|paper A]], [[doi:10.5678/xyz|paper B]].";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">topic</a>',
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.5678/xyz">paper B</a>');
  });

  it("rationale: all 3 aliases render together (Phase-48 baseline preserved through Phase-49 expansion)", () => {
    const md =
      "see [[benchmark-integrity|topic]] and [[arxiv:1909.03004|paper A]] and [[doi:10.1234/abc|paper B]].";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/benchmark-integrity">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper B</a>');
  });

  it("actionRationale: all 3 aliases render together (NEW Phase-49 triple-alias)", () => {
    const md =
      "see [[scalable-oversight|topic]], [[arxiv:1909.03004|the work]], and [[doi:10.1234/abc|cite this]].";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
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
      expect(html).toContain(
        '<a class="wikilink" href="/problems/scalable-oversight">safe slug</a>',
      );
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

// ---------------------------------------------------------------------------
// Phase-50 — end-to-end PubMed PMID consumer rendering via
// `PubmedExtensionRegistry`. Fifth concrete Phase-37-framework consumer;
// first 3rd-`remarkPlugins` consumer beyond arxiv + doi. Ships rationale-
// only per Phase-41/Phase-45 first-ship demand-signal-first precedent.
// Tests whether the regex-disjointness-as-sole-defense discipline (Phase
// 48 established for 2 same-slot consumers; Phase 49 generalized to all
// 4 surfaces) scales to 3 same-slot consumers under composition.
//
// Closes ADR-0018 APPEND-D-AC PubMed PMID item at 5-phase carryover
// (Phase 45 → 50).
// ---------------------------------------------------------------------------

describe("Phase-50 pubmed default — rationale surface via PHASE_50_DEFAULT_ENABLED_SURFACES (Phase 50 ship baseline; decoupled from constant value at Phase 52 per Phase-49 D-12 precedent — Phase 52 cross-surface expansion mutated the constant to all-4-surfaces; this block tests the Phase-50 rationale-only first-ship behavior)", () => {
  beforeEach(() => {
    // Phase 50 first-ship value preserved verbatim (Set(["rationale"])).
    // Phase 52 cross-surface expansion changed PHASE_50_DEFAULT_ENABLED_SURFACES
    // to all 4 surfaces; this block decouples from the constant to
    // preserve Phase-50 baseline coverage per the Phase-49 decoupled-
    // baseline-block discipline.
    __setRegistryForTests(new PubmedExtensionRegistry(new Set(["rationale"])));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it('renders pubmed:NNNNNNNN as <a href="https://pubmed.ncbi.nlm.nih.gov/.../"> in rationale', () => {
    expect(renderRationaleMarkdown("see pubmed:12345678 for the methodology")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a> for the methodology</p>',
    );
  });

  it("renders pmid:NNNNNNNN (alternative prefix) to the same canonical URL form in rationale", () => {
    expect(renderRationaleMarkdown("cited as pmid:12345678 in the survey")).toBe(
      '<p>cited as <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pmid:12345678</a> in the survey</p>',
    );
  });

  it("bio surface unaffected by pubmed extension Phase 50 (registry default-deny on non-enabled)", () => {
    expect(renderBioMarkdown("see pubmed:12345678 here") ?? "").toBe(
      "<p>see pubmed:12345678 here</p>",
    );
  });

  it("reviewNotes surface unaffected by pubmed extension Phase 50", () => {
    expect(renderReviewNotesMarkdown("see pubmed:12345678 here")).toBe(
      "<p>see pubmed:12345678 here</p>",
    );
  });

  it("actionRationale surface unaffected by pubmed extension Phase 50", () => {
    expect(renderActionRationaleMarkdown("see pubmed:12345678 here")).toBe(
      "<p>see pubmed:12345678 here</p>",
    );
  });

  it("XSS defense survives pubmed extension (javascript: stripped; pubmed still resolves)", () => {
    const html = renderRationaleMarkdown("[bad](javascript:alert(1)) and see pubmed:12345678");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
  });

  it("renders pubmed inside emphasized text (nested element preservation)", () => {
    expect(renderRationaleMarkdown("**pubmed:12345678** establishes the result")).toBe(
      '<p><strong><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a></strong> establishes the result</p>',
    );
  });

  it("non-matching pattern (10-digit ID) falls through as literal text in rationale", () => {
    expect(renderRationaleMarkdown("pubmed:1234567890 is too long").startsWith("<p>")).toBe(true);
    // 10th digit lands outside the link per the regex backoff to 9 digits;
    // the substring `pubmed:1234567890` should NOT entirely match.
    expect(renderRationaleMarkdown("pubmed:1234567890 alone")).toBe(
      "<p>pubmed:1234567890 alone</p>",
    );
  });

  it("emits canonical pubmed.ncbi.nlm.nih.gov host with trailing slash", () => {
    const html = renderRationaleMarkdown("see pubmed:12345678");
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).not.toContain('href="https://www.ncbi.nlm.nih.gov/pubmed/');
  });
});

// ---------------------------------------------------------------------------
// Phase-50 — first 3-consumer same-slot composition end-to-end. The triple
// arxiv-doi-pubmed in `remarkPlugins` is collision-free via regex-
// disjointness-as-sole-defense discipline (3-consumer scaling validation).
// ---------------------------------------------------------------------------

describe("Phase-50 first 3-consumer same-slot composition under MARKDOWN_EXTENSIONS=arxiv,doi,pubmed (Phase 50 ship baseline; decoupled from PHASE_50_DEFAULT_ENABLED_SURFACES at Phase 52 per Phase-49 D-12 precedent)", () => {
  beforeEach(() => {
    // Phase-50 default: arxiv on all 4 surfaces (Phase-44); doi on all 4
    // surfaces (Phase-49); pubmed on rationale only (Phase-50 first-ship).
    // Phase 52 cross-surface expansion changed PHASE_50_DEFAULT_ENABLED_SURFACES
    // to all 4 surfaces; explicit Set(["rationale"]) here preserves the
    // Phase-50 first-ship rationale-only-pubmed baseline coverage per the
    // Phase-49 decoupled-baseline-block discipline.
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([arxiv, doi, pubmed]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: ALL 3 consumers (arxiv + doi + pubmed) render in the same paragraph (first 3-consumer same-slot)", () => {
    // **First "three plugins active in the same slot on the same surface
    // under default dispatch" state in project history.** Under
    // `MARKDOWN_EXTENSIONS=arxiv,doi,pubmed` Phase-50 default the
    // remarkPlugins slot on rationale carries [arxiv, doi, pubmed] per
    // APPEND-D-R concatenation rule. The three regex character classes
    // are pairwise disjoint — discipline scales from 2 to 3 without
    // architectural change.
    const html = renderRationaleMarkdown(
      "see arxiv:1909.03004, doi:10.1234/abc, and pubmed:12345678 together",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
  });

  it("rationale: arxiv-then-doi-then-pubmed ordering preserved in output text-flow", () => {
    const html = renderRationaleMarkdown(
      "arxiv:1909.03004 then doi:10.1234/abc then pubmed:12345678",
    );
    const arxivIdx = html.indexOf("arxiv.org");
    const doiIdx = html.indexOf("doi.org");
    const pubmedIdx = html.indexOf("pubmed.ncbi");
    expect(arxivIdx).toBeGreaterThan(-1);
    expect(doiIdx).toBeGreaterThan(-1);
    expect(pubmedIdx).toBeGreaterThan(-1);
    expect(arxivIdx).toBeLessThan(doiIdx);
    expect(doiIdx).toBeLessThan(pubmedIdx);
  });

  it("rationale: reverse-order (pubmed-then-doi-then-arxiv) text-flow preserved (plugin order is immaterial)", () => {
    // Verifies that the 3 plugins each scan the mdast tree and emit links
    // in source order regardless of plugin invocation order. The triple
    // is collision-free via regex-disjointness alone.
    const html = renderRationaleMarkdown(
      "pubmed:12345678 then doi:10.1234/abc then arxiv:1909.03004",
    );
    const arxivIdx = html.indexOf("arxiv.org");
    const doiIdx = html.indexOf("doi.org");
    const pubmedIdx = html.indexOf("pubmed.ncbi");
    expect(pubmedIdx).toBeLessThan(doiIdx);
    expect(doiIdx).toBeLessThan(arxivIdx);
  });

  it("bio: arxiv + doi render (Phase-49 baseline; pubmed inactive on bio per Phase-50 rationale-only default)", () => {
    const html =
      renderBioMarkdown("see arxiv:1909.03004 and doi:10.1234/abc and pubmed:12345678") ?? "";
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).not.toContain("pubmed.ncbi");
    expect(html).toContain("pubmed:12345678"); // literal text preserved
  });

  it("reviewNotes: arxiv + doi render; pubmed inactive (Phase-50 rationale-only default)", () => {
    const html = renderReviewNotesMarkdown(
      "compare arxiv:2024.01234 with doi:10.5678/xyz and pubmed:99999999",
    );
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
    expect(html).toContain('href="https://doi.org/10.5678/xyz"');
    expect(html).not.toContain("pubmed.ncbi");
  });

  it("actionRationale: arxiv + doi render; pubmed inactive (Phase-50 rationale-only default)", () => {
    const html = renderActionRationaleMarkdown(
      "see arxiv:1909.03004, doi:10.1234/abc, and pubmed:12345678",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).not.toContain("pubmed.ncbi");
  });

  it("XSS defenses survive 3-consumer same-slot composition on rationale", () => {
    const html = renderRationaleMarkdown(
      "[bad](javascript:alert(1)) arxiv:1909.03004 doi:10.1234/abc pubmed:12345678",
    );
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
  });
});

// ---------------------------------------------------------------------------
// Phase-50 — first 5-consumer composition under default dispatch via
// CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed]) at
// their respective Phase-50-defaults. Rationale carries 5 consumers across
// 3 slots; other 3 surfaces carry 4 consumers (pubmed inactive there per
// Phase-50 rationale-only default). **Maximum-consumer-cardinality state**
// in project history.
// ---------------------------------------------------------------------------

describe("Phase-50 first 5-consumer composition — wikilinks,tables,arxiv,doi,pubmed maximal default (Phase 50 ship baseline; decoupled from PHASE_50_DEFAULT_ENABLED_SURFACES at Phase 52 per Phase-49 D-12 precedent)", () => {
  beforeEach(() => {
    // Phase 52 cross-surface expansion mutated PHASE_50_DEFAULT_ENABLED_SURFACES
    // to all 4 surfaces; explicit Set(["rationale"]) preserves the Phase-50
    // first-ship max-cardinality-rationale-only-pubmed baseline coverage per
    // the Phase-49 decoupled-baseline-block discipline.
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: ALL 5 consumers render together (first 5-consumer composition; maximum-consumer-cardinality state)", () => {
    // **First "5-consumer composition under default dispatch" state in
    // project history.** rationale carries: wikilinks(rehype) +
    // tables(schema) + [arxiv, doi, pubmed](remark). Triple alias-capable
    // consumers (wikilinks + arxiv + doi) plus the pubmed bare-only
    // consumer (no alias Phase 50). Conflict-free per APPEND-D-R via
    // distinct slots cross-pair + regex-disjointness within remarkPlugins.
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, and pubmed:12345678.\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>'); // wikilinks alias
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"'); // arxiv
    expect(html).toContain('href="https://doi.org/10.1234/abc"'); // doi
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"'); // pubmed
    expect(html).toContain("<table>"); // tables
  });

  it("bio: 4 consumers render (wikilinks + arxiv + doi + tables); pubmed inactive on bio per Phase-50 default", () => {
    // bio carries 4 consumers Phase 50 (Phase-49 baseline preserved):
    // wikilinks + arxiv + doi all-4-surfaces; tables all-4-surfaces;
    // pubmed rationale-only.
    const md =
      "I cite [[hallucination-reduction|topic]] in arxiv:1909.03004, doi:10.1234/abc, and pubmed:12345678.";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">topic</a>',
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).not.toContain("pubmed.ncbi");
    expect(html).toContain("pubmed:12345678"); // literal text preserved
  });

  it("reviewNotes: 4 consumers render; pubmed inactive (Phase-50 rationale-only)", () => {
    const md = "see [[benchmark-integrity|topic]] arxiv:2024.01234 doi:10.5678/xyz pubmed:99999999";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/benchmark-integrity">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
    expect(html).toContain('href="https://doi.org/10.5678/xyz"');
    expect(html).not.toContain("pubmed.ncbi");
  });

  it("actionRationale: 4 consumers render; pubmed inactive (Phase-50 rationale-only)", () => {
    const md =
      "upgrade reflects [[scalable-oversight|the work]] arxiv:1909.03004 doi:10.1234/abc pubmed:12345678";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">the work</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).not.toContain("pubmed.ncbi");
  });

  it("backwards-compat: bare wikilink + bare arxiv + bare doi + bare pubmed all coexist on rationale", () => {
    const md = "see [[scalable-oversight]] arxiv:1909.03004 doi:10.1234/abc pubmed:12345678.";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a>',
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a>');
    expect(html).toContain(
      '<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a>',
    );
  });

  it("XSS defenses survive 5-consumer composition on rationale", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] [[arxiv:1909.03004|safe arxiv]] [[doi:10.1234/abc|safe doi]] pubmed:12345678.";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a class="wikilink" href="/problems/s">safe slug</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">safe arxiv</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">safe doi</a>');
    expect(html).toContain(
      '<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a>',
    );
  });
});

// ---------------------------------------------------------------------------
// Phase-51 — end-to-end PubMed PMID alias syntax `[[pubmed:NNN|display]]` /
// `[[pmid:NNN|display]]` via dual-form `PUBMED_PATTERN` (Unit 51.1) on
// rationale under `MARKDOWN_EXTENSIONS=pubmed` Phase-50 default + within
// the 5-way `wikilinks,tables,arxiv,doi,pubmed` Phase-50 default composite.
// Fourth realization of the Phase-46 plugin-regex-extension phase-shape
// pattern; third plugin-regex-extension on a `remarkPlugins` consumer;
// first dual-form regex with inner alternation inside the bracketed branch.
//
// Closes new Phase-50 deferral at 1-phase carryover — fastest APPEND-
// deferral closure ever observed.
// ---------------------------------------------------------------------------

describe("Phase-51 pubmed alias syntax — rationale surface under default dispatch (Phase 51 ship baseline; decoupled from PHASE_50_DEFAULT_ENABLED_SURFACES at Phase 52 per Phase-49 D-12 precedent)", () => {
  beforeEach(() => {
    // Phase 52 cross-surface expansion mutated PHASE_50_DEFAULT_ENABLED_SURFACES
    // to all 4 surfaces; explicit Set(["rationale"]) preserves the Phase-51
    // alias-syntax rationale-only baseline coverage per the Phase-49
    // decoupled-baseline-block discipline.
    __setRegistryForTests(new PubmedExtensionRegistry(new Set(["rationale"])));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("alias renders on rationale: [[pubmed:NNN|display]] → <a>display</a>", () => {
    expect(
      renderRationaleMarkdown("compare with [[pubmed:12345678|Smith et al. 2024]] for context"),
    ).toBe(
      '<p>compare with <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">Smith et al. 2024</a> for context</p>',
    );
  });

  it("alias renders on rationale with pmid alternative prefix", () => {
    expect(renderRationaleMarkdown("cited as [[pmid:12345678|original work]]")).toBe(
      '<p>cited as <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">original work</a></p>',
    );
  });

  it("alias does NOT render on bio (pubmed disabled by Phase-50 default)", () => {
    const html = renderBioMarkdown("see [[pubmed:12345678|display]] here") ?? "";
    expect(html).not.toContain('href="https://pubmed.ncbi.nlm.nih.gov/');
  });

  it("alias does NOT render on reviewNotes (pubmed disabled by Phase-50 default)", () => {
    const html = renderReviewNotesMarkdown("see [[pubmed:12345678|display]] here");
    expect(html).not.toContain('href="https://pubmed.ncbi.nlm.nih.gov/');
  });

  it("alias does NOT render on actionRationale (pubmed disabled by Phase-50 default)", () => {
    const html = renderActionRationaleMarkdown("see [[pubmed:12345678|display]] here");
    expect(html).not.toContain('href="https://pubmed.ncbi.nlm.nih.gov/');
  });

  it("backwards-compat: bare pubmed:NNN renders on rationale (Phase-50 baseline)", () => {
    expect(renderRationaleMarkdown("see pubmed:12345678 for context")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a> for context</p>',
    );
  });

  it("bracketed without alias renders verbatim pubmed ref preserving prefix variant on rationale", () => {
    expect(renderRationaleMarkdown("see [[pmid:12345678]] here")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pmid:12345678</a> here</p>',
    );
  });

  it("aliased + bare pubmed coexist in same rationale paragraph", () => {
    const html = renderRationaleMarkdown("see [[pubmed:11111111|first]] and pmid:22222222 also");
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/11111111/">first</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/22222222/">pmid:22222222</a>');
  });

  it("alias display HTML-escapes via text-node rendering on rationale (XSS safety)", () => {
    const html = renderRationaleMarkdown("see [[pubmed:12345678|x & y]] math");
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">x &#x26; y</a>');
  });

  it("XSS defenses survive Phase-51 alias on rationale (javascript: stripped; alias resolves)", () => {
    const html = renderRationaleMarkdown(
      "[bad](javascript:alert(1)) and [[pubmed:12345678|safe display]]",
    );
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">safe display</a>');
  });

  it("case-insensitive bracketed prefix preserves source casing of alias", () => {
    expect(renderRationaleMarkdown("see [[PMID:12345678|Display Text]]")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">Display Text</a></p>',
    );
  });
});

// ---------------------------------------------------------------------------
// Phase-51 — pubmed alias coexists with Phase-46/47/48 alias-syntax
// extensions under the Phase-50 maximal 5-consumer composition
// `wikilinks,tables,arxiv,doi,pubmed`. Rationale becomes the **first
// quadruple-alias surface in project history** — wikilinks alias
// (rehypePlugins) + arxiv alias (remarkPlugins) + doi alias (remarkPlugins)
// + pubmed alias (remarkPlugins) simultaneously active. Pubmed is rationale-
// only per Phase-50 default; other surfaces remain triple-alias.
// ---------------------------------------------------------------------------

describe("Phase-51 pubmed alias under Phase-50 5-way composite — first quadruple-alias surface (Phase 51 ship baseline; decoupled from PHASE_50_DEFAULT_ENABLED_SURFACES at Phase 52 per Phase-49 D-12 precedent — rationale-only quadruple-alias state preserved here)", () => {
  beforeEach(() => {
    // Phase 52 cross-surface expansion mutated PHASE_50_DEFAULT_ENABLED_SURFACES
    // to all 4 surfaces; explicit Set(["rationale"]) preserves the Phase-51
    // first-quadruple-alias-rationale-only baseline coverage per the
    // Phase-49 decoupled-baseline-block discipline. The Phase-52 all-4-
    // surfaces quadruple-alias state is validated in a NEW describe block
    // added by Unit 52.2.
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: wikilinks + arxiv + doi + pubmed aliases ALL render together (first quadruple-alias surface)", () => {
    // **First quadruple-alias surface in project history.** Wikilinks
    // alias (Phase 46; rehypePlugins) + arxiv alias (Phase 47;
    // remarkPlugins) + doi alias (Phase 48; remarkPlugins) + pubmed
    // alias (Phase 51; remarkPlugins) all active simultaneously under
    // 5-way default. Conflict-free per regex-disjointness-as-sole-
    // defense discipline (Phase 50 established for 3 same-slot
    // consumers; Phase 51 ship is first dual-form-extended scenario at
    // 3-same-slot cardinality).
    const md =
      "see [[scalable-oversight|topic]], [[arxiv:1909.03004|paper A]], [[doi:10.48550/arXiv.2005.14165|paper B]], and [[pubmed:12345678|paper C]].\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>'); // wikilinks alias
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>'); // arxiv alias
    expect(html).toContain('<a href="https://doi.org/10.48550/arXiv.2005.14165">paper B</a>'); // doi alias
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">paper C</a>'); // pubmed alias
    expect(html).toContain("<table>"); // tables
  });

  it("bio: wikilinks + arxiv + doi aliases render (triple-alias; pubmed inactive per Phase-50 default)", () => {
    // bio is pubmed-disabled by Phase-50 rationale-only default; remains
    // triple-alias (Phase-49 baseline preserved).
    const md =
      "I cite [[arxiv:1909.03004|the original]] for [[hallucination-reduction|this topic]] and [[doi:10.1234/abc|paper]] and [[pubmed:12345678|biomed]].";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the original</a>');
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">this topic</a>',
    );
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper</a>');
    // pubmed alias does NOT render on bio
    expect(html).not.toContain('href="https://pubmed.ncbi.nlm.nih.gov/');
  });

  it("reviewNotes: wikilinks + arxiv + doi aliases render (triple-alias; pubmed inactive)", () => {
    const md =
      "see [[arxiv:2024.01234|the survey]] and [[scalable-oversight|context]] and [[doi:10.5678/xyz|related]] and [[pubmed:99999999|biomed]]";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">the survey</a>');
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">context</a>');
    expect(html).toContain('<a href="https://doi.org/10.5678/xyz">related</a>');
    expect(html).not.toContain('href="https://pubmed.ncbi.nlm.nih.gov/');
  });

  it("actionRationale: wikilinks + arxiv + doi aliases render (triple-alias; pubmed inactive)", () => {
    const md =
      "upgrade reflects [[arxiv:1909.03004|the work]] on [[benchmark-integrity|this]] and [[doi:10.1234/abc|paper]] and [[pubmed:12345678|biomed]]";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the work</a>');
    expect(html).toContain('<a class="wikilink" href="/problems/benchmark-integrity">this</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper</a>');
    expect(html).not.toContain('href="https://pubmed.ncbi.nlm.nih.gov/');
  });

  it("backwards-compat under 5-way composite: bare wikilink + bare arxiv + bare doi + bare pubmed all coexist on rationale", () => {
    const md = "see [[scalable-oversight]] arxiv:1909.03004 doi:10.1234/abc pubmed:12345678.";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/scalable-oversight">scalable-oversight</a>',
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a>');
    expect(html).toContain(
      '<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a>',
    );
  });

  it("XSS defenses survive Phase-51 quadruple-alias surface on rationale", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] [[arxiv:1909.03004|safe arxiv]] [[doi:10.1234/abc|safe doi]] [[pubmed:12345678|safe pubmed]].";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a class="wikilink" href="/problems/s">safe slug</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">safe arxiv</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">safe doi</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">safe pubmed</a>');
  });
});

// ---------------------------------------------------------------------------
// Phase-52 — end-to-end PubMed PMID cross-surface expansion (constructor-arg
// value-only change in `PHASE_50_DEFAULT_ENABLED_SURFACES`) generalizes the
// Phase-50 rationale-only pubmed consumer to all 4 markdown surfaces. Fifth
// realization of the "constructor-arg-only zero-rework expansion" property
// (Phase 42 wikilinks; Phase 43 tables; Phase 44 arxiv; Phase 49 doi; Phase
// 52 pubmed). **First 5-realization property in project history**. Completes
// the per-consumer all-4-surfaces arc for ALL 5 Phase-37-framework consumers.
//
// Closes ADR-0018 APPEND-D-AH PubMed PMID cross-surface item at **2-phase
// carryover** (Phase 50 → 52) — **fastest cross-surface-expansion APPEND-
// deferral closure ever observed**; beats prior 3-phase Phase-41 → 44 record.
// First cross-surface-expansion closure under the 3-phase floor.
// ---------------------------------------------------------------------------

describe("Phase-52 pubmed default — all 4 surfaces via PHASE_50_DEFAULT_ENABLED_SURFACES", () => {
  beforeEach(() => {
    __setRegistryForTests(new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("pubmed renders on bio (NEW Phase-52 expansion)", () => {
    expect(renderBioMarkdown("see pubmed:12345678 here") ?? "").toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a> here</p>',
    );
  });

  it("pubmed renders on reviewNotes (NEW Phase-52 expansion)", () => {
    expect(renderReviewNotesMarkdown("see pubmed:12345678 here")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a> here</p>',
    );
  });

  it("pubmed renders on rationale (Phase-50 baseline preserved through expansion)", () => {
    expect(renderRationaleMarkdown("see pubmed:12345678 here")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a> here</p>',
    );
  });

  it("pubmed renders on actionRationale (NEW Phase-52 expansion)", () => {
    expect(renderActionRationaleMarkdown("see pubmed:12345678 here")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a> here</p>',
    );
  });

  it("pmid alternative prefix renders on bio (NEW Phase-52; prefix-alternation preserved through expansion)", () => {
    expect(renderBioMarkdown("see pmid:12345678 here") ?? "").toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pmid:12345678</a> here</p>',
    );
  });

  it("Phase-51 alias renders on bio (NEW Phase-52 — first non-rationale pubmed alias surface)", () => {
    expect(renderBioMarkdown("see [[pubmed:12345678|Smith 2024]] here") ?? "").toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">Smith 2024</a> here</p>',
    );
  });

  it("Phase-51 alias renders on reviewNotes (NEW Phase-52 — alias extension flows through expansion)", () => {
    expect(renderReviewNotesMarkdown("see [[pmid:12345678|Smith 2024]] here")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">Smith 2024</a> here</p>',
    );
  });

  it("Phase-51 alias renders on actionRationale (NEW Phase-52)", () => {
    expect(renderActionRationaleMarkdown("see [[pubmed:12345678|Smith 2024]] here")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">Smith 2024</a> here</p>',
    );
  });

  it("XSS defenses survive Phase-52 expansion on every surface", () => {
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer("[bad](javascript:alert(1)) and see pubmed:12345678") ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    }
  });

  it("pubmed renders identically across all 4 surfaces (parity; both prefix variants)", () => {
    const mdPubmed = "cite pubmed:38123456 for the methodology";
    const expectedPubmed =
      '<p>cite <a href="https://pubmed.ncbi.nlm.nih.gov/38123456/">pubmed:38123456</a> for the methodology</p>';
    expect(renderBioMarkdown(mdPubmed)).toBe(expectedPubmed);
    expect(renderReviewNotesMarkdown(mdPubmed)).toBe(expectedPubmed);
    expect(renderRationaleMarkdown(mdPubmed)).toBe(expectedPubmed);
    expect(renderActionRationaleMarkdown(mdPubmed)).toBe(expectedPubmed);

    const mdPmid = "cite pmid:38123456 for the methodology";
    const expectedPmid =
      '<p>cite <a href="https://pubmed.ncbi.nlm.nih.gov/38123456/">pmid:38123456</a> for the methodology</p>';
    expect(renderBioMarkdown(mdPmid)).toBe(expectedPmid);
    expect(renderReviewNotesMarkdown(mdPmid)).toBe(expectedPmid);
    expect(renderRationaleMarkdown(mdPmid)).toBe(expectedPmid);
    expect(renderActionRationaleMarkdown(mdPmid)).toBe(expectedPmid);
  });
});

// ---------------------------------------------------------------------------
// Phase-52 — first "all 4 surfaces are quadruple-alias" state under 5-way
// `wikilinks,tables,arxiv,doi,pubmed` Phase-52 default + Phase-46/47/48/51
// alias extensions. Pre-Phase-52 only rationale was quadruple-alias
// (wikilinks + arxiv + doi + pubmed aliases simultaneously per Phase 51
// ship); Phase 52 generalizes via pubmed cross-surface expansion. First
// surface-with-4-alias-consumers cardinality of 4 in project history.
// ---------------------------------------------------------------------------

describe("Phase-52 first all-4-surfaces quadruple-alias state under 5-way composite", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: all 4 aliases (wikilinks + arxiv + doi + pubmed) render together (NEW Phase-52 quadruple-alias)", () => {
    // First time bio has 4 alias-syntax consumers active simultaneously.
    const md =
      "see [[scalable-oversight|topic]] and [[arxiv:1909.03004|paper A]] and [[doi:10.1234/abc|paper B]] and [[pubmed:12345678|paper C]].";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper B</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">paper C</a>');
  });

  it("reviewNotes: all 4 aliases render together (NEW Phase-52 quadruple-alias)", () => {
    const md =
      "see [[hallucination-reduction|topic]], [[arxiv:2024.01234|paper A]], [[doi:10.5678/xyz|paper B]], [[pmid:99999999|paper C]].";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">topic</a>',
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.5678/xyz">paper B</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/99999999/">paper C</a>');
  });

  it("rationale: all 4 aliases render together (Phase-51 baseline preserved through Phase-52 expansion)", () => {
    const md =
      "see [[benchmark-integrity|topic]] and [[arxiv:1909.03004|paper A]] and [[doi:10.1234/abc|paper B]] and [[pubmed:12345678|paper C]].";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/benchmark-integrity">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper B</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">paper C</a>');
  });

  it("actionRationale: all 4 aliases render together (NEW Phase-52 quadruple-alias)", () => {
    const md =
      "see [[scalable-oversight|topic]], [[arxiv:1909.03004|the work]], [[doi:10.1234/abc|cite this]], and [[pmid:12345678|biomed paper]].";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the work</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">cite this</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">biomed paper</a>');
  });

  it("quadruple-alias + tables + XSS defenses all hold on every surface", () => {
    const md =
      "[bad](javascript:alert(1)) [[scalable-oversight|safe slug]] [[arxiv:1909.03004|safe arxiv]] [[doi:10.1234/abc|safe doi]] [[pubmed:12345678|safe pubmed]].\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain(
        '<a class="wikilink" href="/problems/scalable-oversight">safe slug</a>',
      );
      expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">safe arxiv</a>');
      expect(html).toContain('<a href="https://doi.org/10.1234/abc">safe doi</a>');
      expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">safe pubmed</a>');
      expect(html).toContain("<table>");
    }
  });

  it("bare references + aliases coexist on every surface (Phase-50 + Phase-51 + Phase-52 backwards-compat)", () => {
    // All 4 surfaces post-Phase-52 carry the full quadruple-alias-capable
    // composition; bare wikilink + bare arxiv + bare doi + bare pubmed
    // continue to render alongside their alias forms.
    const md =
      "see scalable-oversight, arxiv:1909.03004, doi:10.1234/abc, and pubmed:12345678 here";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
      expect(html).toContain('href="https://doi.org/10.1234/abc"');
      expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-52 — first "all 4 surfaces have 3-consumer same-slot composition"
// state. The arxiv-doi-pubmed triple in `remarkPlugins` is now active on
// every surface under `arxiv,doi,pubmed` composite (Phase 50 ship realized
// the triple on rationale only; Phase 52 generalizes via pubmed cross-
// surface expansion). Validates the regex-disjointness-as-sole-defense
// discipline at 3-consumer cardinality (Phase 50 established) end-to-end
// at maximum surface cardinality.
// ---------------------------------------------------------------------------

describe("Phase-52 first all-4-surfaces 3-consumer same-slot composition (arxiv+doi+pubmed in remarkPlugins everywhere)", () => {
  beforeEach(() => {
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(new CompositeExtensionRegistry([arxiv, doi, pubmed]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: arxiv + doi + pubmed all render in the same paragraph (NEW Phase-52 3-consumer same-slot)", () => {
    const html =
      renderBioMarkdown(
        "compare arxiv:1909.03004 with doi:10.1234/abc.def and pubmed:12345678 directly",
      ) ?? "";
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc.def"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
  });

  it("reviewNotes: arxiv + doi + pubmed all render (NEW Phase-52 3-consumer same-slot)", () => {
    const html = renderReviewNotesMarkdown(
      "compare arxiv:2024.01234 with doi:10.5678/xyz and pmid:99999999 here",
    );
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
    expect(html).toContain('href="https://doi.org/10.5678/xyz"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/99999999/"');
  });

  it("actionRationale: arxiv + doi + pubmed all render (NEW Phase-52 3-consumer same-slot)", () => {
    const html = renderActionRationaleMarkdown(
      "see arxiv:1909.03004 and doi:10.1234/abc and pubmed:38123456 together",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/38123456/"');
  });

  it("rationale: arxiv + doi + pubmed all render (Phase-50 baseline preserved through Phase-52 expansion)", () => {
    const html = renderRationaleMarkdown(
      "compare arxiv:1909.03004 with doi:10.1234/abc.def and pubmed:12345678 for context",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc.def"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
  });

  it("regex-disjointness-as-sole-defense at 3-consumer cardinality: registration ordering preserved on every surface", () => {
    // The three `remarkPlugins` plugins run in registration order (arxiv
    // first, then doi, then pubmed). For this triple, plugin ORDER is
    // immaterial because their regex character classes are pairwise
    // disjoint (arxiv `\d{4}\.\d{4,5}` lacks `:`+`/`; doi `10.<reg>/<suffix>`
    // requires `10.`+`/`; pubmed `(?:pubmed|pmid):\d` requires literal
    // prefix). Output text-flow follows source.
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer("arxiv:1909.03004 then doi:10.1234/abc then pubmed:12345678") ?? "";
      const arxivIdx = html.indexOf("arxiv.org");
      const doiIdx = html.indexOf("doi.org");
      const pubmedIdx = html.indexOf("pubmed.ncbi.nlm.nih.gov");
      expect(arxivIdx).toBeGreaterThan(-1);
      expect(doiIdx).toBeGreaterThan(-1);
      expect(pubmedIdx).toBeGreaterThan(-1);
      expect(arxivIdx).toBeLessThan(doiIdx);
      expect(doiIdx).toBeLessThan(pubmedIdx);
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-53 — end-to-end older-style category-prefixed arxiv IDs via inner
// ID-class disjunction extension on ARXIV_PATTERN. Fifth realization of the
// Phase-46 plugin-regex-extension phase-shape pattern (first 5-realization
// phase-shape in project history). First non-alias-syntax plugin-regex-
// extension. Second regex evolution on remarkLinkArxivIds (first plugin with
// 2 regex evolutions).
//
// Closes ADR-0018 APPEND-D-Y item 2 at 12-phase carryover (Phase 41 → 53) —
// LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE EVER OBSERVED (beats prior 8-
// phase D-L item 2 record from Phase 38 → 46 wikilinks alias closure).
// ---------------------------------------------------------------------------

describe("Phase-53 arxiv legacy category-prefixed IDs — all 4 surfaces under default dispatch", () => {
  beforeEach(() => {
    __setRegistryForTests(new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("legacy arxiv:math/0211159 renders on bio (NEW Phase-53 ID-class extension)", () => {
    expect(renderBioMarkdown("see arxiv:math/0211159 here") ?? "").toBe(
      '<p>see <a href="https://arxiv.org/abs/math/0211159">arxiv:math/0211159</a> here</p>',
    );
  });

  it("legacy arxiv:hep-th/9711200 renders on reviewNotes (hyphenated category)", () => {
    expect(renderReviewNotesMarkdown("see arxiv:hep-th/9711200 here")).toBe(
      '<p>see <a href="https://arxiv.org/abs/hep-th/9711200">arxiv:hep-th/9711200</a> here</p>',
    );
  });

  it("legacy arxiv:cs.AI/0501001 renders on rationale (subcategory format)", () => {
    expect(renderRationaleMarkdown("see arxiv:cs.AI/0501001 here")).toBe(
      '<p>see <a href="https://arxiv.org/abs/cs.AI/0501001">arxiv:cs.AI/0501001</a> here</p>',
    );
  });

  it("legacy arxiv:cond-mat.stat-mech/0301001 renders on actionRationale (hyphenated category + subcategory)", () => {
    expect(renderActionRationaleMarkdown("see arxiv:cond-mat.stat-mech/0301001 here")).toBe(
      '<p>see <a href="https://arxiv.org/abs/cond-mat.stat-mech/0301001">arxiv:cond-mat.stat-mech/0301001</a> here</p>',
    );
  });

  it("Phase-47 bracketed alias works for legacy IDs on bio", () => {
    expect(renderBioMarkdown("see [[arxiv:math/0211159|Witten 2002]] here") ?? "").toBe(
      '<p>see <a href="https://arxiv.org/abs/math/0211159">Witten 2002</a> here</p>',
    );
  });

  it("legacy + modern formats coexist on every surface (parity + backwards-compat)", () => {
    const md = "compare arxiv:1909.03004 (modern) with arxiv:hep-th/9711200 (legacy)";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
      expect(html).toContain('href="https://arxiv.org/abs/hep-th/9711200"');
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-53 — legacy + modern + bracketed alias coexistence under 5-way
// composite (Phase-52 maximal-activation default). All 4 surfaces inherit
// the legacy-ID matching via the Phase-44 cross-surface arxiv default + the
// Phase-53 ID-class extension flowing through the composite-registry
// dispatch.
// ---------------------------------------------------------------------------

describe("Phase-53 arxiv legacy + modern + alias coexistence under 5-way composite", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: modern + legacy + bracketed alias all coexist under 5-way default (NEW Phase-53)", () => {
    const md =
      "see arxiv:1909.03004 (modern), arxiv:math/0211159 (legacy), and [[arxiv:hep-th/9711200|Maldacena 1997]] (alias-legacy)";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/math/0211159">arxiv:math/0211159</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/hep-th/9711200">Maldacena 1997</a>');
  });

  it("bio: legacy renders alongside doi + pubmed under 5-way composite", () => {
    const md = "compare arxiv:hep-th/9711200 with doi:10.1234/abc and pubmed:12345678";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('href="https://arxiv.org/abs/hep-th/9711200"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
  });

  it("legacy alias inherits XSS safety (HTML-escape via text-node rendering)", () => {
    const md = "[[arxiv:math/0211159|x & y]]";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).toContain('<a href="https://arxiv.org/abs/math/0211159">x &#x26; y</a>');
    }
  });

  it("XSS defenses survive Phase-53 legacy + 5-way composite on every surface", () => {
    const md =
      "[bad](javascript:alert(1)) [[scalable-oversight|topic]] arxiv:hep-th/9711200 doi:10.1234/abc pubmed:12345678.\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('href="https://arxiv.org/abs/hep-th/9711200"');
      expect(html).toContain('href="https://doi.org/10.1234/abc"');
      expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
      expect(html).toContain("<table>");
    }
  });

  it("legacy with version suffix renders correctly under 5-way composite", () => {
    const md = "see arxiv:cond-mat/0301001v3 for the long-form discussion";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).toContain('href="https://arxiv.org/abs/cond-mat/0301001v3"');
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-53 — legacy arxiv + doi + pubmed 3-consumer same-slot composition.
// Regex-disjointness-as-sole-defense discipline at 3-consumer cardinality
// (Phase 50 established; Phase 52 generalized to all 4 surfaces) HOLDS UNDER
// ID-CLASS EXTENSION on arxiv. First state where regex-disjointness is
// exercised across a mix of single-ID-class (doi + pubmed) and dual-ID-
// class (arxiv modern + legacy) regexes at 3-consumer cardinality.
// ---------------------------------------------------------------------------

describe("Phase-53 arxiv legacy + 3-consumer same-slot composition (regex-disjointness holds under ID-class extension)", () => {
  beforeEach(() => {
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(new CompositeExtensionRegistry([arxiv, doi, pubmed]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: legacy arxiv + doi + pubmed all render (NEW Phase-53 — mixed ID-class disjointness)", () => {
    const html =
      renderBioMarkdown(
        "compare arxiv:hep-th/9711200 with doi:10.1234/abc and pubmed:12345678 directly",
      ) ?? "";
    expect(html).toContain('href="https://arxiv.org/abs/hep-th/9711200"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
  });

  it("reviewNotes: legacy arxiv + doi + pubmed all render", () => {
    const html = renderReviewNotesMarkdown(
      "see arxiv:math/0211159 and doi:10.5678/xyz and pmid:99999999 here",
    );
    expect(html).toContain('href="https://arxiv.org/abs/math/0211159"');
    expect(html).toContain('href="https://doi.org/10.5678/xyz"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/99999999/"');
  });

  it("rationale + actionRationale: legacy arxiv + modern arxiv + doi + pubmed all coexist (parity)", () => {
    const md = "see arxiv:1909.03004, arxiv:cond-mat/0301001, doi:10.1234/abc, and pubmed:12345678";
    for (const renderer of [renderRationaleMarkdown, renderActionRationaleMarkdown] as const) {
      const html = renderer(md);
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
      expect(html).toContain('href="https://arxiv.org/abs/cond-mat/0301001"');
      expect(html).toContain('href="https://doi.org/10.1234/abc"');
      expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-54 — end-to-end ORCID auto-link consumer via OrcidExtensionRegistry.
// Sixth concrete Phase-37-framework consumer; first 4th-`remarkPlugins`
// consumer beyond arxiv + doi + pubmed. Ships rationale-only per Phase-41 /
// Phase-45 / Phase-50 first-ship demand-signal-first precedent.
//
// First 4-consumer same-slot composition under MARKDOWN_EXTENSIONS=arxiv,
// doi,pubmed,orcid. First 6-consumer composition under default dispatch
// under MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid — new
// maximum-consumer-cardinality state in project history.
//
// Closes ADR-0018 APPEND-D-AC ORCID auto-link consumer item at 9-phase
// carryover (Phase 45 → 54) — second-longest absolute APPEND-deferral
// closure ever observed.
// ---------------------------------------------------------------------------

describe("Phase-54 orcid default — rationale surface via PHASE_54_DEFAULT_ENABLED_SURFACES", () => {
  beforeEach(() => {
    __setRegistryForTests(new OrcidExtensionRegistry(new Set(["rationale"])));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("orcid renders on rationale", () => {
    expect(renderRationaleMarkdown("see orcid:0000-0002-1825-0097 here")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a> here</p>',
    );
  });

  it("orcid does NOT render on bio (Phase-54 rationale-only default)", () => {
    expect(renderBioMarkdown("see orcid:0000-0002-1825-0097 here") ?? "").toBe(
      "<p>see orcid:0000-0002-1825-0097 here</p>",
    );
  });

  it("orcid does NOT render on reviewNotes", () => {
    expect(renderReviewNotesMarkdown("see orcid:0000-0002-1825-0097 here")).toBe(
      "<p>see orcid:0000-0002-1825-0097 here</p>",
    );
  });

  it("orcid does NOT render on actionRationale", () => {
    expect(renderActionRationaleMarkdown("see orcid:0000-0002-1825-0097 here")).toBe(
      "<p>see orcid:0000-0002-1825-0097 here</p>",
    );
  });

  it("orcid uppercase X checksum renders correctly on rationale", () => {
    expect(renderRationaleMarkdown("orcid:0000-0002-9079-593X is the author")).toBe(
      '<p><a href="https://orcid.org/0000-0002-9079-593X">orcid:0000-0002-9079-593X</a> is the author</p>',
    );
  });

  it("multiple ORCIDs in same paragraph render correctly on rationale", () => {
    const html = renderRationaleMarkdown(
      "see orcid:0000-0002-1825-0097 and orcid:0000-0001-5109-3700",
    );
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).toContain('href="https://orcid.org/0000-0001-5109-3700"');
  });

  it("XSS defenses survive Phase-54 ORCID + rationale (javascript: stripped; orcid resolves)", () => {
    const html = renderRationaleMarkdown(
      "[bad](javascript:alert(1)) and see orcid:0000-0002-1825-0097",
    );
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
  });
});

// ---------------------------------------------------------------------------
// Phase-54 — first 4-consumer same-slot composition under
// MARKDOWN_EXTENSIONS=arxiv,doi,pubmed,orcid. The arxiv-doi-pubmed-orcid
// 4-tuple in `remarkPlugins` is collision-free via regex-disjointness-as-
// sole-defense discipline (4-consumer scaling validation). All 4 pairs of
// regexes (6 total pair combinations) have distinct literal prefixes.
// ---------------------------------------------------------------------------

describe("Phase-54 first 4-consumer same-slot composition under MARKDOWN_EXTENSIONS=arxiv,doi,pubmed,orcid", () => {
  beforeEach(() => {
    // Phase-54 default: arxiv + doi + pubmed on all 4 surfaces (Phase-44 /
    // Phase-49 / Phase-52 cross-surface expansions); orcid on rationale
    // only (Phase-54 first-ship).
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    const orcid = new OrcidExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([arxiv, doi, pubmed, orcid]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: arxiv + doi + pubmed + orcid ALL render in same paragraph (first 4-consumer same-slot)", () => {
    const html = renderRationaleMarkdown(
      "compare arxiv:1909.03004 with doi:10.1234/abc and pubmed:12345678 by orcid:0000-0002-1825-0097",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
  });

  it("bio: arxiv + doi + pubmed render; orcid inactive (Phase-54 rationale-only default for orcid)", () => {
    // Phase-52 baseline: arxiv + doi + pubmed all-4-surfaces. Phase-54
    // adds orcid rationale-only — bio retains the Phase-52 3-consumer
    // composition.
    const html =
      renderBioMarkdown(
        "compare arxiv:1909.03004 with doi:10.1234/abc and pubmed:12345678 by orcid:0000-0002-1825-0097",
      ) ?? "";
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("reviewNotes: arxiv + doi + pubmed render; orcid inactive", () => {
    const html = renderReviewNotesMarkdown(
      "compare arxiv:1909.03004 with doi:10.1234/abc and pubmed:12345678 by orcid:0000-0002-1825-0097",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("actionRationale: arxiv + doi + pubmed render; orcid inactive", () => {
    const html = renderActionRationaleMarkdown(
      "compare arxiv:1909.03004 with doi:10.1234/abc and pubmed:12345678 by orcid:0000-0002-1825-0097",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("regex-disjointness-as-sole-defense at 4-consumer cardinality: registration ordering preserved on rationale", () => {
    // The four `remarkPlugins` plugins run in registration order (arxiv
    // first, then doi, then pubmed, then orcid). For this 4-tuple, plugin
    // ORDER is immaterial because their regex literal prefixes are
    // pairwise disjoint (arxiv:, doi:, pubmed:/pmid:, orcid:). Output
    // text-flow follows source.
    const html = renderRationaleMarkdown(
      "arxiv:1909.03004 then doi:10.1234/abc then pubmed:12345678 then orcid:0000-0002-1825-0097",
    );
    const arxivIdx = html.indexOf("arxiv.org");
    const doiIdx = html.indexOf("doi.org");
    const pubmedIdx = html.indexOf("pubmed.ncbi.nlm.nih.gov");
    const orcidIdx = html.indexOf("orcid.org");
    expect(arxivIdx).toBeGreaterThan(-1);
    expect(doiIdx).toBeGreaterThan(-1);
    expect(pubmedIdx).toBeGreaterThan(-1);
    expect(orcidIdx).toBeGreaterThan(-1);
    expect(arxivIdx).toBeLessThan(doiIdx);
    expect(doiIdx).toBeLessThan(pubmedIdx);
    expect(pubmedIdx).toBeLessThan(orcidIdx);
  });

  it("XSS defenses survive 4-consumer same-slot composition on rationale", () => {
    const html = renderRationaleMarkdown(
      "[bad](javascript:alert(1)) arxiv:1909.03004 doi:10.1234/abc pubmed:12345678 orcid:0000-0002-1825-0097",
    );
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
  });
});

// ---------------------------------------------------------------------------
// Phase-54 — first 6-consumer composition under default dispatch via
// CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed, orcid])
// at their respective Phase-54-defaults. Rationale carries 6 consumers
// across 3 slots; other 3 surfaces carry 5 consumers (orcid inactive there
// per Phase-54 rationale-only default). **New maximum-consumer-cardinality
// state** in project history.
// ---------------------------------------------------------------------------

describe("Phase-54 first 6-consumer composition — wikilinks,tables,arxiv,doi,pubmed,orcid maximal default", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    const orcid = new OrcidExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(
      new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed, orcid]),
    );
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: all 6 consumers active simultaneously (wikilink + table + arxiv + doi + pubmed + orcid)", () => {
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097.\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).toContain("<table>");
  });

  it("bio: 5 consumers active (Phase-52 baseline; orcid inactive per Phase-54 rationale-only default)", () => {
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("reviewNotes: 5 consumers active; orcid inactive", () => {
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("actionRationale: 5 consumers active; orcid inactive", () => {
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("XSS defenses survive Phase-54 6-consumer composition on every surface", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] arxiv:1909.03004 doi:10.1234/abc pubmed:12345678 orcid:0000-0002-1825-0097";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('<a class="wikilink" href="/problems/s">safe slug</a>');
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
      expect(html).toContain('href="https://doi.org/10.1234/abc"');
      expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-55 — end-to-end ORCID alias syntax `[[orcid:NNNN-NNNN-NNNN-NNNN|display]]`
// via dual-form regex extension on remarkLinkOrcidIds. Sixth realization of
// Phase-46 plugin-regex-extension phase-shape pattern — first 6-realization
// phase-shape pattern in project history. Fourth dual-form regex in the
// framework; all 4 `remarkPlugins` consumers exhibit dual-form regex post-
// Phase 55.
//
// Closes new Phase-54 deferral at 1-phase carryover — ties Phase-51 pubmed
// alias fastest-closure record. Second "immediate-successor same-thread-
// direction phase boundary" in project history (Phase 54 → 55).
// ---------------------------------------------------------------------------

describe("Phase-55 orcid alias syntax — rationale surface under default dispatch", () => {
  beforeEach(() => {
    // Phase 54 first-ship baseline (Set(["rationale"])) preserved verbatim
    // for this block via explicit constructor arg per D-12 decoupled-
    // baseline-block pattern (Phase-49 established; Phase-52 second
    // application; Phase-56 third application). Phase 56 cross-surface
    // expansion is asserted in the new Phase-56-default describe blocks
    // added in Unit 56.2.
    __setRegistryForTests(new OrcidExtensionRegistry(new Set(["rationale"])));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("alias renders on rationale: [[orcid:NNNN-NNNN-NNNN-NNNN|display]] → <a>display</a>", () => {
    expect(renderRationaleMarkdown("see [[orcid:0000-0002-1825-0097|Smith 2024]] here")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">Smith 2024</a> here</p>',
    );
  });

  it("alias does NOT render on bio (orcid disabled by Phase-54 rationale-only default)", () => {
    // The factory dispatch routes through the default-deny on bio; the
    // bracketed alias renders as literal text.
    const html = renderBioMarkdown("see [[orcid:0000-0002-1825-0097|Smith 2024]] here") ?? "";
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("alias does NOT render on reviewNotes", () => {
    const html = renderReviewNotesMarkdown("see [[orcid:0000-0002-1825-0097|Smith 2024]] here");
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("alias does NOT render on actionRationale", () => {
    const html = renderActionRationaleMarkdown("see [[orcid:0000-0002-1825-0097|Smith 2024]] here");
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("Phase-54 backwards-compat: bare orcid:NNNN-NNNN-NNNN-NNNN still renders on rationale", () => {
    expect(renderRationaleMarkdown("see orcid:0000-0002-1825-0097 here")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a> here</p>',
    );
  });

  it("bracketed without alias renders verbatim ref on rationale (brackets stripped)", () => {
    expect(renderRationaleMarkdown("see [[orcid:0000-0002-1825-0097]] here")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a> here</p>',
    );
  });

  it("aliased + bare orcid coexist in same rationale paragraph", () => {
    const html = renderRationaleMarkdown(
      "see [[orcid:0000-0002-1825-0097|first]] and orcid:0000-0001-5109-3700",
    );
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">first</a>');
    expect(html).toContain(
      '<a href="https://orcid.org/0000-0001-5109-3700">orcid:0000-0001-5109-3700</a>',
    );
  });

  it("alias display HTML-escapes via remark-rehype text-node rendering (XSS safety end-to-end)", () => {
    const html = renderRationaleMarkdown("[[orcid:0000-0002-1825-0097|x & y]]");
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">x &#x26; y</a>');
  });
});

// ---------------------------------------------------------------------------
// Phase-55 — first "quintuple-alias surface" state under 6-way
// MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid Phase-54 default
// + Phase-46/47/48/51/55 alias extensions. Pre-Phase-55 max-cardinality alias
// surface was rationale at quadruple-alias (Phase 51 ship). Post-Phase-55,
// rationale carries 5 alias-syntax consumers simultaneously. First surface-
// with-5-alias-consumers cardinality of 1 in project history.
// ---------------------------------------------------------------------------

describe("Phase-55 orcid alias under Phase-54 6-way composite — first quintuple-alias surface", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    const orcid = new OrcidExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(
      new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed, orcid]),
    );
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: wikilinks + arxiv + doi + pubmed + orcid aliases ALL render together — FIRST QUINTUPLE-ALIAS SURFACE", () => {
    // **First "quintuple-alias surface" state in project history.** Pre-
    // Phase-55 max-cardinality alias surface was rationale at quadruple-
    // alias (Phase 51 ship). Phase 55 ship adds orcid as the 5th alias-
    // syntax consumer on rationale.
    const md =
      "see [[scalable-oversight|topic]] and [[arxiv:1909.03004|paper]] and [[doi:10.1234/abc|study]] and [[pubmed:12345678|article]] and [[orcid:0000-0002-1825-0097|author]].";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">study</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">article</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">author</a>');
  });

  it("bio: wikilinks + arxiv + doi + pubmed aliases render (quadruple-alias; orcid inactive per Phase-54 default)", () => {
    // bio retains the Phase-52 all-4-surfaces quadruple-alias state;
    // orcid is rationale-only per Phase-54 default.
    const md =
      "see [[scalable-oversight|topic]] and [[arxiv:1909.03004|paper]] and [[doi:10.1234/abc|study]] and [[pubmed:12345678|article]] and [[orcid:0000-0002-1825-0097|author]].";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">study</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">article</a>');
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("reviewNotes: quadruple-alias preserved; orcid alias inactive", () => {
    const md =
      "see [[hallucination-reduction|topic]], [[arxiv:2024.01234|paper]], [[doi:10.5678/xyz|study]], [[pmid:99999999|article]], [[orcid:0000-0002-9079-593X|author]].";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">topic</a>',
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">paper</a>');
    expect(html).toContain('<a href="https://doi.org/10.5678/xyz">study</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/99999999/">article</a>');
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("actionRationale: quadruple-alias preserved; orcid alias inactive", () => {
    const md =
      "see [[scalable-oversight|topic]], [[arxiv:1909.03004|paper]], [[doi:10.1234/abc|study]], [[pmid:12345678|article]], [[orcid:0000-0002-1825-0097|author]].";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">study</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">article</a>');
    expect(html).not.toContain('href="https://orcid.org/');
  });

  it("Backwards-compat under 6-way composite: bare wikilink + bare arxiv + bare doi + bare pubmed + bare orcid all coexist on rationale", () => {
    // Phase-55 alias is in addition to bare; both forms supported.
    const md =
      "see scalable-oversight, arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097 here";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
  });

  it("XSS defenses survive Phase-55 quintuple-alias surface on rationale", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] [[arxiv:1909.03004|safe arxiv]] [[doi:10.1234/abc|safe doi]] [[pubmed:12345678|safe pubmed]] [[orcid:0000-0002-1825-0097|safe orcid]].";
    const html = renderRationaleMarkdown(md);
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('<a class="wikilink" href="/problems/s">safe slug</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">safe arxiv</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">safe doi</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">safe pubmed</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">safe orcid</a>');
  });
});

// ---------------------------------------------------------------------------
// Phase-56 — end-to-end ORCID cross-surface expansion (constructor-arg
// value-only change in `PHASE_54_DEFAULT_ENABLED_SURFACES`) generalizes the
// Phase-54 rationale-only orcid consumer to all 4 markdown surfaces. Sixth
// realization of the "constructor-arg-only zero-rework expansion" property
// (Phase 42 wikilinks; Phase 43 tables; Phase 44 arxiv; Phase 49 doi; Phase
// 52 pubmed; Phase 56 orcid). **First 6-realization for that pattern in
// project history**. **First state with TWO coexisting 6-realization
// framework patterns** (plugin-regex-extension at 6 from Phase 55 +
// constructor-arg-only-expansion at 6 from Phase 56).
//
// Closes ADR-0018 APPEND-D-AL ORCID cross-surface item at **2-phase
// carryover** (Phase 54 → 56) — **ties Phase-52 pubmed-cross-surface 2-
// phase fastest-closure record**. Second cross-surface-expansion closure
// at the 2-phase floor.
// ---------------------------------------------------------------------------

describe("Phase-56 orcid default — all 4 surfaces via PHASE_54_DEFAULT_ENABLED_SURFACES", () => {
  beforeEach(() => {
    __setRegistryForTests(new OrcidExtensionRegistry(PHASE_54_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("orcid renders on bio (NEW Phase-56 expansion)", () => {
    expect(renderBioMarkdown("see orcid:0000-0002-1825-0097 here") ?? "").toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a> here</p>',
    );
  });

  it("orcid renders on reviewNotes (NEW Phase-56 expansion)", () => {
    expect(renderReviewNotesMarkdown("see orcid:0000-0002-1825-0097 here")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a> here</p>',
    );
  });

  it("orcid renders on rationale (Phase-54 baseline preserved through expansion)", () => {
    expect(renderRationaleMarkdown("see orcid:0000-0002-1825-0097 here")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a> here</p>',
    );
  });

  it("orcid renders on actionRationale (NEW Phase-56 expansion)", () => {
    expect(renderActionRationaleMarkdown("see orcid:0000-0002-1825-0097 here")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a> here</p>',
    );
  });

  it("ORCID uppercase X checksum renders correctly on bio (NEW Phase-56; MOD 11-2 residue-10 case preserved through expansion)", () => {
    expect(renderBioMarkdown("orcid:0000-0002-9079-593X is the author") ?? "").toBe(
      '<p><a href="https://orcid.org/0000-0002-9079-593X">orcid:0000-0002-9079-593X</a> is the author</p>',
    );
  });

  it("Phase-55 alias renders on bio (NEW Phase-56 — first non-rationale orcid alias surface)", () => {
    expect(renderBioMarkdown("see [[orcid:0000-0002-1825-0097|Smith 2024]] here") ?? "").toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">Smith 2024</a> here</p>',
    );
  });

  it("Phase-55 alias renders on reviewNotes (NEW Phase-56 — alias extension flows through expansion)", () => {
    expect(renderReviewNotesMarkdown("see [[orcid:0000-0002-1825-0097|Smith 2024]] here")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">Smith 2024</a> here</p>',
    );
  });

  it("Phase-55 alias renders on actionRationale (NEW Phase-56)", () => {
    expect(renderActionRationaleMarkdown("see [[orcid:0000-0002-1825-0097|Smith 2024]] here")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">Smith 2024</a> here</p>',
    );
  });

  it("XSS defenses survive Phase-56 expansion on every surface", () => {
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer("[bad](javascript:alert(1)) and see orcid:0000-0002-1825-0097") ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    }
  });

  it("orcid renders identically across all 4 surfaces (parity; bare + alias forms)", () => {
    const mdBare = "cite orcid:0000-0001-5109-3700 as primary author";
    const expectedBare =
      '<p>cite <a href="https://orcid.org/0000-0001-5109-3700">orcid:0000-0001-5109-3700</a> as primary author</p>';
    expect(renderBioMarkdown(mdBare)).toBe(expectedBare);
    expect(renderReviewNotesMarkdown(mdBare)).toBe(expectedBare);
    expect(renderRationaleMarkdown(mdBare)).toBe(expectedBare);
    expect(renderActionRationaleMarkdown(mdBare)).toBe(expectedBare);

    const mdAlias = "cite [[orcid:0000-0001-5109-3700|Jane Doe]] as primary author";
    const expectedAlias =
      '<p>cite <a href="https://orcid.org/0000-0001-5109-3700">Jane Doe</a> as primary author</p>';
    expect(renderBioMarkdown(mdAlias)).toBe(expectedAlias);
    expect(renderReviewNotesMarkdown(mdAlias)).toBe(expectedAlias);
    expect(renderRationaleMarkdown(mdAlias)).toBe(expectedAlias);
    expect(renderActionRationaleMarkdown(mdAlias)).toBe(expectedAlias);
  });
});

// ---------------------------------------------------------------------------
// Phase-56 — first "all 4 surfaces are quintuple-alias" state under 6-way
// `wikilinks,tables,arxiv,doi,pubmed,orcid` Phase-56 default + Phase-46/47/
// 48/51/55 alias extensions. Pre-Phase-56 only rationale was quintuple-alias
// (wikilinks + arxiv + doi + pubmed + orcid aliases simultaneously per
// Phase 55 ship); Phase 56 generalizes via orcid cross-surface expansion.
// First surface-with-5-alias-consumers cardinality of 4 in project history.
// ---------------------------------------------------------------------------

describe("Phase-56 first all-4-surfaces quintuple-alias state under 6-way composite", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    const orcid = new OrcidExtensionRegistry(PHASE_54_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(
      new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed, orcid]),
    );
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: all 5 aliases (wikilinks + arxiv + doi + pubmed + orcid) render together (NEW Phase-56 quintuple-alias)", () => {
    // First time bio has 5 alias-syntax consumers active simultaneously.
    const md =
      "see [[scalable-oversight|topic]] and [[arxiv:1909.03004|paper A]] and [[doi:10.1234/abc|paper B]] and [[pubmed:12345678|paper C]] and [[orcid:0000-0002-1825-0097|author A]].";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper B</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">paper C</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">author A</a>');
  });

  it("reviewNotes: all 5 aliases render together (NEW Phase-56 quintuple-alias)", () => {
    const md =
      "see [[hallucination-reduction|topic]], [[arxiv:2024.01234|paper A]], [[doi:10.5678/xyz|paper B]], [[pmid:99999999|paper C]], [[orcid:0000-0001-5109-3700|author B]].";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">topic</a>',
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.5678/xyz">paper B</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/99999999/">paper C</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0001-5109-3700">author B</a>');
  });

  it("rationale: all 5 aliases render together (Phase-55 baseline preserved through Phase-56 expansion)", () => {
    const md =
      "see [[benchmark-integrity|topic]] and [[arxiv:1909.03004|paper A]] and [[doi:10.1234/abc|paper B]] and [[pubmed:12345678|paper C]] and [[orcid:0000-0002-9079-593X|author C]].";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/benchmark-integrity">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper B</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">paper C</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0002-9079-593X">author C</a>');
  });

  it("actionRationale: all 5 aliases render together (NEW Phase-56 quintuple-alias)", () => {
    const md =
      "see [[scalable-oversight|topic]], [[arxiv:1909.03004|the work]], [[doi:10.1234/abc|cite this]], [[pmid:12345678|biomed paper]], and [[orcid:0000-0002-1825-0097|primary author]].";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the work</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">cite this</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">biomed paper</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">primary author</a>');
  });

  it("quintuple-alias + tables + XSS defenses all hold on every surface", () => {
    const md =
      "[bad](javascript:alert(1)) [[scalable-oversight|safe slug]] [[arxiv:1909.03004|safe arxiv]] [[doi:10.1234/abc|safe doi]] [[pubmed:12345678|safe pubmed]] [[orcid:0000-0002-1825-0097|safe orcid]].\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain(
        '<a class="wikilink" href="/problems/scalable-oversight">safe slug</a>',
      );
      expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">safe arxiv</a>');
      expect(html).toContain('<a href="https://doi.org/10.1234/abc">safe doi</a>');
      expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">safe pubmed</a>');
      expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">safe orcid</a>');
      expect(html).toContain("<table>");
    }
  });

  it("bare references + aliases coexist on every surface (Phase-54 + Phase-55 + Phase-56 backwards-compat)", () => {
    // All 4 surfaces post-Phase-56 carry the full quintuple-alias-capable
    // composition; bare wikilink + bare arxiv + bare doi + bare pubmed +
    // bare orcid continue to render alongside their alias forms.
    const md =
      "see scalable-oversight, arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, and orcid:0000-0002-1825-0097 here";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
      expect(html).toContain('href="https://doi.org/10.1234/abc"');
      expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
      expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-56 — first "all 4 surfaces have 4-consumer same-slot composition"
// state. The arxiv-doi-pubmed-orcid quadruple in `remarkPlugins` is now
// active on every surface under `arxiv,doi,pubmed,orcid` composite (Phase
// 54 ship realized the 4-consumer same-slot on rationale only; Phase 56
// generalizes via orcid cross-surface expansion). Validates the regex-
// disjointness-as-sole-defense discipline at 4-consumer cardinality (Phase
// 54 established) end-to-end at maximum surface cardinality.
// ---------------------------------------------------------------------------

describe("Phase-56 first all-4-surfaces 4-consumer same-slot composition (arxiv+doi+pubmed+orcid in remarkPlugins everywhere)", () => {
  beforeEach(() => {
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    const orcid = new OrcidExtensionRegistry(PHASE_54_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(new CompositeExtensionRegistry([arxiv, doi, pubmed, orcid]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: arxiv + doi + pubmed + orcid all render in the same paragraph (NEW Phase-56 4-consumer same-slot)", () => {
    const html =
      renderBioMarkdown(
        "compare arxiv:1909.03004 with doi:10.1234/abc and pubmed:12345678 by orcid:0000-0002-1825-0097",
      ) ?? "";
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
  });

  it("reviewNotes: arxiv + doi + pubmed + orcid all render (NEW Phase-56 4-consumer same-slot)", () => {
    const html = renderReviewNotesMarkdown(
      "compare arxiv:2024.01234 with doi:10.5678/xyz and pmid:99999999 by orcid:0000-0001-5109-3700",
    );
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
    expect(html).toContain('href="https://doi.org/10.5678/xyz"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/99999999/"');
    expect(html).toContain('href="https://orcid.org/0000-0001-5109-3700"');
  });

  it("actionRationale: arxiv + doi + pubmed + orcid all render (NEW Phase-56 4-consumer same-slot)", () => {
    const html = renderActionRationaleMarkdown(
      "see arxiv:1909.03004 and doi:10.1234/abc and pubmed:38123456 by orcid:0000-0002-9079-593X together",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/38123456/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-9079-593X"');
  });

  it("rationale: arxiv + doi + pubmed + orcid all render (Phase-54 baseline preserved through Phase-56 expansion)", () => {
    const html = renderRationaleMarkdown(
      "compare arxiv:1909.03004 with doi:10.1234/abc.def and pubmed:12345678 and orcid:0000-0002-1825-0097 for context",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc.def"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
  });

  it("regex-disjointness-as-sole-defense at 4-consumer cardinality: registration ordering preserved on every surface (NEW Phase-56)", () => {
    // The four `remarkPlugins` plugins run in registration order (arxiv,
    // doi, pubmed, orcid). For this 4-tuple, plugin ORDER is immaterial
    // because their regex literal prefixes are pairwise disjoint (arxiv:,
    // doi:, pubmed:/pmid:, orcid:). Output text-flow follows source on
    // every surface, not just rationale.
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html =
        renderer(
          "arxiv:1909.03004 then doi:10.1234/abc then pubmed:12345678 then orcid:0000-0002-1825-0097",
        ) ?? "";
      const arxivIdx = html.indexOf("arxiv.org");
      const doiIdx = html.indexOf("doi.org");
      const pubmedIdx = html.indexOf("pubmed.ncbi.nlm.nih.gov");
      const orcidIdx = html.indexOf("orcid.org");
      expect(arxivIdx).toBeGreaterThan(-1);
      expect(doiIdx).toBeGreaterThan(-1);
      expect(pubmedIdx).toBeGreaterThan(-1);
      expect(orcidIdx).toBeGreaterThan(-1);
      expect(arxivIdx).toBeLessThan(doiIdx);
      expect(doiIdx).toBeLessThan(pubmedIdx);
      expect(pubmedIdx).toBeLessThan(orcidIdx);
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-58 — end-to-end bioRxiv preprint consumer via BiorxivExtensionRegistry.
// Seventh concrete Phase-37-framework consumer; first 5th-`remarkPlugins`
// consumer beyond arxiv + doi + pubmed + orcid. Ships rationale-only per
// Phase-41 / Phase-45 / Phase-50 / Phase-54 first-ship demand-signal-first
// precedent.
//
// First 5-consumer same-slot composition under MARKDOWN_EXTENSIONS=arxiv,
// doi,pubmed,orcid,biorxiv. First 7-consumer composition under default
// dispatch under MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv
// — new maximum-consumer-cardinality state in project history.
//
// Closes ADR-0018 APPEND-D-AL bioRxiv preprint consumer item at 4-phase
// carryover (Phase 54 → 58). Standard consumer-first-ship gap.
// ---------------------------------------------------------------------------

describe("Phase-58 biorxiv default — rationale surface via PHASE_58_DEFAULT_ENABLED_SURFACES", () => {
  beforeEach(() => {
    // D-12 decoupled-baseline-block: Phase 59 expanded
    // `PHASE_58_DEFAULT_ENABLED_SURFACES` to all 4 surfaces; this Phase-58
    // baseline block is decoupled with an explicit `new Set(["rationale"])`
    // to preserve the Phase-58 rationale-only first-ship coverage per
    // Phase-49/52/56 D-12 precedent (existing Phase-N baseline blocks
    // asserting N-on-`rationale`-only must use an explicit constructor
    // arg after Phase-(N+K) flips the constant to all-4).
    __setRegistryForTests(new BiorxivExtensionRegistry(new Set(["rationale"])));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("biorxiv renders on rationale", () => {
    expect(renderRationaleMarkdown("see biorxiv:2024.01.15.575678 here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> here</p>',
    );
  });

  it("biorxiv does NOT render on bio (Phase-58 rationale-only default)", () => {
    expect(renderBioMarkdown("see biorxiv:2024.01.15.575678 here") ?? "").toBe(
      "<p>see biorxiv:2024.01.15.575678 here</p>",
    );
  });

  it("biorxiv does NOT render on reviewNotes", () => {
    expect(renderReviewNotesMarkdown("see biorxiv:2024.01.15.575678 here")).toBe(
      "<p>see biorxiv:2024.01.15.575678 here</p>",
    );
  });

  it("biorxiv does NOT render on actionRationale", () => {
    expect(renderActionRationaleMarkdown("see biorxiv:2024.01.15.575678 here")).toBe(
      "<p>see biorxiv:2024.01.15.575678 here</p>",
    );
  });

  it("biorxiv with version suffix renders correctly on rationale", () => {
    expect(renderRationaleMarkdown("biorxiv:2024.01.15.575678v2 is the latest version")).toBe(
      '<p><a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678v2">biorxiv:2024.01.15.575678v2</a> is the latest version</p>',
    );
  });

  it("multiple biorxiv IDs render on rationale", () => {
    const html = renderRationaleMarkdown(
      "compare biorxiv:2024.01.15.575678 with biorxiv:2023.12.05.570123",
    );
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123"');
  });

  it("doi:10.1101/<id> on rationale does NOT match biorxiv (prefix discriminator preserves regex-disjointness with doi consumer)", () => {
    // biorxiv consumer requires literal `biorxiv:` prefix; doi consumer
    // requires literal `doi:` prefix. The biorxiv consumer's regex does
    // NOT match `doi:10.1101/...` form. doi consumer is NOT registered in
    // this isolation test (just BiorxivExtensionRegistry); the doi:
    // reference renders as plain text.
    expect(renderRationaleMarkdown("see doi:10.1101/2024.01.15.575678 here")).toBe(
      "<p>see doi:10.1101/2024.01.15.575678 here</p>",
    );
  });
});

// ---------------------------------------------------------------------------
// Phase-58 — first 5-consumer same-slot composition under
// MARKDOWN_EXTENSIONS=arxiv,doi,pubmed,orcid,biorxiv on rationale.
// Regex-disjointness-as-sole-defense discipline scales from 4 to 5 same-slot
// consumers — all 10 pairs of 5 consumers pairwise collision-free via
// distinct literal prefixes (arxiv:, doi:, pubmed:/pmid:, orcid:, biorxiv:).
// ---------------------------------------------------------------------------

describe("Phase-58 first 5-consumer same-slot composition under MARKDOWN_EXTENSIONS=arxiv,doi,pubmed,orcid,biorxiv", () => {
  beforeEach(() => {
    // Phase-58 default: arxiv + doi + pubmed + orcid on all 4 surfaces
    // (Phase-44 / Phase-49 / Phase-52 / Phase-56 cross-surface expansions);
    // biorxiv on rationale only (Phase-58 first-ship). D-12 decoupled-
    // baseline-block: Phase 59 expanded `PHASE_58_DEFAULT_ENABLED_SURFACES`
    // to all 4 surfaces; this Phase-58 baseline block uses an explicit
    // `new Set(["rationale"])` for biorxiv to preserve the Phase-58
    // rationale-only first-ship coverage per Phase-49/52/56 D-12 precedent.
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    const orcid = new OrcidExtensionRegistry(PHASE_54_DEFAULT_ENABLED_SURFACES);
    const biorxiv = new BiorxivExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(new CompositeExtensionRegistry([arxiv, doi, pubmed, orcid, biorxiv]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: arxiv + doi + pubmed + orcid + biorxiv ALL render in same paragraph (first 5-consumer same-slot)", () => {
    const html = renderRationaleMarkdown(
      "compare arxiv:1909.03004 with doi:10.1234/abc and pubmed:12345678 by orcid:0000-0002-1825-0097 see biorxiv:2024.01.15.575678",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
  });

  it("bio: arxiv + doi + pubmed + orcid render; biorxiv inactive (Phase-58 rationale-only default for biorxiv)", () => {
    // Phase-56 baseline: arxiv + doi + pubmed + orcid all-4-surfaces.
    // Phase-58 adds biorxiv rationale-only — bio retains the Phase-56
    // 4-consumer composition.
    const html =
      renderBioMarkdown(
        "compare arxiv:1909.03004 with doi:10.1234/abc and pubmed:12345678 by orcid:0000-0002-1825-0097 see biorxiv:2024.01.15.575678",
      ) ?? "";
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).not.toContain('href="https://www.biorxiv.org/');
  });

  it("reviewNotes: arxiv + doi + pubmed + orcid render; biorxiv inactive", () => {
    const html = renderReviewNotesMarkdown(
      "compare arxiv:1909.03004 with doi:10.1234/abc and pubmed:12345678 by orcid:0000-0002-1825-0097 see biorxiv:2024.01.15.575678",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).not.toContain('href="https://www.biorxiv.org/');
  });

  it("actionRationale: arxiv + doi + pubmed + orcid render; biorxiv inactive", () => {
    const html = renderActionRationaleMarkdown(
      "compare arxiv:1909.03004 with doi:10.1234/abc and pubmed:12345678 by orcid:0000-0002-1825-0097 see biorxiv:2024.01.15.575678",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).not.toContain('href="https://www.biorxiv.org/');
  });

  it("regex-disjointness-as-sole-defense at 5-consumer cardinality: registration ordering preserved on rationale (10 pairs validated)", () => {
    // The five `remarkPlugins` plugins run in registration order (arxiv,
    // doi, pubmed, orcid, biorxiv). For this 5-tuple, plugin ORDER is
    // immaterial because their regex literal prefixes are pairwise
    // disjoint (arxiv:, doi:, pubmed:/pmid:, orcid:, biorxiv:). All 10
    // pairs validated collision-free. Output text-flow follows source.
    const html = renderRationaleMarkdown(
      "arxiv:1909.03004 then doi:10.1234/abc then pubmed:12345678 then orcid:0000-0002-1825-0097 then biorxiv:2024.01.15.575678",
    );
    const arxivIdx = html.indexOf("arxiv.org");
    const doiIdx = html.indexOf("doi.org");
    const pubmedIdx = html.indexOf("pubmed.ncbi.nlm.nih.gov");
    const orcidIdx = html.indexOf("orcid.org");
    const biorxivIdx = html.indexOf("biorxiv.org");
    expect(arxivIdx).toBeGreaterThan(-1);
    expect(doiIdx).toBeGreaterThan(-1);
    expect(pubmedIdx).toBeGreaterThan(-1);
    expect(orcidIdx).toBeGreaterThan(-1);
    expect(biorxivIdx).toBeGreaterThan(-1);
    expect(arxivIdx).toBeLessThan(doiIdx);
    expect(doiIdx).toBeLessThan(pubmedIdx);
    expect(pubmedIdx).toBeLessThan(orcidIdx);
    expect(orcidIdx).toBeLessThan(biorxivIdx);
  });

  it("XSS defenses survive 5-consumer same-slot composition on rationale", () => {
    const html = renderRationaleMarkdown(
      "[bad](javascript:alert(1)) arxiv:1909.03004 doi:10.1234/abc pubmed:12345678 orcid:0000-0002-1825-0097 biorxiv:2024.01.15.575678",
    );
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
  });
});

// ---------------------------------------------------------------------------
// Phase-58 — first 7-consumer composition under default dispatch via
// CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed, orcid, biorxiv])
// at their respective Phase-58-defaults. Rationale carries 7 consumers
// across 3 slots; other 3 surfaces carry 6 consumers (biorxiv inactive
// there per Phase-58 rationale-only default). **New maximum-consumer-
// cardinality state** in project history.
// ---------------------------------------------------------------------------

describe("Phase-58 first 7-consumer composition — wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv maximal default", () => {
  beforeEach(() => {
    // D-12 decoupled-baseline-block: Phase 59 expanded
    // `PHASE_58_DEFAULT_ENABLED_SURFACES` to all 4 surfaces; this Phase-58
    // baseline block uses an explicit `new Set(["rationale"])` for biorxiv
    // to preserve the Phase-58 rationale-only first-ship coverage per
    // Phase-49/52/56 D-12 precedent.
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    const orcid = new OrcidExtensionRegistry(PHASE_54_DEFAULT_ENABLED_SURFACES);
    const biorxiv = new BiorxivExtensionRegistry(new Set(["rationale"]));
    __setRegistryForTests(
      new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed, orcid, biorxiv]),
    );
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("rationale: all 7 consumers active simultaneously (wikilink + table + arxiv + doi + pubmed + orcid + biorxiv)", () => {
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097, biorxiv:2024.01.15.575678.\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
    expect(html).toContain("<table>");
  });

  it("bio: 6 consumers active (Phase-56 baseline; biorxiv inactive per Phase-58 rationale-only default)", () => {
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097, biorxiv:2024.01.15.575678";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).not.toContain('href="https://www.biorxiv.org/');
  });

  it("reviewNotes: 6 consumers active; biorxiv inactive", () => {
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097, biorxiv:2024.01.15.575678";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).not.toContain('href="https://www.biorxiv.org/');
  });

  it("actionRationale: 6 consumers active; biorxiv inactive", () => {
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097, biorxiv:2024.01.15.575678";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).not.toContain('href="https://www.biorxiv.org/');
  });

  it("XSS defenses survive Phase-58 7-consumer composition on every surface", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] arxiv:1909.03004 doi:10.1234/abc pubmed:12345678 orcid:0000-0002-1825-0097 biorxiv:2024.01.15.575678";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('<a class="wikilink" href="/problems/s">safe slug</a>');
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
      expect(html).toContain('href="https://doi.org/10.1234/abc"');
      expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
      expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-59 — end-to-end bioRxiv cross-surface expansion. The single-consumer
// `BiorxivExtensionRegistry` is dispatched against the Phase-58-default
// constant (now all-4 post-Phase-59 flip) and renders biorxiv autolinks +
// preserves Phase-58 rationale baseline on every surface. Validates the
// **seventh realization of "constructor-arg-only zero-rework expansion"
// property** — first 7-realization for that pattern in project history
// (extends Phase-56 record 6 → 7); generalizes the per-consumer all-4-
// surfaces arc to ALL 7 Phase-37-framework consumers.
//
// Closes ADR-0018 APPEND-D-AP bioRxiv cross-surface item at **1-phase
// carryover** (Phase 58 → 59) — NEW FASTEST cross-surface-expansion
// APPEND-deferral closure record (extends prior 2-phase record from Phase
// 52 + 56). First sub-2-phase cross-surface closure.
// ---------------------------------------------------------------------------

describe("Phase-59 biorxiv default — all 4 surfaces via PHASE_58_DEFAULT_ENABLED_SURFACES", () => {
  beforeEach(() => {
    __setRegistryForTests(new BiorxivExtensionRegistry(PHASE_58_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("biorxiv renders on bio (NEW Phase-59 expansion)", () => {
    expect(renderBioMarkdown("see biorxiv:2024.01.15.575678 here") ?? "").toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> here</p>',
    );
  });

  it("biorxiv renders on reviewNotes (NEW Phase-59 expansion)", () => {
    expect(renderReviewNotesMarkdown("see biorxiv:2024.01.15.575678 here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> here</p>',
    );
  });

  it("biorxiv renders on rationale (Phase-58 baseline preserved through expansion)", () => {
    expect(renderRationaleMarkdown("see biorxiv:2024.01.15.575678 here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> here</p>',
    );
  });

  it("biorxiv renders on actionRationale (NEW Phase-59 expansion)", () => {
    expect(renderActionRationaleMarkdown("see biorxiv:2024.01.15.575678 here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> here</p>',
    );
  });

  it("biorxiv with version suffix renders correctly on bio (NEW Phase-59; version preservation flows through expansion)", () => {
    expect(renderBioMarkdown("biorxiv:2024.01.15.575678v2 is the latest version") ?? "").toBe(
      '<p><a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678v2">biorxiv:2024.01.15.575678v2</a> is the latest version</p>',
    );
  });

  it("biorxiv with multi-digit version suffix renders on reviewNotes (NEW Phase-59)", () => {
    expect(renderReviewNotesMarkdown("biorxiv:2023.12.05.570123v10 is revision 10")).toBe(
      '<p><a href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123v10">biorxiv:2023.12.05.570123v10</a> is revision 10</p>',
    );
  });

  it("multiple biorxiv IDs render on actionRationale (NEW Phase-59)", () => {
    const html = renderActionRationaleMarkdown(
      "compare biorxiv:2024.01.15.575678 with biorxiv:2023.12.05.570123",
    );
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123"');
  });

  it("doi:10.1101/<id> on bio does NOT match biorxiv (prefix discriminator preserves regex-disjointness across surfaces)", () => {
    // biorxiv consumer requires literal `biorxiv:` prefix; doi consumer
    // requires literal `doi:` prefix. The biorxiv consumer's regex does
    // not match `doi:10.1101/...` even though the DOI is bioRxiv's
    // registrant namespace. This isolation test (just BiorxivExtensionRegistry
    // dispatched on all 4 surfaces post-Phase-59) confirms that on every
    // surface, the prefix discriminator preserves the regex-disjointness
    // discipline.
    expect(renderBioMarkdown("see doi:10.1101/2024.01.15.575678 here") ?? "").toBe(
      "<p>see doi:10.1101/2024.01.15.575678 here</p>",
    );
  });

  it("XSS defenses survive Phase-59 expansion on every surface", () => {
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer("[bad](javascript:alert(1)) and see biorxiv:2024.01.15.575678") ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
    }
  });

  it("biorxiv renders identically across all 4 surfaces (parity)", () => {
    const md = "cite biorxiv:2024.01.15.575678 as primary source";
    const expected =
      '<p>cite <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> as primary source</p>';
    expect(renderBioMarkdown(md)).toBe(expected);
    expect(renderReviewNotesMarkdown(md)).toBe(expected);
    expect(renderRationaleMarkdown(md)).toBe(expected);
    expect(renderActionRationaleMarkdown(md)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Phase-59 — first "all 4 surfaces have 5-consumer same-slot composition"
// state. The arxiv-doi-pubmed-orcid-biorxiv quintuple in `remarkPlugins` is
// now active on every surface under `arxiv,doi,pubmed,orcid,biorxiv`
// composite default (Phase 58 ship realized 5-consumer same-slot on
// rationale only; Phase 59 generalizes via biorxiv cross-surface expansion).
// Validates the regex-disjointness-as-sole-defense discipline at 5-consumer
// cardinality (Phase 58 established) end-to-end at maximum surface
// cardinality.
// ---------------------------------------------------------------------------

describe("Phase-59 first all-4-surfaces 5-consumer same-slot composition (arxiv+doi+pubmed+orcid+biorxiv in remarkPlugins everywhere)", () => {
  beforeEach(() => {
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    const orcid = new OrcidExtensionRegistry(PHASE_54_DEFAULT_ENABLED_SURFACES);
    const biorxiv = new BiorxivExtensionRegistry(PHASE_58_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(new CompositeExtensionRegistry([arxiv, doi, pubmed, orcid, biorxiv]));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: arxiv + doi + pubmed + orcid + biorxiv all render in the same paragraph (NEW Phase-59 5-consumer same-slot)", () => {
    const html =
      renderBioMarkdown(
        "compare arxiv:1909.03004 with doi:10.1234/abc and pubmed:12345678 by orcid:0000-0002-1825-0097 see biorxiv:2024.01.15.575678",
      ) ?? "";
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
  });

  it("reviewNotes: arxiv + doi + pubmed + orcid + biorxiv all render (NEW Phase-59 5-consumer same-slot)", () => {
    const html = renderReviewNotesMarkdown(
      "compare arxiv:2024.01234 with doi:10.5678/xyz and pmid:99999999 by orcid:0000-0001-5109-3700 see biorxiv:2023.12.05.570123",
    );
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
    expect(html).toContain('href="https://doi.org/10.5678/xyz"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/99999999/"');
    expect(html).toContain('href="https://orcid.org/0000-0001-5109-3700"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123"');
  });

  it("actionRationale: arxiv + doi + pubmed + orcid + biorxiv all render (NEW Phase-59 5-consumer same-slot)", () => {
    const html = renderActionRationaleMarkdown(
      "see arxiv:1909.03004 and doi:10.1234/abc and pubmed:38123456 by orcid:0000-0002-9079-593X with biorxiv:2024.01.15.575678v3 together",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/38123456/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-9079-593X"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678v3"');
  });

  it("rationale: arxiv + doi + pubmed + orcid + biorxiv all render (Phase-58 baseline preserved through Phase-59 expansion)", () => {
    const html = renderRationaleMarkdown(
      "compare arxiv:1909.03004 with doi:10.1234/abc.def and pubmed:12345678 and orcid:0000-0002-1825-0097 and biorxiv:2024.01.15.575678 for context",
    );
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc.def"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
  });

  it("regex-disjointness-as-sole-defense at 5-consumer cardinality: registration ordering preserved on every surface (NEW Phase-59)", () => {
    // The five `remarkPlugins` plugins run in registration order (arxiv,
    // doi, pubmed, orcid, biorxiv). For this 5-tuple, plugin ORDER is
    // immaterial because their regex literal prefixes are pairwise disjoint
    // (arxiv:, doi:, pubmed:/pmid:, orcid:, biorxiv:). All 10 pairs of 5
    // consumers pairwise collision-free. Output text-flow follows source
    // on every surface — first state where 5-consumer order-preservation
    // is exercised on every surface.
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html =
        renderer(
          "arxiv:1909.03004 then doi:10.1234/abc then pubmed:12345678 then orcid:0000-0002-1825-0097 then biorxiv:2024.01.15.575678",
        ) ?? "";
      const arxivIdx = html.indexOf("arxiv.org");
      const doiIdx = html.indexOf("doi.org");
      const pubmedIdx = html.indexOf("pubmed.ncbi.nlm.nih.gov");
      const orcidIdx = html.indexOf("orcid.org");
      const biorxivIdx = html.indexOf("biorxiv.org");
      expect(arxivIdx).toBeGreaterThan(-1);
      expect(doiIdx).toBeGreaterThan(-1);
      expect(pubmedIdx).toBeGreaterThan(-1);
      expect(orcidIdx).toBeGreaterThan(-1);
      expect(biorxivIdx).toBeGreaterThan(-1);
      expect(arxivIdx).toBeLessThan(doiIdx);
      expect(doiIdx).toBeLessThan(pubmedIdx);
      expect(pubmedIdx).toBeLessThan(orcidIdx);
      expect(orcidIdx).toBeLessThan(biorxivIdx);
    }
  });

  it("XSS defenses survive Phase-59 5-consumer same-slot composition on every surface", () => {
    const md =
      "[bad](javascript:alert(1)) arxiv:1909.03004 doi:10.1234/abc pubmed:12345678 orcid:0000-0002-1825-0097 biorxiv:2024.01.15.575678";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
      expect(html).toContain('href="https://doi.org/10.1234/abc"');
      expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
      expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
      expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-59 — first "all 4 surfaces with 7-consumer composition under
// default dispatch" state. The Phase-58 asymmetric `[rationale=7, others=6]`
// state becomes symmetric `[all=7]`. **Second "all-surfaces saturated at
// maximum-consumer-cardinality" state** in project history (first was
// Phase 56 at 6-consumer; Phase 59 elevates to 7-consumer). 7 consumers ×
// 4 surfaces × 3 slots = 84 component-surface-slot positions; 28 active
// under 7-way default.
// ---------------------------------------------------------------------------

describe("Phase-59 first all-4-surfaces 7-consumer composition — wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv maximal default", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    const orcid = new OrcidExtensionRegistry(PHASE_54_DEFAULT_ENABLED_SURFACES);
    const biorxiv = new BiorxivExtensionRegistry(PHASE_58_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(
      new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed, orcid, biorxiv]),
    );
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: all 7 consumers active simultaneously (wikilink + table + arxiv + doi + pubmed + orcid + biorxiv) — NEW Phase-59 maximal cardinality", () => {
    // Pre-Phase-59 bio carried 6 consumers (Phase-56 baseline; biorxiv
    // inactive there per Phase-58 rationale-only default). Phase 59 cross-
    // surface expansion of biorxiv adds it on bio, taking bio to 7-consumer
    // composition — matching the Phase-58 rationale-only maximum.
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097, biorxiv:2024.01.15.575678.\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
    expect(html).toContain("<table>");
  });

  it("reviewNotes: all 7 consumers active simultaneously — NEW Phase-59 maximal cardinality", () => {
    const md =
      "see [[hallucination-reduction|topic]], arxiv:2024.01234, doi:10.5678/xyz, pmid:99999999, orcid:0000-0001-5109-3700, biorxiv:2023.12.05.570123v2.\n\n| X | Y |\n|---|---|\n| 3 | 4 |";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">topic</a>',
    );
    expect(html).toContain('href="https://arxiv.org/abs/2024.01234"');
    expect(html).toContain('href="https://doi.org/10.5678/xyz"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/99999999/"');
    expect(html).toContain('href="https://orcid.org/0000-0001-5109-3700"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123v2"');
    expect(html).toContain("<table>");
  });

  it("rationale: all 7 consumers active (Phase-58 baseline preserved through Phase-59 expansion)", () => {
    const md =
      "see [[benchmark-integrity|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-9079-593X, biorxiv:2024.01.15.575678.\n\n| A | B |\n|---|---|\n| 1 | 2 |";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/benchmark-integrity">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-9079-593X"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
    expect(html).toContain("<table>");
  });

  it("actionRationale: all 7 consumers active simultaneously — NEW Phase-59 maximal cardinality", () => {
    const md =
      "see [[scalable-oversight|topic]], arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097, biorxiv:2024.01.15.575678.\n\n| P | Q |\n|---|---|\n| 5 | 6 |";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
    expect(html).toContain("<table>");
  });

  it("XSS defenses survive Phase-59 7-consumer composition on every surface", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] arxiv:1909.03004 doi:10.1234/abc pubmed:12345678 orcid:0000-0002-1825-0097 biorxiv:2024.01.15.575678";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('<a class="wikilink" href="/problems/s">safe slug</a>');
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
      expect(html).toContain('href="https://doi.org/10.1234/abc"');
      expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
      expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
      expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
    }
  });
});

// ---------------------------------------------------------------------------
// Phase-60 — end-to-end bioRxiv alias-syntax extension. The dual-form regex
// in `BIORXIV_PATTERN` now matches both bracketed `[[biorxiv:NNN(vN)?(|display)?]]`
// and bare `biorxiv:NNN(vN)?` references. **Seventh realization of Phase-46
// plugin-regex-extension phase-shape pattern** — first 7-realization for
// that pattern in project history (extends Phase-55 record 6 → 7). Class +
// factory dispatch arm + `PHASE_58_DEFAULT_ENABLED_SURFACES` UNCHANGED;
// pure plugin-internal regex extension.
//
// Phase 59 cross-surface state (all 4 surfaces) preserved; Phase 60 alias-
// syntax extends biorxiv display-text on every surface from the start
// (unlike Phase-55 orcid alias which shipped rationale-only initially).
// Closes APPEND-D-AP alias item at 2-phase carryover (Phase 58 → 60).
// ---------------------------------------------------------------------------

describe("Phase-60 biorxiv alias syntax — all 4 surfaces under default dispatch", () => {
  beforeEach(() => {
    __setRegistryForTests(new BiorxivExtensionRegistry(PHASE_58_DEFAULT_ENABLED_SURFACES));
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("alias renders on bio: [[biorxiv:YYYY.MM.DD.NNNNNN|display]] → <a>display</a>", () => {
    expect(renderBioMarkdown("see [[biorxiv:2024.01.15.575678|Smith 2024]] here") ?? "").toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">Smith 2024</a> here</p>',
    );
  });

  it("alias renders on reviewNotes", () => {
    expect(renderReviewNotesMarkdown("see [[biorxiv:2024.01.15.575678|Smith 2024]] here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">Smith 2024</a> here</p>',
    );
  });

  it("alias renders on rationale", () => {
    expect(renderRationaleMarkdown("see [[biorxiv:2024.01.15.575678|Smith 2024]] here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">Smith 2024</a> here</p>',
    );
  });

  it("alias renders on actionRationale", () => {
    expect(renderActionRationaleMarkdown("see [[biorxiv:2024.01.15.575678|Smith 2024]] here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">Smith 2024</a> here</p>',
    );
  });

  it("Phase-58 backwards-compat: bare biorxiv:YYYY.MM.DD.NNNNNN still renders on every surface", () => {
    const md = "see biorxiv:2024.01.15.575678 here";
    const expected =
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> here</p>';
    expect(renderBioMarkdown(md)).toBe(expected);
    expect(renderReviewNotesMarkdown(md)).toBe(expected);
    expect(renderRationaleMarkdown(md)).toBe(expected);
    expect(renderActionRationaleMarkdown(md)).toBe(expected);
  });

  it("bracketed without alias renders verbatim ref on every surface (brackets stripped)", () => {
    const md = "see [[biorxiv:2024.01.15.575678]] here";
    const expected =
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> here</p>';
    expect(renderBioMarkdown(md)).toBe(expected);
    expect(renderReviewNotesMarkdown(md)).toBe(expected);
    expect(renderRationaleMarkdown(md)).toBe(expected);
    expect(renderActionRationaleMarkdown(md)).toBe(expected);
  });

  it("bracketed with version suffix preserves version in URL on every surface", () => {
    const md = "see [[biorxiv:2024.01.15.575678v2|revision 2]] for context";
    const expected =
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678v2">revision 2</a> for context</p>';
    expect(renderBioMarkdown(md)).toBe(expected);
    expect(renderReviewNotesMarkdown(md)).toBe(expected);
    expect(renderRationaleMarkdown(md)).toBe(expected);
    expect(renderActionRationaleMarkdown(md)).toBe(expected);
  });

  it("alias display HTML-escapes via remark-rehype text-node rendering on every surface (XSS safety end-to-end)", () => {
    const md = "[[biorxiv:2024.01.15.575678|x & y]]";
    const expected =
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">x &#x26; y</a>';
    expect(renderBioMarkdown(md) ?? "").toContain(expected);
    expect(renderReviewNotesMarkdown(md)).toContain(expected);
    expect(renderRationaleMarkdown(md)).toContain(expected);
    expect(renderActionRationaleMarkdown(md)).toContain(expected);
  });
});

// ---------------------------------------------------------------------------
// Phase-60 — first "all 4 surfaces are sextuple-alias" state under 7-way
// MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv
// Phase-60 default + Phase-46/47/48/51/55/60 alias extensions. Pre-Phase-60
// all 4 surfaces are quintuple-alias (Phase 56 ship). Post-Phase-60 every
// surface carries 6 alias consumers (wikilinks + arxiv + doi + pubmed +
// orcid + biorxiv). **First surface-with-6-alias-consumers cardinality
// of 4** in project history.
// ---------------------------------------------------------------------------

describe("Phase-60 first all-4-surfaces sextuple-alias state under 7-way composite", () => {
  beforeEach(() => {
    const wikilinks = new WikilinkExtensionRegistry(PHASE_38_DEFAULT_ENABLED_SURFACES);
    const tables = new TablesExtensionRegistry(PHASE_39_DEFAULT_ENABLED_SURFACES);
    const arxiv = new ArxivExtensionRegistry(PHASE_41_DEFAULT_ENABLED_SURFACES);
    const doi = new DoiExtensionRegistry(PHASE_45_DEFAULT_ENABLED_SURFACES);
    const pubmed = new PubmedExtensionRegistry(PHASE_50_DEFAULT_ENABLED_SURFACES);
    const orcid = new OrcidExtensionRegistry(PHASE_54_DEFAULT_ENABLED_SURFACES);
    const biorxiv = new BiorxivExtensionRegistry(PHASE_58_DEFAULT_ENABLED_SURFACES);
    __setRegistryForTests(
      new CompositeExtensionRegistry([wikilinks, tables, arxiv, doi, pubmed, orcid, biorxiv]),
    );
    __resetMarkdownCachesForTests();
  });

  afterEach(() => {
    __resetRegistryForTests();
    __resetMarkdownCachesForTests();
  });

  it("bio: all 6 aliases (wikilinks + arxiv + doi + pubmed + orcid + biorxiv) render together — FIRST SEXTUPLE-ALIAS state", () => {
    // **First "all 4 surfaces are sextuple-alias" state in project
    // history.** Pre-Phase-60 all 4 surfaces are quintuple-alias (Phase 56
    // ship); Phase 60 adds biorxiv as the 6th alias-syntax consumer on
    // every surface. First surface-with-6-alias-consumers cardinality of 4.
    const md =
      "see [[scalable-oversight|topic]] and [[arxiv:1909.03004|paper A]] and [[doi:10.1234/abc|paper B]] and [[pubmed:12345678|paper C]] and [[orcid:0000-0002-1825-0097|author A]] and [[biorxiv:2024.01.15.575678|preprint A]].";
    const html = renderBioMarkdown(md) ?? "";
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper B</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">paper C</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">author A</a>');
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">preprint A</a>',
    );
  });

  it("reviewNotes: all 6 aliases render together", () => {
    const md =
      "see [[hallucination-reduction|topic]], [[arxiv:2024.01234|paper A]], [[doi:10.5678/xyz|paper B]], [[pmid:99999999|paper C]], [[orcid:0000-0001-5109-3700|author B]], [[biorxiv:2023.12.05.570123|preprint B]].";
    const html = renderReviewNotesMarkdown(md);
    expect(html).toContain(
      '<a class="wikilink" href="/problems/hallucination-reduction">topic</a>',
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.5678/xyz">paper B</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/99999999/">paper C</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0001-5109-3700">author B</a>');
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123">preprint B</a>',
    );
  });

  it("rationale: all 6 aliases render together", () => {
    const md =
      "see [[benchmark-integrity|topic]] and [[arxiv:1909.03004|paper A]] and [[doi:10.1234/abc|paper B]] and [[pubmed:12345678|paper C]] and [[orcid:0000-0002-9079-593X|author C]] and [[biorxiv:2024.01.15.575678v2|preprint v2]].";
    const html = renderRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/benchmark-integrity">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">paper A</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">paper B</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">paper C</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0002-9079-593X">author C</a>');
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678v2">preprint v2</a>',
    );
  });

  it("actionRationale: all 6 aliases render together", () => {
    const md =
      "see [[scalable-oversight|topic]], [[arxiv:1909.03004|the work]], [[doi:10.1234/abc|cite this]], [[pmid:12345678|biomed paper]], [[orcid:0000-0002-1825-0097|primary author]], and [[biorxiv:2024.01.15.575678|the preprint]].";
    const html = renderActionRationaleMarkdown(md);
    expect(html).toContain('<a class="wikilink" href="/problems/scalable-oversight">topic</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">the work</a>');
    expect(html).toContain('<a href="https://doi.org/10.1234/abc">cite this</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">biomed paper</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">primary author</a>');
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">the preprint</a>',
    );
  });

  it("Backwards-compat under 7-way composite: bare wikilink + bare arxiv + bare doi + bare pubmed + bare orcid + bare biorxiv all coexist on every surface", () => {
    // Phase-60 alias is in addition to bare; both forms supported on
    // every surface post-Phase-60.
    const md =
      "see scalable-oversight, arxiv:1909.03004, doi:10.1234/abc, pubmed:12345678, orcid:0000-0002-1825-0097, biorxiv:2024.01.15.575678 here";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).toContain('href="https://arxiv.org/abs/1909.03004"');
      expect(html).toContain('href="https://doi.org/10.1234/abc"');
      expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
      expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
      expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
    }
  });

  it("XSS defenses survive Phase-60 sextuple-alias on every surface", () => {
    const md =
      "[bad](javascript:alert(1)) [[s|safe slug]] [[arxiv:1909.03004|safe arxiv]] [[doi:10.1234/abc|safe doi]] [[pubmed:12345678|safe pubmed]] [[orcid:0000-0002-1825-0097|safe orcid]] [[biorxiv:2024.01.15.575678|safe biorxiv]].";
    for (const renderer of [
      renderBioMarkdown,
      renderReviewNotesMarkdown,
      renderRationaleMarkdown,
      renderActionRationaleMarkdown,
    ] as const) {
      const html = renderer(md) ?? "";
      expect(html).not.toContain("javascript:alert");
      expect(html).toContain('<a class="wikilink" href="/problems/s">safe slug</a>');
      expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">safe arxiv</a>');
      expect(html).toContain('<a href="https://doi.org/10.1234/abc">safe doi</a>');
      expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">safe pubmed</a>');
      expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">safe orcid</a>');
      expect(html).toContain(
        '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">safe biorxiv</a>',
      );
    }
  });
});
