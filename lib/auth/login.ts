import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Resolve a user's GitHub login from the project's `users` table by
 * the Auth.js v5 session `user.id` (UUID). Used by Phase-12 surfaces
 * (curator dashboard route + review API route + detail-page server
 * actions) where the session shape does NOT carry `githubLogin`
 * (Auth.js v5's default `User` type only exposes `id` / `name` /
 * `email` / `image`; `githubLogin` is a project-specific column on
 * `users` populated by [ADR-0012](../../docs/adr/0012-auth-provider.md)
 * D-E's `events.linkAccount` callback).
 *
 * Returns `null` when the user row is missing OR when `githubLogin`
 * is unset (Phase-9 retrofit edge — users who signed in before the
 * `events.linkAccount` callback landed).
 *
 * Extracted from inline helpers in Unit 12.4's route + page so the
 * route tests can mock `@/lib/auth/login` cleanly.
 */
export async function getLoginById(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ githubLogin: users.githubLogin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.githubLogin ?? null;
}

/**
 * Phase-15 sibling of {@link getLoginById} — returns `githubLogin` (URL
 * key) + `displayName` (user-controlled override per
 * [ADR-0016](../../docs/adr/0016-user-editable-profile-fields.md) D-A)
 * + `imageOverride` (Phase-16 user-controlled avatar per
 * [ADR-0017](../../docs/adr/0017-image-storage.md) D-A) in a single
 * query. Used by `SiteHeader` to populate AuthControl's signed-in pill
 * fallback chain (`displayName ?? name ?? email ?? fallback` per
 * ADR-0016 D-E) without an extra round-trip. Image-override field
 * is forward-compat for the Phase-14 Class B avatar-dropdown follow-on;
 * no current consumer renders it in SiteHeader / AuthControl.
 *
 * Returns `null` when the user row is missing (Phase-9 retrofit edge);
 * a present row may have any field `null` independently.
 */
export async function getUserMetadataById(userId: string): Promise<{
  githubLogin: string | null;
  displayName: string | null;
  imageOverride: string | null;
} | null> {
  const [row] = await db
    .select({
      githubLogin: users.githubLogin,
      displayName: users.displayName,
      imageOverride: users.imageOverride,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;
  return {
    githubLogin: row.githubLogin,
    displayName: row.displayName,
    imageOverride: row.imageOverride,
  };
}
