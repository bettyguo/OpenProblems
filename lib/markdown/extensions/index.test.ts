import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { __resetRegistryForTests, DefaultExtensionRegistry, getExtensionRegistry } from "./index";

beforeEach(() => {
  __resetRegistryForTests();
});

afterEach(() => {
  __resetRegistryForTests();
});

describe("getExtensionRegistry (factory)", () => {
  it("returns a DefaultExtensionRegistry instance Phase 37", () => {
    expect(getExtensionRegistry()).toBeInstanceOf(DefaultExtensionRegistry);
  });

  it("caches the singleton across calls", () => {
    const a = getExtensionRegistry();
    const b = getExtensionRegistry();
    expect(a).toBe(b);
  });

  it("__resetRegistryForTests clears the singleton so subsequent calls return a fresh instance", () => {
    const first = getExtensionRegistry();
    __resetRegistryForTests();
    const second = getExtensionRegistry();
    expect(first).not.toBe(second);
    expect(second).toBeInstanceOf(DefaultExtensionRegistry);
  });

  it("default registry returns empty extension sets for all four surfaces (factory smoke test)", () => {
    const r = getExtensionRegistry();
    expect(r.getExtensions("bio")).toEqual({});
    expect(r.getExtensions("reviewNotes")).toEqual({});
    expect(r.getExtensions("rationale")).toEqual({});
    expect(r.getExtensions("actionRationale")).toEqual({});
  });
});
