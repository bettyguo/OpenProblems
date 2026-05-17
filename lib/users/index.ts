import { and, count, eq, inArray, sql } from "drizzle-orm";

import { problems } from "#site/content";

import { db } from "@/lib/db";
import { ratingChallenges, users, watchlist } from "@/lib/db/schema";
import { delAvatar, putAvatar } from "@/lib/storage";

/**
 * Per-user public-profile helpers (Unit 14.2) per
 * [ADR-0015](../../docs/adr/0015-per-user-privacy-model.md).
 *
 * Three pieces:
 *
 *   1. {@link getPublicProfileByHandle} — case-insensitive lookup of a
 *      `users` row by `githubLogin` (ADR-0015 D-B). Returns the canonical
 *      case stored in the DB; URL case is just the link-time choice.
 *      The route caller invokes `notFound()` on null.
 *
 *   2. {@link getProfileActivity} — three parallel COUNT queries
 *      returning the **publicly-visible** activity aggregates per
 *      ADR-0015 D-A: watchlist count + pending-challenges count
 *      (`submitted ∪ under_review`) + accepted-challenges count.
 *      `rejected` + `withdrawn` counts are **never returned** by this
 *      helper — they're submitter-only per Phase-13 Unit 13.0 D-3.
 *
 *   3. {@link getCuratorOfRecordSlugs} — pure-function scan of the
 *      Velite-built `problems` array (`#site/content`) for problems
 *      where `editorial.primary_curator` matches the supplied handle
 *      **case-sensitively** per ADR-0015 D-E. Caller renders a small
 *      badge with the resulting slugs.
 *
 * These helpers know NOTHING about auth — callers (the
 * `/[locale]/u/[handle]` shell page + sub-route) check the session
 * separately if needed (e.g., for the "Edit your profile" CTA that
 * only renders when `session.user.id === profile.userId`).
 *
 * Mirrors the {@link "@/lib/watchlist"} + {@link "@/lib/rating-challenges"}
 * + {@link "@/lib/auth/login"} separation conventions: thin Drizzle /
 * file-scan wrappers; tests mock `@/lib/db` + `#site/content`.
 */

export interface PublicProfile {
  userId: string;
  /** Canonical case from `users.githubLogin` (NOT the URL case). */
  githubLogin: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  /**
   * User-controlled display name override (Phase-15 per
   * [ADR-0016](../../docs/adr/0016-user-editable-profile-fields.md) D-A).
   * Overrides `name` on render via the D-E fallback chain
   * `displayName → name → githubLogin → translated fallback`.
   * Null when user has never set it; null after explicit clear (empty
   * string after trim collapses to NULL per Unit 15.3 `updateProfile`).
   */
  displayName: string | null;
  /**
   * User-controlled plain-text bio (Phase-15 per ADR-0016 D-A + D-F).
   * Max 280 chars; whitespace-pre-wrap rendering; NO markdown / NO HTML
   * / NO link-detection (Q66 candidate Phase 16+). Null when user has
   * never set it OR after explicit clear.
   */
  bio: string | null;
  /**
   * User-controlled image override (Phase-16 per
   * [ADR-0017](../../docs/adr/0017-image-storage.md) D-A). Stores
   * absolute Vercel Blob public URL when set; null otherwise. Overrides
   * `image` on render via the D-E fallback chain
   * `imageOverride → image → fallback initials placeholder`. Null
   * when user has never uploaded OR after explicit clear-by-empty-submit
   * per D-B.
   */
  imageOverride: string | null;
}

export interface ProfileActivity {
  watchedCount: number;
  /** `submitted` + `under_review` per ADR-0015 D-A. */
  pendingChallengeCount: number;
  acceptedChallengeCount: number;
}

/**
 * Single-row fetch by handle (case-insensitive). The `[handle]` URL
 * segment is matched against `users.githubLogin` via
 * `LOWER(githubLogin) = LOWER(?)`. Returns null when no row matches;
 * caller invokes `notFound()`.
 *
 * Per ADR-0015 D-B: no redirect on case mismatch — the URL case the
 * user typed stays in the browser bar; the profile body always renders
 * the canonical case from the matched `users.githubLogin` value.
 *
 * Skips rows where `githubLogin` is NULL (Phase-9 retrofit edge: users
 * who signed in before Unit 9.6's `events.linkAccount` callback are
 * unreachable via handle routing).
 */
