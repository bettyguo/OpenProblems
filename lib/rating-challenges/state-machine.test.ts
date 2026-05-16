import { describe, expect, it } from "vitest";

import {
  CHALLENGE_STATUSES,
  TERMINAL_STATUSES,
  isAllowedReviewTransition,
  isAllowedWithdrawal,
  validateReviewNotes,
} from "./index";

/**
 * Pure-function tests for the Phase-12 state machine (Unit 12.3) per
 * ADR-0014 D-A. Exercises `isAllowedReviewTransition` +
 * `isAllowedWithdrawal` + `validateReviewNotes` without touching DB.
 */

describe("CHALLENGE_STATUSES + TERMINAL_STATUSES", () => {
  it("exports 5 status values per ADR-0014 D-A", () => {
    expect(CHALLENGE_STATUSES).toEqual([
      "submitted",
      "under_review",
      "accepted",
      "rejected",
      "withdrawn",
    ]);
  });

  it("marks accepted / rejected / withdrawn as terminal", () => {
    expect(TERMINAL_STATUSES).toEqual(["accepted", "rejected", "withdrawn"]);
  });
});

describe("isAllowedReviewTransition", () => {
  it("submitted → start_review is allowed", () => {
    expect(isAllowedReviewTransition("submitted", "start_review")).toBe(true);
  });

  it("submitted → accept is allowed (fast lane)", () => {
    expect(isAllowedReviewTransition("submitted", "accept")).toBe(true);
  });

  it("submitted → reject is allowed (fast lane)", () => {
    expect(isAllowedReviewTransition("submitted", "reject")).toBe(true);
  });

  it("under_review → accept is allowed", () => {
    expect(isAllowedReviewTransition("under_review", "accept")).toBe(true);
  });

  it("under_review → reject is allowed", () => {
    expect(isAllowedReviewTransition("under_review", "reject")).toBe(true);
  });

  it("under_review → start_review is NOT allowed (no re-entry)", () => {
    expect(isAllowedReviewTransition("under_review", "start_review")).toBe(false);
  });

  it("accepted → any review action is NOT allowed (terminal)", () => {
    expect(isAllowedReviewTransition("accepted", "start_review")).toBe(false);
    expect(isAllowedReviewTransition("accepted", "accept")).toBe(false);
    expect(isAllowedReviewTransition("accepted", "reject")).toBe(false);
  });

  it("rejected → any review action is NOT allowed (terminal)", () => {
    expect(isAllowedReviewTransition("rejected", "start_review")).toBe(false);
    expect(isAllowedReviewTransition("rejected", "accept")).toBe(false);
    expect(isAllowedReviewTransition("rejected", "reject")).toBe(false);
  });

  it("withdrawn → any review action is NOT allowed (terminal)", () => {
    expect(isAllowedReviewTransition("withdrawn", "start_review")).toBe(false);
    expect(isAllowedReviewTransition("withdrawn", "accept")).toBe(false);
    expect(isAllowedReviewTransition("withdrawn", "reject")).toBe(false);
  });
});

describe("isAllowedWithdrawal", () => {
  it("submitted → withdrawn is allowed", () => {
    expect(isAllowedWithdrawal("submitted")).toBe(true);
  });

  it("under_review → withdrawn is allowed (mid-review)", () => {
    expect(isAllowedWithdrawal("under_review")).toBe(true);
  });

  it("accepted → withdrawn is NOT allowed (terminal)", () => {
    expect(isAllowedWithdrawal("accepted")).toBe(false);
  });

  it("rejected → withdrawn is NOT allowed (terminal)", () => {
    expect(isAllowedWithdrawal("rejected")).toBe(false);
  });

  it("withdrawn → withdrawn is NOT allowed (already terminal)", () => {
    expect(isAllowedWithdrawal("withdrawn")).toBe(false);
  });
});

describe("validateReviewNotes", () => {
  it("returns null for valid notes on accept", () => {
    expect(validateReviewNotes("Accepted because evidence is strong.", "accept")).toBe(null);
  });

  it("returns null for valid notes on reject", () => {
    expect(validateReviewNotes("Rejected because evidence is weak.", "reject")).toBe(null);
  });

  it("returns null for empty notes on start_review", () => {
    expect(validateReviewNotes("", "start_review")).toBe(null);
  });

  it("returns null for whitespace-only notes on start_review", () => {
    expect(validateReviewNotes("   \n  ", "start_review")).toBe(null);
  });

  it("errors when accept notes are empty", () => {
    const error = validateReviewNotes("", "accept");
    expect(error).toMatch(/required/i);
  });

  it("errors when accept notes are whitespace only", () => {
    const error = validateReviewNotes("   \t\n  ", "accept");
    expect(error).toMatch(/required/i);
  });

  it("errors when reject notes are empty", () => {
    const error = validateReviewNotes("", "reject");
    expect(error).toMatch(/required/i);
  });

  it("errors when notes exceed 4000 chars", () => {
    const longNotes = "x".repeat(4001);
    const error = validateReviewNotes(longNotes, "accept");
    expect(error).toMatch(/4000 characters/);
  });

  it("accepts exactly 4000 chars", () => {
    const notes = "x".repeat(4000);
    expect(validateReviewNotes(notes, "accept")).toBe(null);
  });
});
