#!/usr/bin/env tsx
/**
 * Unit 20.1 — `backfill-exif-strip` CLI.
 *
 *   pnpm backfill-exif-strip [--dry-run]
 *
 * Retroactively applies the Phase-19 EXIF-stripping pipeline (per
 * [ADR-0019](../docs/adr/0019-image-transcoding.md)) to Phase 16-18 avatars
 * uploaded BEFORE the Phase-19 deploy date (and to any other rows whose
 * `imageOverride` URL still points at a Vercel Blob avatar). Closes the
 * ADR-0019 D-E backwards-compat carryover (*"Backfill script Phase 20+
 * candidate if curator demands retroactive privacy correction"*).
 *
 * Manual curator invocation — NOT a server action / API route / cron job.
 * Run `--dry-run` first to inventory affected rows + log expected mutations;
 * then run without flags to execute.
 *
 * Per-row pipeline (mirrors `lib/storage/putAvatar` from Phase 19):
 *
 *   1. `fetch(url)` → `Buffer.from(await response.arrayBuffer())`
 *      — download the original (with-EXIF) blob from Vercel Blob.
 *   2. `sharp(buffer).rotate().toBuffer()`
 *      — apply EXIF Orientation to pixel data (ADR-0019 D-D), then
 *        re-encode without metadata (ADR-0019 D-B inverted-allow-list).
 *   3. `put(<new-key>, strippedBuffer, ...)`
 *      — upload to a new Vercel Blob key (`avatars/<userId>-<ts>-backfill.<ext>`
 *        per D-10; immutable URLs force a new key).
 *   4. `UPDATE user SET imageOverride = <new-url> WHERE id = <userId>`
 *      — point the row at the stripped blob.
 *   5. `del(<old-url>)`
 *      — best-effort cleanup of the original blob. Idempotent on
 *        already-deleted (Vercel Blob `del` is a no-op).
 *
 * Phase-20 scope cap (per `docs/thinking/20.0-phase-20-prep.md` D-3 + D-4):
 * - `--dry-run` only flag this phase. `--user-id` + `--verbose` Phase 21+
 *   if curator demands.
 * - Serial-row processing (for loop); no concurrency / batching Phase 20.
 * - Per-row try/catch; one bad row doesn't kill the batch — failed rows
 *   logged + skipped + counted in summary; non-zero exit if any failed.
 * - Idempotent re-run: re-stripping an already-stripped blob is a no-op
 *   pixel-wise (sharp produces identical buffer when no EXIF present); the
 *   DB row just gets a fresh URL with the next timestamp. Curator can re-run
 *   without corruption risk.
 *
 * Server-only — depends on `BLOB_READ_WRITE_TOKEN` (Q69) +
 * `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` (Q55) at runtime.
 */
import { eq, isNotNull } from "drizzle-orm";
import { del, put } from "@vercel/blob";
import process from "node:process";
import sharp from "sharp";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const SCRIPT_NAME = "backfill-exif-strip";

/**
 * Vercel Blob URL pattern from ADR-0017 D-A: `https://<store>.public.blob.vercel-storage.com/avatars/<userId>-<timestamp>.<ext>`.
 * Filters out non-Vercel-Blob `imageOverride` values (defends against
 * future S3 / R2 swap surfacing alongside legacy rows).
 */
const VERCEL_BLOB_AVATAR_URL =
  /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/avatars\/.+\.(jpg|jpeg|png|webp)$/i;

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

Retroactively applies Phase-19 EXIF stripping (ADR-0019) to existing
Vercel Blob avatars (rows in 'user' where imageOverride IS NOT NULL and
URL matches the Vercel Blob avatar pattern).

Flags:
  --dry-run    Inventory affected rows + log expected mutations; do NOT
               download / strip / upload / update / delete. Run this
               FIRST to verify scope before executing.
  --help, -h   Show this help text and exit.

Exit codes:
  0  All matched rows processed successfully (or 0 rows matched).
  1  At least one row failed (others still processed).

