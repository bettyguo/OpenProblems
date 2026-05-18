import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/storage", () => ({
  putAvatar: vi.fn(),
  delAvatar: vi.fn(),
}));

vi.mock("@/lib/moderation", () => ({
  getModerator: vi.fn(() => ({
    moderateText: vi.fn(async () => ({ ok: true })),
    moderateImage: vi.fn(async () => ({ ok: true })),
  })),
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
const { delAvatar, putAvatar } = await import("@/lib/storage");
const { getModerator } = await import("@/lib/moderation");
const {
  clearProfileImage,
  getCuratorOfRecordSlugs,
  getProfileActivity,
  getPublicProfileByHandle,
  MAX_BIO_CHARS,
  MAX_DISPLAY_NAME_CHARS,
  MAX_IMAGE_URL_CHARS,
  updateProfile,
  updateProfileImage,
  validateBio,
  validateDisplayName,
  validateImageOverride,
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
      imageOverride: null,
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
      imageOverride: null,
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
      imageOverride: null,
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
      imageOverride: null,
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
      imageOverride: null,
    };
    vi.mocked(db.select).mockReturnValueOnce(profileQuery([fakeRow]) as never);

    const profile = await getPublicProfileByHandle("BettyGuo");
    expect(profile?.displayName).toBeNull();
    expect(profile?.bio).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Phase-16 user-editable image override (Unit 16.3) — per ADR-0017 D-A + D-B + D-F.
// ---------------------------------------------------------------------------

/** Construct a `Uint8Array<ArrayBuffer>` (not `<ArrayBufferLike>`) so it
 *  satisfies `BlobPart` for `new File([bytes], ...)`. TypeScript 5.7+
 *  tightened `new Uint8Array([numbers])` to `Uint8Array<ArrayBufferLike>`
 *  which is incompatible with the `ArrayBuffer`-bound BlobPart. */
function bytes(values: number[]): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(values.length);
  const view = new Uint8Array(buf);
  values.forEach((v, i) => {
    view[i] = v;
  });
  return view;
}

function makeImageFile(mime: string, magic: Uint8Array<ArrayBuffer>, name = "img.bin"): File {
  return new File([magic], name, { type: mime });
}

/** Valid JPEG magic-byte prefix `0xFF 0xD8 0xFF`. */
const JPEG_MAGIC = bytes([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
/** Valid PNG magic-byte prefix `0x89 P N G`. */
const PNG_MAGIC = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
/** Valid WebP magic-byte prefix `RIFF<size>WEBP`. */
const WEBP_MAGIC = bytes([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

const VALID_BLOB_URL = "https://store.public.blob.vercel-storage.com/avatars/u-1-1234.jpg";

describe("validateImageOverride", () => {
  it("accepts empty string (clear-by-empty-submit per ADR-0017 D-B)", () => {
    expect(validateImageOverride("")).toBeNull();
  });

  it("accepts a valid Vercel Blob public URL", () => {
    expect(validateImageOverride(VALID_BLOB_URL)).toBeNull();
  });

  it("rejects http:// URLs (HTTPS required per ADR-0017 D-F)", () => {
    expect(validateImageOverride("http://store.public.blob.vercel-storage.com/x.jpg")).toMatch(
      /Vercel Blob public URL/,
    );
  });

  it("rejects off-allowlist hosts (e.g., evil.com)", () => {
    expect(validateImageOverride("https://evil.com/img.jpg")).toMatch(/Vercel Blob public URL/);
  });

  it("rejects URLs longer than MAX_IMAGE_URL_CHARS", () => {
    const overlong =
      "https://store.public.blob.vercel-storage.com/" + "a".repeat(MAX_IMAGE_URL_CHARS);
    expect(validateImageOverride(overlong)).toMatch(/at most 512 characters/);
  });
});

describe("updateProfileImage", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset();
    vi.mocked(db.update).mockReset();
    vi.mocked(putAvatar).mockReset();
    vi.mocked(delAvatar).mockReset();
  });

  function setupUpdateStub() {
    const set = vi.fn().mockReturnThis();
    const where = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.update).mockReturnValueOnce({ set, where } as never);
    return { set, where };
  }

  function setupExistingImageQuery(currentImageOverride: string | null) {
    vi.mocked(db.select).mockReturnValueOnce(
      profileQuery([{ imageOverride: currentImageOverride }]) as never,
    );
  }

  it("uploads + writes URL on valid JPEG (ADR-0017 D-B happy path)", async () => {
    setupExistingImageQuery(null);
    vi.mocked(putAvatar).mockResolvedValueOnce(VALID_BLOB_URL);
    const { set } = setupUpdateStub();

    const file = makeImageFile("image/jpeg", JPEG_MAGIC);
    const err = await updateProfileImage("user-1", file);

    expect(err).toBeNull();
    expect(putAvatar).toHaveBeenCalledWith(file, "user-1");
    expect(set).toHaveBeenCalledWith({ imageOverride: VALID_BLOB_URL });
    expect(delAvatar).not.toHaveBeenCalled(); // no prior override
  });

  it("rejects SVG MIME (XSS surface per ADR-0017 D-B) before any DB / storage hit", async () => {
    const file = makeImageFile("image/svg+xml", bytes([0x3c, 0x73, 0x76, 0x67]));
    const err = await updateProfileImage("user-1", file);
    expect(err).toMatch(/JPEG, PNG, or WebP/);
    expect(vi.mocked(db.select)).not.toHaveBeenCalled();
    expect(putAvatar).not.toHaveBeenCalled();
  });

  it("rejects empty files", async () => {
    const file = new File([], "empty.jpg", { type: "image/jpeg" });
    const err = await updateProfileImage("user-1", file);
    expect(err).toMatch(/empty/);
    expect(putAvatar).not.toHaveBeenCalled();
  });

  it("rejects files > MAX_IMAGE_BYTES (2 MB cap per ADR-0017 D-B)", async () => {
    const oversize = new File([new Uint8Array(2 * 1024 * 1024 + 1)], "big.jpg", {
      type: "image/jpeg",
    });
    const err = await updateProfileImage("user-1", oversize);
    expect(err).toMatch(/smaller than 2 MB/);
    expect(putAvatar).not.toHaveBeenCalled();
  });

  it("rejects forged MIME (PNG declared but JPEG bytes) via magic-byte check (D-F defense-in-depth)", async () => {
    const file = makeImageFile("image/png", JPEG_MAGIC);
    const err = await updateProfileImage("user-1", file);
    expect(err).toMatch(/do not match its declared format/);
    expect(putAvatar).not.toHaveBeenCalled();
  });

  it("accepts valid PNG magic bytes", async () => {
    setupExistingImageQuery(null);
    vi.mocked(putAvatar).mockResolvedValueOnce(VALID_BLOB_URL);
    setupUpdateStub();

    const file = makeImageFile("image/png", PNG_MAGIC);
    expect(await updateProfileImage("user-1", file)).toBeNull();
  });

  it("accepts valid WebP magic bytes", async () => {
    setupExistingImageQuery(null);
    vi.mocked(putAvatar).mockResolvedValueOnce(VALID_BLOB_URL);
    setupUpdateStub();

    const file = makeImageFile("image/webp", WEBP_MAGIC);
    expect(await updateProfileImage("user-1", file)).toBeNull();
  });

  it("deletes prior Blob after successful replace (delete-on-replace per D-B)", async () => {
    const priorUrl = "https://store.public.blob.vercel-storage.com/avatars/u-1-old.jpg";
    setupExistingImageQuery(priorUrl);
    vi.mocked(putAvatar).mockResolvedValueOnce(VALID_BLOB_URL);
    setupUpdateStub();
    vi.mocked(delAvatar).mockResolvedValueOnce(undefined);

    const file = makeImageFile("image/jpeg", JPEG_MAGIC);
    await updateProfileImage("user-1", file);

    expect(delAvatar).toHaveBeenCalledWith(priorUrl);
  });

  it("tolerates delete-on-replace failure (orphan tolerated per D-B try/finally)", async () => {
    const priorUrl = "https://store.public.blob.vercel-storage.com/avatars/u-1-old.jpg";
    setupExistingImageQuery(priorUrl);
    vi.mocked(putAvatar).mockResolvedValueOnce(VALID_BLOB_URL);
    setupUpdateStub();
    vi.mocked(delAvatar).mockRejectedValueOnce(new Error("Blob 404"));

    const file = makeImageFile("image/jpeg", JPEG_MAGIC);
    // Helper swallows; new URL still lands.
    expect(await updateProfileImage("user-1", file)).toBeNull();
  });
});

describe("clearProfileImage", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset();
    vi.mocked(db.update).mockReset();
    vi.mocked(delAvatar).mockReset();
  });

  function setupUpdateStub() {
    const set = vi.fn().mockReturnThis();
    const where = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.update).mockReturnValueOnce({ set, where } as never);
    return { set, where };
  }

  function setupExistingImageQuery(currentImageOverride: string | null) {
    vi.mocked(db.select).mockReturnValueOnce(
      profileQuery([{ imageOverride: currentImageOverride }]) as never,
    );
  }

  it("writes NULL + deletes Blob when user has a current override", async () => {
    const priorUrl = "https://store.public.blob.vercel-storage.com/avatars/u-1-old.jpg";
    setupExistingImageQuery(priorUrl);
    const { set } = setupUpdateStub();
    vi.mocked(delAvatar).mockResolvedValueOnce(undefined);

    await clearProfileImage("user-1");

    expect(set).toHaveBeenCalledWith({ imageOverride: null });
    expect(delAvatar).toHaveBeenCalledWith(priorUrl);
  });

  it("is a no-op when user has no current override (no UPDATE, no del call)", async () => {
    setupExistingImageQuery(null);
    await clearProfileImage("user-1");
    expect(vi.mocked(db.update)).not.toHaveBeenCalled();
    expect(delAvatar).not.toHaveBeenCalled();
  });

  it("tolerates delete failure on clear (orphan tolerated)", async () => {
    const priorUrl = "https://store.public.blob.vercel-storage.com/avatars/u-1-old.jpg";
    setupExistingImageQuery(priorUrl);
    setupUpdateStub();
    vi.mocked(delAvatar).mockRejectedValueOnce(new Error("Blob 404"));

    // No throw expected.
    await clearProfileImage("user-1");
    expect(delAvatar).toHaveBeenCalledWith(priorUrl);
  });
});

