import { describe, expect, it } from "vitest";

import { extractGithubLogin, PROVIDER_IDS, type ProviderId } from "./link-account";

/**
 * Tests for `extractGithubLogin` + `PROVIDER_IDS` per
 * [ADR-0020 D-B + D-D](../../docs/adr/0020-multi-provider-oauth.md).
 *
 * The provider-ids constant is the single source of truth for the
 * configured-provider count + ordering; tests guard against drift
 * (third provider sneaking in without ADR amendment per ADR-0020
 * D-B; ordering reversal breaking sign-in UI per ADR-0020 D-F).
 *
 * `extractGithubLogin` encodes ADR-0020 D-D's GitHub-only curator-of-
 * record gate; tests guard against (a) non-GitHub providers accidentally
 * populating `users.githubLogin` (Google sign-in must NOT touch this
 * field); (b) malformed GitHub profile shapes silently failing.
 */

describe("PROVIDER_IDS", () => {
  it("contains exactly 2 providers at Phase 28 close", () => {
    // ADR-0020 D-B: provider count exactly 2; third+ requires ADR
    // amendment. This test is the regression guard against accidental
    // drift via a `providers: [...]` array edit without ADR update.
    expect(PROVIDER_IDS).toHaveLength(2);
  });

  it("is ordered [github, google]", () => {
    // ADR-0020 D-B: GitHub first, Google second. Sign-in UI button
    // order in `<AuthControl>` tracks this; reversal would break the
    // Phase-9 user expectation.
    expect(PROVIDER_IDS[0]).toBe("github");
    expect(PROVIDER_IDS[1]).toBe("google");
  });

  it("types ProviderId as union of the configured ids", () => {
    // Compile-time assertion via assignability. If a third provider
    // is added to the const array without updating downstream code,
    // this still compiles — but the count + order tests above will
    // fail, forcing the ADR amendment loop.
    const a: ProviderId = "github";
    const b: ProviderId = "google";
    expect(a).toBe("github");
    expect(b).toBe("google");
  });
});

describe("extractGithubLogin", () => {
  const validGithubProfile = { login: "octocat", id: 12345, name: "The Octocat" };
  const validGoogleProfile = { email: "u@example.org", name: "User", picture: "https://..." };
  const userWithId = { id: "u-abc-123" };

  it("returns login when github provider + valid profile + user.id", () => {
    const result = extractGithubLogin({ provider: "github" }, validGithubProfile, userWithId);
    expect(result).toEqual({ userId: "u-abc-123", githubLogin: "octocat" });
  });

  it("returns null when account.provider is google (Phase-28 D-D guard)", () => {
    // ADR-0020 D-D: Google sign-in does NOT populate users.githubLogin.
    // This is the critical regression guard for the curator-of-record
    // model preservation.
    const result = extractGithubLogin({ provider: "google" }, validGoogleProfile, userWithId);
    expect(result).toBeNull();
  });

  it("returns null when account.provider is unknown future provider", () => {
    // Defensive: if ADR-0020 D-B is ever amended to add gitlab/email-link/
    // passkeys, those provider sign-ins must also NOT touch githubLogin
    // until the ADR explicitly opens that surface (Q74).
    const result = extractGithubLogin({ provider: "gitlab" }, { username: "x" }, userWithId);
    expect(result).toBeNull();
  });

  it("returns null when profile.login is missing", () => {
    const result = extractGithubLogin(
      { provider: "github" },
      { id: 12345, name: "No login here" },
      userWithId,
    );
    expect(result).toBeNull();
  });

  it("returns null when profile.login is not a string", () => {
    // GitHub never returns a non-string login, but Auth.js v5 types
    // profile as `User | AdapterUser` which doesn't narrow the shape.
    const result = extractGithubLogin(
      { provider: "github" },
      { login: 99999, id: 12345 },
      userWithId,
    );
    expect(result).toBeNull();
  });

  it("returns null when user.id is undefined", () => {
    const result = extractGithubLogin({ provider: "github" }, validGithubProfile, {});
    expect(result).toBeNull();
  });

  it("returns null when profile is null", () => {
    const result = extractGithubLogin({ provider: "github" }, null, userWithId);
    expect(result).toBeNull();
  });

  it("returns null when profile is a non-object primitive", () => {
    const result = extractGithubLogin({ provider: "github" }, "octocat", userWithId);
    expect(result).toBeNull();
  });
});
