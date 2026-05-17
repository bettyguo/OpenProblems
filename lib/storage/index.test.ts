import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  del: vi.fn(),
}));

/**
 * `sharp` mock — returns a fluent pipeline where `.rotate()` chains
 * back to the same object and `.toBuffer()` resolves to a fixed
 * sentinel buffer. Tests verify the integration shape per ADR-0019
 * D-C (`sharp(input).rotate().toBuffer()` pipeline placement). The
 * actual EXIF-stripping behavior is sharp's responsibility; verified
 * by integration tests against real fixtures Phase 20+ (per ADR-0019
 * D-E backwards-compat note + Phase-19 scope-cap discipline).
 */
const STRIPPED_BUFFER = Buffer.from("STRIPPED");
const sharpRotate = vi.fn();
const sharpToBuffer = vi.fn().mockResolvedValue(STRIPPED_BUFFER);
const sharpInstance = { rotate: sharpRotate, toBuffer: sharpToBuffer };
sharpRotate.mockReturnValue(sharpInstance);
const sharpFactory = vi.fn().mockReturnValue(sharpInstance);

vi.mock("sharp", () => ({ default: sharpFactory }));

const { del, put } = await import("@vercel/blob");
const { delAvatar, putAvatar } = await import("./index");

describe("putAvatar — Phase-19 ADR-0019 sharp pipeline", () => {
  beforeEach(() => {
    vi.mocked(put).mockReset();
    sharpFactory.mockClear();
    sharpRotate.mockClear();
    sharpToBuffer.mockClear();
    sharpRotate.mockReturnValue(sharpInstance);
    sharpToBuffer.mockResolvedValue(STRIPPED_BUFFER);
  });

  it("transcodes input via sharp(buffer).rotate().toBuffer() before Vercel Blob upload (ADR-0019 D-C + D-D)", async () => {
    vi.mocked(put).mockResolvedValueOnce({
      url: "https://store.public.blob.vercel-storage.com/avatars/u-1-1234.jpg",
      pathname: "avatars/u-1-1234.jpg",
      contentType: "image/jpeg",
      contentDisposition: "",
    } as never);

    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "img.jpg", {
      type: "image/jpeg",
    });
    await putAvatar(file, "u-1");

    // sharp called once with the input buffer.
    expect(sharpFactory).toHaveBeenCalledTimes(1);
    expect(sharpFactory).toHaveBeenCalledWith(expect.any(Buffer));
    // `.rotate()` called once (ADR-0019 D-D auto-rotation preservation).
    expect(sharpRotate).toHaveBeenCalledTimes(1);
    expect(sharpRotate).toHaveBeenCalledWith();
    // `.toBuffer()` called once (ADR-0019 D-B EXIF strip default behavior).
    expect(sharpToBuffer).toHaveBeenCalledTimes(1);
  });

  it("uploads the sharp-stripped buffer (NOT the original file) to Vercel Blob (ADR-0019 D-C)", async () => {
    vi.mocked(put).mockResolvedValueOnce({
      url: "https://store.public.blob.vercel-storage.com/avatars/u-1-9.jpg",
      pathname: "avatars/u-1-9.jpg",
      contentType: "image/jpeg",
      contentDisposition: "",
    } as never);

    const file = new File([new Uint8Array(8)], "img.jpg", { type: "image/jpeg" });
    await putAvatar(file, "u-1");

    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/u-1-\d+\.jpg$/),
      STRIPPED_BUFFER,
      { access: "public", contentType: "image/jpeg" },
    );
  });

  it("uploads JPEG with avatars/<userId>-<timestamp>.jpg storage-key shape (ADR-0017 D-A)", async () => {
    vi.mocked(put).mockResolvedValueOnce({
      url: "https://store.public.blob.vercel-storage.com/avatars/u-1-1234.jpg",
      pathname: "avatars/u-1-1234.jpg",
      contentType: "image/jpeg",
      contentDisposition: "",
    } as never);

    const file = new File([new Uint8Array(8)], "img.jpg", { type: "image/jpeg" });
    const url = await putAvatar(file, "u-1");

    expect(url).toBe("https://store.public.blob.vercel-storage.com/avatars/u-1-1234.jpg");
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/u-1-\d+\.jpg$/),
      STRIPPED_BUFFER,
      { access: "public", contentType: "image/jpeg" },
    );
  });

  it("uses .png extension for image/png; preserves contentType through pipeline", async () => {
    vi.mocked(put).mockResolvedValueOnce({
      url: "https://store.public.blob.vercel-storage.com/avatars/u-2-9.png",
      pathname: "avatars/u-2-9.png",
      contentType: "image/png",
      contentDisposition: "",
    } as never);

    const file = new File([new Uint8Array(8)], "img.png", { type: "image/png" });
    await putAvatar(file, "u-2");

    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/u-2-\d+\.png$/),
      STRIPPED_BUFFER,
      expect.objectContaining({ contentType: "image/png" }),
    );
  });

  it("uses .webp extension for image/webp; preserves contentType through pipeline", async () => {
    vi.mocked(put).mockResolvedValueOnce({
      url: "https://store.public.blob.vercel-storage.com/avatars/u-3-9.webp",
      pathname: "avatars/u-3-9.webp",
      contentType: "image/webp",
      contentDisposition: "",
    } as never);

    const file = new File([new Uint8Array(8)], "img.webp", { type: "image/webp" });
    await putAvatar(file, "u-3");

    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/u-3-\d+\.webp$/),
      STRIPPED_BUFFER,
      expect.objectContaining({ contentType: "image/webp" }),
    );
  });
});

describe("delAvatar", () => {
  beforeEach(() => {
    vi.mocked(del).mockReset();
  });

  it("calls SDK del with the supplied URL (idempotent on already-deleted blobs)", async () => {
    vi.mocked(del).mockResolvedValueOnce(undefined as never);
    const url = "https://store.public.blob.vercel-storage.com/avatars/u-1-1234.jpg";
    await delAvatar(url);
    expect(del).toHaveBeenCalledWith(url);
  });
});
