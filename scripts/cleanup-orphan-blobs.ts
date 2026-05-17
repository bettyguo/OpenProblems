#!/usr/bin/env tsx
/**
 * Unit 21.1 — `cleanup-orphan-blobs` CLI.
 *
 *   pnpm cleanup-orphan-blobs [--dry-run]
 *
 * Reconciles Vercel Blob storage against the `users.imageOverride` DB column
 * to identify and delete orphan avatar blobs. **DB is the source of truth**;
 * any blob in `avatars/*` that is NOT referenced by a `users.imageOverride`
 * row is an orphan and can be safely deleted.
 *
 * Sources of orphan blobs (closed by this script):
 *   - Phase-16 delete-on-replace failures (network timeout between `put`
 *     of new blob and `del` of old).
 *   - Phase-20 backfill creating a new blob per row AND best-effort-deleting
 *     the original (failed `del()` leaves an orphan).
 *   - Account-deletion cascades that DROP the DB row without deleting the
 *     blob (Phase 16-21 deletion path is DB-row-only; Vercel Blob is not
 *     touched).
 *   - Manual `imageOverride` clears via `updateProfileImage` action
 *     (overwrite with NULL or new URL leaks the previous blob if `del()`
 *     fails).
 *
 * Manual curator invocation — NOT a server action / API route / cron job.
 * Run `--dry-run` first to enumerate orphans without deleting; then run
 * without flags to execute.
 *
 * Per-run 5-phase pipeline:
 *
 *   1. **Enumerate**: `list({ prefix: "avatars/", limit: 1000, cursor })`
 *      paginated until `hasMore === false`. Vercel Blob `list()` API v2.
 *   2. **Snapshot DB**: `SELECT id, imageOverride FROM user WHERE imageOverride IS NOT NULL`
 *      → `Set<string>` of in-use URLs. Single query; cached for the
 *      duration of the run. Snapshot-at-start posture (mitigation: run
 *      during low-traffic windows; `--dry-run` first).
 *   3. **Detect orphans**: for each listed blob, `blob.url ∉ inUseUrls`
 *      → orphan. Pathname-pattern filter narrows to
 *      `avatars/<userId>-<timestamp>(-backfill)?.<ext>` shapes.
 *   4. **Delete**: `del(<orphan-url>)` with per-blob try/catch.
 *      Idempotent on already-deleted (Vercel Blob `del` is no-op).
 *   5. **Summary**: log enumerated / in-use / orphan / deleted / failed
 *      counts; exit 0 on success or 0 orphans, 1 if any `del()` failed.
 *
 * Server-only — depends on `BLOB_READ_WRITE_TOKEN` (Q69; authorizes both
 * `list()` + `del()`) + `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` (Q55)
 * at runtime.
 *
 * Continues the Phase-20 `backfill-exif-strip.ts` operational-script-
 * keystone pattern. No new ADR / no new env var / no new dep / no new
 * vitest test.
 */
import { isNotNull } from "drizzle-orm";
import { del, list } from "@vercel/blob";
import process from "node:process";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const SCRIPT_NAME = "cleanup-orphan-blobs";
const LIST_PREFIX = "avatars/";
const LIST_PAGE_LIMIT = 1000;

/**
 * Avatar pathname pattern matching both Phase-16 + Phase-20 shapes:
 *   - `avatars/<userId>-<timestamp>.<ext>`           (Phase-16 putAvatar)
 *   - `avatars/<userId>-<timestamp>-backfill.<ext>`  (Phase-20 backfill)
 *
 * Narrows cleanup scope to avatar blobs only; defends against future
 * non-avatar Vercel Blob usage (Phase-22+ uploaded content).
 */
const AVATAR_PATHNAME = /^avatars\/.+\.(jpg|jpeg|png|webp)$/i;

