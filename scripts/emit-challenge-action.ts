#!/usr/bin/env tsx
/**
 * Unit 22.1 — `emit-challenge-action` CLI.
 *
 *   pnpm emit-challenge-action <challenge-id> [--dry-run]
 *   pnpm emit-challenge-action --all-under-review [--dry-run] [--no-prior-fill]
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
 *   4. Curator reviews + edits the draft (4 OTHER dimensions are
 *      copied from prior rating-action when one exists per Phase-23
 *      auto-fill; otherwise PLACEHOLDERS with TODO rationale).
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
 * Phase-25 flags (D-4 through D-6):
 *   - `--all-under-review`: batch-process all `status=under_review`
 *     challenges in one invocation. Mutually exclusive with the
 *     `<challenge-id>` positional arg. Per-row try/catch (one bad
 *     row doesn't kill batch); summary at end; exit 1 if any failed.
 *   - `--no-prior-fill`: skip Phase-23 prior-action auto-fill;
 *     force Phase-22 placeholder behavior. Useful when prior data
 *     is suspect / curator wants to re-author from scratch.
 *
 * Pure-function YAML scaffolder lives in
 * `lib/rating-challenges/scaffold.ts` (unit-tested independently). This
 * script handles the DB-read + FS-write orchestration shell.
 *
 * Server-only: requires `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` (Q55)
 * at runtime. No new dep, no new env var.
 *
 * Continues the Phase-20-24 operational-script-keystone pattern.
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
  readMethodologyVersion,
  readPriorRatingAction,
  TERMINAL_STATUSES,
  type ChallengeDimension,
} from "@/lib/rating-challenges/scaffold";

const SCRIPT_NAME = "emit-challenge-action";
const DRAFTS_DIR = path.join("drafts", "ratings");
const CONTENT_ROOT = "content";
const CONTENT_PROBLEMS_ROOT = path.join(CONTENT_ROOT, "problems");

interface CliArgs {
  challengeId?: string;
  allUnderReview: boolean;
  dryRun: boolean;
  noPriorFill: boolean;
}

function parseArgs(argv: string[]): CliArgs | { help: true } {
  let challengeId: string | undefined;
  let allUnderReview = false;
  let dryRun = false;
  let noPriorFill = false;
  for (const a of argv) {
    if (a === "--help" || a === "-h") return { help: true };
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (a === "--all-under-review") {
      allUnderReview = true;
      continue;
    }
    if (a === "--no-prior-fill") {
      noPriorFill = true;
      continue;
    }
    if (a.startsWith("--")) throw new Error(`Unknown flag: ${a}`);
    if (challengeId !== undefined) throw new Error(`Unexpected extra positional argument: ${a}`);
    challengeId = a;
  }
  if (allUnderReview && challengeId !== undefined) {
    throw new Error("Cannot combine <challenge-id> with --all-under-review");
  }
  if (!allUnderReview && challengeId === undefined) {
    throw new Error("Missing required argument: <challenge-id> (or use --all-under-review)");
  }
  const result: CliArgs = { allUnderReview, dryRun, noPriorFill };
  if (challengeId !== undefined) result.challengeId = challengeId;
  return result;
}

function printHelp(): void {
  console.log(`Usage: pnpm ${SCRIPT_NAME} <challenge-id> [--dry-run] [--no-prior-fill]
       pnpm ${SCRIPT_NAME} --all-under-review [--dry-run] [--no-prior-fill]

Scaffold a rating-action YAML from a curator-reviewed ratingChallenge
row, writing it as a gitignored draft at drafts/ratings/<id>.yaml
(per ADR-0014 D-D). Curator reviews + edits + moves to content/ +
commits manually.

Arguments:
  <challenge-id>  UUID of the rating-challenge row (or use
                  --all-under-review for batch mode).

Flags:
  --all-under-review   Batch-process all status=under_review challenges
                       in one invocation. Mutually exclusive with
                       <challenge-id> positional arg.
  --no-prior-fill      Skip Phase-23 prior-action auto-fill; force
                       Phase-22 placeholder behavior on OTHER 4
                       dimensions. Stackable with --all-under-review.
  --dry-run            Print scaffolded YAML to stdout instead of
                       writing. In batch mode, prints each YAML
                       separated by '---'.
  --help, -h           Show this help text and exit.

Exit codes:
  0  Scaffold(s) written (or printed in --dry-run mode).
  1  Challenge not found, terminal status, NULL reviewer, NULL
     reviewer githubLogin, scaffold write failed, OR at least one
     row failed in batch mode.

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

async function readUnderReviewChallenges(): Promise<ChallengeRow[]> {
  return db.select().from(ratingChallenges).where(eq(ratingChallenges.status, "under_review"));
}

async function readReviewer(id: string): Promise<ReviewerRow | undefined> {
  const rows = await db
    .select({ id: users.id, githubLogin: users.githubLogin })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0];
}

interface ScaffoldOpts {
  challenge: ChallengeRow;
  reviewer: ReviewerRow;
  challengeDimension: ChallengeDimension;
  methodologyVersion: string;
  dryRun: boolean;
  noPriorFill: boolean;
}

async function scaffoldOne(opts: ScaffoldOpts): Promise<string> {
  const { challenge, reviewer, challengeDimension, methodologyVersion, dryRun, noPriorFill } = opts;
  const today = new Date().toISOString().slice(0, 10);

  // Phase-23 auto-fill (Phase-25 --no-prior-fill opt-out).
  const priorAction = noPriorFill
    ? null
    : await readPriorRatingAction({
        contentRoot: CONTENT_PROBLEMS_ROOT,
        problemSlug: challenge.problemSlug,
      });
  if (noPriorFill) {
    console.log(`[${challenge.id}] --no-prior-fill: skipping auto-fill; using placeholders.`);
  } else if (priorAction) {
    console.log(
      `[${challenge.id}] Auto-filled OTHER 4 dimensions from prior: ${challenge.problemSlug}/${priorAction.filename}`,
    );
  } else {
    console.log(
      `[${challenge.id}] No prior rating-action under ${CONTENT_PROBLEMS_ROOT}/${challenge.problemSlug}/ratings — using placeholders.`,
    );
  }

  // Reviewer's githubLogin already validated non-null by caller.
  const reviewerLogin = reviewer.githubLogin as string;
  const yaml = buildRatingActionYaml({
    problemSlug: challenge.problemSlug,
    challengeId: challenge.id,
    submitterUserId: challenge.userId,
    reviewerId: reviewer.id,
    reviewerLogin,
    dimension: challengeDimension,
    proposedValue: challenge.proposedValue,
    rationale: challenge.rationale,
    date: today,
    priorAction,
    methodologyVersion,
  });

  if (dryRun) return yaml;

  const outPath = path.join(DRAFTS_DIR, `${challenge.id}.yaml`);
  await mkdir(DRAFTS_DIR, { recursive: true });
  await writeFile(outPath, yaml, "utf8");
  return outPath;
}

interface ChallengeValidation {
  ok: true;
  dimension: ChallengeDimension;
  reviewer: ReviewerRow;
}

interface ChallengeRejection {
  ok: false;
  reason: string;
}

async function validateChallenge(
  challenge: ChallengeRow,
): Promise<ChallengeValidation | ChallengeRejection> {
  if (TERMINAL_STATUSES.has(challenge.status)) {
    return {
      ok: false,
      reason: `terminal status "${challenge.status}"; scaffold not applicable.`,
    };
  }
  if (!challenge.reviewerId) {
    return { ok: false, reason: "no reviewerId; assign a reviewer via the UI first." };
  }
  if (!isChallengeDimension(challenge.dimension)) {
    return {
      ok: false,
      reason: `unrecognized dimension "${challenge.dimension}"; expected one of: ${CHALLENGE_DIMENSIONS.join(", ")}.`,
    };
  }
  const reviewer = await readReviewer(challenge.reviewerId);
  if (!reviewer || !reviewer.githubLogin) {
    return {
      ok: false,
      reason: `reviewer ${challenge.reviewerId} has no githubLogin; cannot set curator-of-record.`,
    };
  }
  return { ok: true, dimension: challenge.dimension, reviewer };
}

function printNextSteps(challenge: ChallengeRow, date: string): void {
  console.log("");
  console.log(`Next steps for [${challenge.id}]:`);
  console.log(`  1. Review + edit the draft.`);
  console.log(
    `  2. Move to content/problems/${challenge.problemSlug}/ratings/${date}-<descriptive-slug>.yaml.`,
  );
  console.log(`  3. \`git add\` + commit (pre-commit hooks fire).`);
  console.log(
    `  4. Return to /curator/challenges/${challenge.id} to attach the filename via acceptedActionId.`,
  );
}

async function main(): Promise<number> {
  const parsed = parseArgs(process.argv.slice(2));
  if ("help" in parsed) {
    printHelp();
    return 0;
  }
  const { allUnderReview, challengeId, dryRun, noPriorFill } = parsed;

  const methodologyVersion = await readMethodologyVersion({ contentRoot: CONTENT_ROOT });

  if (allUnderReview) {
    const challenges = await readUnderReviewChallenges();
    if (challenges.length === 0) {
      console.log("No challenges with status=under_review. Nothing to do.");
      return 0;
    }
    console.log(`Found ${challenges.length} challenges with status=under_review.`);
    console.log(`Methodology version: ${methodologyVersion}`);
    console.log("");

    const succeeded: string[] = [];
    const failed: { id: string; reason: string }[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const challenge of challenges) {
      const validation = await validateChallenge(challenge);
      if (!validation.ok) {
        failed.push({ id: challenge.id, reason: validation.reason });
        console.error(`  ✗ [${challenge.id}] ${validation.reason}`);
        continue;
      }
      try {
        const out = await scaffoldOne({
          challenge,
          reviewer: validation.reviewer,
          challengeDimension: validation.dimension,
          methodologyVersion,
          dryRun,
          noPriorFill,
        });
        succeeded.push(challenge.id);
        if (dryRun) {
          console.log(`---`);
          console.log(out);
        } else {
          console.log(`  ✓ [${challenge.id}] scaffolded draft: ${out}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failed.push({ id: challenge.id, reason: message });
        console.error(`  ✗ [${challenge.id}] ${message}`);
      }
    }

    console.log("");
    console.log("SUMMARY");
    console.log(`  succeeded: ${succeeded.length}`);
    console.log(`  failed:    ${failed.length}`);
    if (!dryRun && succeeded.length > 0) {
      console.log(`  drafts written to ${DRAFTS_DIR}/<challenge-id>.yaml`);
      console.log(`  curator reviews + moves to content/ + commits per challenge`);
      console.log(`  scaffolded date: ${today}`);
    }
    return failed.length === 0 ? 0 : 1;
  }

  // Single-challenge mode (Phase-22+23 default).
  const challenge = await readChallenge(challengeId!);
  if (!challenge) {
    console.error(`Challenge not found: ${challengeId}`);
    return 1;
  }
  const validation = await validateChallenge(challenge);
  if (!validation.ok) {
    console.error(`Challenge ${challenge.id}: ${validation.reason}`);
    return 1;
  }

  const out = await scaffoldOne({
    challenge,
    reviewer: validation.reviewer,
    challengeDimension: validation.dimension,
    methodologyVersion,
    dryRun,
    noPriorFill,
  });

  if (dryRun) {
    console.log(out);
    return 0;
  }

  console.log(`Scaffolded draft: ${out}`);
  const today = new Date().toISOString().slice(0, 10);
  printNextSteps(challenge, today);
  return 0;
}

const exitCode = await main();
process.exit(exitCode);
