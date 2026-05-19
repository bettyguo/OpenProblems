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
    // Phase-54 bare form has no user-controlled text in display; Phase-55
    // bracketed alias form adds `|display` user-controlled text. Both
    // route through text-node rendering for HTML escaping.
    const html = runOrcidPipeline("orcid:0000-0002-1825-0097");
    expect(html).toContain("<a ");
    expect(html).not.toContain("<script");
  });

  // ---------------------------------------------------------------
  // Phase-55 alias syntax `[[orcid:NNNN-NNNN-NNNN-NNNN|display]]`
  // (Unit 55.1). Backwards-compatible with Phase-54 bare form; bracketed
  // form is priority alternative in dual-form regex with bare as fallback.
  // Closes new Phase-54 deferral at 1-phase carryover — ties Phase-51
  // pubmed alias fastest-closure record. Fourth dual-form regex in the
  // framework. Sixth realization of Phase-46 plugin-regex-extension
  // phase-shape pattern — first 6-realization phase-shape pattern in
  // project history. All 4 `remarkPlugins` consumers exhibit dual-form
  // regex post-Phase 55.
  // ---------------------------------------------------------------

  it("Phase-55: resolves [[orcid:NNNN-NNNN-NNNN-NNNN|display]] to <a href=...>display</a>", () => {
    expect(runOrcidPipeline("[[orcid:0000-0002-1825-0097|Smith et al. 2024]]")).toBe(
      '<p><a href="https://orcid.org/0000-0002-1825-0097">Smith et al. 2024</a></p>',
    );
  });

  it("Phase-55: bracketed without alias renders verbatim ref (brackets stripped)", () => {
    expect(runOrcidPipeline("[[orcid:0000-0002-1825-0097]]")).toBe(
      '<p><a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a></p>',
    );
  });

  it("Phase-55: bracketed without alias preserves source casing of prefix (`[[ORCID:...]]`)", () => {
    expect(runOrcidPipeline("[[ORCID:0000-0002-1825-0097]]")).toBe(
      '<p><a href="https://orcid.org/0000-0002-1825-0097">ORCID:0000-0002-1825-0097</a></p>',
    );
  });

  it("Phase-55: bracketed alias with X checksum renders correctly", () => {
    expect(runOrcidPipeline("[[orcid:0000-0002-9079-593X|Author X]]")).toBe(
      '<p><a href="https://orcid.org/0000-0002-9079-593X">Author X</a></p>',
    );
  });

  it("Phase-55: backwards-compat — bare orcid:NNNN-NNNN-NNNN-NNNN still works (Phase-54 baseline)", () => {
    expect(runOrcidPipeline("orcid:0000-0002-1825-0097")).toBe(
      '<p><a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a></p>',
    );
  });

  it("Phase-55: aliased + bare orcid coexist in same paragraph", () => {
    const html = runOrcidPipeline(
      "see [[orcid:0000-0002-1825-0097|first author]] and orcid:0000-0001-5109-3700 here",
    );
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">first author</a>');
    expect(html).toContain(
      '<a href="https://orcid.org/0000-0001-5109-3700">orcid:0000-0001-5109-3700</a>',
    );
  });

  it("Phase-55: empty alias [[orcid:NNNN-NNNN-NNNN-NNNN|]] falls through; bare alternative admits inner ID (mirrors Phase-47/51 pattern)", () => {
    // The alias display class is `+` (one-or-more); empty alias fails the
    // bracketed alternative. The bare alternative's `\b` word-boundary
    // (like Phase-47 arxiv + Phase-51 pubmed) admits the inner ID match —
    // leaves brackets + pipe as literal.
    expect(runOrcidPipeline("[[orcid:0000-0002-1825-0097|]]")).toBe(
      '<p>[[<a href="https://orcid.org/0000-0002-1825-0097">orcid:0000-0002-1825-0097</a>|]]</p>',
    );
  });

  it("Phase-55: alias display HTML-escapes via remark-rehype text-node rendering (XSS safety)", () => {
    const html = runOrcidPipeline("[[orcid:0000-0002-1825-0097|x & y]]");
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">x &#x26; y</a>');
  });

  it("Phase-55: case-insensitive bracketed prefix preserves source casing of alias", () => {
    expect(runOrcidPipeline("[[Orcid:0000-0002-1825-0097|Display Text]]")).toBe(
      '<p><a href="https://orcid.org/0000-0002-1825-0097">Display Text</a></p>',
    );
  });

  it("Phase-55: multiple aliased ORCIDs in same paragraph", () => {
    const html = runOrcidPipeline(
      "see [[orcid:0000-0002-1825-0097|first]] and [[orcid:0000-0001-5109-3700|second]] for context",
    );
    expect(html).toContain('<a href="https://orcid.org/0000-0002-1825-0097">first</a>');
    expect(html).toContain('<a href="https://orcid.org/0000-0001-5109-3700">second</a>');
  });

  it("Phase-55: aliased ORCID inside bold renders <strong><a>display</a></strong>", () => {
    expect(runOrcidPipeline("**[[orcid:0000-0002-1825-0097|critical author]]**")).toBe(
      '<p><strong><a href="https://orcid.org/0000-0002-1825-0097">critical author</a></strong></p>',
    );
  });

  it("Phase-55: aliased ORCID with multi-word display preserves spaces and punctuation", () => {
    expect(runOrcidPipeline("[[orcid:0000-0002-1825-0097|Smith, Jones, and Bell 2024]]")).toBe(
      '<p><a href="https://orcid.org/0000-0002-1825-0097">Smith, Jones, and Bell 2024</a></p>',
    );
  });

  it("Phase-55: bracketed ORCID with X checksum + alias preserves both", () => {
    expect(runOrcidPipeline("[[orcid:0000-0002-9079-593X|original release author]]")).toBe(
      '<p><a href="https://orcid.org/0000-0002-9079-593X">original release author</a></p>',
    );
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
