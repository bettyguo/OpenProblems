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
