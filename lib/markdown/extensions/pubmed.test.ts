import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import {
  PHASE_50_DEFAULT_ENABLED_SURFACES,
  PubmedExtensionRegistry,
  remarkLinkPubmedIds,
} from "./pubmed";

/**
 * Minimal pipeline exercising `remarkLinkPubmedIds` in isolation —
 * bypasses sanitize so the plugin's behavior can be verified
 * directly. End-to-end tests (factory dispatch + composition with
 * arxiv + doi in the same slot) land in Unit 50.2.
 */
function runPubmedPipeline(md: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkLinkPubmedIds)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(md),
  );
}

describe("remarkLinkPubmedIds — plugin behavior", () => {
  it("resolves a single pubmed:NNNNNNNN to absolute https://pubmed.ncbi.nlm.nih.gov/NNNNNNNN/ link", () => {
    expect(runPubmedPipeline("pubmed:12345678")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a></p>',
    );
  });

  it("resolves pmid:NNNNNNNN (alternative prefix) to the same canonical URL form", () => {
    expect(runPubmedPipeline("pmid:12345678")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pmid:12345678</a></p>',
    );
  });

  it("matches case-insensitively on the `pubmed:` prefix; display preserves source casing", () => {
    expect(runPubmedPipeline("PubMed:12345678")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">PubMed:12345678</a></p>',
    );
    expect(runPubmedPipeline("PUBMED:12345678")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">PUBMED:12345678</a></p>',
    );
  });

  it("matches case-insensitively on the `pmid:` prefix; display preserves source casing", () => {
    expect(runPubmedPipeline("PMID:12345678")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">PMID:12345678</a></p>',
    );
    expect(runPubmedPipeline("Pmid:12345678")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">Pmid:12345678</a></p>',
    );
  });

  it("preserves surrounding text", () => {
    expect(runPubmedPipeline("see pubmed:12345678 for context")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a> for context</p>',
    );
  });

  it("resolves multiple matches in one paragraph", () => {
    expect(runPubmedPipeline("compare pubmed:11111111 with pmid:22222222")).toBe(
      '<p>compare <a href="https://pubmed.ncbi.nlm.nih.gov/11111111/">pubmed:11111111</a> with ' +
        '<a href="https://pubmed.ncbi.nlm.nih.gov/22222222/">pmid:22222222</a></p>',
    );
  });

  it("resolves adjacent matches separated only by punctuation", () => {
    expect(runPubmedPipeline("(pubmed:11111111; pmid:22222222)")).toBe(
      '<p>(<a href="https://pubmed.ncbi.nlm.nih.gov/11111111/">pubmed:11111111</a>; ' +
        '<a href="https://pubmed.ncbi.nlm.nih.gov/22222222/">pmid:22222222</a>)</p>',
    );
  });

  it("resolves a pubmed reference nested inside a bold element", () => {
    expect(runPubmedPipeline("**pubmed:12345678**")).toBe(
      '<p><strong><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a></strong></p>',
    );
  });

  it("preserves trailing sentence-terminator period outside the match", () => {
    expect(runPubmedPipeline("cited as pubmed:12345678.")).toBe(
      '<p>cited as <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a>.</p>',
    );
  });

  it("preserves trailing comma outside the match", () => {
    expect(runPubmedPipeline("see pubmed:12345678, also see ...")).toBe(
      '<p>see <a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a>, also see ...</p>',
    );
  });

  it("matches 1-digit PMIDs (lower bound of \\d{1,9}; historical MEDLINE indexing)", () => {
    expect(runPubmedPipeline("pubmed:1")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/1/">pubmed:1</a></p>',
    );
  });

  it("matches 9-digit PMIDs (upper bound of \\d{1,9})", () => {
    expect(runPubmedPipeline("pubmed:123456789")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/123456789/">pubmed:123456789</a></p>',
    );
  });

  it("matches 7-digit PMIDs (typical modern length)", () => {
    expect(runPubmedPipeline("pubmed:1234567")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/1234567/">pubmed:1234567</a></p>',
    );
  });

  it("rejects 10-digit PMIDs (\\d{1,9} caps at 9 digits)", () => {
    // 10-digit numeric sequences would risk matching unrelated decimal
    // sequences in prose; per Phase-50 D-8 the upper bound is 9 digits.
    // The regex word-boundary anchor at the end fails after digit #9
    // since the 10th digit is also a word character; the regex backs off
    // to a 9-digit match. Verify the trailing digit lands outside the link.
    expect(runPubmedPipeline("pubmed:1234567890")).toBe("<p>pubmed:1234567890</p>");
  });

  it("rejects mid-word match (word-boundary anchor prevents `Xpubmed:1234`)", () => {
    expect(runPubmedPipeline("Xpubmed:12345678")).toBe("<p>Xpubmed:12345678</p>");
  });

  it("rejects mid-word match for pmid prefix (word-boundary anchor prevents `Xpmid:1234`)", () => {
    expect(runPubmedPipeline("Xpmid:12345678")).toBe("<p>Xpmid:12345678</p>");
  });

  it("rejects bare numeric IDs without `pubmed:` or `pmid:` prefix", () => {
    expect(runPubmedPipeline("12345678 is a number")).toBe("<p>12345678 is a number</p>");
  });

  it("rejects pubmed: prefix with non-digit identifier (regex requires \\d+)", () => {
    expect(runPubmedPipeline("pubmed:abc123")).toBe("<p>pubmed:abc123</p>");
  });

  it("rejects pubmed: prefix with empty identifier", () => {
    expect(runPubmedPipeline("pubmed: 12345678")).toBe("<p>pubmed: 12345678</p>");
  });

  it("handles three PubMed references in a single paragraph", () => {
    const html = runPubmedPipeline("see pubmed:11111111, pmid:22222222, and pubmed:33333333");
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/11111111/"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/22222222/"');
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/33333333/"');
  });

  it("emits the canonical pubmed.ncbi.nlm.nih.gov host with trailing slash", () => {
    const html = runPubmedPipeline("pubmed:12345678");
    expect(html).toContain('href="https://pubmed.ncbi.nlm.nih.gov/12345678/"');
    expect(html).not.toContain('href="https://www.ncbi.nlm.nih.gov/pubmed/');
  });

  it("XSS: emits text-node display (HTML-escaping handled by remark-rehype text-node rendering)", () => {
    // Display is verbatim source casing of `pubmed:NNN` / `pmid:NNN`.
    // Phase-50 bare form has no user-controlled text in display; Phase-51
    // bracketed alias form adds `|display` user-controlled text. Both
    // route through text-node rendering for HTML escaping.
    const html = runPubmedPipeline("pubmed:12345678");
    expect(html).toContain("<a ");
    expect(html).not.toContain("<script");
  });

  // ---------------------------------------------------------------
  // Phase-51 alias syntax `[[pubmed:NNN|display]]` / `[[pmid:NNN|display]]`
  // (Unit 51.1). Backwards-compatible with Phase-50 bare form; bracketed
  // form is priority alternative in dual-form regex with bare as fallback.
  // Closes new Phase-50 deferral at 1-phase carryover — fastest APPEND-
  // deferral closure ever observed. Third dual-form regex in framework;
  // first with inner prefix-alternation inside the bracketed branch.
  // ---------------------------------------------------------------

  it("Phase-51: resolves [[pubmed:NNN|display]] to <a href=...>display</a>", () => {
    expect(runPubmedPipeline("[[pubmed:12345678|Smith et al. 2024]]")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">Smith et al. 2024</a></p>',
    );
  });

  it("Phase-51: resolves [[pmid:NNN|display]] (alternative prefix in bracketed alias form)", () => {
    expect(runPubmedPipeline("[[pmid:12345678|Smith et al. 2024]]")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">Smith et al. 2024</a></p>',
    );
  });

  it("Phase-51: bracketed without alias renders verbatim ref (brackets stripped) preserving prefix variant", () => {
    expect(runPubmedPipeline("[[pubmed:12345678]]")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a></p>',
    );
    expect(runPubmedPipeline("[[pmid:12345678]]")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pmid:12345678</a></p>',
    );
  });

  it("Phase-51: bracketed without alias preserves mixed source casing of prefix variant", () => {
    expect(runPubmedPipeline("[[PubMed:12345678]]")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">PubMed:12345678</a></p>',
    );
    expect(runPubmedPipeline("[[PMID:12345678]]")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">PMID:12345678</a></p>',
    );
  });

  it("Phase-51: backwards-compat — bare pubmed:NNN still works (Phase-50 baseline)", () => {
    expect(runPubmedPipeline("pubmed:12345678")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a></p>',
    );
  });

  it("Phase-51: aliased + bare pubmed coexist in same paragraph", () => {
    const html = runPubmedPipeline("see [[pubmed:11111111|paper A]] and pmid:22222222 here");
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/11111111/">paper A</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/22222222/">pmid:22222222</a>');
  });

  it("Phase-51: bracketed pubmed + bracketed pmid coexist (both prefix variants in alias form)", () => {
    const html = runPubmedPipeline(
      "compare [[pubmed:11111111|first]] with [[pmid:22222222|second]]",
    );
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/11111111/">first</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/22222222/">second</a>');
  });

  it("Phase-51: empty alias [[pubmed:NNN|]] falls through; bare alternative admits inner ID (mirrors Phase-47 arxiv pattern)", () => {
    // The alias display class is `+` (one-or-more); empty alias fails the
    // bracketed alternative. The bare alternative's `\b` word-boundary
    // (like Phase-47 arxiv, unlike Phase-48 doi's prose-friendly lookahead)
    // admits the inner ID match — leaves brackets + pipe as literal.
    expect(runPubmedPipeline("[[pubmed:12345678|]]")).toBe(
      '<p>[[<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">pubmed:12345678</a>|]]</p>',
    );
  });

  it("Phase-51: alias display HTML-escapes via remark-rehype text-node rendering (XSS safety)", () => {
    const html = runPubmedPipeline("[[pubmed:12345678|x & y]]");
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">x &#x26; y</a>');
  });

  it("Phase-51: case-insensitive bracketed prefix preserves source casing of alias", () => {
    expect(runPubmedPipeline("[[PMID:12345678|Display Text]]")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">Display Text</a></p>',
    );
  });

  it("Phase-51: multiple aliased pubmed refs in same paragraph", () => {
    const html = runPubmedPipeline(
      "see [[pubmed:11111111|first]] and [[pmid:22222222|second]] for context",
    );
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/11111111/">first</a>');
    expect(html).toContain('<a href="https://pubmed.ncbi.nlm.nih.gov/22222222/">second</a>');
  });

  it("Phase-51: aliased pubmed inside bold renders <strong><a>display</a></strong>", () => {
    expect(runPubmedPipeline("**[[pubmed:12345678|critical work]]**")).toBe(
      '<p><strong><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">critical work</a></strong></p>',
    );
  });

  it("Phase-51: aliased pubmed with multi-word display preserves spaces and punctuation", () => {
    expect(runPubmedPipeline("[[pubmed:12345678|Smith, Jones, and Bell 2024]]")).toBe(
      '<p><a href="https://pubmed.ncbi.nlm.nih.gov/12345678/">Smith, Jones, and Bell 2024</a></p>',
    );
  });
});

