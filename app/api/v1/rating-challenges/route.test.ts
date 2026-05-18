import { beforeEach, describe, expect, it, vi } from "vitest";

import { problems } from "#site/content";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/rating-challenges", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rating-challenges")>();
  return {
    ...actual,
    submitChallenge: vi.fn(),
  };
});
vi.mock("@/lib/moderation", () => ({
  getModerator: vi.fn(() => ({
    moderateText: vi.fn(async () => ({ ok: true })),
    moderateImage: vi.fn(async () => ({ ok: true })),
  })),
}));

const { auth } = await import("@/lib/auth");
const { submitChallenge } = await import("@/lib/rating-challenges");
const { getModerator } = await import("@/lib/moderation");
const { POST } = await import("./route");

const realSlug = problems[0]!.slug;
const validRationale =
  "I think this rating is wrong because the recent papers show clear progress on multiple benchmarks across the standard task family.";

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/v1/rating-challenges", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(auth).mockReset();
  vi.mocked(submitChallenge).mockReset().mockResolvedValue({ id: "challenge-uuid" });
});

describe("POST /api/v1/rating-challenges", () => {
  it("returns 401 with `unauthenticated` body when auth() returns null", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(makeReq({}));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthenticated" });
    expect(submitChallenge).not.toHaveBeenCalled();
  });

  describe("with authenticated session", () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    });

    it("returns 400 problemSlug when slug is not in content", async () => {
      const res = await POST(
        makeReq({
          problemSlug: "definitely-not-a-real-slug",
          dimension: "difficulty",
          proposedValue: "A",
          rationale: validRationale,
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.field).toBe("problemSlug");
      expect(submitChallenge).not.toHaveBeenCalled();
    });

    it("returns 400 dimension when dimension is unknown", async () => {
      const res = await POST(
        makeReq({
          problemSlug: realSlug,
          dimension: "not-a-real-dimension",
          proposedValue: "A",
          rationale: validRationale,
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.field).toBe("dimension");
      expect(submitChallenge).not.toHaveBeenCalled();
    });

    it("returns 400 proposedValue when difficulty grade is invalid", async () => {
      const res = await POST(
        makeReq({
          problemSlug: realSlug,
          dimension: "difficulty",
          proposedValue: "Z",
          rationale: validRationale,
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.field).toBe("proposedValue");
    });

    it("returns 400 proposedValue when saturation is out of range", async () => {
      const res = await POST(
        makeReq({
          problemSlug: realSlug,
          dimension: "saturation",
          proposedValue: "150",
          rationale: validRationale,
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.field).toBe("proposedValue");
    });

    it("returns 400 proposedValue when stars-based dimension is out of range", async () => {
      const res = await POST(
        makeReq({
          problemSlug: realSlug,
          dimension: "value",
          proposedValue: "9",
          rationale: validRationale,
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.field).toBe("proposedValue");
    });

    it("returns 400 rationale when rationale is too short", async () => {
      const res = await POST(
        makeReq({
          problemSlug: realSlug,
          dimension: "value",
          proposedValue: "4",
          rationale: "Too short.",
        }),
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.field).toBe("rationale");
    });

    it("returns 201 with the new challenge on success", async () => {
      const res = await POST(
        makeReq({
          problemSlug: realSlug,
          dimension: "saturation",
          proposedValue: "42",
          rationale: validRationale,
        }),
      );
      expect(res.status).toBe(201);
      await expect(res.json()).resolves.toEqual({
        id: "challenge-uuid",
        slug: realSlug,
        dimension: "saturation",
        status: "submitted",
      });
      expect(submitChallenge).toHaveBeenCalledWith({
        userId: "user-1",
        problemSlug: realSlug,
        dimension: "saturation",
        proposedValue: "42",
        rationale: validRationale,
      });
    });

    it("accepts saturation = 'N/A' per ADR-0006", async () => {
      const res = await POST(
        makeReq({
          problemSlug: realSlug,
          dimension: "saturation",
          proposedValue: "N/A",
          rationale: validRationale,
        }),
      );
      expect(res.status).toBe(201);
    });

    it("returns 422 moderation-refused on rationale block (ADR-0024 D-D rating-challenge surface)", async () => {
      vi.mocked(getModerator).mockReturnValueOnce({
        moderateText: vi.fn(async () => ({
          ok: false,
          severity: "block",
          reasons: ["rationale policy violation"],
        })),
        moderateImage: vi.fn(async () => ({ ok: true })),
      });
      const res = await POST(
        makeReq({
          problemSlug: realSlug,
          dimension: "saturation",
          proposedValue: "42",
          rationale: validRationale,
        }),
      );
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe("moderation-refused");
      expect(body.field).toBe("rationale");
      expect(body.message).toBe("rationale policy violation");
      expect(submitChallenge).not.toHaveBeenCalled();
    });
  });
});
