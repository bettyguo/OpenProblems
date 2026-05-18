import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import { DoiExtensionRegistry, PHASE_45_DEFAULT_ENABLED_SURFACES, remarkLinkDoiIds } from "./doi";

/**
 * Minimal pipeline exercising `remarkLinkDoiIds` in isolation —
 * bypasses sanitize so the plugin's behavior can be verified
 * directly. End-to-end tests (factory dispatch + composition with
 * arxiv in the same slot) land in Unit 45.2.
 */
function runDoiPipeline(md: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkLinkDoiIds)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(md),
  );
}

describe("remarkLinkDoiIds — plugin behavior", () => {
  it("resolves a single doi:10.NNNN/xxx to absolute https://doi.org/... link", () => {
    expect(runDoiPipeline("doi:10.1234/abc.def")).toBe(
      '<p><a href="https://doi.org/10.1234/abc.def">doi:10.1234/abc.def</a></p>',
    );
  });

  it("matches case-insensitively on the `doi:` prefix; display preserves source casing", () => {
    expect(runDoiPipeline("DOI:10.1234/abc")).toBe(
      '<p><a href="https://doi.org/10.1234/abc">DOI:10.1234/abc</a></p>',
    );
    expect(runDoiPipeline("Doi:10.1234/abc")).toBe(
      '<p><a href="https://doi.org/10.1234/abc">Doi:10.1234/abc</a></p>',
    );
  });

  it("preserves surrounding text", () => {
    expect(runDoiPipeline("see doi:10.1234/abc for context")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a> for context</p>',
    );
  });

  it("resolves multiple matches in one paragraph", () => {
    expect(runDoiPipeline("doi:10.1234/abc and doi:10.5678/def")).toBe(
      '<p><a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a> and ' +
        '<a href="https://doi.org/10.5678/def">doi:10.5678/def</a></p>',
    );
  });

  it("resolves adjacent matches separated only by punctuation", () => {
    expect(runDoiPipeline("(doi:10.1234/abc; doi:10.5678/def)")).toBe(
      '<p>(<a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a>; ' +
        '<a href="https://doi.org/10.5678/def">doi:10.5678/def</a>)</p>',
    );
  });

  it("resolves a doi reference nested inside a bold element", () => {
    expect(runDoiPipeline("**doi:10.1234/abc**")).toBe(
      '<p><strong><a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a></strong></p>',
    );
  });

  it("preserves trailing sentence-terminator period outside the match (lookahead bound)", () => {
    expect(runDoiPipeline("cited as doi:10.1234/abc.")).toBe(
      '<p>cited as <a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a>.</p>',
    );
  });

  it("preserves trailing comma outside the match", () => {
    expect(runDoiPipeline("see doi:10.1234/abc, also see ...")).toBe(
      '<p>see <a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a>, also see ...</p>',
    );
  });

  it("matches Crossref 9-digit-registrant DOIs (upper bound of \\d{4,9})", () => {
    expect(runDoiPipeline("doi:10.123456789/abc")).toBe(
      '<p><a href="https://doi.org/10.123456789/abc">doi:10.123456789/abc</a></p>',
    );
  });

  it("matches Crossref 4-digit-registrant DOIs (lower bound of \\d{4,9})", () => {
    expect(runDoiPipeline("doi:10.1000/x")).toBe(
      '<p><a href="https://doi.org/10.1000/x">doi:10.1000/x</a></p>',
    );
  });

  it("matches DOIs with embedded dots in suffix (e.g., 10.1234/abc.def.ghi)", () => {
    expect(runDoiPipeline("doi:10.1234/abc.def.ghi xyz")).toBe(
      '<p><a href="https://doi.org/10.1234/abc.def.ghi">doi:10.1234/abc.def.ghi</a> xyz</p>',
    );
  });

  it("matches DOIs with hyphens in suffix", () => {
    expect(runDoiPipeline("doi:10.1234/abc-def-123 end")).toBe(
      '<p><a href="https://doi.org/10.1234/abc-def-123">doi:10.1234/abc-def-123</a> end</p>',
    );
  });

  it("matches DOIs with parens in suffix that don't break the lookahead", () => {
    // Crossref allows parens in suffix; but our lookahead also bounds on
    // `)` which means a DOI immediately followed by `)` will be matched
    // up to the `)`. This is the prep-doc D-13 tradeoff.
    expect(runDoiPipeline("(doi:10.1234/abc)")).toBe(
      '<p>(<a href="https://doi.org/10.1234/abc">doi:10.1234/abc</a>)</p>',
    );
  });

  it("matches DOIs with colon in suffix", () => {
    expect(runDoiPipeline("doi:10.1234/abc:def ok")).toBe(
      '<p><a href="https://doi.org/10.1234/abc:def">doi:10.1234/abc:def</a> ok</p>',
    );
  });

  it("rejects 3-digit registrant (\\d{4,9} requires at least 4 digits)", () => {
    expect(runDoiPipeline("doi:10.123/abc")).toBe("<p>doi:10.123/abc</p>");
  });

  it("rejects 10-digit registrant (\\d{4,9} caps at 9 digits)", () => {
    expect(runDoiPipeline("doi:10.1234567890/abc")).toBe("<p>doi:10.1234567890/abc</p>");
  });

  it("rejects DOI without leading `10.` prefix", () => {
    expect(runDoiPipeline("doi:20.1234/abc")).toBe("<p>doi:20.1234/abc</p>");
  });

  it("rejects DOI without slash separator", () => {
    expect(runDoiPipeline("doi:10.1234abc")).toBe("<p>doi:10.1234abc</p>");
  });

  it("rejects DOI with empty suffix (slash but nothing after)", () => {
    expect(runDoiPipeline("doi:10.1234/ tail")).toBe("<p>doi:10.1234/ tail</p>");
  });

  it("rejects mid-word match (word-boundary anchor prevents `Xdoi:10.NNNN/xxx`)", () => {
    expect(runDoiPipeline("Xdoi:10.1234/abc")).toBe("<p>Xdoi:10.1234/abc</p>");
  });

  it("rejects bare DOIs without `doi:` prefix (out of scope Phase 45)", () => {
    expect(runDoiPipeline("10.1234/abc")).toBe("<p>10.1234/abc</p>");
  });

  it("handles three DOI references in a single paragraph", () => {
    const html = runDoiPipeline("doi:10.1234/abc, doi:10.5678/def.ghi, and doi:10.999999/xyz-001");
    expect(html).toContain('href="https://doi.org/10.1234/abc"');
    expect(html).toContain('href="https://doi.org/10.5678/def.ghi"');
    expect(html).toContain('href="https://doi.org/10.999999/xyz-001"');
  });

  it("emits the canonical doi.org host (NOT dx.doi.org legacy host)", () => {
    const html = runDoiPipeline("doi:10.1234/abc");
    expect(html).toContain('href="https://doi.org/');
    expect(html).not.toContain('href="https://dx.doi.org/');
  });
});

