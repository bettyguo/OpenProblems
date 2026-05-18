import { NoopModerator } from "./noop";
import type { ContentModerator } from "./types";

/**
 * Content-moderation factory per
 * [ADR-0024](../../docs/adr/0024-content-moderation.md) D-E.
 *
 * Reads `process.env.MODERATION_PROVIDER`; dispatches to the
 * corresponding `ContentModerator` implementation; caches the
 * returned instance per-process (lazy singleton; mirrors
 * `lib/email/` Resend-client lazy-init pattern Phase 30 established).
 *
 * Recognized values:
 *
 *   - unset / empty-string / `"noop"` → `NoopModerator` default.
 *
 * Future values (Phase 36+; not recognized at Phase 35 ship):
 *   - `"openai"` → `OpenAIModerator`
 *   - `"perspective"` → `PerspectiveModerator`
 *   - `"regex-wordlist"` → `RegexWordlistModerator`
 *   - `"custom"` → curator-injected module path
 *
 * Unknown values throw at first `getModerator()` call (not at module
 * load) with a clear message listing recognized values. The throw is
 * deliberate per ADR-0024 D-E: a curator who typos
 * `MODERATION_PROVIDER=openni` would otherwise silently fall through
 * to noop — the wrong default for a mis-typed enforcement intent.
 *
 * Server-only: this module composes server-side providers (future
 * providers will import Node SDKs). Never include in a `"use client"`
 * boundary. Preserves the Phase 9+ First Load JS 103 kB invariant.
 */

let moderatorInstance: ContentModerator | null = null;

export function getModerator(): ContentModerator {
  if (moderatorInstance) return moderatorInstance;

  const provider = process.env["MODERATION_PROVIDER"] ?? "";

  switch (provider) {
    case "":
    case "noop":
      moderatorInstance = new NoopModerator();
      return moderatorInstance;
    default:
      throw new Error(
        `Unknown MODERATION_PROVIDER value: "${provider}". ` +
          `Recognized values at this build: "noop" (default). ` +
          `Phase 36+ providers will extend this list — see ADR-0024 D-G.`,
      );
  }
}

/**
 * Test-only reset hook for the lazily-initialized moderator
 * singleton per [ADR-0024](../../docs/adr/0024-content-moderation.md)
 * D-F.
 *
 * Mirrors the `lib/email/__resetResendClientForTests()` Phase-30
 * pattern. Vitest tests need per-suite env-var control; this hook
 * clears the cached singleton so subsequent `getModerator()` calls
 * re-read `process.env.MODERATION_PROVIDER`.
 *
 * Not exported via a "test-only" runtime convention because Phase 35
 * has no test/index runtime split; callers in production code should
 * not invoke this.
 */
export function __resetModeratorForTests(): void {
  moderatorInstance = null;
}

export { NoopModerator } from "./noop";
export type { ContentModerator, ModerationContext, ModerationResult } from "./types";
