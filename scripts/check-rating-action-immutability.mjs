#!/usr/bin/env node
/**
 * ADR-0005 enforcement (Layer 2 of 3: filesystem convention → this hook →
 * CI gate at Unit 0.11).
 *
 * Refuses to let a commit proceed if any file under
 * `content/problems/<slug>/ratings/` is staged with status M (modified),
 * D (deleted), or R (renamed). Pure additions (A) and untouched files
 * (no entry) are allowed — that is how new rating actions land.
 *
 * Rationale: methodological credibility (MASTER_PROMPT §3.1) requires the
 * rating-action log to be mechanically untamperable in the normal workflow.
 * A correction must be a NEW action that cites the prior, never an edit
 * of an existing one.
 */

import { execSync } from "node:child_process";

const RATING_GLOB = /^content\/problems\/[^/]+\/ratings\//;

function listStaged() {
  const out = execSync("git diff --cached --name-status", { encoding: "utf8" });
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

const staged = listStaged();
const offending = staged.filter(({ status, paths }) => {
  if (!status) return false;
  const code = status[0];
  // M = modify, D = delete, R = rename (R100\told\tnew), C = copy.
  // A = add: allowed. T = type change: allowed for rare permission flips.
  if (code !== "M" && code !== "D" && code !== "R" && code !== "C") return false;
  return paths.some((p) => RATING_GLOB.test(p));
});

if (offending.length > 0) {
  console.error("\n✗ ADR-0005: rating-action files are immutable.");
  console.error("  The following staged changes are not allowed:\n");
  for (const { status, paths } of offending) {
    console.error(`    [${status}] ${paths.join("  →  ")}`);
  }
  console.error("");
  console.error("  Authoring a correction? Publish a NEW rating-action file");
  console.error("  that cites the prior_action; do not edit or delete the");
  console.error("  existing one. See docs/adr/0005-rating-action-immutability.md.\n");
  process.exit(1);
}

process.exit(0);