describe("PubmedExtensionRegistry — class behavior", () => {
  it("returns remarkLinkPubmedIds for enabled surfaces", () => {
    const r = new PubmedExtensionRegistry(new Set(["rationale"]));
    expect(r.getExtensions("rationale")).toEqual({
      remarkPlugins: [remarkLinkPubmedIds],
    });
  });

  it("returns empty extension set for non-enabled surfaces", () => {
    const r = new PubmedExtensionRegistry(new Set(["rationale"]));
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports an empty enabled set (all surfaces disabled)", () => {
    const r = new PubmedExtensionRegistry(new Set());
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports multiple enabled surfaces (Phase 51+ expansion shape)", () => {
    const r = new PubmedExtensionRegistry(new Set(["rationale", "actionRationale"]));
    expect(r.getExtensions("rationale")).toEqual({
      remarkPlugins: [remarkLinkPubmedIds],
    });
    expect(r.getExtensions("actionRationale")).toEqual({
      remarkPlugins: [remarkLinkPubmedIds],
    });
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
  });

  it("exposes PHASE_50_DEFAULT_ENABLED_SURFACES = all 4 surfaces Phase 52 cross-surface expansion", () => {
    // Phase 50 ship through Phase-51 close: Set(["rationale"]) — single-
    // surface scope mirroring Phase-41 arxiv-first-ship + Phase-45 doi-
    // first-ship demand-signal-first precedent. Phase 52 expansion: all 4
    // surfaces per ADR-0018 APPEND-D-AJ (closes APPEND-D-AH PubMed PMID
    // cross-surface item at 2-phase carryover — fastest cross-surface-
    // expansion APPEND-deferral closure ever observed; beats prior 3-phase
    // Phase-41 → 44 record). **Fifth real-consumer-expansion realization**
    // of the "constructor-arg-only zero-rework expansion" property (Phase
    // 42 wikilinks + Phase 43 tables + Phase 44 arxiv + Phase 49 doi +
    // Phase 52 pubmed); **first 5-realization property in project
    // history**. Constant's NAME preserves the introduction-phase audit
    // trail (Phase 50 = WHEN the pubmed consumer first shipped); VALUE
    // evolves Phase 52 per Phase-42/43/44/49 D-8 precedent. Surface
    // enumeration follows MarkdownSurface type-union order per
    // Phase-42/43/44/49 D-9 precedent.
    expect(PHASE_50_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(true);
    expect(PHASE_50_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(true);
    expect(PHASE_50_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_50_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(true);
    expect(PHASE_50_DEFAULT_ENABLED_SURFACES.size).toBe(4);
  });
});
