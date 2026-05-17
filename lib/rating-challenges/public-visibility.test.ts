import { describe, expect, it } from "vitest";

import {
  PUBLIC_CHALLENGE_STATUSES,
  TERMINAL_STATUSES,
  isPublicChallengeStatus,
  shouldShowReviewerInfo,
} from "./index";

/**
 * Tests for the Phase-13 public-visibility policy (Unit 13.1) per
 * ADR-0014 D-? + Unit 11.6 Q58 lean + Unit 13.0 D-3.
 *
 * Per-status visibility policy:
 *   submitted    → PUBLIC
 *   under_review → PUBLIC
 *   accepted     → PUBLIC
 *   rejected     → SUBMITTER-ONLY (privacy on editorial decisions)
 *   withdrawn    → SUBMITTER-ONLY (privacy on change-of-mind)
 */

describe("PUBLIC_CHALLENGE_STATUSES", () => {
  it("exports 3 statuses matching the Q58 D-3 visibility policy", () => {
    expect(PUBLIC_CHALLENGE_STATUSES).toEqual(["submitted", "under_review", "accepted"]);
  });

  it("excludes rejected (preserves submitter privacy on editorial decisions)", () => {
    expect((PUBLIC_CHALLENGE_STATUSES as readonly string[]).includes("rejected")).toBe(false);
  });

  it("excludes withdrawn (preserves submitter privacy on change-of-mind)", () => {
    expect((PUBLIC_CHALLENGE_STATUSES as readonly string[]).includes("withdrawn")).toBe(false);
  });

  it("includes accepted (editorial-record-shaped; contributed to rating action)", () => {
    expect((PUBLIC_CHALLENGE_STATUSES as readonly string[]).includes("accepted")).toBe(true);
  });
});

describe("isPublicChallengeStatus", () => {
  it("returns true for submitted", () => {
    expect(isPublicChallengeStatus("submitted")).toBe(true);
  });

  it("returns true for under_review", () => {
    expect(isPublicChallengeStatus("under_review")).toBe(true);
  });

  it("returns true for accepted", () => {
    expect(isPublicChallengeStatus("accepted")).toBe(true);
  });

  it("returns false for rejected", () => {
    expect(isPublicChallengeStatus("rejected")).toBe(false);
  });

  it("returns false for withdrawn", () => {
    expect(isPublicChallengeStatus("withdrawn")).toBe(false);
  });

  it("returns false for unknown values (defensive)", () => {
    expect(isPublicChallengeStatus("not-a-status")).toBe(false);
    expect(isPublicChallengeStatus("")).toBe(false);
  });
});

describe("Visibility partition matches state machine terminals", () => {
  it("public set + private terminals partition all 5 statuses", () => {
    const publicSet = new Set<string>([...PUBLIC_CHALLENGE_STATUSES]);
    const privateTerminals = ["rejected", "withdrawn"]; // accepted is public + terminal
    const allTerminals = new Set<string>([...TERMINAL_STATUSES]);

    // Every status is exactly one of: public or private-terminal.
    for (const s of ["submitted", "under_review", "accepted", "rejected", "withdrawn"]) {
      const inPublic = publicSet.has(s);
      const inPrivateTerminal = privateTerminals.includes(s);
      expect(inPublic !== inPrivateTerminal).toBe(true);
    }

    // The two private terminals are indeed terminal.
    for (const s of privateTerminals) {
      expect(allTerminals.has(s)).toBe(true);
    }

    // `accepted` is BOTH public AND terminal (editorial-record-shaped).
    expect(publicSet.has("accepted")).toBe(true);
    expect(allTerminals.has("accepted")).toBe(true);
  });
});

describe("shouldShowReviewerInfo — Phase-26 D-3 detail-page visibility", () => {
  it("returns true only for accepted (curator deliberation is private until terminal)", () => {
    expect(shouldShowReviewerInfo("accepted")).toBe(true);
  });

  it("returns false for submitted (no review started; reviewer info absent)", () => {
    expect(shouldShowReviewerInfo("submitted")).toBe(false);
  });

  it("returns false for under_review (deliberation in progress; reviewer + notes private)", () => {
    expect(shouldShowReviewerInfo("under_review")).toBe(false);
  });
});
