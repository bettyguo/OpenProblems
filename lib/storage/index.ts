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
 *   the URL is loaded outside of an `<img>` tag. Phase 24+: always
 *   `.webp` (output is always WebP regardless of input MIME).
 */

/**
 * Phase-24 avatar transcode parameters per
 * [ADR-0019](../../docs/adr/0019-image-transcoding.md) D-F:
 * `sharp(buf).rotate().resize(maxSize).webp({ quality }).toBuffer()`.
 *
 * - **AVATAR_SIZE (512px square)**: covers hi-DPI use cases (32-150px
 *   display @ 2-4x) for SiteHeader pill / `/profile` edit form /
 *   `/u/{handle}` cover. Larger than typical avatar render size
 *   (giving headroom) but small enough that bandwidth + storage stay
 *   tight. Phase 25+ if hi-DPI signal demands 768/1024.
 * - **WEBP_QUALITY (85)**: sharp's recommended default per ADR-0019
 *   D-F example. ~70-80% smaller than equivalent JPEG/PNG at
 *   visually-indistinguishable quality. Phase 25+ if observed
 *   quality issue.
 */
const AVATAR_SIZE = 512;
const WEBP_QUALITY = 85;

/**
 * Upload an avatar file to Vercel Blob and return the public URL.
 * Storage-key shape: `avatars/<userId>-<timestamp>.webp`.
 *
 * Per [ADR-0019](../../docs/adr/0019-image-transcoding.md) (Phase
 * 19 + Phase 24), the file passes through a `sharp` transcoding
 * pipeline BEFORE Vercel Blob upload:
 *
 *   1. `Buffer.from(await file.arrayBuffer())` — File → Buffer.
 *   2. `sharp(buffer).rotate()` — auto-rotation per D-D (Phase 19):
 *      reads EXIF Orientation tag (1-8), applies rotation/flip to
 *      pixel data, resets Orientation to 1. iOS portrait shots
 *      render correctly across all clients including those that
 *      ignore EXIF Orientation.
 *   3. `.resize({ width: 512, height: 512, fit: "cover" })` —
 *      Phase-24 resize per D-F: scale + crop to fill the target
 *      square while preserving aspect ratio. Avatars render at
 *      32-150px display; 512px covers hi-DPI without bloat.
 *   4. `.webp({ quality: 85 })` — Phase-24 format conversion per
 *      D-F: re-encode as WebP. ~70-80% smaller than equivalent
 *      JPEG/PNG at visually-indistinguishable quality.
 *   5. `.toBuffer()` — re-encode WITHOUT EXIF metadata per D-B
 *      (Phase 19): sharp's default behavior strips ALL EXIF tags.
 *   6. `put(key, strippedBuffer, ...)` — upload to Vercel Blob
 *      with `image/webp` content-type.
 *
 * Input MIME validation (ADR-0017 D-B accepted set: jpg/png/webp)
 * is enforced by the caller (`updateProfileImage` in `lib/users/`)
 * BEFORE reaching this helper. Phase 24 changes only the OUTPUT
 * format (always WebP) — input validation is unchanged.
 *
 * Public-access by ADR-0017 D-A (avatar images are public on
 * profile pages). EXIF stripping (Phase 19) + WebP resize-transcoding
 * (Phase 24) are server-side privacy + bandwidth surfaces; existing
 * Phase 16-23 avatars NOT retroactively processed (D-E backwards-compat
 * decision; retroactive backfill via `pnpm backfill-exif-strip`
 * for EXIF + `pnpm backfill-resize-webp` for resize+WebP).
 */
export async function putAvatar(file: File, userId: string): Promise<string> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE, fit: "cover" })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  const key = `avatars/${userId}-${Date.now()}.webp`;
  const { url } = await put(key, outputBuffer, {
    access: "public",
    contentType: "image/webp",
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
