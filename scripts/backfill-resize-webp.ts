#!/usr/bin/env tsx
/**
 * Unit 24.1 — `backfill-resize-webp` CLI.
 *
 *   pnpm backfill-resize-webp [--dry-run]
 *
 * Retroactively applies the Phase-24 resize + WebP transcode pipeline
 * (per [ADR-0019](../docs/adr/0019-image-transcoding.md) D-F) to existing
 * Vercel Blob avatars uploaded BEFORE the Phase-24 deploy date (Phase
 * 16-23 originals + any rows whose `imageOverride` URL still points at
 * a non-resized Vercel Blob avatar). Closes the ADR-0019 D-F
 * inheritance contract for the resizing + WebP format-conversion path
 * (one of the four anticipated Phase-20+ extensions D-F documented).
 *
 * Manual curator invocation — NOT a server action / API route / cron job.
 * Run `--dry-run` first to inventory affected rows + log expected
 * mutations; then run without flags to execute.
 *
 * Per-row pipeline (mirrors Phase-24 `lib/storage/putAvatar`):
 *
 *   1. `fetch(url)` → `Buffer.from(await response.arrayBuffer())`
 *      — download the original blob from Vercel Blob.
 *   2. `sharp(buffer).rotate().resize({...}).webp({...}).toBuffer()`
 *      — apply EXIF Orientation (ADR-0019 D-D), resize to 512×512
 *      square cover-fit (Phase-24 D-3), re-encode as WebP at
 *      quality 85 (Phase-24 D-3).
 *   3. `put(<new-key>, outputBuffer, { contentType: "image/webp" })`
 *      — upload to a new Vercel Blob key
 *      (`avatars/<userId>-<ts>-resize.webp` per D-13; immutable URLs
 *      force a new key; `-resize` suffix distinguishes from Phase-20's
 *      `-backfill` so both backfill cycles coexist).
 *   4. `UPDATE user SET imageOverride = <new-url> WHERE id = <userId>`
 *      — point the row at the resized blob.
 *   5. `del(<old-url>)`
 *      — best-effort cleanup of the original blob.
 *
 * Phase-24 scope cap (per `docs/thinking/24.0-phase-24-prep.md` D-3 + D-4):
 * - `--dry-run` only flag this phase.
 * - Serial-row processing (for loop); no concurrency / batching.
 * - Per-row try/catch; one bad row doesn't kill the batch.
 * - Idempotent re-run: re-processing an already-resized blob produces
 *   functionally-equivalent output (slight pixel difference from re-
 *   encoding rounding; acceptable per Phase-19 D-1 caveat).
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

const SCRIPT_NAME = "backfill-resize-webp";

/**
 * Phase-24 resize + WebP parameters (must match `AVATAR_SIZE` +
 * `WEBP_QUALITY` constants in `lib/storage/index.ts`). Inlined here
 * rather than imported to keep the script self-contained for
 * operator inspection.
 */
const AVATAR_SIZE = 512;
const WEBP_QUALITY = 85;

/**
 * Vercel Blob URL pattern from ADR-0017 D-A — `https://<store>.public.blob.vercel-storage.com/avatars/<userId>-<timestamp>(-suffix)?.<ext>`.
 * Matches Phase-16 originals + Phase-20 `-backfill` outputs + Phase-24
 * `-resize` outputs (any ext: jpg/jpeg/png/webp). Filters out
 * non-Vercel-Blob `imageOverride` values.
 */
const VERCEL_BLOB_AVATAR_URL =
  /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/avatars\/.+\.(jpg|jpeg|png|webp)$/i;

interface CliArgs {
  dryRun: boolean;
  userId?: string;
}

function parseArgs(argv: string[]): CliArgs | { help: true } {
  let dryRun = false;
  let userId: string | undefined;
  for (const a of argv) {
    if (a === "--help" || a === "-h") return { help: true };
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (a.startsWith("--user-id=")) {
      userId = a.slice("--user-id=".length);
      if (!userId) throw new Error("--user-id requires a value");
      continue;
    }
    throw new Error(`Unknown argument: ${a}`);
  }
  const result: CliArgs = { dryRun };
  if (userId !== undefined) result.userId = userId;
  return result;
}

