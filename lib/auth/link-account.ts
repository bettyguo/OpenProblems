/**
 * Pure helpers backing the NextAuth `linkAccount` event in
 * `lib/auth/index.ts`. Factored out Phase 28 (Unit 28.2) so the
 * provider-gated `githubLogin` extraction logic + the configured
 * provider list stay unit-testable without instantiating the
 * NextAuth runtime (which initializes the Drizzle adapter at module
 * load and requires DB connectivity).
 *
 * Per [ADR-0020 D-B](../../docs/adr/0020-multi-provider-oauth.md)
 * the project ships exactly two OAuth providers at Phase 28 close:
 * GitHub first, Google second. The ordering is load-bearing — sign-in
 * UI button order tracks this list.
 *
 * Per ADR-0020 D-D the curator-of-record gate remains GitHub-only:
 * `users.githubLogin` is populated only when `account.provider ===
 * "github"`. {@link extractGithubLogin} encodes this rule + the
 * GitHub-profile-`login`-field narrowing previously inline in
 * `lib/auth/index.ts`.
 */

/**
 * Identifiers of OAuth providers configured in the
 * `providers: [...]` array of `NextAuth({...})`. Order matches
 * `lib/auth/index.ts`'s `providers` array exactly.
 *
 * Phase 28 expands this from `["github"]` to `["github", "google"]`
 * per ADR-0020 D-B. Adding a third (GitLab, email-link, passkeys,
 * etc.) requires an ADR-0020 amendment or new ADR per D-B.
 */
export const PROVIDER_IDS = ["github", "google"] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

/**
 * Narrows a NextAuth `linkAccount` event payload into the GitHub
 * `@handle` to persist on `users.githubLogin`, returning null when:
 *
 *   - The triggering account is from a non-GitHub provider (Phase 28
 *     adds Google; Phase 29+ may add others). Per ADR-0020 D-D the
 *     curator-of-record gate stays GitHub-only.
 *   - The GitHub profile lacks the `login` field (shouldn't happen
 *     in practice — GitHub always returns `login` — but Auth.js v5
 *     types `profile` as `User | AdapterUser` which loses the
 *     provider-specific shape, so we narrow defensively).
 *   - The `user.id` is missing (Auth.js generates it before
 *     `linkAccount` fires, so this is a defensive guard).
 *
 * Caller in `lib/auth/index.ts` `events.linkAccount` runs the DB
 * `UPDATE users SET github_login = <result> WHERE id = <user.id>`
 * only when this returns a non-null value.
 *
 * @param account `{ provider: string }` — narrowed to provider id.
 * @param profile The provider profile payload (NextAuth's
 *   `events.linkAccount({ profile })`). For GitHub, carries `login`.
 * @param user `{ id: string | undefined }` — the linked user row.
 * @returns The GitHub login string when account.provider === "github"
 *   AND profile.login is a string AND user.id is set; otherwise null.
 */
export function extractGithubLogin(
  account: { provider: string },
  profile: unknown,
  user: { id?: string | undefined },
): { userId: string; githubLogin: string } | null {
  if (account.provider !== "github") return null;
  if (!user.id) return null;
  if (typeof profile !== "object" || profile === null) return null;
  const providerProfile = profile as Record<string, unknown>;
  const rawLogin = providerProfile.login;
  const login = typeof rawLogin === "string" ? rawLogin : null;
  if (!login) return null;
  return { userId: user.id, githubLogin: login };
}
