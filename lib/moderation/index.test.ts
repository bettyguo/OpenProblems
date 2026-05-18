import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { __resetModeratorForTests, getModerator, NoopModerator } from "./index";

const ORIGINAL_PROVIDER = process.env["MODERATION_PROVIDER"];

beforeEach(() => {
  __resetModeratorForTests();
});

afterEach(() => {
  __resetModeratorForTests();
  if (ORIGINAL_PROVIDER === undefined) {
    delete process.env["MODERATION_PROVIDER"];
  } else {
    process.env["MODERATION_PROVIDER"] = ORIGINAL_PROVIDER;
  }
});

describe("getModerator (factory)", () => {
  it("returns NoopModerator when MODERATION_PROVIDER is unset", () => {
    delete process.env["MODERATION_PROVIDER"];
    expect(getModerator()).toBeInstanceOf(NoopModerator);
  });

  it("returns NoopModerator when MODERATION_PROVIDER is empty-string", () => {
    process.env["MODERATION_PROVIDER"] = "";
    expect(getModerator()).toBeInstanceOf(NoopModerator);
  });

  it("returns NoopModerator when MODERATION_PROVIDER is the literal 'noop'", () => {
    process.env["MODERATION_PROVIDER"] = "noop";
    expect(getModerator()).toBeInstanceOf(NoopModerator);
  });

  it("caches the singleton across calls within the same env", () => {
    process.env["MODERATION_PROVIDER"] = "noop";
    const a = getModerator();
    const b = getModerator();
    expect(a).toBe(b);
  });

  it("throws a clear error on an unknown provider value", () => {
    process.env["MODERATION_PROVIDER"] = "openni";
    expect(() => getModerator()).toThrow(/Unknown MODERATION_PROVIDER/);
    expect(() => getModerator()).toThrow(/openni/);
    expect(() => getModerator()).toThrow(/noop/);
  });

  it("__resetModeratorForTests clears the singleton so subsequent calls re-read env", () => {
    process.env["MODERATION_PROVIDER"] = "noop";
    const first = getModerator();
    __resetModeratorForTests();
    process.env["MODERATION_PROVIDER"] = "";
    const second = getModerator();
    expect(first).not.toBe(second);
    expect(second).toBeInstanceOf(NoopModerator);
  });
});
