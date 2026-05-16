import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { problems } from "#site/content";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/auth/login", () => ({
  getLoginById: vi.fn(),
}));
vi.mock("@/lib/rating-challenges", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rating-challenges")>();
  return {
    ...actual,
    getChallengeById: vi.fn(),
    reviewChallenge: vi.fn(),
  };
});

const { auth } = await import("@/lib/auth");
const { getLoginById } = await import("@/lib/auth/login");
const { getChallengeById, reviewChallenge } = await import("@/lib/rating-challenges");
const { POST } = await import("./route");

const ENV_KEY = "LOP_CURATOR_LOGINS";
const realSlug = problems[0]!.slug;
const realChallenge = {
  id: "challenge-1",
  userId: "submitter-1",
  problemSlug: realSlug,
  dimension: "value",
  proposedValue: "4",
  rationale: "some rationale text long enough for the validator gate to pass at all",
  status: "submitted" as const,
  createdAt: new Date("2026-05-01"),
  reviewedAt: null,
  reviewerId: null,
  reviewNotes: null,
  acceptedActionId: null,
};

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/v1/rating-challenges/challenge-1/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ctx = { params: Promise.resolve({ id: "challenge-1" }) };

describe("POST /api/v1/rating-challenges/[id]/review", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env[ENV_KEY];
    process.env[ENV_KEY] = "curator-login";
    vi.mocked(auth).mockReset();
    vi.mocked(getLoginById).mockReset();
    vi.mocked(getChallengeById).mockReset();
    vi.mocked(reviewChallenge)
      .mockReset()
      .mockResolvedValue({ status: "under_review", reviewedAt: null });
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env[ENV_KEY];
    } else {
      process.env[ENV_KEY] = originalEnv;
    }
  });

  it("returns 401 when auth() returns null", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeReq({ action: "start_review" }), ctx);
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthenticated" });
    expect(reviewChallenge).not.toHaveBeenCalled();
  });

  it("returns 403 when signed-in caller is not in curator allowlist", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(getLoginById).mockResolvedValue("not-a-curator");
    const res = await POST(makeReq({ action: "start_review" }), ctx);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "forbidden" });
    expect(reviewChallenge).not.toHaveBeenCalled();
  });

  it("returns 403 when caller has no githubLogin (Phase-9 retrofit edge)", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(getLoginById).mockResolvedValue(null);
    const res = await POST(makeReq({ action: "start_review" }), ctx);
    expect(res.status).toBe(403);
  });

  describe("with curator session", () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "curator-id" } } as never);
      // Reviewer = "curator-login"; submitter login resolved on a second
      // `getLoginById` call. Default both calls to curator-login then
      // override per test where COI differentiation matters.
      vi.mocked(getLoginById)
        .mockResolvedValueOnce("curator-login")
        .mockResolvedValueOnce("submitter-login");
    });

    it("returns 400 when action is invalid", async () => {
      const res = await POST(makeReq({ action: "definitely-not-real" }), ctx);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.field).toBe("action");
    });

    it("returns 400 when accept notes are empty", async () => {
      const res = await POST(makeReq({ action: "accept", notes: "" }), ctx);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.field).toBe("notes");
    });

    it("returns 404 when challenge is not found", async () => {
      vi.mocked(getChallengeById).mockResolvedValue(null);
      const res = await POST(makeReq({ action: "accept", notes: "Looks good." }), ctx);
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual({ error: "not-found" });
    });

    it("returns 409 illegal-transition when status is terminal", async () => {
      vi.mocked(getChallengeById).mockResolvedValue({
        ...realChallenge,
        status: "accepted",
      } as never);
      const res = await POST(makeReq({ action: "accept", notes: "Looks good." }), ctx);
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe("illegal-transition");
      expect(body.from).toBe("accepted");
    });

    it("returns 409 coi-blocked when curator = submitter", async () => {
      // Override second mock call: submitter login matches curator's.
      vi.mocked(getLoginById)
        .mockReset()
        .mockResolvedValueOnce("curator-login") // reviewer lookup
        .mockResolvedValueOnce("curator-login"); // submitter lookup → self-review
      vi.mocked(getChallengeById).mockResolvedValue(realChallenge as never);
      const res = await POST(makeReq({ action: "accept", notes: "Self-review attempt." }), ctx);
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe("coi-blocked");
      expect(body.reason).toBe("self-review");
      expect(reviewChallenge).not.toHaveBeenCalled();
    });

    it("returns 200 on successful start_review (notes optional)", async () => {
      vi.mocked(getChallengeById).mockResolvedValue(realChallenge as never);
      vi.mocked(reviewChallenge).mockResolvedValue({
        status: "under_review",
        reviewedAt: null,
      });
      const res = await POST(makeReq({ action: "start_review", notes: "" }), ctx);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({
        id: "challenge-1",
        status: "under_review",
        reviewedAt: null,
      });
      expect(reviewChallenge).toHaveBeenCalledWith({
        challengeId: "challenge-1",
        reviewerId: "curator-id",
        action: "start_review",
        notes: "",
      });
    });

    it("returns 200 with reviewedAt ISO on successful accept", async () => {
      vi.mocked(getChallengeById).mockResolvedValue(realChallenge as never);
      const reviewedAt = new Date("2026-06-01T00:00:00.000Z");
      vi.mocked(reviewChallenge).mockResolvedValue({
        status: "accepted",
        reviewedAt,
      });
      const res = await POST(makeReq({ action: "accept", notes: "Evidence is strong." }), ctx);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("accepted");
      expect(body.reviewedAt).toBe("2026-06-01T00:00:00.000Z");
    });
  });
});
