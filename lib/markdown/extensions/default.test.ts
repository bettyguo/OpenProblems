import { describe, expect, it } from "vitest";

import { DefaultExtensionRegistry } from "./default";

describe("DefaultExtensionRegistry", () => {
  it("returns empty extension set for the bio surface", () => {
    const r = new DefaultExtensionRegistry();
    expect(r.getExtensions("bio")).toEqual({});
  });

  it("returns empty extension set for the reviewNotes surface", () => {
    const r = new DefaultExtensionRegistry();
    expect(r.getExtensions("reviewNotes")).toEqual({});
  });

  it("returns empty extension set for the rationale surface", () => {
    const r = new DefaultExtensionRegistry();
    expect(r.getExtensions("rationale")).toEqual({});
  });

  it("returns empty extension set for the actionRationale surface", () => {
    const r = new DefaultExtensionRegistry();
    expect(r.getExtensions("actionRationale")).toEqual({});
  });

  it("returns a fresh object each call (not a shared mutable reference)", () => {
    const r = new DefaultExtensionRegistry();
    const a = r.getExtensions("bio");
    const b = r.getExtensions("bio");
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