export async function getPublicProfileByHandle(handle: string): Promise<PublicProfile | null> {
  const normalized = handle.trim();
  if (!normalized) return null;

  const [row] = await db
    .select({
      userId: users.id,
      githubLogin: users.githubLogin,
      name: users.name,
      image: users.image,
      createdAt: users.createdAt,
      displayName: users.displayName,
      bio: users.bio,
      imageOverride: users.imageOverride,
    })
    .from(users)
    .where(sql`LOWER(${users.githubLogin}) = LOWER(${normalized})`)
    .limit(1);

  if (!row || !row.githubLogin) return null;

  return {
    userId: row.userId,
    githubLogin: row.githubLogin,
    name: row.name,
    image: row.image,
    createdAt: row.createdAt,
    displayName: row.displayName,
    bio: row.bio,
    imageOverride: row.imageOverride,
  };
}

/**
 * Returns publicly-visible activity aggregates for the supplied user
 * per ADR-0015 D-A. Three parallel COUNT queries:
 *
 *   - `watchedCount` — rows in `watchlist` where `userId = ?`.
 *   - `pendingChallengeCount` — rows in `ratingChallenge` where
 *     `userId = ?` AND `status IN ("submitted", "under_review")`.
 *   - `acceptedChallengeCount` — rows in `ratingChallenge` where
 *     `userId = ?` AND `status = "accepted"`.
 *
 * `rejected` + `withdrawn` counts are intentionally NOT returned —
 * Phase-13 Unit 13.0 D-3 + ADR-0015 D-A keep them submitter-only.
 * The user's own `/profile` surface (Phase 10 + 11 + 12) renders
 * full per-status partition; the public `/u/{handle}` surface uses
 * this helper instead.
 */
export async function getProfileActivity(userId: string): Promise<ProfileActivity> {
  const [watchedRow, pendingRow, acceptedRow] = await Promise.all([
    db.select({ n: count() }).from(watchlist).where(eq(watchlist.userId, userId)),
    db
      .select({ n: count() })
      .from(ratingChallenges)
      .where(
        and(
          eq(ratingChallenges.userId, userId),
          inArray(ratingChallenges.status, ["submitted", "under_review"]),
        ),
      ),
    db
      .select({ n: count() })
      .from(ratingChallenges)
      .where(and(eq(ratingChallenges.userId, userId), eq(ratingChallenges.status, "accepted"))),
  ]);

  return {
    watchedCount: watchedRow[0]?.n ?? 0,
    pendingChallengeCount: pendingRow[0]?.n ?? 0,
    acceptedChallengeCount: acceptedRow[0]?.n ?? 0,
  };
}

/**
 * Pure-function scan of the Velite-built `problems` array for problems
 * where `editorial.primary_curator` matches the supplied handle
 * **case-sensitively** per ADR-0015 D-E.
 *
 * Returns problem slugs (empty array on no match). Caller renders a
 * curator-of-record badge with the resulting count + (Phase 15+) an
 * expansion link to a per-curator activity page.
 *
 * Case-sensitivity rationale: `editorial.primary_curator` is a curator-
 * typed string in problem YAML; the canonical case is what the curator
 * chose. Case-insensitive comparison would lose editorial precision.
 * Caller should pass the **canonical case** from
 * `users.githubLogin` (which `getPublicProfileByHandle` returns), NOT
 * the raw URL `[handle]` segment.
 *
 * O(n_problems) cost; cheap at current 10 problems. Velite resolves
 * `#site/content` at build time so `problems` is a static array.
 */
export function getCuratorOfRecordSlugs(handle: string): readonly string[] {
  const trimmed = handle.trim();
  if (!trimmed) return [];
  return problems.filter((p) => p.editorial.primary_curator === trimmed).map((p) => p.slug);
}

// ---------------------------------------------------------------------------
// Phase-15 user-editable profile fields (Unit 15.3) — per ADR-0016 D-A + D-B.
// ---------------------------------------------------------------------------

/**
 * Max length for `users.displayName` per ADR-0016 D-A. Matches GitHub +
 * Bluesky display-name limits.
 */
