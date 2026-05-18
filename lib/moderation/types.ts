/**
 * Content-moderation framework types per
 * [ADR-0024](../../docs/adr/0024-content-moderation.md).
 *
 * Framework-only Phase 35: defines the `ContentModerator` interface
 * + `ModerationResult` discriminated union + `ModerationContext`
 * shape. Concrete provider implementations (OpenAI moderation /
 * Perspective / regex-wordlist / custom) deferred to Phase 36+ per
 * ADR-0024 D-H. Default provider Phase 35 = `NoopModerator` in
 * `./noop.ts`.
 *
 * Server-only: callers run inside server actions / API routes /
 * pipeline helpers. Never include in a `"use client"` boundary.
 * Preserves the Phase 9+ First Load JS 103 kB invariant.
 */

/**
 * Discriminated-union result of a moderation decision.
 *
 *   - `{ ok: true }` — content passes; caller proceeds.
 *   - `{ ok: false; severity: "block"; reasons: [...] }` — content
 *     fails policy; caller refuses (HTTP 422 + i18n-keyed error).
 *   - `{ ok: false; severity: "warn"; reasons: [...] }` — content
 *     passes policy but provider flagged a concern; caller may
 *     surface a warning chip without refusing. Phase 35 wiring
 *     treats `warn` as pass-through; per-surface `warn`-aware UX
 *     deferred Phase 36+ per ADR-0024 D-H.
 */
export type ModerationResult =
  | { ok: true }
  | { ok: false; reasons: ReadonlyArray<string>; severity: "block" | "warn" };

/**
 * Per-call context passed to the moderator. Allows future providers
 * to tune per-surface (different threshold for public bio vs
 * subscribe email) and per-actor (e.g., trusted-curator allowlist).
 *
 *   - `surface` is a literal union over the four wired surfaces.
 *   - `userIdOrEmail` is the actor identity — DB `user.id` for
 *     signed-in surfaces (`bio` / `avatar` / `rating-challenge`);
 *     canonical lowercase email for the `subscribe` surface (where
 *     the actor may not be signed in).
 *
 * Additive extensions are non-breaking: future providers may need
 * `policyVersion` / `localeHint` / `trustScore`; add them as
 * optional fields, not as a new union variant.
 */
export interface ModerationContext {
  surface: "bio" | "avatar" | "rating-challenge" | "subscribe";
  userIdOrEmail: string;
}

/**
 * The provider-agnostic moderation interface. All four Phase-35-
 * wired call sites depend on this type, not on any provider's
 * concrete class.
 *
 * Providers that handle only one modality (text-only / image-only)
 * implement the unsupported method as `{ ok: true }` pass-through or
 * throw "unsupported" per their own convention. Phase-35 noop default
 * implements both as pass-through.
 */
export interface ContentModerator {
  moderateText(text: string, ctx: ModerationContext): Promise<ModerationResult>;
  moderateImage(buffer: Buffer, ctx: ModerationContext): Promise<ModerationResult>;
}
