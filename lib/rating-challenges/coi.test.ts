import { describe, expect, it } from "vitest";

import { problems } from "#site/content";

import { getCoIStatus } from "./coi";

/**
 * Tests for `getCoIStatus(reviewerLogin, problemSlug, submitterLogin)`
 * Phase-12 simplified §8.6 COI surface (Unit 12.3). Per ADR-0014 D-C.
 */

const realProblem = problems[0]!;
const realSlug = realProblem.slug;
const primaryCurator = realProblem.editorial.primary_curator;

describe("getCoIStatus", () => {
  describe("self-review (hard block)", () => {
    it("blocks when reviewer = submitter", () => {
      const status = getCoIStatus("alice", realSlug, "alice");
      expect(status.blocked).toBe(true);
      expect(status.reason).toBe("self-review");
      expect(status.warning).toMatch(/own challenge/i);
    });

    it("does NOT block when submitterLogin is null (Phase-9 retrofit edge)", () => {
      const status = getCoIStatus("alice", realSlug, null);
      expect(status.blocked).toBe(false);
    });

    it("is case-sensitive on the login match", () => {
      const status = getCoIStatus("alice", realSlug, "Alice");
      expect(status.blocked).toBe(false);
    });
  });

  describe("primary-curator (soft warn)", () => {
    it("warns but does NOT block when reviewer is the problem's primary_curator", () => {
      const status = getCoIStatus(primaryCurator, realSlug, "someone-else");
      expect(status.blocked).toBe(false);
      expect(status.reason).toBe("primary-curator");
      expect(status.warning).toMatch(/authored/i);
    });

    it("does NOT warn when reviewer is unrelated to the problem", () => {
      const status = getCoIStatus("unrelated-curator", realSlug, "someone-else");
      expect(status.blocked).toBe(false);
      expect(status.reason).toBe(null);
      expect(status.warning).toBeUndefined();
    });

    it("does NOT warn when problemSlug is unknown (orphan-row tolerant)", () => {
      const status = getCoIStatus("any-curator", "definitely-not-a-real-slug", "someone-else");
      expect(status.blocked).toBe(false);
      expect(status.reason).toBe(null);
    });
  });

  describe("priority ordering", () => {
    it("self-review takes precedence over primary-curator", () => {
      // If reviewer is BOTH the submitter AND the primary_curator, the
      // self-review hard block wins (more conservative).
      const status = getCoIStatus(primaryCurator, realSlug, primaryCurator);
      expect(status.blocked).toBe(true);
      expect(status.reason).toBe("self-review");
    });
  });
});