describe("DoiExtensionRegistry — class behavior", () => {
  it("returns remarkLinkDoiIds for enabled surfaces", () => {
    const r = new DoiExtensionRegistry(new Set(["rationale"]));
    expect(r.getExtensions("rationale")).toEqual({
      remarkPlugins: [remarkLinkDoiIds],
    });
  });

  it("returns empty extension set for non-enabled surfaces", () => {
    const r = new DoiExtensionRegistry(new Set(["rationale"]));
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports an empty enabled set (all surfaces disabled)", () => {
    const r = new DoiExtensionRegistry(new Set());
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports multiple enabled surfaces (Phase 46+ expansion shape)", () => {
    const r = new DoiExtensionRegistry(new Set(["rationale", "actionRationale"]));
    expect(r.getExtensions("rationale")).toEqual({
      remarkPlugins: [remarkLinkDoiIds],
    });
    expect(r.getExtensions("actionRationale")).toEqual({
      remarkPlugins: [remarkLinkDoiIds],
    });
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
  });

  it('exposes PHASE_45_DEFAULT_ENABLED_SURFACES = Set(["rationale"]) Phase 45 ship', () => {
    // Phase 45 ship: rationale-only — mirrors Phase-41 arxiv-first-ship
    // demand-signal-first precedent. Constant's NAME encodes the
    // introduction-phase audit trail (Phase 45 = WHEN the doi consumer
    // first shipped). Cross-surface expansion to all 4 surfaces deferred
    // Phase 46+ per ADR-0018 APPEND-D-AC Phase-46+ deferrals.
    expect(PHASE_45_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_45_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(false);
    expect(PHASE_45_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(false);
    expect(PHASE_45_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(false);
    expect(PHASE_45_DEFAULT_ENABLED_SURFACES.size).toBe(1);
  });
});