See docs/adr/0019-image-transcoding.md D-E for context.
`);
}

/**
 * Infer the avatar file extension from a Vercel Blob avatar URL.
 * The URL pattern guarantees one of jpg/jpeg/png/webp; map jpeg → jpg
 * to match `inferExt()` in `lib/storage/index.ts`.
 */
function extFromUrl(url: string): "jpg" | "png" | "webp" {
  const match = url.match(/\.(jpg|jpeg|png|webp)$/i);
  if (!match) {
    // Unreachable: pattern filter above guarantees a match.
    throw new Error(`No avatar extension in URL: ${url}`);
  }
  const ext = match[1]!.toLowerCase();
  return ext === "jpeg" ? "jpg" : (ext as "jpg" | "png" | "webp");
}

function contentTypeForExt(ext: "jpg" | "png" | "webp"): string {
  return ext === "jpg" ? "image/jpeg" : `image/${ext}`;
}

interface BackfillRow {
  userId: string;
  originalUrl: string;
}

interface BackfillResult {
  userId: string;
  originalUrl: string;
  newUrl: string;
  originalBytes: number;
  strippedBytes: number;
}

async function backfillRow(row: BackfillRow): Promise<BackfillResult> {
  const ext = extFromUrl(row.originalUrl);

  const response = await fetch(row.originalUrl);
  if (!response.ok) {
    throw new Error(`fetch ${row.originalUrl} → HTTP ${response.status}`);
  }
  const inputBuffer = Buffer.from(await response.arrayBuffer());
  const strippedBuffer = await sharp(inputBuffer).rotate().toBuffer();

  const key = `avatars/${row.userId}-${Date.now()}-backfill.${ext}`;
  const contentType = contentTypeForExt(ext);
  const { url: newUrl } = await put(key, strippedBuffer, {
    access: "public",
    contentType,
  });

  await db.update(users).set({ imageOverride: newUrl }).where(eq(users.id, row.userId));

  await del(row.originalUrl);

  return {
    userId: row.userId,
    originalUrl: row.originalUrl,
    newUrl,
    originalBytes: inputBuffer.byteLength,
    strippedBytes: strippedBuffer.byteLength,
  };
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

  const candidateRows = await db
    .select({ id: users.id, imageOverride: users.imageOverride })
    .from(users)
    .where(isNotNull(users.imageOverride));

  const affected: BackfillRow[] = candidateRows
    .filter((r): r is { id: string; imageOverride: string } => typeof r.imageOverride === "string")
    .filter((r) => VERCEL_BLOB_AVATAR_URL.test(r.imageOverride))
    .map((r) => ({ userId: r.id, originalUrl: r.imageOverride }));

  console.log(`  candidate rows (imageOverride IS NOT NULL): ${candidateRows.length}`);
  console.log(`  affected rows (Vercel Blob avatar pattern): ${affected.length}`);

  if (affected.length === 0) {
    console.log("\nNothing to do.");
    return 0;
  }

  if (dryRun) {
    console.log("\nDRY RUN — rows that WOULD be backfilled:");
    for (const row of affected) {
      console.log(`  [${row.userId}] ${row.originalUrl}`);
    }
    console.log(
      `\nRe-run without --dry-run to execute. Per-row pipeline: fetch → sharp.rotate().toBuffer() → put(<new-key>) → UPDATE user → del(<old-url>).`,
    );
    return 0;
  }

  const ok: BackfillResult[] = [];
  const failed: { userId: string; originalUrl: string; error: string }[] = [];

  for (const row of affected) {
    try {
      const result = await backfillRow(row);
      ok.push(result);
      const savedBytes = result.originalBytes - result.strippedBytes;
      console.log(
        `  ✓ [${result.userId}] ${result.originalUrl} → ${result.newUrl} (${result.originalBytes} → ${result.strippedBytes} bytes; ${savedBytes >= 0 ? "-" : "+"}${Math.abs(savedBytes)} bytes)`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ userId: row.userId, originalUrl: row.originalUrl, error: message });
      console.log(`  ✗ [${row.userId}] ${row.originalUrl} — ${message}`);
    }
  }

  console.log("\nSUMMARY");
  console.log(`  succeeded:  ${ok.length}`);
  console.log(`  failed:     ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFAILED ROWS");
    for (const f of failed) {
      console.log(`  [${f.userId}] ${f.originalUrl}`);
      console.log(`    ${f.error}`);
    }
  }

  return failed.length === 0 ? 0 : 1;
}

const exitCode = await main();
process.exit(exitCode);
