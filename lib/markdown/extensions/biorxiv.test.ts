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
