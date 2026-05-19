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

  it("Phase-53: older-style category-prefixed IDs now MATCH (was rejected pre-Phase-53)", () => {
    // Pre-Phase-53: rejected as out of scope per ADR-0018 D-G Phase-42+
    // deferrals (APPEND-D-Y item 2). Phase 53 ship: matches via inner
    // ID-class disjunction — see Phase-53 section below for full coverage.
    expect(runArxivPipeline("arxiv:math/0211159")).toBe(
      '<p><a href="https://arxiv.org/abs/math/0211159">arxiv:math/0211159</a></p>',
    );
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

  // ---------------------------------------------------------------
  // Phase-47 alias syntax `[[arxiv:NNNN.NNNNN|display]]` (Unit 47.1).
  // Backwards-compatible with Phase-41 bare `arxiv:NNNN.NNNNN`; the
  // bracketed form is the priority alternative in a dual-form regex
  // with the bare form as fallback. Closes ADR-0018 APPEND-D-Y item
  // 5 at 6-phase carryover (Phase 41 → 47). Mirrors Phase-46
  // wikilinks alias regex-extension verbatim on the arxiv plugin.
  // First dual-form regex in the framework.
  // ---------------------------------------------------------------

  it("Phase-47: resolves [[arxiv:NNNN.NNNNN|display]] to <a href=...>display</a>", () => {
    expect(runArxivPipeline("[[arxiv:1909.03004|Smith et al. 2024]]")).toBe(
      '<p><a href="https://arxiv.org/abs/1909.03004">Smith et al. 2024</a></p>',
    );
  });

  it("Phase-47: bracketed without alias renders the arxiv ref verbatim (brackets stripped)", () => {
    expect(runArxivPipeline("[[arxiv:1909.03004]]")).toBe(
      '<p><a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a></p>',
    );
  });

  it("Phase-47: bracketed with version + alias preserves both", () => {
    expect(runArxivPipeline("[[arxiv:1909.03004v3|original release]]")).toBe(
      '<p><a href="https://arxiv.org/abs/1909.03004v3">original release</a></p>',
    );
  });

  it("Phase-47: backwards-compat — bare arxiv:NNNN.NNNNN still works (Phase-41 baseline)", () => {
    expect(runArxivPipeline("arxiv:1909.03004")).toBe(
      '<p><a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a></p>',
    );
  });

  it("Phase-47: aliased + bare arxiv coexist in same paragraph", () => {
    const html = runArxivPipeline("compare [[arxiv:1909.03004|first paper]] with arxiv:2024.01234");
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">first paper</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.01234">arxiv:2024.01234</a>');
  });

  it("Phase-47: empty alias [[arxiv:NNNN.NNNNN|]] falls through as literal (display class +)", () => {
    // The alias display class is `+` (one-or-more) mirroring Phase-46.
    // Empty alias does not satisfy; the bracketed alternative fails;
    // the bare alternative matches the inner `arxiv:NNNN.NNNNN`,
    // leaving the brackets + pipe as literal context.
    expect(runArxivPipeline("[[arxiv:1909.03004|]]")).toBe(
      '<p>[[<a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>|]]</p>',
    );
  });

  it("Phase-47: alias display HTML-escapes via remark-rehype text-node rendering (XSS safety)", () => {
    const html = runArxivPipeline("[[arxiv:1909.03004|x & y]]");
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">x &#x26; y</a>');
  });

  it("Phase-47: case-insensitive prefix in bracketed form; alias preserves source casing", () => {
    expect(runArxivPipeline("[[ARXIV:2024.12345|Display]]")).toBe(
      '<p><a href="https://arxiv.org/abs/2024.12345">Display</a></p>',
    );
  });

  it("Phase-47: bracketed-without-alias preserves source casing of arxiv ref", () => {
    expect(runArxivPipeline("[[ArXiv:2024.12345]]")).toBe(
      '<p><a href="https://arxiv.org/abs/2024.12345">ArXiv:2024.12345</a></p>',
    );
  });

  it("Phase-47: multiple aliased arxiv refs in same paragraph", () => {
    const html = runArxivPipeline(
      "see [[arxiv:1909.03004|first]] and [[arxiv:2024.12345|second]] for context",
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">first</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/2024.12345">second</a>');
  });

  it("Phase-47: aliased arxiv inside bold renders <strong><a>display</a></strong>", () => {
    expect(runArxivPipeline("**[[arxiv:1909.03004|critical work]]**")).toBe(
      '<p><strong><a href="https://arxiv.org/abs/1909.03004">critical work</a></strong></p>',
    );
  });

  it("Phase-47: aliased arxiv with multi-word display preserves spaces", () => {
    expect(runArxivPipeline("[[arxiv:1909.03004|Smith, Jones, and Bell 2024]]")).toBe(
      '<p><a href="https://arxiv.org/abs/1909.03004">Smith, Jones, and Bell 2024</a></p>',
    );
  });

  // ---------------------------------------------------------------
  // Phase-53 legacy category-prefixed arxiv IDs (Unit 53.1). Inner
  // ID-class disjunction `\d{4}\.\d{4,5}|[a-z]+(?:-[a-z]+)*(?:\.[A-Z-]+)?/\d{7}`
  // matches BOTH modern and legacy formats. Closes ADR-0018 APPEND-
  // D-Y item 2 at 12-phase carryover — longest absolute APPEND-
  // deferral closure ever observed. Fifth realization of Phase-46
  // plugin-regex-extension phase-shape pattern. First non-alias-
  // syntax plugin-regex-extension. Second regex evolution on
  // remarkLinkArxivIds.
  // ---------------------------------------------------------------

  it("Phase-53: resolves bare legacy `arxiv:math/0211159` (single-word category)", () => {
    expect(runArxivPipeline("arxiv:math/0211159")).toBe(
      '<p><a href="https://arxiv.org/abs/math/0211159">arxiv:math/0211159</a></p>',
    );
  });

  it("Phase-53: resolves bare legacy with uppercase subcategory `arxiv:cs.AI/0501001`", () => {
    expect(runArxivPipeline("arxiv:cs.AI/0501001")).toBe(
      '<p><a href="https://arxiv.org/abs/cs.AI/0501001">arxiv:cs.AI/0501001</a></p>',
    );
  });

  it("Phase-53: resolves bare legacy with hyphenated category `arxiv:hep-th/9711200`", () => {
    expect(runArxivPipeline("arxiv:hep-th/9711200")).toBe(
      '<p><a href="https://arxiv.org/abs/hep-th/9711200">arxiv:hep-th/9711200</a></p>',
    );
  });

  it("Phase-53: resolves bare legacy with uppercase 2-letter subcategory `arxiv:cs.GT/0309136`", () => {
    expect(runArxivPipeline("arxiv:cs.GT/0309136")).toBe(
      '<p><a href="https://arxiv.org/abs/cs.GT/0309136">arxiv:cs.GT/0309136</a></p>',
    );
  });

  it("Phase-53: resolves bare legacy with hyphenated category + hyphenated subcategory `arxiv:cond-mat.stat-mech/0301001`", () => {
    expect(runArxivPipeline("arxiv:cond-mat.stat-mech/0301001")).toBe(
      '<p><a href="https://arxiv.org/abs/cond-mat.stat-mech/0301001">arxiv:cond-mat.stat-mech/0301001</a></p>',
    );
  });

  it("Phase-53: resolves bare legacy with version suffix `arxiv:hep-th/9711200v2`", () => {
    expect(runArxivPipeline("arxiv:hep-th/9711200v2")).toBe(
      '<p><a href="https://arxiv.org/abs/hep-th/9711200v2">arxiv:hep-th/9711200v2</a></p>',
    );
  });

  it("Phase-53: resolves bracketed legacy without alias `[[arxiv:math/0211159]]`", () => {
    expect(runArxivPipeline("[[arxiv:math/0211159]]")).toBe(
      '<p><a href="https://arxiv.org/abs/math/0211159">arxiv:math/0211159</a></p>',
    );
  });

  it("Phase-53: resolves bracketed legacy with alias `[[arxiv:math/0211159|Witten 2002]]`", () => {
    expect(runArxivPipeline("[[arxiv:math/0211159|Witten 2002]]")).toBe(
      '<p><a href="https://arxiv.org/abs/math/0211159">Witten 2002</a></p>',
    );
  });

  it("Phase-53: bracketed legacy preserves source casing of prefix (`[[ArXiv:math/0211159]]`)", () => {
    expect(runArxivPipeline("[[ArXiv:math/0211159]]")).toBe(
      '<p><a href="https://arxiv.org/abs/math/0211159">ArXiv:math/0211159</a></p>',
    );
  });

  it("Phase-53: backwards-compat — modern format `arxiv:1909.03004` still works", () => {
    expect(runArxivPipeline("arxiv:1909.03004")).toBe(
      '<p><a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a></p>',
    );
  });

  it("Phase-53: modern + legacy coexist in same paragraph", () => {
    const html = runArxivPipeline("compare arxiv:1909.03004 with arxiv:hep-th/9711200 here");
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">arxiv:1909.03004</a>');
    expect(html).toContain(
      '<a href="https://arxiv.org/abs/hep-th/9711200">arxiv:hep-th/9711200</a>',
    );
  });

  it("Phase-53: bracketed modern + bracketed legacy coexist", () => {
    const html = runArxivPipeline(
      "see [[arxiv:1909.03004|modern]] and [[arxiv:math/0211159|legacy]] here",
    );
    expect(html).toContain('<a href="https://arxiv.org/abs/1909.03004">modern</a>');
    expect(html).toContain('<a href="https://arxiv.org/abs/math/0211159">legacy</a>');
  });

  it("Phase-53: rejects legacy with 6-digit identifier (\\d{7} requires exactly 7)", () => {
    expect(runArxivPipeline("arxiv:math/021115")).toBe("<p>arxiv:math/021115</p>");
  });

  it("Phase-53: legacy preserves trailing sentence-terminator period outside the match", () => {
    expect(runArxivPipeline("cited as arxiv:math/0211159.")).toBe(
      '<p>cited as <a href="https://arxiv.org/abs/math/0211159">arxiv:math/0211159</a>.</p>',
    );
  });

  it("Phase-53: legacy nested inside bold renders correctly", () => {
    expect(runArxivPipeline("**arxiv:hep-th/9711200**")).toBe(
      '<p><strong><a href="https://arxiv.org/abs/hep-th/9711200">arxiv:hep-th/9711200</a></strong></p>',
    );
  });

  it("Phase-53: legacy alias display HTML-escapes via remark-rehype text-node rendering (XSS safety)", () => {
    const html = runArxivPipeline("[[arxiv:math/0211159|x & y]]");
    expect(html).toContain('<a href="https://arxiv.org/abs/math/0211159">x &#x26; y</a>');
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

  it("exposes PHASE_41_DEFAULT_ENABLED_SURFACES = Set of all 4 surfaces (Phase 44 expansion)", () => {
    // Phase 41 ship through Phase-43 close: Set(["rationale"]). Phase 44
    // expansion: all 4 surfaces per ADR-0018 APPEND-D-Y item 1 closure
    // (cross-surface arxiv expansion; completes per-consumer expansion
    // arc — third real-consumer-expansion realization after Phase-42
    // wikilinks and Phase-43 tables). Constant NAME preserved per Phase-42
    // D-8 precedent (Phase 41 = introduction phase encoded in name; VALUE
    // evolves Phase 44).
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(true);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(true);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(true);
    expect(PHASE_41_DEFAULT_ENABLED_SURFACES.size).toBe(4);
  });
});
