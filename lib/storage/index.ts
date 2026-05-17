import { del, put } from "@vercel/blob";

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
 * Public-access by ADR-0017 D-A (avatar images are public on profile
 * pages; private-access mode would require a token-signed URL per render
 * with no win).
 */
export async function putAvatar(file: File, userId: string): Promise<string> {
  const key = `avatars/${userId}-${Date.now()}.${inferExt(file.type)}`;
  const { url } = await put(key, file, {
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
