import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { extractPdfText, __testing } from "@/lib/curate/pdf-text";

const { defaultPdfUrl } = __testing;

const FAKE_PDF_BYTES = Buffer.from("%PDF-1.4 fake bytes");

function makeMockFetch(payload: Buffer, status = 200): typeof fetch {
  return (async () => ({
    ok: status >= 200 && status < 300,
    status,
    arrayBuffer: async () =>
      payload.buffer.slice(payload.byteOffset, payload.byteOffset + payload.byteLength),
  })) as unknown as typeof fetch;
}

function makeMockParser(text: string, numpages: number) {
  return async (_buffer: Buffer) => ({ text, numpages });
}

describe("defaultPdfUrl", () => {
  it("composes the arxiv PDF host URL", () => {
    expect(defaultPdfUrl("2310.06770")).toBe("https://arxiv.org/pdf/2310.06770");
  });
});

describe("extractPdfText", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "pdf-cache-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("fetches and parses on cache miss", async () => {
    const result = await extractPdfText("2310.06770", {
      cacheDir: tmpDir,
      fetchImpl: makeMockFetch(FAKE_PDF_BYTES),
      parseImpl: makeMockParser("Extracted abstract text.", 18),
    });
    expect(result.text).toBe("Extracted abstract text.");
    expect(result.numPages).toBe(18);
    expect(result.sourceUrl).toBe("https://arxiv.org/pdf/2310.06770");
    expect(result.fetchedFromCache).toBe(false);
  });

  it("writes the parsed text to the cache directory", async () => {
    await extractPdfText("2310.06770", {
      cacheDir: tmpDir,
      fetchImpl: makeMockFetch(FAKE_PDF_BYTES),
      parseImpl: makeMockParser("Hello world", 1),
    });
    const cached = JSON.parse(await readFile(path.join(tmpDir, "2310.06770.json"), "utf-8")) as {
      arxivId: string;
      text: string;
      numPages: number;
      sourceUrl: string;
      fetchedAt: string;
    };
    expect(cached.arxivId).toBe("2310.06770");
    expect(cached.text).toBe("Hello world");
    expect(cached.numPages).toBe(1);
    expect(cached.sourceUrl).toBe("https://arxiv.org/pdf/2310.06770");
    expect(cached.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("reads from the cache on subsequent calls (no network)", async () => {
    let fetchCalls = 0;
    let parseCalls = 0;
    const fetchImpl: typeof fetch = (async (...args: Parameters<typeof fetch>) => {
      fetchCalls += 1;
      return makeMockFetch(FAKE_PDF_BYTES)(...args);
    }) as typeof fetch;
    const parseImpl = async (b: Buffer) => {
      parseCalls += 1;
      return makeMockParser("cached", 5)(b);
    };
    const first = await extractPdfText("2310.06770", { cacheDir: tmpDir, fetchImpl, parseImpl });
    expect(first.fetchedFromCache).toBe(false);
    expect(fetchCalls).toBe(1);
    expect(parseCalls).toBe(1);
    const second = await extractPdfText("2310.06770", { cacheDir: tmpDir, fetchImpl, parseImpl });
    expect(second.fetchedFromCache).toBe(true);
    expect(second.text).toBe("cached");
    expect(fetchCalls).toBe(1);
    expect(parseCalls).toBe(1);
  });

  it("noCache: true forces a re-fetch (and re-parse)", async () => {
    let fetchCalls = 0;
    const fetchImpl: typeof fetch = (async (...args: Parameters<typeof fetch>) => {
      fetchCalls += 1;
      return makeMockFetch(FAKE_PDF_BYTES)(...args);
    }) as typeof fetch;
    const parseImpl = makeMockParser("body", 3);
    await extractPdfText("2310.06770", { cacheDir: tmpDir, fetchImpl, parseImpl });
    expect(fetchCalls).toBe(1);
    await extractPdfText("2310.06770", {
      cacheDir: tmpDir,
      fetchImpl,
      parseImpl,
      noCache: true,
    });
    expect(fetchCalls).toBe(2);
  });

  it("uses a custom pdfUrl when provided", async () => {
    let observedUrl = "";
    const fetchImpl: typeof fetch = (async (url: Parameters<typeof fetch>[0]) => {
      observedUrl = String(url);
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () =>
          FAKE_PDF_BYTES.buffer.slice(
            FAKE_PDF_BYTES.byteOffset,
            FAKE_PDF_BYTES.byteOffset + FAKE_PDF_BYTES.byteLength,
          ),
      };
    }) as unknown as typeof fetch;
    const result = await extractPdfText("2310.06770", {
      cacheDir: tmpDir,
      fetchImpl,
      parseImpl: makeMockParser("custom", 2),
      pdfUrl: "https://example.org/custom.pdf",
    });
    expect(observedUrl).toBe("https://example.org/custom.pdf");
    expect(result.sourceUrl).toBe("https://example.org/custom.pdf");
  });

  it("throws on HTTP error and does not write the cache", async () => {
    await expect(
      extractPdfText("2310.06770", {
        cacheDir: tmpDir,
        fetchImpl: makeMockFetch(FAKE_PDF_BYTES, 503),
        parseImpl: makeMockParser("never", 0),
      }),
    ).rejects.toThrow(/PDF fetch 503/);
    await expect(readFile(path.join(tmpDir, "2310.06770.json"), "utf-8")).rejects.toThrow();
  });

  it("does not call the parser when reading from cache", async () => {
    let parseCalls = 0;
    const fetchImpl = makeMockFetch(FAKE_PDF_BYTES);
    const parseImpl = async (b: Buffer) => {
      parseCalls += 1;
      return makeMockParser("seed", 7)(b);
    };
    await extractPdfText("2310.06770", { cacheDir: tmpDir, fetchImpl, parseImpl });
    expect(parseCalls).toBe(1);
    await extractPdfText("2310.06770", { cacheDir: tmpDir, fetchImpl, parseImpl });
    expect(parseCalls).toBe(1);
  });
});
