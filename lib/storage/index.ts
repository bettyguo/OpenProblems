import { del, put } from "@vercel/blob";
import sharp from "sharp";

/**
 * Vercel Blob storage wrapper — first storage layer in project history
 * (Unit 16.3) per [ADR-0017](../../docs/adr/0017-image-storage.md) D-A.
 *
 * Thin wrappers around `@vercel/blob`'s `put` + `del`. Kept deliberately
 * narrow (~3 helpers) so the vendor swap to S3 / R2 stays straightforward
 * if Phase 17+ trigger fires (storage cost crosses $10/month OR
 * vendor-portability becomes load-bearing).
 *
 * Server-only module. Imports `@vercel/blob` which requires
 * `BLOB_READ_WRITE_TOKEN` env var at runtime (Q69 operational gate).
 * Auth.js-style graceful degradation NOT applied here — callers
 * (`updateProfileImage` in `lib/users/`) wrap the failure into a
 * user-visible error message.
 *
 * Storage-key naming per ADR-0017 D-A: `avatars/<userId>-<timestamp>.<ext>`.
 * - `userId` segment enables user-keyed cleanup on account deletion (a
 *   Phase-17+ follow-on; not implemented).
 * - `timestamp` segment prevents CDN cache collisions on rapid replace
 *   (Vercel Blob URLs are CDN-fronted; same key would serve stale bytes).
 * - `ext` segment preserves browser content-type sniffing fallback when
 *   the URL is loaded outside of an `<img>` tag.
 */

/**
 * Accepted MIME → file extension mapping. Mirrors ADR-0017 D-B's
 * accepted-MIME set. Caller has already validated `file.type`
 * against this set via `updateProfileImage` before reaching here.
 */
function inferExt(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin"; // unreachable per upstream validation
  }
}

/**
 * Upload an avatar file to Vercel Blob and return the public URL.
 * Storage-key shape: `avatars/<userId>-<timestamp>.<ext>`.
 *
 * Per [ADR-0019](../../docs/adr/0019-image-transcoding.md) (Phase
 * 19), the file passes through a `sharp` transcoding pipeline
 * BEFORE Vercel Blob upload:
 *
 *   1. `Buffer.from(await file.arrayBuffer())` — File → Buffer.
 *   2. `sharp(buffer).rotate()` — auto-rotation per D-D: reads
 *      EXIF Orientation tag (1-8), applies rotation/flip to pixel
 *      data, resets Orientation to 1. iOS portrait shots render
 *      correctly across all clients including those that ignore
 *      EXIF Orientation.
 *   3. `.toBuffer()` — re-encode WITHOUT EXIF metadata per D-B:
 *      `sharp.toBuffer()`'s default behavior strips ALL EXIF
 *      tags (GPS / camera serial / datetime / software / author /
 *      copyright / comment / etc.). Color profile + dimensions +
 *      encoding settings preserved. No `.withMetadata()` call
 *      Phase 19 — strip everything (conservative privacy default).
 *   4. `put(key, strippedBuffer, ...)` — upload to Vercel Blob.
 *
 * Output format matches input format (`sharp` preserves input
 * format by default when no explicit `.jpeg()/.png()/.webp()` is
 * called); `contentType: file.type` remains correct.
 *
 * Public-access by ADR-0017 D-A (avatar images are public on
 * profile pages; private-access mode would require a token-signed
 * URL per render with no win). EXIF stripping (D-A through D-D)
 * is the privacy-by-default surface per Phase 19; existing Phase
 * 16-18 avatars NOT retroactively processed (D-E backwards-compat
 * decision).
 */
export async function putAvatar(file: File, userId: string): Promise<string> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const strippedBuffer = await sharp(inputBuffer).rotate().toBuffer();
  const key = `avatars/${userId}-${Date.now()}.${inferExt(file.type)}`;
  const { url } = await put(key, strippedBuffer, {
    access: "public",
    contentType: file.type,
  });
  return url;
}

/**
 * Delete a previously-uploaded avatar Blob by its absolute URL.
 * Idempotent on already-deleted blobs (Vercel Blob's `del` is a no-op
 * when the target doesn't exist).
 */
export async function delAvatar(url: string): Promise<void> {
  await del(url);
}
