import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isCurator } from "./curator";

/**
 * Tests for `isCurator(login)` env-var allowlist parsing (Unit 12.3).
 *
 * Each test sets `LOP_CURATOR_LOGINS` per its case; `afterEach` restores
 * the original env so tests are isolated.
 */

const ENV_KEY = "LOP_CURATOR_LOGINS";

describe("isCurator", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env[ENV_KEY];
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = originalEnv;
    }
  });

  it("returns false when login is null", () => {
    process.env[ENV_KEY] = "bettyguo";
    expect(isCurator(null)).toBe(false);
  });

  it("returns false when login is undefined", () => {
    process.env[ENV_KEY] = "bettyguo";
    expect(isCurator(undefined)).toBe(false);
  });

  it("returns false when login is empty string", () => {
    process.env[ENV_KEY] = "bettyguo";
    expect(isCurator("")).toBe(false);
  });

  it("returns false when env var is unset", () => {
    delete process.env[ENV_KEY];
    expect(isCurator("bettyguo")).toBe(false);
  });

  it("returns false when env var is empty", () => {
    process.env[ENV_KEY] = "";
    expect(isCurator("bettyguo")).toBe(false);
  });

  it("returns true when login is in single-value allowlist", () => {
    process.env[ENV_KEY] = "bettyguo";
    expect(isCurator("bettyguo")).toBe(true);
  });

  it("returns true when login is in CSV allowlist", () => {
    process.env[ENV_KEY] = "bettyguo,jikun,otherperson";
    expect(isCurator("jikun")).toBe(true);
  });

  it("returns false when login is not in CSV allowlist", () => {
    process.env[ENV_KEY] = "bettyguo,jikun";
    expect(isCurator("noncurator")).toBe(false);
  });

  it("trims whitespace around CSV tokens", () => {
    process.env[ENV_KEY] = " bettyguo , jikun , otherperson ";
    expect(isCurator("jikun")).toBe(true);
    expect(isCurator("bettyguo")).toBe(true);
  });

  it("is case-sensitive (matches users.githubLogin per ADR-0012 D-E)", () => {
    process.env[ENV_KEY] = "bettyguo";
    expect(isCurator("BettyGuo")).toBe(false);
    expect(isCurator("BETTYGUO")).toBe(false);
  });

  it("ignores empty tokens between commas", () => {
    process.env[ENV_KEY] = "bettyguo,,jikun,";
    expect(isCurator("jikun")).toBe(true);
  });
});
