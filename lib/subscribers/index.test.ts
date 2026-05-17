import { describe, expect, it } from "vitest";

import {
  canonicalizeEmail,
  generateToken,
  parseDomainSubscriptions,
  safeCompareTokens,
  serializeDomainSubscriptions,
  subscriberSubscribesToDomain,
  validateEmail,
} from "./index";

/**
 * Pure-function tests for `lib/subscribers/index.ts` per
 * [ADR-0021](../../docs/adr/0021-subscriber-list-email.md).
 *
 * DB-helper tests (`createOrRefreshPendingSubscription`,
 * `verifyByToken`, `unsubscribeByToken`) require live DB or full
 * mocking; deferred to Phase-31+ integration test scope (B.20).
 * Phase 30 ships pure-function coverage that exercises the canonical-
 * form + token-shape + timing-safe-comparison contracts.
 */

describe("canonicalizeEmail", () => {
  it("lowercases the email", () => {
    expect(canonicalizeEmail("Test@Example.COM")).toBe("test@example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(canonicalizeEmail("  user@example.com  ")).toBe("user@example.com");
  });

  it("combines trim + lowercase", () => {
    expect(canonicalizeEmail("\tFoo@Bar.Org\n")).toBe("foo@bar.org");
  });
});

describe("validateEmail", () => {
  it("accepts standard addresses", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("first.last+tag@subdomain.example.co.uk")).toBe(true);
  });

  it("rejects empty / overlong", () => {
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("a".repeat(255))).toBe(false);
  });

  it("rejects malformed shapes", () => {
    expect(validateEmail("plainstring")).toBe(false);
    expect(validateEmail("@nolocal.com")).toBe(false);
    expect(validateEmail("nodomain@")).toBe(false);
    expect(validateEmail("no@dots")).toBe(false);
  });
});

describe("generateToken", () => {
  it("returns a URL-safe base64 string", () => {
    const tok = generateToken();
    expect(tok).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns ~43 chars for 32 random bytes (base64url, no padding)", () => {
    // 32 bytes → 43 base64url chars (no padding for URL-safe variant).
    const tok = generateToken();
    expect(tok.length).toBeGreaterThanOrEqual(42);
    expect(tok.length).toBeLessThanOrEqual(44);
  });

  it("generates distinct tokens on each call (256-bit entropy)", () => {
    const toks = new Set<string>();
    for (let i = 0; i < 100; i++) toks.add(generateToken());
    expect(toks.size).toBe(100);
  });
});

describe("safeCompareTokens", () => {
  it("returns true for identical tokens", () => {
    expect(safeCompareTokens("abc123", "abc123")).toBe(true);
  });

  it("returns false for different same-length tokens", () => {
    expect(safeCompareTokens("abc123", "abc124")).toBe(false);
  });

  it("returns false for length mismatch (without throwing)", () => {
    expect(safeCompareTokens("abc", "abcdefg")).toBe(false);
  });

  it("returns true for two empty strings", () => {
    expect(safeCompareTokens("", "")).toBe(true);
  });
});

describe("parseDomainSubscriptions", () => {
  it("parses valid JSON string array", () => {
    expect(parseDomainSubscriptions('["general-ml","applications"]')).toEqual([
      "general-ml",
      "applications",
    ]);
  });

  it("returns empty array on malformed JSON", () => {
    expect(parseDomainSubscriptions("not-json")).toEqual([]);
  });

  it("returns empty array on non-array JSON", () => {
    expect(parseDomainSubscriptions('{"foo":"bar"}')).toEqual([]);
  });

  it("filters non-string elements", () => {
    expect(parseDomainSubscriptions('["a",42,"b",null,"c"]')).toEqual(["a", "b", "c"]);
  });
});

describe("serializeDomainSubscriptions", () => {
  it("dedupes and sorts for canonical form", () => {
    expect(serializeDomainSubscriptions(["applications", "general-ml", "applications"])).toBe(
      '["applications","general-ml"]',
    );
  });

  it("filters empty / whitespace-only entries", () => {
    expect(serializeDomainSubscriptions(["a", "", "  ", "b"])).toBe('["a","b"]');
  });

  it("trims surrounding whitespace per entry", () => {
    expect(serializeDomainSubscriptions(["  general-ml  ", "applications"])).toBe(
      '["applications","general-ml"]',
    );
  });

  it("returns [] for all-empty input", () => {
    expect(serializeDomainSubscriptions([])).toBe("[]");
    expect(serializeDomainSubscriptions(["", "  "])).toBe("[]");
  });
});

describe("subscriberSubscribesToDomain", () => {
  it("returns true when the domain is in the subscription list", () => {
    expect(subscriberSubscribesToDomain('["general-ml","applications"]', "general-ml")).toBe(true);
    expect(subscriberSubscribesToDomain('["general-ml","applications"]', "applications")).toBe(
      true,
    );
  });

  it("returns false when the domain is not in the subscription list", () => {
    expect(subscriberSubscribesToDomain('["general-ml"]', "applications")).toBe(false);
    expect(subscriberSubscribesToDomain('["general-ml"]', "deep-learning")).toBe(false);
  });

  it("returns false when the subscription JSON is malformed", () => {
    expect(subscriberSubscribesToDomain("not-json", "general-ml")).toBe(false);
    expect(subscriberSubscribesToDomain('{"foo":"bar"}', "general-ml")).toBe(false);
  });

  it("returns false when the domain arg is empty / whitespace", () => {
    expect(subscriberSubscribesToDomain('["general-ml"]', "")).toBe(false);
    expect(subscriberSubscribesToDomain('["general-ml"]', "   ")).toBe(false);
  });

  it("tolerates surrounding whitespace on the domain arg", () => {
    expect(subscriberSubscribesToDomain('["general-ml"]', "  general-ml  ")).toBe(true);
  });

  it("returns false for an empty subscription array", () => {
    expect(subscriberSubscribesToDomain("[]", "general-ml")).toBe(false);
  });
});
