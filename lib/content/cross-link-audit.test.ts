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
