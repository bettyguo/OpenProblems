import { describe, expect, it } from "vitest";

import { NoopModerator } from "./noop";
import type { ModerationContext } from "./types";

const bioCtx: ModerationContext = { surface: "bio", userIdOrEmail: "user-123" };
const avatarCtx: ModerationContext = { surface: "avatar", userIdOrEmail: "user-123" };

describe("NoopModerator", () => {
  it("returns ok: true for moderateText regardless of input content", async () => {
    const m = new NoopModerator();
    const empty = await m.moderateText("", bioCtx);
    const benign = await m.moderateText("hello world", bioCtx);
    const adversarial = await m.moderateText(
      "this is the kind of text a real moderator would block",
      bioCtx,
    );
    expect(empty).toEqual({ ok: true });
    expect(benign).toEqual({ ok: true });
    expect(adversarial).toEqual({ ok: true });
  });

  it("returns ok: true for moderateImage regardless of buffer content", async () => {
    const m = new NoopModerator();
    const empty = await m.moderateImage(Buffer.alloc(0), avatarCtx);
    const small = await m.moderateImage(Buffer.from([1, 2, 3, 4]), avatarCtx);
    const big = await m.moderateImage(Buffer.alloc(10_000, 0xff), avatarCtx);
    expect(empty).toEqual({ ok: true });
    expect(small).toEqual({ ok: true });
    expect(big).toEqual({ ok: true });
  });
});
