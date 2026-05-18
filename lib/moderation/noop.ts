import type { ContentModerator, ModerationContext, ModerationResult } from "./types";

/**
 * Default `ContentModerator` implementation per
 * [ADR-0024](../../docs/adr/0024-content-moderation.md) D-D.
 *
 * Both methods return `{ ok: true }` synchronously-wrapped-in-
 * `Promise.resolve()`. Zero API cost, zero latency, zero false-
 * positive rate. This is the active provider when
 * `process.env.MODERATION_PROVIDER` is unset, empty-string, or
 * literal `"noop"` (per factory dispatch in `./index.ts`).
 *
 * Pre-Phase-36 production deploys ship with this provider. Concrete
 * providers (OpenAI moderation / Perspective / regex-wordlist /
 * custom) land Phase 36+ as new files in this directory + new
 * dispatch arms in the factory.
 */
export class NoopModerator implements ContentModerator {
  async moderateText(_text: string, _ctx: ModerationContext): Promise<ModerationResult> {
    return { ok: true };
  }

  async moderateImage(_buffer: Buffer, _ctx: ModerationContext): Promise<ModerationResult> {
    return { ok: true };
  }
}