export const MAX_DISPLAY_NAME_CHARS = 80;

/**
 * Max length for `users.bio` per ADR-0016 D-A. Matches Twitter / X /
 * Bluesky short-form bio limits.
 */
export const MAX_BIO_CHARS = 280;

/**
 * Returns null when the supplied display name is valid (or empty —
 * empty means "clear the field" per D-B), otherwise a human-readable
 * error string. Mirrors Phase-11 `validateProposedValue` shape.
 */
export function validateDisplayName(value: string): string | null {
  if (value.length > MAX_DISPLAY_NAME_CHARS) {
    return `Display name must be at most ${MAX_DISPLAY_NAME_CHARS} characters.`;
  }
  return null;
}

/**
 * Returns null when the supplied bio is valid (or empty — empty means
 * "clear the field" per D-B), otherwise a human-readable error string.
 * Plain text only per D-F; no markdown / HTML / link-detection.
 */
export function validateBio(value: string): string | null {
  if (value.length > MAX_BIO_CHARS) {
    return `Bio must be at most ${MAX_BIO_CHARS} characters.`;
  }
  return null;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
}

/**
 * Atomically update a user's editable profile fields per ADR-0016 D-A
 * + D-B. Per-field semantics:
 *
 *   - **Undefined**: field unchanged (not in UPDATE SET clause).
 *   - **Empty string after trim**: clear the field (store NULL).
 *   - **Valid trimmed string**: stored as-is (within length cap).
 *
 * Returns the validation error string for the first field that fails,
 * or `null` on success. The DB UPDATE happens only after BOTH fields
 * validate; partial writes on validation failure are avoided.
 *
 * Caller (server action on `/profile`) has already verified the
 * session. Helpers know nothing about auth — pass `userId` directly.
 */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<string | null> {
  const set: Partial<{ displayName: string | null; bio: string | null }> = {};

  if (input.displayName !== undefined) {
    const trimmed = input.displayName.trim();
    const error = validateDisplayName(trimmed);
    if (error) return error;
    set.displayName = trimmed.length === 0 ? null : trimmed;
  }

  if (input.bio !== undefined) {
    const trimmed = input.bio.trim();
    const error = validateBio(trimmed);
    if (error) return error;
    set.bio = trimmed.length === 0 ? null : trimmed;
  }

  // No-op when no fields supplied — caller may invoke with empty input.
  if (Object.keys(set).length === 0) return null;

  await db.update(users).set(set).where(eq(users.id, userId));
  return null;
}

// ---------------------------------------------------------------------------
// Phase-16 user-editable image override (Unit 16.3) — per ADR-0017 D-A + D-B
// + D-F. Uploads happen via lib/storage's Vercel Blob wrapper; the DB stores
// only the URL pointer (ADR-0013 D-F USER-STATE-only preserved).
// ---------------------------------------------------------------------------

/**
 * Max length for `users.imageOverride` per ADR-0017 D-F. Conservative
 * cap that accommodates Vercel Blob's public URL format
 * (`https://*.public.blob.vercel-storage.com/<random-hash>-<filename>`)
 * plus any future query-string suffixes.
 */
export const MAX_IMAGE_URL_CHARS = 512;

/**
 * Max upload file size per ADR-0017 D-B. 2 MB is generous for avatar
 * use case (typical PNG ~50-200 KB; 2 MB leaves room for high-res
 * photos pre-resize). Server-side authoritative; client-side
 * `file.size` is a UX-feedback layer.
 */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Accepted MIME types per ADR-0017 D-B. SVG explicitly excluded for
 * XSS surface (SVG can embed `<script>` tags). GIF / animated WebP
 * excluded per D-H "static images only Phase 16".
 */
const ACCEPTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Vercel Blob public URL pattern per ADR-0017 D-F. Matches
 * `https://<subdomain>.public.blob.vercel-storage.com/<path>`. Used by
 * `validateImageOverride` to defend against off-allowlist URLs that
 * skip the upload path (e.g., manually-crafted form submissions).
 */
const VERCEL_BLOB_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/.+/i;

