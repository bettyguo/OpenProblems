import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { __testing, fetchArxivMetadata, type ArxivMetadata } from "@/lib/curate/arxiv-client";

const { TokenBucket, parseAtomEntry, stripVersion } = __testing;

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:arxiv="http://arxiv.org/schemas/atom">
  <entry>
    <id>http://arxiv.org/abs/2310.06770v3</id>
    <updated>2024-11-11T18:00:00Z</updated>
    <published>2023-10-10T17:00:00Z</published>
    <title>SWE-bench: Can Language Models Resolve Real-World GitHub Issues?</title>
    <summary>We introduce SWE-bench, a benchmark of 2,294 real-world software-engineering tasks drawn from GitHub issues.</summary>
    <author><name>Carlos E. Jimenez</name></author>
    <author><name>John Yang</name></author>
    <author><name>Alexander Wettig</name></author>
    <link href="http://arxiv.org/abs/2310.06770v3" rel="alternate" type="text/html"/>
    <link href="http://arxiv.org/pdf/2310.06770v3" rel="related" type="application/pdf"/>
    <arxiv:primary_category term="cs.SE" scheme="http://arxiv.org/schemas/atom"/>
    <category term="cs.SE" scheme="http://arxiv.org/schemas/atom"/>
    <category term="cs.AI" scheme="http://arxiv.org/schemas/atom"/>
  </entry>
</feed>`;

function makeMockFetch(payload: string, status = 200): typeof fetch {
  return (async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => payload,
  })) as unknown as typeof fetch;
}

describe("stripVersion", () => {
  it("strips a trailing v<digit> from the id", () => {
    expect(stripVersion("2310.06770v3")).toEqual({ id: "2310.06770", version: "v3" });
    expect(stripVersion("2310.06770v12")).toEqual({ id: "2310.06770", version: "v12" });
  });

  it("returns empty version when no suffix is present", () => {
    expect(stripVersion("2310.06770")).toEqual({ id: "2310.06770", version: "" });
  });
});

describe("parseAtomEntry", () => {
  it("parses title, abstract, authors, categories, dates, urls", () => {
    const m = parseAtomEntry(SAMPLE_XML);
    expect(m.arxivId).toBe("2310.06770");
    expect(m.version).toBe("v3");
    expect(m.title).toMatch(/^SWE-bench/);
    expect(m.abstract).toContain("2,294");
    expect(m.authors).toEqual(["Carlos E. Jimenez", "John Yang", "Alexander Wettig"]);
    expect(m.primaryCategory).toBe("cs.SE");
    expect(m.categories).toContain("cs.SE");
    expect(m.categories).toContain("cs.AI");
    expect(m.publishedDate).toBe("2023-10-10");
    expect(m.updatedDate).toBe("2024-11-11");
    expect(m.abstractUrl).toBe("http://arxiv.org/abs/2310.06770v3");
    expect(m.pdfUrl).toBe("http://arxiv.org/pdf/2310.06770v3");
  });

  it("throws when the response has no <entry>", () => {
    expect(() =>
      parseAtomEntry(`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"/>`),
    ).toThrow(/no <entry>/);
  });

  it("throws when title or summary is missing", () => {
    const xml = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/0000.0001</id>
    <published>2026-01-01T00:00:00Z</published>
    <updated>2026-01-01T00:00:00Z</updated>
  </entry>
</feed>`;
    expect(() => parseAtomEntry(xml)).toThrow(/missing title or summary/);
  });
});

describe("TokenBucket", () => {
  it("allows burst of `capacity` calls without delay", async () => {
    const now = 0;
    let waited = 0;
    const bucket = new TokenBucket(
      3,
      1000,
      () => now,
      async (ms) => {
        waited += ms;
      },
    );
    await bucket.take();
    await bucket.take();
    await bucket.take();
    expect(waited).toBe(0);
  });

  it("delays the 4th call by ~refillMs when called instantly", async () => {
    let now = 0;
    let waited = 0;
    const bucket = new TokenBucket(
      3,
      1000,
      () => now,
      async (ms) => {
        waited += ms;
        now += ms;
      },
    );
    await bucket.take();
    await bucket.take();
    await bucket.take();
    await bucket.take();
    expect(waited).toBeGreaterThan(0);
    expect(waited).toBeLessThanOrEqual(1000);
  });
});

describe("fetchArxivMetadata", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "arxiv-cache-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("fetches and parses metadata on cache miss", async () => {
    const m = await fetchArxivMetadata("2310.06770", {
      cacheDir: tmpDir,
      fetchImpl: makeMockFetch(SAMPLE_XML),
    });
    expect(m.arxivId).toBe("2310.06770");
    expect(m.title).toMatch(/^SWE-bench/);
  });

  it("writes the parsed metadata to the cache directory", async () => {
    await fetchArxivMetadata("2310.06770", {
      cacheDir: tmpDir,
      fetchImpl: makeMockFetch(SAMPLE_XML),
    });
    const cached = JSON.parse(
      await readFile(path.join(tmpDir, "2310.06770.json"), "utf-8"),
    ) as ArxivMetadata;
    expect(cached.arxivId).toBe("2310.06770");
    expect(cached.version).toBe("v3");
  });

  it("reads from the cache on subsequent calls (no network)", async () => {
    let fetchCalls = 0;
    const fetchImpl = makeMockFetch(SAMPLE_XML);
    const counting: typeof fetch = (async (...args: Parameters<typeof fetch>) => {
      fetchCalls += 1;
      return fetchImpl(...args);
    }) as typeof fetch;
    await fetchArxivMetadata("2310.06770", { cacheDir: tmpDir, fetchImpl: counting });
    expect(fetchCalls).toBe(1);
    await fetchArxivMetadata("2310.06770", { cacheDir: tmpDir, fetchImpl: counting });
    expect(fetchCalls).toBe(1);
  });

  it("noCache: true bypasses the cache read (forces refetch)", async () => {
    let fetchCalls = 0;
    const fetchImpl = makeMockFetch(SAMPLE_XML);
    const counting: typeof fetch = (async (...args: Parameters<typeof fetch>) => {
      fetchCalls += 1;
      return fetchImpl(...args);
    }) as typeof fetch;
    await fetchArxivMetadata("2310.06770", { cacheDir: tmpDir, fetchImpl: counting });
    expect(fetchCalls).toBe(1);
    await fetchArxivMetadata("2310.06770", {
      cacheDir: tmpDir,
      fetchImpl: counting,
      noCache: true,
    });
    expect(fetchCalls).toBe(2);
  });

  it("throws on HTTP error (and does not write cache)", async () => {
    await expect(
      fetchArxivMetadata("2310.06770", {
        cacheDir: tmpDir,
        fetchImpl: makeMockFetch("server error", 503),
      }),
    ).rejects.toThrow(/arXiv API 503/);
    await expect(readFile(path.join(tmpDir, "2310.06770.json"), "utf-8")).rejects.toThrow();
  });

  it("strips a version suffix from the input id when computing the canonical cache key", async () => {
    await fetchArxivMetadata("2310.06770v3", {
      cacheDir: tmpDir,
      fetchImpl: makeMockFetch(SAMPLE_XML),
    });
    // Cache key is the canonical id without version.
    const cached = await readFile(path.join(tmpDir, "2310.06770.json"), "utf-8");
    expect(cached).toContain('"arxivId": "2310.06770"');
  });
});
