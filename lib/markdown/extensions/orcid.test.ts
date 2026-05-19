import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

import {
  OrcidExtensionRegistry,
  PHASE_54_DEFAULT_ENABLED_SURFACES,
  remarkLinkOrcidIds,
} from "./orcid";

/**
 * Minimal pipeline exercising `remarkLinkOrcidIds` in isolation —
 * bypasses sanitize so the plugin's behavior can be verified
 * directly. End-to-end tests (factory dispatch + composition with
 * arxiv + doi + pubmed in the same slot) land in Unit 54.2.
 */
function runOrcidPipeline(md: string): string {
  return String(
    unified()
      .use(remarkParse)
      .use(remarkLinkOrcidIds)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(md),
  );
}

describe("remarkLinkOrcidIds — plugin behavior", () => {
  it("resolves a single orcid:NNNN-NNNN-NNNN-NNNN to absolute https://orcid.org/... link", () => {
    expect(runOrcidPipeline("orcid:0000-0002-1825-0097")).toBe(
      '<p><a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a></p>',
    );
  });

  it("matches case-insensitively on the `orcid:` prefix; display preserves source casing", () => {
    expect(runOrcidPipeline("ORCID:0000-0002-1825-0097")).toBe(
      '<p><a href="https://orcid.org/0000-0002-1825-0097">ORCID:0000-0002-1825-0097</a></p>',
    );
    expect(runOrcidPipeline("Orcid:0000-0002-1825-0097")).toBe(
      '<p><a href="https://orcid.org/0000-0002-1825-0097">Orcid:0000-0002-1825-0097</a></p>',
    );
  });

  it("resolves ORCID with uppercase X checksum (MOD 11-2 residue-10 case)", () => {
    expect(runOrcidPipeline("orcid:0000-0002-9079-593X")).toBe(
      '<p><a href="https://orcid.org/0000-0002-9079-593X">orcid:0000-0002-9079-593X</a></p>',
    );
  });

  it("resolves ORCID with lowercase x checksum (case-insensitive via /i flag)", () => {
    expect(runOrcidPipeline("orcid:0000-0002-9079-593x")).toBe(
      '<p><a href="https://orcid.org/0000-0002-9079-593x">orcid:0000-0002-9079-593x</a></p>',
    );
  });

  it("resolves ORCID with all-digit checksum", () => {
    expect(runOrcidPipeline("orcid:0000-0001-5109-3700")).toBe(
      '<p><a href="https://orcid.org/0000-0001-5109-3700">orcid:0000-0001-5109-3700</a></p>',
    );
  });

  it("preserves surrounding text", () => {
    expect(runOrcidPipeline("see orcid:0000-0002-1825-0097 for context")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a> for context</p>',
    );
  });

  it("resolves multiple matches in one paragraph", () => {
    expect(
      runOrcidPipeline("compare orcid:0000-0002-1825-0097 with orcid:0000-0001-5109-3700"),
    ).toBe(
      '<p>compare <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a> with ' +
        '<a href="https://orcid.org/0000-0001-5109-3700">orcid:0000-0001-5109-3700</a></p>',
    );
  });

  it("resolves adjacent matches separated only by punctuation", () => {
    expect(runOrcidPipeline("(orcid:0000-0002-1825-0097; orcid:0000-0001-5109-3700)")).toBe(
      '<p>(<a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a>; ' +
        '<a href="https://orcid.org/0000-0001-5109-3700">orcid:0000-0001-5109-3700</a>)</p>',
    );
  });

  it("resolves an ORCID reference nested inside a bold element", () => {
    expect(runOrcidPipeline("**orcid:0000-0002-1825-0097**")).toBe(
      '<p><strong><a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a></strong></p>',
    );
  });

  it("preserves trailing sentence-terminator period outside the match", () => {
    expect(runOrcidPipeline("cited as orcid:0000-0002-1825-0097.")).toBe(
      '<p>cited as <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a>.</p>',
    );
  });

  it("preserves trailing comma outside the match", () => {
    expect(runOrcidPipeline("see orcid:0000-0002-1825-0097, also see ...")).toBe(
      '<p>see <a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a>, also see ...</p>',
    );
  });

  it("rejects malformed ORCID with too few digits in a group", () => {
    expect(runOrcidPipeline("orcid:0000-0002-1825-007")).toBe("<p>orcid:0000-0002-1825-007</p>");
  });

  it("rejects malformed ORCID with too many digits in a group", () => {
    expect(runOrcidPipeline("orcid:00000-0002-1825-0097")).toBe(
      "<p>orcid:00000-0002-1825-0097</p>",
    );
  });

  it("rejects malformed ORCID missing hyphens", () => {
    expect(runOrcidPipeline("orcid:0000000218250097")).toBe("<p>orcid:0000000218250097</p>");
  });

  it("rejects malformed ORCID with letter in non-checksum position", () => {
    expect(runOrcidPipeline("orcid:0000-0002-1825-X097")).toBe("<p>orcid:0000-0002-1825-X097</p>");
  });

  it("rejects mid-word match (word-boundary anchor prevents `Xorcid:...`)", () => {
    expect(runOrcidPipeline("Xorcid:0000-0002-1825-0097")).toBe(
      "<p>Xorcid:0000-0002-1825-0097</p>",
    );
  });

  it("rejects bare 16-char ID without `orcid:` prefix", () => {
    expect(runOrcidPipeline("0000-0002-1825-0097 is a number")).toBe(
      "<p>0000-0002-1825-0097 is a number</p>",
    );
  });

  it("rejects orcid: prefix with empty identifier", () => {
    expect(runOrcidPipeline("orcid: 0000-0002-1825-0097")).toBe(
      "<p>orcid: 0000-0002-1825-0097</p>",
    );
  });

  it("handles three ORCID references in a single paragraph", () => {
    const html = runOrcidPipeline(
      "see orcid:0000-0002-1825-0097, orcid:0000-0001-5109-3700, and orcid:0000-0002-9079-593X",
    );
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).toContain('href="https://orcid.org/0000-0001-5109-3700"');
    expect(html).toContain('href="https://orcid.org/0000-0002-9079-593X"');
  });

  it("emits the canonical orcid.org host with no trailing slash", () => {
    const html = runOrcidPipeline("orcid:0000-0002-1825-0097");
    expect(html).toContain('href="https://orcid.org/0000-0002-1825-0097"');
    expect(html).not.toContain('href="https://orcid.org/0000-0002-1825-0097/"');
  });

  it("XSS: emits text-node display (HTML-escaping handled by remark-rehype text-node rendering)", () => {
    // Display is verbatim source casing of `orcid:NNN-NNN-NNN-NNN`.
    // Phase-54 bare form has no user-controlled text in display.
    const html = runOrcidPipeline("orcid:0000-0002-1825-0097");
    expect(html).toContain("<a ");
    expect(html).not.toContain("<script");
  });
});