interface CliArgs {
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs | { help: true } {
  let dryRun = false;
  for (const a of argv) {
    if (a === "--help" || a === "-h") return { help: true };
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    throw new Error(`Unknown argument: ${a}`);
  }
  return { dryRun };
}

function printHelp(): void {
  console.log(`Usage: pnpm ${SCRIPT_NAME} [--dry-run]

Reconciles Vercel Blob storage against the users.imageOverride DB column;
deletes avatar blobs that are NOT referenced by any user row (orphans).

DB is the source of truth; storage is the side-effect.

Flags:
  --dry-run    Enumerate + snapshot + detect; log orphans WITHOUT deleting.
               Run this FIRST to verify scope before executing.
  --help, -h   Show this help text and exit.

Exit codes:
  0  All orphans deleted successfully (or 0 orphans found).
  1  At least one del() failed (others still processed).

Sources of orphan blobs closed by this script:
  - Phase-16 delete-on-replace failures.
  - Phase-20 backfill best-effort-del() failures.
  - Account-deletion cascades that drop DB row but not blob.
  - Manual imageOverride clears with failed del().

See docs/thinking/21.0-phase-21-prep.md for context.
`);
}

interface OrphanCandidate {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
}

async function enumerateAvatarBlobs(): Promise<OrphanCandidate[]> {
  const allBlobs: OrphanCandidate[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({
      prefix: LIST_PREFIX,
      limit: LIST_PAGE_LIMIT,
      ...(cursor ? { cursor } : {}),
    });
    for (const blob of page.blobs) {
      if (AVATAR_PATHNAME.test(blob.pathname)) {
        allBlobs.push({
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
        });
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return allBlobs;
}

async function snapshotInUseUrls(): Promise<Set<string>> {
  const rows = await db
    .select({ imageOverride: users.imageOverride })
    .from(users)
    .where(isNotNull(users.imageOverride));
  const set = new Set<string>();
  for (const r of rows) {
    if (typeof r.imageOverride === "string") set.add(r.imageOverride);
  }
  return set;
}

async function main(): Promise<number> {
  const parsed = parseArgs(process.argv.slice(2));
  if ("help" in parsed) {
    printHelp();
    return 0;
  }
  const { dryRun } = parsed;

  const startedAt = new Date().toISOString();
  console.log(`${SCRIPT_NAME} — ${startedAt}${dryRun ? " (DRY RUN)" : ""}`);

  // Phase 1: enumerate; Phase 2: snapshot DB (parallel-safe).
  const [blobs, inUseUrls] = await Promise.all([enumerateAvatarBlobs(), snapshotInUseUrls()]);

  console.log(`  enumerated avatar blobs: ${blobs.length}`);
  console.log(`  DB-in-use imageOverride URLs: ${inUseUrls.size}`);

  // Phase 3: detect orphans.
  const orphans = blobs.filter((b) => !inUseUrls.has(b.url));
  console.log(`  orphans detected: ${orphans.length}`);

  if (orphans.length === 0) {
    console.log("\nNothing to do.");
    return 0;
  }

  if (dryRun) {
    console.log("\nDRY RUN — orphans that WOULD be deleted:");
    for (const o of orphans) {
      console.log(`  [${o.pathname}] [${o.size} bytes] [uploaded ${o.uploadedAt.toISOString()}]`);
    }
    console.log(`\nRe-run without --dry-run to execute. Per-blob: del(<orphan-url>).`);
    return 0;
  }

  // Phase 4: delete.
  const deleted: OrphanCandidate[] = [];
  const failed: { orphan: OrphanCandidate; error: string }[] = [];
  for (const orphan of orphans) {
    try {
      await del(orphan.url);
      deleted.push(orphan);
      console.log(`  ✓ deleted [${orphan.pathname}] [${orphan.size} bytes]`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ orphan, error: message });
      console.log(`  ✗ failed  [${orphan.pathname}] — ${message}`);
    }
  }

  // Phase 5: summary.
  console.log("\nSUMMARY");
  console.log(`  enumerated:  ${blobs.length}`);
  console.log(`  in-use (DB): ${inUseUrls.size}`);
  console.log(`  orphans:     ${orphans.length}`);
  console.log(`  deleted:     ${deleted.length}`);
  console.log(`  failed:      ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFAILED ORPHANS");
    for (const f of failed) {
      console.log(`  [${f.orphan.pathname}]`);
      console.log(`    ${f.error}`);
    }
  }

  return failed.length === 0 ? 0 : 1;
}

const exitCode = await main();
process.exit(exitCode);
