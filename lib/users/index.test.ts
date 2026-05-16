import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
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
const {
  getCuratorOfRecordSlugs,
  getProfileActivity,
  getPublicProfileByHandle,
  MAX_BIO_CHARS,
  MAX_DISPLAY_NAME_CHARS,
  updateProfile,
  validateBio,
  validateDisplayName,
} = await import("./index");

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
      displayName: null,
      bio: null,
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
      displayName: null,
      bio: null,
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
      displayName: null,
      bio: null,
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

// ---------------------------------------------------------------------------
// Phase-15 user-editable profile fields (Unit 15.3) — per ADR-0016 D-A + D-B.
// ---------------------------------------------------------------------------

describe("validateDisplayName", () => {
  it("accepts the empty string (treated as clear-the-field by updateProfile)", () => {
    expect(validateDisplayName("")).toBeNull();
  });

  it("accepts a normal display name", () => {
    expect(validateDisplayName("Betty G.")).toBeNull();
  });

  it("accepts exactly MAX_DISPLAY_NAME_CHARS chars", () => {
    expect(validateDisplayName("a".repeat(MAX_DISPLAY_NAME_CHARS))).toBeNull();
  });

  it("rejects MAX_DISPLAY_NAME_CHARS + 1 chars", () => {
    expect(validateDisplayName("a".repeat(MAX_DISPLAY_NAME_CHARS + 1))).toMatch(
      /at most 80 characters/,
    );
  });
});

describe("validateBio", () => {
  it("accepts the empty string", () => {
    expect(validateBio("")).toBeNull();
  });

  it("accepts a normal bio with newlines", () => {
    expect(validateBio("PhD student\nWorking on interpretability + alignment.")).toBeNull();
  });

  it("accepts exactly MAX_BIO_CHARS chars", () => {
    expect(validateBio("x".repeat(MAX_BIO_CHARS))).toBeNull();
  });

  it("rejects MAX_BIO_CHARS + 1 chars", () => {
    expect(validateBio("x".repeat(MAX_BIO_CHARS + 1))).toMatch(/at most 280 characters/);
  });
});

describe("updateProfile", () => {
  beforeEach(() => {
    vi.mocked(db.update).mockReset();
  });

  function setupUpdateStub() {
    const set = vi.fn().mockReturnThis();
    const where = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.update).mockReturnValueOnce({ set, where } as never);
    return { set, where };
  }

  it("returns null + writes both fields when both supplied (ADR-0016 D-A)", async () => {
    const { set, where } = setupUpdateStub();
    const err = await updateProfile("user-1", { displayName: "Betty G.", bio: "I'm a PhD." });
    expect(err).toBeNull();
    expect(set).toHaveBeenCalledWith({ displayName: "Betty G.", bio: "I'm a PhD." });
    expect(where).toHaveBeenCalled();
  });

  it("trims whitespace before storing (ADR-0016 D-B)", async () => {
    const { set } = setupUpdateStub();
    await updateProfile("user-1", { displayName: "  Betty G.  ", bio: "  hi  " });
    expect(set).toHaveBeenCalledWith({ displayName: "Betty G.", bio: "hi" });
  });

  it("stores NULL when trimmed value is empty string (ADR-0016 D-B clear-field semantics)", async () => {
    const { set } = setupUpdateStub();
    await updateProfile("user-1", { displayName: "   ", bio: "" });
    expect(set).toHaveBeenCalledWith({ displayName: null, bio: null });
  });

  it("updates only the supplied field when the other is undefined", async () => {
    const { set } = setupUpdateStub();
    await updateProfile("user-1", { displayName: "Betty G." });
    expect(set).toHaveBeenCalledWith({ displayName: "Betty G." });
  });

  it("returns validation error + skips UPDATE when displayName too long", async () => {
    // No setupUpdateStub() — the helper should bail before calling db.update.
    const err = await updateProfile("user-1", {
      displayName: "a".repeat(MAX_DISPLAY_NAME_CHARS + 1),
    });
    expect(err).toMatch(/at most 80 characters/);
    expect(vi.mocked(db.update)).not.toHaveBeenCalled();
  });

  it("returns validation error + skips UPDATE when bio too long", async () => {
    const err = await updateProfile("user-1", { bio: "x".repeat(MAX_BIO_CHARS + 1) });
    expect(err).toMatch(/at most 280 characters/);
    expect(vi.mocked(db.update)).not.toHaveBeenCalled();
  });

  it("is a no-op when no fields are supplied (returns null without DB hit)", async () => {
    const err = await updateProfile("user-1", {});
    expect(err).toBeNull();
    expect(vi.mocked(db.update)).not.toHaveBeenCalled();
  });
});

describe("PublicProfile shape extension (Unit 15.3)", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset();
  });

  it("includes displayName + bio fields in the returned profile (ADR-0016 D-A)", async () => {
    const fakeRow = {
      userId: "u-1",
      githubLogin: "BettyGuo",
      name: "Betty G.",
      image: null,
      createdAt: new Date("2026-05-14"),
      displayName: "Betty",
      bio: "I'm a PhD.",
    };
    vi.mocked(db.select).mockReturnValueOnce(profileQuery([fakeRow]) as never);

    const profile = await getPublicProfileByHandle("BettyGuo");
    expect(profile?.displayName).toBe("Betty");
    expect(profile?.bio).toBe("I'm a PhD.");
  });

  it("preserves null fields for users who haven't edited (defensive)", async () => {
    const fakeRow = {
      userId: "u-1",
      githubLogin: "BettyGuo",
      name: "Betty G.",
      image: null,
      createdAt: new Date("2026-05-14"),
      displayName: null,
      bio: null,
    };
    vi.mocked(db.select).mockReturnValueOnce(profileQuery([fakeRow]) as never);

    const profile = await getPublicProfileByHandle("BettyGuo");
    expect(profile?.displayName).toBeNull();
    expect(profile?.bio).toBeNull();
  });
});
