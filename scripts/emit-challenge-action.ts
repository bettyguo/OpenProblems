#!/usr/bin/env tsx
/**
 * Unit 22.1 — `emit-challenge-action` CLI.
 *
 *   pnpm emit-challenge-action <challenge-id> [--dry-run]
 *
 * ADR-0014 D-D operational helper: scaffolds a rating-action YAML from a
 * curator-reviewed `ratingChallenge` DB row, writing it as a gitignored
 * draft. Mirrors Phase-5 `extract-leaderboard`'s drafts-first shape.
 * Eliminates the "write the YAML by hand" friction per ADR-0014 D-D
 * while preserving the manual commit step.
 *
 * Workflow:
 *   1. Curator decides to accept a challenge in the UI.
 *   2. Curator runs `pnpm emit-challenge-action <challenge-id>`.
 *   3. Script writes `drafts/ratings/<challenge-id>.yaml` (gitignored).
 *   4. Curator reviews + edits the draft (4 PLACEHOLDER dimensions +
 *      `prior_action` + `signals_considered` are TODO).
 *   5. Curator moves the draft to
 *      `content/problems/<slug>/ratings/<YYYY-MM-DD>-<descriptive>.yaml`
 *      and `git add` + commits manually. ADR-0005 immutability hook
 *      + `validate-content` Zod gate + cross-link audit fire on commit.
 *   6. Curator returns to /curator/challenges/<id> and attaches the
 *      filename via the `acceptedActionId` form (per ADR-0014 D-D
 *      manual-attachment step).
 *
 * Refusal cases (exit 1):
 *   - Challenge id not found in DB.
 *   - Challenge status is terminal (`accepted` / `rejected` /
 *     `withdrawn`).
 *   - Challenge has no `reviewerId` (curator must claim review first).
 *   - Reviewer's `users.githubLogin` is NULL (curator-of-record field
 *     uninitialized).
 *
 * Pure-function YAML scaffolder lives in
 * `lib/rating-challenges/scaffold.ts` (unit-tested independently). This
 * script handles the DB-read + FS-write orchestration shell.
 *
 * Server-only: requires `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` (Q55)
 * at runtime. No new dep, no new env var.
 *
 * Continues the Phase-20 + Phase-21 operational-script-keystone pattern.
 * No new ADR (ADR-0014 D-D pins the contract).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { ratingChallenges, users } from "@/lib/db/schema";
import {
  buildRatingActionYaml,
  CHALLENGE_DIMENSIONS,
  isChallengeDimension,
  readPriorRatingAction,
  TERMINAL_STATUSES,
} from "@/lib/rating-challenges/scaffold";

const SCRIPT_NAME = "emit-challenge-action";
const DRAFTS_DIR = path.join("drafts", "ratings");
const CONTENT_PROBLEMS_ROOT = path.join("content", "problems");

interface CliArgs {
  challengeId: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs | { help: true } {
  let challengeId: string | undefined;
  let dryRun = false;
  for (const a of argv) {
    if (a === "--help" || a === "-h") return { help: true };
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (a.startsWith("--")) throw new Error(`Unknown flag: ${a}`);
    if (challengeId !== undefined) throw new Error(`Unexpected extra positional argument: ${a}`);
    challengeId = a;
  }
  if (challengeId === undefined) throw new Error("Missing required argument: <challenge-id>");
  return { challengeId, dryRun };
}

function printHelp(): void {
  console.log(`Usage: pnpm ${SCRIPT_NAME} <challenge-id> [--dry-run]

Scaffold a rating-action YAML from a curator-reviewed ratingChallenge
row, writing it as a gitignored draft at drafts/ratings/<id>.yaml
(per ADR-0014 D-D). Curator reviews + edits + moves to content/ +
commits manually.

Arguments:
  <challenge-id>  Required. UUID of the rating-challenge row.

Flags:
  --dry-run    Print the scaffolded YAML to stdout instead of writing.
  --help, -h   Show this help text and exit.

Exit codes:
  0  Scaffold written (or printed in --dry-run mode).
  1  Challenge not found, terminal status, NULL reviewer, NULL
     reviewer githubLogin, or scaffold write failed.

See docs/adr/0014-curator-review-pipeline.md (D-D) for context.
`);
}

interface ChallengeRow {
  id: string;
  userId: string;
  problemSlug: string;
  dimension: string;
  proposedValue: string;
  rationale: string;
  status: string;
  reviewerId: string | null;
}

interface ReviewerRow {
  id: string;
  githubLogin: string | null;
}

async function readChallenge(id: string): Promise<ChallengeRow | undefined> {
  const rows = await db.select().from(ratingChallenges).where(eq(ratingChallenges.id, id)).limit(1);
  return rows[0];
}

async function readReviewer(id: string): Promise<ReviewerRow | undefined> {
  const rows = await db
    .select({ id: users.id, githubLogin: users.githubLogin })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0];
}

async function main(): Promise<number> {
  const parsed = parseArgs(process.argv.slice(2));
  if ("help" in parsed) {
    printHelp();
    return 0;
  }
  const { challengeId, dryRun } = parsed;

  const challenge = await readChallenge(challengeId);
  if (!challenge) {
    console.error(`Challenge not found: ${challengeId}`);
    return 1;
  }
  if (TERMINAL_STATUSES.has(challenge.status)) {
    console.error(
      `Challenge ${challengeId} has terminal status "${challenge.status}"; scaffold not applicable.`,
    );
    return 1;
  }
  if (!challenge.reviewerId) {
    console.error(
      `Challenge ${challengeId} has no reviewerId; assign a reviewer via the UI first.`,
    );
    return 1;
  }
  if (!isChallengeDimension(challenge.dimension)) {
    console.error(
      `Challenge ${challengeId} has unrecognized dimension "${challenge.dimension}"; expected one of: ${CHALLENGE_DIMENSIONS.join(", ")}.`,
    );
    return 1;
  }

  const reviewer = await readReviewer(challenge.reviewerId);
  if (!reviewer || !reviewer.githubLogin) {
    console.error(
      `Reviewer ${challenge.reviewerId} has no githubLogin; cannot set curator-of-record.`,
    );
    return 1;
  }

  const today = new Date().toISOString().slice(0, 10);

  // Phase-23: auto-fill OTHER 4 dimensions + signals + watchlist + prior_action
  // from the most-recent prior rating-action when one exists.
  const priorAction = await readPriorRatingAction({
    contentRoot: CONTENT_PROBLEMS_ROOT,
    problemSlug: challenge.problemSlug,
  });
  if (priorAction) {
    console.log(
      `Auto-filled OTHER 4 dimensions from prior: ${challenge.problemSlug}/${priorAction.filename}`,
    );
  } else {
    console.log(
      `No prior rating-action found under ${CONTENT_PROBLEMS_ROOT}/${challenge.problemSlug}/ratings — using placeholders.`,
    );
  }

  const yaml = buildRatingActionYaml({
    problemSlug: challenge.problemSlug,
    challengeId: challenge.id,
    submitterUserId: challenge.userId,
    reviewerId: reviewer.id,
    reviewerLogin: reviewer.githubLogin,
    dimension: challenge.dimension,
    proposedValue: challenge.proposedValue,
    rationale: challenge.rationale,
    date: today,
    priorAction,
  });

  if (dryRun) {
    console.log(yaml);
    return 0;
  }

  const outPath = path.join(DRAFTS_DIR, `${challengeId}.yaml`);
  await mkdir(DRAFTS_DIR, { recursive: true });
  await writeFile(outPath, yaml, "utf8");
  console.log(`Scaffolded draft: ${outPath}`);
  console.log("");
  console.log("Next steps:");
  console.log(`  1. Review + edit the draft (4 placeholder dimensions + prior_action + signals).`);
  console.log(
    `  2. Move to content/problems/${challenge.problemSlug}/ratings/${today}-<descriptive-slug>.yaml.`,
  );
  console.log(`  3. \`git add\` + commit (pre-commit hooks fire).`);
  console.log(
    `  4. Return to /curator/challenges/${challengeId} to attach the filename via acceptedActionId.`,
  );
  return 0;
}

const exitCode = await main();
process.exit(exitCode);