/**
 * Returns null when the supplied image-override URL is valid (or
 * empty — empty means "clear the field" per D-B clear-by-empty-submit),
 * otherwise a human-readable error string. Mirrors
 * `validateDisplayName` / `validateBio` shape.
 *
 * Validation per ADR-0017 D-F:
 *   1. Empty allowed (clear semantics).
 *   2. Length ≤ MAX_IMAGE_URL_CHARS.
 *   3. Matches Vercel Blob public URL pattern (https + host whitelist).
 */
export function validateImageOverride(value: string): string | null {
  if (value.length === 0) return null;
  if (value.length > MAX_IMAGE_URL_CHARS) {
    return `Image URL must be at most ${MAX_IMAGE_URL_CHARS} characters.`;
  }
  if (!VERCEL_BLOB_URL_PATTERN.test(value)) {
    return "Image URL must be a Vercel Blob public URL.";
  }
  return null;
}

/**
 * Defense-in-depth magic-byte check per ADR-0017 D-F. `file.type` is
 * browser-provided and forgeable; this verifies the actual file
 * contents start with the expected signature for the declared MIME.
 *
 * Signatures:
 *   - JPEG: `0xFF 0xD8 0xFF` (any third byte 0xE0..0xEF or similar).
 *   - PNG:  `0x89 0x50 0x4E 0x47` ("\x89PNG").
 *   - WebP: `0x52 0x49 0x46 0x46 ?? ?? ?? ?? 0x57 0x45 0x42 0x50`
 *           ("RIFF<size>WEBP").
 */
async function magicBytesMatchMime(file: File, mime: string): Promise<boolean> {
  const buf = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buf);
  switch (mime) {
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    case "image/webp":
      return (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    default:
      return false;
  }
}

/**
 * Validate + upload + write `users.imageOverride` per ADR-0017 D-B
 * + D-F. Steps:
 *
 *   1. MIME validation (jpeg / png / webp; SVG / others excluded).
 *   2. File size sanity (non-empty; ≤ MAX_IMAGE_BYTES).
 *   3. First-bytes magic-byte check (defense-in-depth against forged
 *      `file.type`).
 *   4. Fetch the user's current `imageOverride` (so we can clean up
 *      the old Blob on successful replace).
 *   5. Upload to Vercel Blob via lib/storage `putAvatar`.
 *   6. Write the new URL to `users.imageOverride`.
 *   7. Best-effort delete of the previous Blob (try/finally; orphan
 *      tolerated on failure per D-B + D-H Class B cleanup follow-on).
 *
 * Returns null on success or a human-readable error string on the
 * first validation failure. Storage failures during upload propagate
 * to the caller (the server action surfaces them in the error banner).
 */
export async function updateProfileImage(userId: string, file: File): Promise<string | null> {
  if (!ACCEPTED_IMAGE_MIME_TYPES.has(file.type)) {
    return "Image must be a JPEG, PNG, or WebP file.";
  }
  if (file.size === 0) {
    return "Image file is empty.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be smaller than 2 MB.";
  }
  if (!(await magicBytesMatchMime(file, file.type))) {
    return "Image file contents do not match its declared format.";
  }

  const [existing] = await db
    .select({ imageOverride: users.imageOverride })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const oldUrl = existing?.imageOverride ?? null;

  const newUrl = await putAvatar(file, userId);
  await db.update(users).set({ imageOverride: newUrl }).where(eq(users.id, userId));

  if (oldUrl) {
    try {
      await delAvatar(oldUrl);
    } catch {
      // Orphan tolerated; abandoned-blob cleanup script (Phase-16
      // Class B follow-on per ADR-0017 D-H) handles reconciliation.
    }
  }

  return null;
}

/**
 * Clear `users.imageOverride` (write NULL) + delete the Blob per
 * ADR-0017 D-B clear-by-empty-submit semantics. No-op when the user
 * has no current override. Mirrors Phase-15 `updateProfile`'s
 * empty-after-trim → NULL pattern for text fields.
 */
export async function clearProfileImage(userId: string): Promise<void> {
  const [existing] = await db
    .select({ imageOverride: users.imageOverride })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const oldUrl = existing?.imageOverride ?? null;

  if (!oldUrl) return;

  await db.update(users).set({ imageOverride: null }).where(eq(users.id, userId));

  try {
    await delAvatar(oldUrl);
  } catch {
    // Orphan tolerated; abandoned-blob cleanup script handles it.
  }
}