function printHelp(): void {
  console.log(`Usage: pnpm ${SCRIPT_NAME} [--dry-run] [--user-id=<id>]

Retroactively applies Phase-24 resize + WebP transcode (ADR-0019 D-F)
to existing Vercel Blob avatars (rows in 'user' where imageOverride
IS NOT NULL and URL matches the Vercel Blob avatar pattern).

Output is always 512x512 WebP at quality 85. New storage key shape:
avatars/<userId>-<timestamp>-resize.webp (the -resize suffix
distinguishes from Phase-20's -backfill outputs in Vercel Blob
console).

Flags:
  --dry-run        Inventory affected rows + log expected mutations; do
                   NOT download / resize / upload / update / delete.
                   Run this FIRST to verify scope before executing.
  --user-id=<id>   Phase-25 D-6: scope retroactive resize to a single
                   user (e.g., user reports broken avatar; surgical
                   re-run). Defends against accidental full-batch run.
                   Stackable with --dry-run.
  --help, -h       Show this help text and exit.

Exit codes:
  0  All matched rows processed successfully (or 0 rows matched).
  1  At least one row failed (others still processed).

See docs/adr/0019-image-transcoding.md D-F for context.
`);
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
  outputBytes: number;
}

async function backfillRow(row: BackfillRow): Promise<BackfillResult> {
  const response = await fetch(row.originalUrl);
  if (!response.ok) {
    throw new Error(`fetch ${row.originalUrl} → HTTP ${response.status}`);
  }
  const inputBuffer = Buffer.from(await response.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE, fit: "cover" })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const key = `avatars/${row.userId}-${Date.now()}-resize.webp`;
  const { url: newUrl } = await put(key, outputBuffer, {
    access: "public",
    contentType: "image/webp",
  });

  await db.update(users).set({ imageOverride: newUrl }).where(eq(users.id, row.userId));

  await del(row.originalUrl);

  return {
    userId: row.userId,
    originalUrl: row.originalUrl,
    newUrl,
    originalBytes: inputBuffer.byteLength,
    outputBytes: outputBuffer.byteLength,
  };
}

async function main(): Promise<number> {
  const parsed = parseArgs(process.argv.slice(2));
  if ("help" in parsed) {
    printHelp();
    return 0;
  }
  const { dryRun, userId } = parsed;

  const startedAt = new Date().toISOString();
  console.log(
    `${SCRIPT_NAME} — ${startedAt}${dryRun ? " (DRY RUN)" : ""}${userId ? ` (--user-id=${userId})` : ""}`,
  );

  const candidateRows = await db
    .select({ id: users.id, imageOverride: users.imageOverride })
    .from(users)
    .where(isNotNull(users.imageOverride));

  const affected: BackfillRow[] = candidateRows
    .filter((r): r is { id: string; imageOverride: string } => typeof r.imageOverride === "string")
    .filter((r) => VERCEL_BLOB_AVATAR_URL.test(r.imageOverride))
    .filter((r) => (userId === undefined ? true : r.id === userId))
    .map((r) => ({ userId: r.id, originalUrl: r.imageOverride }));

  console.log(`  candidate rows (imageOverride IS NOT NULL): ${candidateRows.length}`);
  console.log(
    `  affected rows (Vercel Blob avatar pattern${userId ? ` + user-id filter` : ""}): ${affected.length}`,
  );

  if (affected.length === 0) {
    console.log("\nNothing to do.");
    return 0;
  }

  if (dryRun) {
    console.log("\nDRY RUN — rows that WOULD be resize-WebP-backfilled:");
    for (const row of affected) {
      console.log(`  [${row.userId}] ${row.originalUrl}`);
    }
    console.log(
      `\nRe-run without --dry-run to execute. Per-row pipeline: fetch → sharp.rotate().resize({${AVATAR_SIZE}, ${AVATAR_SIZE}, "cover"}).webp({${WEBP_QUALITY}}).toBuffer() → put(<new-key>) → UPDATE user → del(<old-url>).`,
    );
    return 0;
  }

  const ok: BackfillResult[] = [];
  const failed: { userId: string; originalUrl: string; error: string }[] = [];

  for (const row of affected) {
    try {
      const result = await backfillRow(row);
      ok.push(result);
      const savedBytes = result.originalBytes - result.outputBytes;
      console.log(
        `  ✓ [${result.userId}] ${result.originalUrl} → ${result.newUrl} (${result.originalBytes} → ${result.outputBytes} bytes; ${savedBytes >= 0 ? "-" : "+"}${Math.abs(savedBytes)} bytes)`,
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
