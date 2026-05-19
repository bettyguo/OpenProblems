import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import {
  BiorxivExtensionRegistry,
  PHASE_58_DEFAULT_ENABLED_SURFACES,
  remarkLinkBiorxivIds,
} from "./biorxiv";

/**
 * Minimal pipeline exercising `remarkLinkBiorxivIds` in isolation —
 * bypasses sanitize so the plugin's behavior can be verified
 * directly. End-to-end tests (factory dispatch + composition with
 * arxiv + doi + pubmed + orcid in the same slot) land in Unit 58.2.
 */
function runBiorxivPipeline(md: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkLinkBiorxivIds)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(md),
  );
}

describe("remarkLinkBiorxivIds — plugin behavior", () => {
  it("resolves a single biorxiv:YYYY.MM.DD.NNNNNN to absolute https://www.biorxiv.org/content/10.1101/... link", () => {
    expect(runBiorxivPipeline("biorxiv:2024.01.15.575678")).toBe(
      '<p><a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a></p>',
    );
  });

  it("matches case-insensitively on the `biorxiv:` prefix; display preserves source casing", () => {
    expect(runBiorxivPipeline("BIORXIV:2024.01.15.575678")).toBe(
      '<p><a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">BIORXIV:2024.01.15.575678</a></p>',
    );
    expect(runBiorxivPipeline("BioRxiv:2024.01.15.575678")).toBe(
      '<p><a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">BioRxiv:2024.01.15.575678</a></p>',
    );
  });

  it("resolves biorxiv with version suffix v1 (preserved in both URL and display)", () => {
    expect(runBiorxivPipeline("biorxiv:2024.01.15.575678v1")).toBe(
      '<p><a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678v1">biorxiv:2024.01.15.575678v1</a></p>',
    );
  });

  it("resolves biorxiv with multi-digit version suffix v10", () => {
    expect(runBiorxivPipeline("biorxiv:2023.12.05.570123v10")).toBe(
      '<p><a href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123v10">biorxiv:2023.12.05.570123v10</a></p>',
    );
  });

  it("resolves biorxiv in sentence context with surrounding prose", () => {
    expect(runBiorxivPipeline("see biorxiv:2024.01.15.575678 for the methodology")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> for the methodology</p>',
    );
  });

  it("resolves multiple biorxiv IDs in the same paragraph", () => {
    const html = runBiorxivPipeline(
      "compare biorxiv:2024.01.15.575678 with biorxiv:2023.12.05.570123",
    );
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a>',
    );
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123">biorxiv:2023.12.05.570123</a>',
    );
  });

  it("resolves mixed-version biorxiv IDs in the same paragraph", () => {
    const html = runBiorxivPipeline(
      "compare biorxiv:2024.01.15.575678v1 with biorxiv:2024.01.15.575678v2",
    );
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678v1">biorxiv:2024.01.15.575678v1</a>',
    );
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678v2">biorxiv:2024.01.15.575678v2</a>',
    );
  });

  it("rejects mid-word matches (preserved by word-boundary anchors)", () => {
    // `Xbiorxiv:2024...` — leading X means the `\b` before `b` fails to
    // trigger; entire token rejected.
    expect(runBiorxivPipeline("Xbiorxiv:2024.01.15.575678")).toBe(
      "<p>Xbiorxiv:2024.01.15.575678</p>",
    );
  });

  it("rejects invalid date prefix lengths (5-digit year)", () => {
    expect(runBiorxivPipeline("biorxiv:20240.01.15.575678")).toBe(
      "<p>biorxiv:20240.01.15.575678</p>",
    );
  });

  it("rejects invalid month/day formats (1-digit month)", () => {
    expect(runBiorxivPipeline("biorxiv:2024.1.15.575678")).toBe("<p>biorxiv:2024.1.15.575678</p>");
  });

  it("rejects invalid submission number lengths (5-digit)", () => {
    expect(runBiorxivPipeline("biorxiv:2024.01.15.57567")).toBe("<p>biorxiv:2024.01.15.57567</p>");
  });

  it("rejects legacy numeric-only IDs (pre-2019 bioRxiv format; Phase 59+ deferral)", () => {
    expect(runBiorxivPipeline("biorxiv:001234")).toBe("<p>biorxiv:001234</p>");
  });

  it("does not match strings missing the `biorxiv:` prefix", () => {
    expect(runBiorxivPipeline("2024.01.15.575678 is a date-shape but no prefix")).toBe(
      "<p>2024.01.15.575678 is a date-shape but no prefix</p>",
    );
  });

  it("does not match `doi:10.1101/...` prefix (doi consumer handles those)", () => {
    // doi:10.1101/2024.01.15.575678 has a `doi:` prefix; biorxiv consumer
    // requires literal `biorxiv:` prefix. No regex collision via prefix
    // discriminator. doi consumer (Phase 45) handles the doi: form.
    expect(runBiorxivPipeline("doi:10.1101/2024.01.15.575678")).toBe(
      "<p>doi:10.1101/2024.01.15.575678</p>",
    );
  });

  it("preserves trailing punctuation outside the matched URL", () => {
    expect(runBiorxivPipeline("see biorxiv:2024.01.15.575678, page 5.")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a>, page 5.</p>',
    );
  });

  it("preserves preceding punctuation outside the matched URL", () => {
    expect(runBiorxivPipeline("(biorxiv:2024.01.15.575678) is the citation")).toBe(
      '<p>(<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a>) is the citation</p>',
    );
  });

  it("handles biorxiv at start of line", () => {
    expect(runBiorxivPipeline("biorxiv:2024.01.15.575678 is the new preprint")).toBe(
      '<p><a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> is the new preprint</p>',
    );
  });

  it("handles biorxiv at end of line", () => {
    expect(runBiorxivPipeline("see also biorxiv:2024.01.15.575678")).toBe(
      '<p>see also <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a></p>',
    );
  });

  it("returns the URL with literal 10.1101/ DOI registrant prefix prepended (canonical bioRxiv URL form)", () => {
    // bioRxiv DOIs are 10.1101/<id>; the biorxiv: reference omits the
    // 10.1101/ prefix and the plugin synthesizes the full URL.
    const html = runBiorxivPipeline("biorxiv:2024.01.15.575678");
    expect(html).toContain("https://www.biorxiv.org/content/10.1101/2024.01.15.575678");
  });

  it("does not match overlapping ID formats from other consumers (regex-disjointness via prefix discriminator)", () => {
    // arxiv:1909.03004 — handled by arxiv consumer; biorxiv ignores.
    // doi:10.1234/abc — handled by doi consumer; biorxiv ignores.
    // pubmed:12345678 — handled by pubmed consumer; biorxiv ignores.
    // orcid:0000-0002-1825-0097 — handled by orcid consumer; biorxiv ignores.
    expect(runBiorxivPipeline("arxiv:1909.03004")).toBe("<p>arxiv:1909.03004</p>");
    expect(runBiorxivPipeline("doi:10.1234/abc")).toBe("<p>doi:10.1234/abc</p>");
    expect(runBiorxivPipeline("pubmed:12345678")).toBe("<p>pubmed:12345678</p>");
    expect(runBiorxivPipeline("orcid:0000-0002-1825-0097")).toBe(
      "<p>orcid:0000-0002-1825-0097</p>",
    );
  });

  it("XSS-safe: raw HTML in surrounding text is stripped by remark-rehype (allowDangerousHtml defaults to false); biorxiv link emits absolute https URL only", () => {
    // The isolation pipeline uses `remark-rehype` with default settings;
    // raw HTML in markdown source (e.g., `<script>`) is stripped at the
    // MDAST → HAST boundary (allowDangerousHtml: false default). The
    // biorxiv link itself emits an absolute https:// URL — no schemeless
    // or dangerous schemes possible from this plugin.
    const html = runBiorxivPipeline("biorxiv:2024.01.15.575678 <script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain('href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678"');
  });

  it("preserves text-only nodes when no biorxiv prefix is present (early-return optimization path)", () => {
    expect(runBiorxivPipeline("just some text with no preprint refs")).toBe(
      "<p>just some text with no preprint refs</p>",
    );
  });

  // -------------------------------------------------------------------------
  // Phase-60 alias-syntax tests — bracketed dual-form regex extension
  // `[[biorxiv:YYYY.MM.DD.NNNNNN(vN)?(|display)?]]`. **Fifth dual-form regex
  // in the framework** (after arxiv Phase 47 + doi Phase 48 + pubmed Phase
  // 51 + orcid Phase 55). **Seventh realization of Phase-46 plugin-regex-
  // extension phase-shape pattern** — first 7-realization for that pattern
  // in project history. Closes APPEND-D-AP alias item at 2-phase carryover
  // (Phase 58 → 60). Mirrors Phase-55 orcid alias test shape verbatim with
  // bioRxiv-specific ID-class + version suffix substitutions.
  // -------------------------------------------------------------------------

  it("Phase-60 alias: bracketed [[biorxiv:YYYY.MM.DD.NNNNNN|display]] → <a href=...>display</a>", () => {
    expect(runBiorxivPipeline("see [[biorxiv:2024.01.15.575678|Smith 2024]] for context")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">Smith 2024</a> for context</p>',
    );
  });

  it("Phase-60 alias: bracketed without alias [[biorxiv:YYYY.MM.DD.NNNNNN]] strips brackets but preserves source casing of prefix", () => {
    expect(runBiorxivPipeline("see [[biorxiv:2024.01.15.575678]] here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> here</p>',
    );
  });

  it("Phase-60 alias: bracketed without alias preserves uppercase prefix casing ([[BIORXIV:...]])", () => {
    expect(runBiorxivPipeline("see [[BIORXIV:2024.01.15.575678]] here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">BIORXIV:2024.01.15.575678</a> here</p>',
    );
  });

  it("Phase-60 alias: bracketed with version suffix [[biorxiv:YYYY.MM.DD.NNNNNNvN|display]] preserves version in URL", () => {
    expect(
      runBiorxivPipeline("see [[biorxiv:2024.01.15.575678v2|revision 2]] for the latest version"),
    ).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678v2">revision 2</a> for the latest version</p>',
    );
  });

  it("Phase-60 alias: backwards-compat — bare biorxiv:YYYY.MM.DD.NNNNNN (Phase-58 baseline) still works", () => {
    expect(runBiorxivPipeline("see biorxiv:2024.01.15.575678 here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a> here</p>',
    );
  });

  it("Phase-60 alias: backwards-compat — bare biorxiv:YYYY.MM.DD.NNNNNNvN (Phase-58 version-suffix baseline) still works", () => {
    expect(runBiorxivPipeline("see biorxiv:2024.01.15.575678v3 here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678v3">biorxiv:2024.01.15.575678v3</a> here</p>',
    );
  });

  it("Phase-60 alias: aliased + bare coexist in same paragraph", () => {
    const html = runBiorxivPipeline(
      "compare [[biorxiv:2024.01.15.575678|paper A]] with biorxiv:2023.12.05.570123",
    );
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">paper A</a>',
    );
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123">biorxiv:2023.12.05.570123</a>',
    );
  });

  it("Phase-60 alias: empty alias [[biorxiv:YYYY.MM.DD.NNNNNN|]] falls through to bare form (mirrors Phase-47/51/55 pattern)", () => {
    // The bracketed regex requires `[^\]\n]+` (one or more chars) in the
    // alias group, so empty alias `[[biorxiv:NNN|]]` does NOT match the
    // bracketed form. The `\b...\b` bare form matches `biorxiv:NNN` inside
    // the `[[...]]` (the `[[` and `]]` are not word chars; `\b` triggers
    // at the boundary). Mirrors Phase-47 arxiv + Phase-51 pubmed + Phase-
    // 55 orcid empty-alias behavior verbatim.
    const html = runBiorxivPipeline("see [[biorxiv:2024.01.15.575678|]] here");
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">biorxiv:2024.01.15.575678</a>',
    );
  });

  it("Phase-60 alias: display HTML-escapes via text-node rendering (XSS safety; mirrors Phase-55 ampersand-escape pattern)", () => {
    // The display text is emitted as an mdast `text` node `value`, which
    // transits through `remark-rehype` to a hast text-node child. The text-
    // node value is HTML-escaped by `rehype-stringify` per HTML5 spec —
    // no raw HTML leakage from alias display. Ampersand is the canonical
    // proof: `&` in source becomes `&#x26;` in output. (Bracket characters
    // like `<` cannot reach the alias group because the bracketed regex
    // alternative requires `[^\]\n]+` which doesn't admit `]`, and
    // remark-parse strips raw `<script>` tags upstream — neither path
    // delivers an unescaped HTML-special char into the display group.)
    const html = runBiorxivPipeline("[[biorxiv:2024.01.15.575678|x & y]]");
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">x &#x26; y</a>',
    );
  });

  it("Phase-60 alias: bracketed with mixed-case prefix ([[BiOrXiV:...|display]]) matches case-insensitively", () => {
    expect(runBiorxivPipeline("see [[BiOrXiV:2024.01.15.575678|mixed case]] here")).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">mixed case</a> here</p>',
    );
  });

  it("Phase-60 alias: multiple aliased bioRxiv IDs in same paragraph", () => {
    const html = runBiorxivPipeline(
      "compare [[biorxiv:2024.01.15.575678|paper A]] with [[biorxiv:2023.12.05.570123|paper B]]",
    );
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">paper A</a>',
    );
    expect(html).toContain(
      '<a href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123">paper B</a>',
    );
  });

  it("Phase-60 alias: bracketed bioRxiv inside bold renders correctly", () => {
    expect(
      runBiorxivPipeline("see **[[biorxiv:2024.01.15.575678|primary source]]** for details"),
    ).toBe(
      '<p>see <strong><a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">primary source</a></strong> for details</p>',
    );
  });

  it("Phase-60 alias: multi-word alias display preserves spaces + punctuation", () => {
    expect(
      runBiorxivPipeline("[[biorxiv:2024.01.15.575678|Smith, Jones, et al. 2024]] is the source"),
    ).toBe(
      '<p><a href="https://www.biorxiv.org/content/10.1101/2024.01.15.575678">Smith, Jones, et al. 2024</a> is the source</p>',
    );
  });

  it("Phase-60 alias: bracketed bioRxiv with version + alias preserves version in URL but uses alias as display", () => {
    expect(
      runBiorxivPipeline("see [[biorxiv:2023.12.05.570123v10|tenth revision]] for the history"),
    ).toBe(
      '<p>see <a href="https://www.biorxiv.org/content/10.1101/2023.12.05.570123v10">tenth revision</a> for the history</p>',
    );
  });
});

