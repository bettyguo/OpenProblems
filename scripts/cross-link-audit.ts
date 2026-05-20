#!/usr/bin/env tsx
/**
 * Phase 2 acceptance-gate script (§13 / Unit 2.11): cross-link audit.
 *
 * Reads `content/` and verifies reference + reciprocity invariants across
 * papers / authors / institutions / problems / entries.
 *
 * Exits 0 if no errors (warnings allowed); 1 otherwise. Wired as
 * `pnpm audit-content`.
 *
 * Severity rationale + check inventory: docs/thinking/2.11-cross-link-audit.md.
 */
import path from "node:path";
import process from "node:process";
import { runCrossLinkAudit } from "@/lib/content/cross-link-audit";

const contentRoot = path.resolve(process.cwd(), "content");
const startedAt = new Date().toISOString();
const report = await runCrossLinkAudit(contentRoot);

console.log(`Cross-link audit — ${startedAt}`);
console.log(`  files read:      ${report.filesRead}`);
console.log(`  errors:          ${report.errors.length}`);
console.log(`  warnings:        ${report.warnings.length}`);

if (report.errors.length > 0) {
  console.log("");
  console.log("ERRORS");
  for (const e of report.errors) {
    console.log(`  [check:${e.check}] ${e.file}`);
    console.log(`    ${e.message}`);
  }
}

if (report.warnings.length > 0) {
  console.log("");
  console.log("WARNINGS");
  for (const w of report.warnings) {
    console.log(`  [check:${w.check}] ${w.file}`);
    console.log(`    ${w.message}`);
  }
}

const s = report.summary;
console.log("");
console.log("SUMMARY");
console.log(
  `  papers:        ${s.papers} (${s.danglingPaperProblemRefs} dangling problem refs, ${s.danglingPaperAuthorRefs} dangling author refs, ${s.danglingPaperInstitutionRefs} dangling institution refs)`,
);
console.log(`  authors:       ${s.authors}`);
console.log(`  institutions:  ${s.institutions}`);
console.log(
  `  problems:      ${s.problems} (${s.asymmetricRelatedProblems} asymmetric related-problems edges, ${s.danglingWikilinkRefs} dangling wikilink refs)`,
);

process.exit(report.errors.length === 0 ? 0 : 1);
