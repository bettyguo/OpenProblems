/**
 * Curator authorization tier (Unit 12.3) — the project's **second
 * authorization tier** beyond signed-in. Pinned in
 * [ADR-0014](../../docs/adr/0014-curator-review-pipeline.md) D-B.
 *
 * The CSV env var `LOP_CURATOR_LOGINS` defines the curator allowlist.
 * Values are GitHub logins (case-sensitive), matching `users.githubLogin`
 * populated by the Auth.js v5 `events.linkAccount` callback per
 * [ADR-0012](../../docs/adr/0012-auth-provider.md) D-E.
 *
 * `isCurator(login)` returns `true` when the login appears in the
 * allowlist + the allowlist is non-empty. Falsy input (null / undefined /
 * empty) returns `false`.
 *
 * **Why env-var, not DB column** (ADR-0014 D-B rationale):
 * - Bootstrap-friendly: no DB seeding; mirrors Q47 / Q54 / Q55 ops-gate pattern.
 * - Auditable: env changes flow through Vercel deploy logs.
 * - Reversible: revoke = remove from CSV + restart.
 * - Avoids premature DB schema: `curatorRoles` table + admin UI deferred to
 *   Phase 14+ alongside editorial-board ([Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance)) resolution.
 *
 * **Phase-12 scope cap**: per-problem ACLs deferred to Phase 13+;
 * editorial-board model deferred to Phase 14+ alongside Q7 resolution.
 */

const CURATOR_LOGINS_ENV = "LOP_CURATOR_LOGINS";

/**
 * Parses the `LOP_CURATOR_LOGINS` CSV env var. Splits on comma, trims
 * whitespace per token, drops empty tokens. Order-insensitive lookups.
 *
 * Each call re-reads the env var so curator updates take effect on the
 * next request without restart (note: Vercel still requires deploy
 * restart for env-var changes to propagate — the runtime read here is
 * a defense against the parent process holding a stale snapshot).
 */
function readAllowlist(): readonly string[] {
  const csv = process.env[CURATOR_LOGINS_ENV] ?? "";
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isCurator(login: string | null | undefined): boolean {
  if (!login) return false;
  return readAllowlist().includes(login);
}
