import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("#site/content", () => ({
  problems: [
    { slug: "alpha", editorial: { primary_curator: "bettyguo", last_curated: "2026-05-14" } },
    { slug: "beta", editorial: { primary_curator: "BettyGuo", last_curated: "2026-05-15" } },
    { slug: "gamma", editorial: { primary_curator: "jikun", last_curated: "2026-05-16" } },
    { slug: "delta", editorial: { primary_curator: "bettyguo", last_curated: "2026-05-17" } },
  ],
}));

const { db } = await import("@/lib/db");
const { getCuratorOfRecordSlugs, getProfileActivity, getPublicProfileByHandle } =
  await import("./index");

/**
 * Builds a chainable Drizzle query stub for `getPublicProfileByHandle`.
 * Mimics `.select().from().where().limit()` returning `rows`.
 */
function profileQuery(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
}

/**
 * Builds a chainable Drizzle query stub for `getProfileActivity`'s
 * `.select().from().where()` count queries (no `.limit()`; `where()`
 * itself is the awaited tail).
 */
function countQuery(n: number) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ n }]),
  };
}

describe("getPublicProfileByHandle", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset();
  });

  it("returns the row when DB matches the handle exactly", async () => {
    const fakeRow = {
      userId: "u-1",
      githubLogin: "BettyGuo",
      name: "Betty G.",
      image: "https://github.com/avatar.png",
      createdAt: new Date("2026-05-14"),
    };
    vi.mocked(db.select).mockReturnValueOnce(profileQuery([fakeRow]) as never);

    const profile = await getPublicProfileByHandle("BettyGuo");
    expect(profile).toEqual(fakeRow);
  });

  it("preserves canonical case when URL case differs (ADR-0015 D-B case-insensitive lookup)", async () => {
    const fakeRow = {
      userId: "u-1",
      githubLogin: "BettyGuo", // canonical case from users table
      name: null,
      image: null,
      createdAt: new Date("2026-05-14"),
    };
    vi.mocked(db.select).mockReturnValueOnce(profileQuery([fakeRow]) as never);

    const profile = await getPublicProfileByHandle("bettyguo"); // lowercase URL
    expect(profile?.githubLogin).toBe("BettyGuo"); // canonical wins
  });

  it("returns null when DB returns no rows", async () => {
    vi.mocked(db.select).mockReturnValueOnce(profileQuery([]) as never);
    const profile = await getPublicProfileByHandle("ghost");
    expect(profile).toBeNull();
  });

  it("returns null when the matched row has a NULL githubLogin (Phase-9 retrofit edge)", async () => {
    const fakeRow = {
      userId: "u-1",
      githubLogin: null,
      name: "Pre-Unit-9.6 user",
      image: null,
      createdAt: new Date("2026-05-14"),
    };
    vi.mocked(db.select).mockReturnValueOnce(profileQuery([fakeRow]) as never);

    const profile = await getPublicProfileByHandle("anything");
    expect(profile).toBeNull();
  });

  it("returns null for empty / whitespace handles (defensive)", async () => {
    expect(await getPublicProfileByHandle("")).toBeNull();
    expect(await getPublicProfileByHandle("   ")).toBeNull();
    expect(vi.mocked(db.select)).not.toHaveBeenCalled();
  });
});

describe("getProfileActivity", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset();
  });

  it("returns the three publicly-visible aggregate counts in parallel", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(countQuery(7) as never) // watched
      .mockReturnValueOnce(countQuery(3) as never) // pending
      .mockReturnValueOnce(countQuery(2) as never); // accepted

    const activity = await getProfileActivity("user-1");
    expect(activity).toEqual({
      watchedCount: 7,
      pendingChallengeCount: 3,
      acceptedChallengeCount: 2,
    });
  });

  it("never returns rejected or withdrawn counts (ADR-0015 D-A; Phase-13 Unit 13.0 D-3)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce(countQuery(0) as never)
      .mockReturnValueOnce(countQuery(0) as never)
      .mockReturnValueOnce(countQuery(0) as never);

    const activity = await getProfileActivity("user-1");
    expect(Object.keys(activity).sort()).toEqual([
      "acceptedChallengeCount",
      "pendingChallengeCount",
      "watchedCount",
    ]);
    expect("rejectedCount" in activity).toBe(false);
    expect("withdrawnCount" in activity).toBe(false);
  });

  it("treats missing row shapes as 0 (defensive)", async () => {
    vi.mocked(db.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      } as never)
      .mockReturnValueOnce(countQuery(0) as never)
      .mockReturnValueOnce(countQuery(0) as never);

    const activity = await getProfileActivity("user-1");
    expect(activity.watchedCount).toBe(0);
  });
});

describe("getCuratorOfRecordSlugs", () => {
  it("returns matching slugs case-sensitively (ADR-0015 D-E)", () => {
    expect(getCuratorOfRecordSlugs("bettyguo")).toEqual(["alpha", "delta"]);
  });

  it("matches the alternate-case curator separately (no case-folding)", () => {
    expect(getCuratorOfRecordSlugs("BettyGuo")).toEqual(["beta"]);
  });

  it("returns an empty array when no problem matches the handle", () => {
    expect(getCuratorOfRecordSlugs("nonexistent")).toEqual([]);
  });

  it("returns an empty array for empty / whitespace handles", () => {
    expect(getCuratorOfRecordSlugs("")).toEqual([]);
    expect(getCuratorOfRecordSlugs("   ")).toEqual([]);
  });

  it("matches a single-curator-of-record problem", () => {
    expect(getCuratorOfRecordSlugs("jikun")).toEqual(["gamma"]);
  });
});