describe("PublicProfile shape extension (Unit 16.3 — imageOverride)", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset();
  });

  it("includes imageOverride field in the returned profile (ADR-0017 D-A + D-E)", async () => {
    const fakeRow = {
      userId: "u-1",
      githubLogin: "BettyGuo",
      name: "Betty G.",
      image: "https://github.com/avatar.png",
      createdAt: new Date("2026-05-14"),
      displayName: null,
      bio: null,
      imageOverride: "https://store.public.blob.vercel-storage.com/avatars/u-1-9.jpg",
    };
    vi.mocked(db.select).mockReturnValueOnce(profileQuery([fakeRow]) as never);

    const profile = await getPublicProfileByHandle("BettyGuo");
    expect(profile?.imageOverride).toBe(
      "https://store.public.blob.vercel-storage.com/avatars/u-1-9.jpg",
    );
  });
});

describe("Content moderation integration (ADR-0024 D-D)", () => {
  beforeEach(() => {
    vi.mocked(db.select).mockReset();
    vi.mocked(db.update).mockReset();
    vi.mocked(putAvatar).mockReset();
    vi.mocked(delAvatar).mockReset();
    vi.mocked(getModerator).mockReset();
    vi.mocked(getModerator).mockReturnValue({
      moderateText: vi.fn(async () => ({ ok: true })),
      moderateImage: vi.fn(async () => ({ ok: true })),
    });
  });

  it("updateProfile returns the moderation reason when bio is blocked (ADR-0024 D-D bio surface)", async () => {
    vi.mocked(getModerator).mockReturnValue({
      moderateText: vi.fn(async () => ({
        ok: false,
        severity: "block",
        reasons: ["bio policy violation"],
      })),
      moderateImage: vi.fn(async () => ({ ok: true })),
    });
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    } as never);

    const err = await updateProfile("u-1", { bio: "some text that the mocked moderator blocks" });
    expect(err).toBe("bio policy violation");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("updateProfileImage returns the moderation reason when avatar is blocked (ADR-0024 D-D avatar surface)", async () => {
    vi.mocked(getModerator).mockReturnValue({
      moderateText: vi.fn(async () => ({ ok: true })),
      moderateImage: vi.fn(async () => ({
        ok: false,
        severity: "block",
        reasons: ["image policy violation"],
      })),
    });
    // Valid PNG magic bytes so the upstream MIME / size / magic checks
    // all pass and execution reaches the moderation gate.
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const file = new File([pngHeader], "avatar.png", { type: "image/png" });

    const err = await updateProfileImage("u-1", file);
    expect(err).toBe("image policy violation");
    expect(putAvatar).not.toHaveBeenCalled();
  });
});