describe("BiorxivExtensionRegistry — class behavior", () => {
  it("returns remarkLinkBiorxivIds for enabled surfaces", () => {
    const r = new BiorxivExtensionRegistry(new Set(["rationale"]));
    expect(r.getExtensions("rationale")).toEqual({
      remarkPlugins: [remarkLinkBiorxivIds],
    });
  });

  it("returns empty extension set for non-enabled surfaces", () => {
    const r = new BiorxivExtensionRegistry(new Set(["rationale"]));
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports an empty enabled set (all surfaces disabled)", () => {
    const r = new BiorxivExtensionRegistry(new Set());
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports multiple enabled surfaces (Phase 59+ cross-surface expansion shape)", () => {
    const r = new BiorxivExtensionRegistry(new Set(["rationale", "actionRationale"]));
    expect(r.getExtensions("rationale")).toEqual({
      remarkPlugins: [remarkLinkBiorxivIds],
    });
    expect(r.getExtensions("actionRationale")).toEqual({
      remarkPlugins: [remarkLinkBiorxivIds],
    });
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
  });

  it("exposes PHASE_58_DEFAULT_ENABLED_SURFACES = all 4 surfaces Phase 59 ship (cross-surface expansion mirrors Phase-44 arxiv + Phase-49 doi + Phase-52 pubmed + Phase-56 orcid expansion verbatim; seventh realization of constructor-arg-only zero-rework expansion property; first 7-realization for that pattern in project history)", () => {
    // Phase 58 ship: Set(["rationale"]) — single-surface scope per the
    // Phase-41/45/50/54 first-ship demand-signal-first precedent.
    // Phase 59 ship: Set(["bio", "reviewNotes", "rationale",
    // "actionRationale"]) — cross-surface expansion to all 4 surfaces
    // via constructor-arg value-only change. Constant NAME preserved
    // (Phase 58 = WHEN the biorxiv consumer first shipped); VALUE
    // evolves Phase 59 per Phase-42/43/44/49/52/56 D-8 precedent.
    // **Seventh realization of "constructor-arg-only zero-rework
    // expansion" property** — first 7-realization for that pattern
    // (extends Phase-56 record 6 → 7). Closes ADR-0018 APPEND-D-AP
    // bioRxiv cross-surface item at 1-phase carryover (Phase 58 → 59)
    // — NEW FASTEST cross-surface-expansion APPEND-deferral closure
    // record (extends prior 2-phase record from Phase 52 + 56).
    expect(PHASE_58_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(true);
    expect(PHASE_58_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(true);
    expect(PHASE_58_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_58_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(true);
    expect(PHASE_58_DEFAULT_ENABLED_SURFACES.size).toBe(4);
  });
});
