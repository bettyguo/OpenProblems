import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  del: vi.fn(),
}));

const { del, put } = await import("@vercel/blob");
const { delAvatar, putAvatar } = await import("./index");

describe("putAvatar", () => {
  beforeEach(() => {
    vi.mocked(put).mockReset();
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
    expect(put).toHaveBeenCalledWith(expect.stringMatching(/^avatars\/u-1-\d+\.jpg$/), file, {
      access: "public",
      contentType: "image/jpeg",
    });
  });

  it("uses .png extension for image/png", async () => {
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
      file,
      expect.objectContaining({ contentType: "image/png" }),
    );
  });

  it("uses .webp extension for image/webp", async () => {
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
      file,
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
