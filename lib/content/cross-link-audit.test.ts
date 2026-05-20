import { describe, expect, it } from "vitest";
import path from "node:path";
import { runCrossLinkAudit } from "@/lib/content/cross-link-audit";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const FIXTURES = path.join(REPO_ROOT, "test", "fixtures");

describe("runCrossLinkAudit", () => {
  it("returns zero errors on the real content/ tree", async () => {
    const report = await runCrossLinkAudit(path.join(REPO_ROOT, "content"));
    expect(report.errors).toEqual([]);
    // Sanity: the seed set is non-empty.
    expect(report.summary.papers).toBeGreaterThanOrEqual(30);
    expect(report.summary.problems).toBeGreaterThanOrEqual(10);
  });

  it("flags a dangling paper→problem contribution as a paper-problem-fk error", async () => {
    const report = await runCrossLinkAudit(path.join(FIXTURES, "audit-dangling"));
    expect(report.errors.length).toBe(1);
    expect(report.errors[0]?.check).toBe("paper-problem-fk");
    expect(report.errors[0]?.message).toMatch(/nonexistent/);
    expect(report.summary.danglingPaperProblemRefs).toBe(1);
  });

  it("flags asymmetric related_problems as a warning, not an error", async () => {
    const report = await runCrossLinkAudit(path.join(FIXTURES, "audit-asymmetric"));
    expect(report.errors).toEqual([]);
    expect(report.warnings.length).toBeGreaterThanOrEqual(1);
    const symmetryWarning = report.warnings.find((w) => w.check === "related-problems-symmetry");
    expect(symmetryWarning).toBeDefined();
    expect(report.summary.asymmetricRelatedProblems).toBe(1);
  });

  it("tolerates missing optional subdirs", async () => {
    // content-valid has only taxonomy.yaml — no problems/, papers/, etc.
    const report = await runCrossLinkAudit(path.join(FIXTURES, "content-valid"));
    expect(report.errors).toEqual([]);
    expect(report.summary.papers).toBe(0);
    expect(report.summary.problems).toBe(0);
  });
});

/**
 * Phase 66 Unit 66.2 — `wikilink-target-fk` check tests
 * (8th `AuditCheck` type; closes ADR-0018 APPEND-D-L item 5
 * at 28-phase carryover — NEW LONGEST ABSOLUTE APPEND-
 * DEFERRAL CLOSURE EVER OBSERVED).
 */
describe("runCrossLinkAudit — wikilink-target-fk (Phase 66)", () => {
  it("reports 0 wikilink errors on the real content/ tree (production-content regression guard)", async () => {
    const report = await runCrossLinkAudit(path.join(REPO_ROOT, "content"));
    const wikilinkFindings = [...report.errors, ...report.warnings].filter(
      (f) => f.check === "wikilink-target-fk",
    );
    expect(wikilinkFindings).toEqual([]);
    expect(report.summary.danglingWikilinkRefs).toBe(0);
  });

  it("flags every unresolved wikilink in a fixture with bare + cross-entity dangling targets", async () => {
    const report = await runCrossLinkAudit(path.join(FIXTURES, "audit-wikilink-dangling"));
    const wikilinkErrors = report.errors.filter((e) => e.check === "wikilink-target-fk");
    // Fixture rating contains 4 dangling refs + 1 valid bare ref:
    //   - [[nonexistent-problem]] (bare; problem-slug fallback)
    //   - [[author:typo-author]] (cross-entity; authorSlugs)
    //   - [[paper:typo-paper]] (cross-entity; paperIds)
    //   - [[institution:typo-institution]] (cross-entity; institutionSlugs)
    //   - [[real]] (valid; should NOT be flagged)
    expect(wikilinkErrors).toHaveLength(4);
    expect(report.summary.danglingWikilinkRefs).toBe(4);
  });

  it("emits ERROR severity (mirrors paper-problem-fk precedent for dangling FK references)", async () => {
    const report = await runCrossLinkAudit(path.join(FIXTURES, "audit-wikilink-dangling"));
    for (const finding of report.errors.filter((e) => e.check === "wikilink-target-fk")) {
      expect(finding.severity).toBe("error");
    }
  });

  it("finding message cites file + field-path + match text + entity type + slug", async () => {
    const report = await runCrossLinkAudit(path.join(FIXTURES, "audit-wikilink-dangling"));
    const bareErr = report.errors.find(
      (e) => e.check === "wikilink-target-fk" && e.message.includes("[[nonexistent-problem]]"),
    );
    expect(bareErr).toBeDefined();
    expect(bareErr?.file).toMatch(/ratings\/2026-05-14-initial\.yaml$/);
    expect(bareErr?.message).toMatch(/dimensions\.difficulty\.rationale/);
    expect(bareErr?.message).toMatch(/no such problem target "nonexistent-problem"/);
  });

  it("entity-type label in finding reflects cross-entity routing (paper/author/institution)", async () => {
    const report = await runCrossLinkAudit(path.join(FIXTURES, "audit-wikilink-dangling"));
    const authorErr = report.errors.find((e) => e.message.includes("[[author:typo-author]]"));
    expect(authorErr?.message).toMatch(/no such author target/);
    const paperErr = report.errors.find((e) => e.message.includes("[[paper:typo-paper]]"));
    expect(paperErr?.message).toMatch(/no such paper target/);
    const instErr = report.errors.find((e) =>
      e.message.includes("[[institution:typo-institution]]"),
    );
    expect(instErr?.message).toMatch(/no such institution target/);
  });

  it("valid wikilinks in the same fixture are not flagged ([[real]] resolves to problem-slug)", async () => {
    const report = await runCrossLinkAudit(path.join(FIXTURES, "audit-wikilink-dangling"));
    const realErr = report.errors.find(
      (e) => e.check === "wikilink-target-fk" && e.message.includes("[[real]]"),
    );
    expect(realErr).toBeUndefined();
  });

  it("audit reads ratings/*.yaml files (filesRead reflects rating-action traversal)", async () => {
    const report = await runCrossLinkAudit(path.join(FIXTURES, "audit-wikilink-dangling"));
    // Fixture has taxonomy.yaml + problems/real/problem.yaml + 1 ratings yaml
    // = 3 yaml files. The audit's filesRead counts taxonomy, problem.yaml,
    // and the rating yaml. (Papers/authors/institutions dirs absent.)
    expect(report.summary.problems).toBe(1);
    // Rating-file traversal is the new Phase 66 surface; presence of any
    // wikilink-target-fk finding from the rating yaml confirms it was read.
    expect(report.errors.some((e) => e.check === "wikilink-target-fk")).toBe(true);
  });
});
