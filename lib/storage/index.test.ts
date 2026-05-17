import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  del: vi.fn(),
}));

/**
 * `sharp` mock — returns a fluent pipeline where `.rotate()`,
 * `.resize()`, and `.webp()` chain back to the same object and
 * `.toBuffer()` resolves to a fixed sentinel buffer. Tests verify the
 * integration shape per ADR-0019 D-C (`sharp(input).rotate().resize().webp().toBuffer()`
 * pipeline placement). The actual EXIF-stripping + resize + WebP
 * encoding is sharp's responsibility; verified by integration tests
 * against real fixtures Phase 25+ (per ADR-0019 D-E + Phase-19 scope-cap).
 *
 * Phase-24 extended the chain with `.resize()` + `.webp()` between
 * Phase-19's `.rotate()` and `.toBuffer()`.
 */
const STRIPPED_BUFFER = Buffer.from("STRIPPED");
const sharpRotate = vi.fn();
const sharpResize = vi.fn();
const sharpWebp = vi.fn();
const sharpToBuffer = vi.fn().mockResolvedValue(STRIPPED_BUFFER);
const sharpInstance = {
  rotate: sharpRotate,
  resize: sharpResize,
  webp: sharpWebp,
  toBuffer: sharpToBuffer,
};
sharpRotate.mockReturnValue(sharpInstance);
sharpResize.mockReturnValue(sharpInstance);
sharpWebp.mockReturnValue(sharpInstance);
const sharpFactory = vi.fn().mockReturnValue(sharpInstance);

vi.mock("sharp", () => ({ default: sharpFactory }));

const { del, put } = await import("@vercel/blob");
const { delAvatar, putAvatar } = await import("./index");

describe("putAvatar — Phase-19 ADR-0019 sharp pipeline + Phase-24 D-F resize+WebP", () => {
  beforeEach(() => {
    vi.mocked(put).mockReset();
    sharpFactory.mockClear();
    sharpRotate.mockClear();
    sharpResize.mockClear();
    sharpWebp.mockClear();
    sharpToBuffer.mockClear();
    sharpRotate.mockReturnValue(sharpInstance);
    sharpResize.mockReturnValue(sharpInstance);
    sharpWebp.mockReturnValue(sharpInstance);
    sharpToBuffer.mockResolvedValue(STRIPPED_BUFFER);
  });

  it("transcodes input via sharp(buffer).rotate().resize().webp().toBuffer() before Vercel Blob upload (ADR-0019 D-C + D-D + D-F)", async () => {
    vi.mocked(put).mockResolvedValueOnce({
      url: "https://store.public.blob.vercel-storage.com/avatars/u-1-1234.webp",
      pathname: "avatars/u-1-1234.webp",
      contentType: "image/webp",
      contentDisposition: "",
    } as never);

    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "img.jpg", {
      type: "image/jpeg",
    });
    await putAvatar(file, "u-1");

    // sharp called once with the input buffer.
    expect(sharpFactory).toHaveBeenCalledTimes(1);
    expect(sharpFactory).toHaveBeenCalledWith(expect.any(Buffer));
    // `.rotate()` called once (ADR-0019 D-D auto-rotation preservation; Phase 19).
    expect(sharpRotate).toHaveBeenCalledTimes(1);
    expect(sharpRotate).toHaveBeenCalledWith();
    // `.resize({ width: 512, height: 512, fit: "cover" })` called once (Phase-24 D-F).
    expect(sharpResize).toHaveBeenCalledTimes(1);
    expect(sharpResize).toHaveBeenCalledWith({ width: 512, height: 512, fit: "cover" });
    // `.webp({ quality: 85 })` called once (Phase-24 D-F).
    expect(sharpWebp).toHaveBeenCalledTimes(1);
    expect(sharpWebp).toHaveBeenCalledWith({ quality: 85 });
    // `.toBuffer()` called once (ADR-0019 D-B EXIF strip default behavior; Phase 19).
    expect(sharpToBuffer).toHaveBeenCalledTimes(1);
  });

  it("uploads the sharp-transcoded buffer (NOT the original file) to Vercel Blob (ADR-0019 D-C)", async () => {
    vi.mocked(put).mockResolvedValueOnce({
      url: "https://store.public.blob.vercel-storage.com/avatars/u-1-9.webp",
      pathname: "avatars/u-1-9.webp",
      contentType: "image/webp",
      contentDisposition: "",
    } as never);

    const file = new File([new Uint8Array(8)], "img.jpg", { type: "image/jpeg" });
    await putAvatar(file, "u-1");

    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/u-1-\d+\.webp$/),
      STRIPPED_BUFFER,
      { access: "public", contentType: "image/webp" },
    );
  });

  it("storage-key extension is always .webp regardless of input JPEG (Phase-24 D-3)", async () => {
    vi.mocked(put).mockResolvedValueOnce({
      url: "https://store.public.blob.vercel-storage.com/avatars/u-1-1234.webp",
      pathname: "avatars/u-1-1234.webp",
      contentType: "image/webp",
      contentDisposition: "",
    } as never);

    const file = new File([new Uint8Array(8)], "img.jpg", { type: "image/jpeg" });
    const url = await putAvatar(file, "u-1");

    expect(url).toBe("https://store.public.blob.vercel-storage.com/avatars/u-1-1234.webp");
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/u-1-\d+\.webp$/),
      STRIPPED_BUFFER,
      { access: "public", contentType: "image/webp" },
    );
  });

  it("storage-key extension is always .webp regardless of input PNG (Phase-24 D-3)", async () => {
    vi.mocked(put).mockResolvedValueOnce({
      url: "https://store.public.blob.vercel-storage.com/avatars/u-2-9.webp",
      pathname: "avatars/u-2-9.webp",
      contentType: "image/webp",
      contentDisposition: "",
    } as never);

    const file = new File([new Uint8Array(8)], "img.png", { type: "image/png" });
    await putAvatar(file, "u-2");

    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(/^avatars\/u-2-\d+\.webp$/),
      STRIPPED_BUFFER,
      expect.objectContaining({ contentType: "image/webp" }),
    );
  });

  it("storage-key extension is always .webp regardless of input WebP (Phase-24 D-3)", async () => {
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
    const url = "https://store.public.blob.vercel-storage.com/avatars/u-1-1234.webp";
    await delAvatar(url);
    expect(del).toHaveBeenCalledWith(url);
  });
});