describe("OrcidExtensionRegistry — class behavior", () => {
  it("returns remarkLinkOrcidIds for enabled surfaces", () => {
    const r = new OrcidExtensionRegistry(new Set(["rationale"]));
    expect(r.getExtensions("rationale")).toEqual({
      remarkPlugins: [remarkLinkOrcidIds],
    });
  });

  it("returns empty extension set for non-enabled surfaces", () => {
    const r = new OrcidExtensionRegistry(new Set(["rationale"]));
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports an empty enabled set (all surfaces disabled)", () => {
    const r = new OrcidExtensionRegistry(new Set());
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("supports multiple enabled surfaces (Phase 55+ expansion shape)", () => {
    const r = new OrcidExtensionRegistry(new Set(["rationale", "actionRationale"]));
    expect(r.getExtensions("rationale")).toEqual({
      remarkPlugins: [remarkLinkOrcidIds],
    });
    expect(r.getExtensions("actionRationale")).toEqual({
      remarkPlugins: [remarkLinkOrcidIds],
    });
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
  });

  it('exposes PHASE_54_DEFAULT_ENABLED_SURFACES = Set(["rationale"]) Phase 54 ship', () => {
    // Phase 54 ship: rationale-only — mirrors Phase-41 arxiv-first-ship
    // + Phase-45 doi-first-ship + Phase-50 pubmed-first-ship demand-
    // signal-first precedent. Constant's NAME encodes the introduction-
    // phase audit trail (Phase 54 = WHEN the orcid consumer first
    // shipped). Cross-surface expansion to all 4 surfaces deferred
    // Phase ~56+ per ADR-0018 APPEND-D-AL Phase-55+ deferrals.
    expect(PHASE_54_DEFAULT_ENABLED_SURFACES.has("rationale")).toBe(true);
    expect(PHASE_54_DEFAULT_ENABLED_SURFACES.has("bio")).toBe(false);
    expect(PHASE_54_DEFAULT_ENABLED_SURFACES.has("reviewNotes")).toBe(false);
    expect(PHASE_54_DEFAULT_ENABLED_SURFACES.has("actionRationale")).toBe(false);
    expect(PHASE_54_DEFAULT_ENABLED_SURFACES.size).toBe(1);
  });
});
