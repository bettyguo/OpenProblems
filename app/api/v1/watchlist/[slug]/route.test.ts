import { beforeEach, describe, expect, it, vi } from "vitest";

import { problems } from "#site/content";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));
vi.mock("@/lib/watchlist", () => ({
  addToWatchlist: vi.fn(),
  removeFromWatchlist: vi.fn(),
}));

// Lazy imports so `vi.mock` hoisting runs first.
const { auth } = await import("@/lib/auth");
const { addToWatchlist, removeFromWatchlist } = await import("@/lib/watchlist");
const { POST, DELETE } = await import("./route");

const realSlug = problems[0]!.slug;
const unknownSlug = "definitely-not-a-real-problem-slug";

function ctx(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

beforeEach(() => {
  vi.mocked(auth).mockReset();
  vi.mocked(addToWatchlist).mockReset().mockResolvedValue(undefined);
  vi.mocked(removeFromWatchlist).mockReset().mockResolvedValue(undefined);
});

describe("POST /api/v1/watchlist/[slug]", () => {
  it("returns 401 with `unauthenticated` body when auth() returns null", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(new Request("http://localhost/"), ctx(realSlug));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthenticated" });
    expect(addToWatchlist).not.toHaveBeenCalled();
  });

  it("returns 404 with `unknown-problem` body when slug is not in content", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    const res = await POST(new Request("http://localhost/"), ctx(unknownSlug));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "unknown-problem" });
    expect(addToWatchlist).not.toHaveBeenCalled();
  });

  it("returns 200 with `{ slug, watched: true }` and calls addToWatchlist on success", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    const res = await POST(new Request("http://localhost/"), ctx(realSlug));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ slug: realSlug, watched: true });
    expect(addToWatchlist).toHaveBeenCalledWith("user-1", realSlug);
  });
});

describe("DELETE /api/v1/watchlist/[slug]", () => {
  it("returns 401 with `unauthenticated` body when auth() returns null", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await DELETE(new Request("http://localhost/"), ctx(realSlug));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthenticated" });
    expect(removeFromWatchlist).not.toHaveBeenCalled();
  });

  it("returns 404 with `unknown-problem` body when slug is not in content", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    const res = await DELETE(new Request("http://localhost/"), ctx(unknownSlug));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "unknown-problem" });
    expect(removeFromWatchlist).not.toHaveBeenCalled();
  });

  it("returns 200 with `{ slug, watched: false }` and calls removeFromWatchlist on success", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    const res = await DELETE(new Request("http://localhost/"), ctx(realSlug));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ slug: realSlug, watched: false });
    expect(removeFromWatchlist).toHaveBeenCalledWith("user-1", realSlug);
  });
});
