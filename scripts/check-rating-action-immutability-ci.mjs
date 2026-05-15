#!/usr/bin/env node
/**
 * ADR-0005 enforcement, Layer 3 (CI gate).
 *
 * Compares the PR head to the base branch (passed as argv[2], e.g.
 * `origin/main`). Fails non-zero if any file under
 * `content/problems/<slug>/ratings/` has been modified, deleted, renamed,
 * or copied (statuses M / D / R / C). Only additions (A) are permitted.
 *
 * Local Layer-2 enforcement lives in `scripts/check-rating-action-immutability.mjs`
 * (pre-commit Husky hook). This CI script catches anyone who used
 * --no-verify to bypass the hook.
 */

import { execSync } from "node:child_process";
import process from "node:process";

const baseRef = process.argv[2];
if (!baseRef) {
  console.error("usage: check-rating-action-immutability-ci.mjs <base-ref>");
  process.exit(2);
}

const RATING_GLOB = /^content\/problems\/[^/]+\/ratings\//;

function diffStatus(base) {
  const out = execSync(`git diff --name-status ${base}...HEAD`, {
    encoding: "utf8",
  });
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\t/);
      const status = parts[0] ?? "";
      const paths = parts.slice(1);
      return { status, paths };
    });
}

const changes = diffStatus(baseRef);
const offending = changes.filter(({ status, paths }) => {
  if (!status) return false;
  const code = status[0];
  if (code !== "M" && code !== "D" && code !== "R" && code !== "C") return false;
  return paths.some((p) => RATING_GLOB.test(p));
});

if (offending.length > 0) {
  console.error("\n✗ ADR-0005: rating-action files are immutable.");
  console.error(`  Compared against base ref: ${baseRef}`);
  console.error("  The following changes are not allowed:\n");
  for (const { status, paths } of offending) {
    console.error(`    [${status}] ${paths.join("  →  ")}`);
  }
  console.error("");
  console.error("  Authoring a correction? Publish a NEW rating-action file");
  console.error("  that cites the prior_action; do not edit or delete the");
  console.error("  existing one. See docs/adr/0005-rating-action-immutability.md.\n");
  process.exit(1);
}

console.log(`✓ ADR-0005 CI check passed against ${baseRef}`);
process.exit(0);
