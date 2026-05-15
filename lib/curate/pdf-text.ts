import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";

/**
 * PDF text-extraction helper for Phase-5 curator scripts (Unit 5.4).
 *
 * - Default URL: `https://arxiv.org/pdf/<arxiv-id>` (override via `options.pdfUrl`).
 * - Module-singleton rate limiter: capacity 2, refill 1 token / 2000 ms.
 *   Separate bucket from `arxiv-client.ts` because `arxiv.org/pdf/` and
 *   `export.arxiv.org/api/` are different subdomains with different limits.
 * - Filesystem cache at `.pdf-cache/<arxiv-id>.json` (gitignored). Caches the
 *   EXTRACTED TEXT, not the PDF binary — text is the expensive-to-recompute
 *   step; PDF is cheap to re-download. Cache write skipped on errors.
 *
 * Used by Unit 5.5's `scripts/extract-leaderboard.ts` CLI.
 */

const DEFAULT_CACHE_DIR = ".pdf-cache";
const DEFAULT_USER_AGENT = "llm-openproblems/0.0 (https://github.com/bettyguo/OpenProblems)";
const ARXIV_PDF_BASE = "https://arxiv.org/pdf";

const RATE_LIMIT_CAPACITY = 2;
const RATE_LIMIT_REFILL_MS = 2000;

export interface PdfExtractionResult {
  text: string;
  numPages: number;
  sourceUrl: string;
  fetchedFromCache: boolean;
}

export interface ExtractPdfOptions {
  noCache?: boolean;
  cacheDir?: string;
  fetchImpl?: typeof fetch;
  parseImpl?: (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
  pdfUrl?: string;
  userAgent?: string;
}

interface CachedPdf {
  arxivId: string;
  sourceUrl: string;
  text: string;
  numPages: number;
  fetchedAt: string;
}

class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillMs: number,
    private readonly now: () => number = Date.now,
    private readonly delay: (ms: number) => Promise<void> = (ms) =>
      new Promise((r) => setTimeout(r, ms)),
  ) {
    this.tokens = capacity;
    this.lastRefill = now();
  }

  async take(): Promise<void> {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const tokensNeeded = 1 - this.tokens;
    const waitMs = Math.ceil(tokensNeeded * this.refillMs);
    await this.delay(waitMs);
    this.refill();
    this.tokens -= 1;
  }

  private refill(): void {
    const now = this.now();
    const elapsed = now - this.lastRefill;
    const refillAmount = elapsed / this.refillMs;
    this.tokens = Math.min(this.capacity, this.tokens + refillAmount);
    this.lastRefill = now;
  }
}

const sharedBucket = new TokenBucket(RATE_LIMIT_CAPACITY, RATE_LIMIT_REFILL_MS);

async function readCache(cacheDir: string, arxivId: string): Promise<CachedPdf | null> {
  try {
    const buf = await readFile(path.join(cacheDir, `${arxivId}.json`), "utf-8");
    return JSON.parse(buf) as CachedPdf;
  } catch {
    return null;
  }
}

async function writeCache(cacheDir: string, entry: CachedPdf): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(
    path.join(cacheDir, `${entry.arxivId}.json`),
    JSON.stringify(entry, null, 2),
    "utf-8",
  );
}

function defaultPdfUrl(arxivId: string): string {
  return `${ARXIV_PDF_BASE}/${arxivId}`;
}

export async function extractPdfText(
  arxivId: string,
  options: ExtractPdfOptions = {},
): Promise<PdfExtractionResult> {
  const cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
  const fetchImpl = options.fetchImpl ?? fetch;
  const parseImpl =
    options.parseImpl ??
    (async (buffer: Buffer) => {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        return { text: result.text, numpages: result.total };
      } finally {
        await parser.destroy();
      }
    });
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const sourceUrl = options.pdfUrl ?? defaultPdfUrl(arxivId);

  if (!options.noCache) {
    const cached = await readCache(cacheDir, arxivId);
    if (cached) {
      return {
        text: cached.text,
        numPages: cached.numPages,
        sourceUrl: cached.sourceUrl,
        fetchedFromCache: true,
      };
    }
  }

  await sharedBucket.take();

  const response = await fetchImpl(sourceUrl, {
    headers: { "User-Agent": userAgent },
  });
  if (!response.ok) {
    throw new Error(`PDF fetch ${response.status} for ${sourceUrl}`);
  }
  const arrayBuf = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  const { text, numpages } = await parseImpl(buffer);

  const entry: CachedPdf = {
    arxivId,
    sourceUrl,
    text,
    numPages: numpages,
    fetchedAt: new Date().toISOString(),
  };
  await writeCache(cacheDir, entry);

  return {
    text,
    numPages: numpages,
    sourceUrl,
    fetchedFromCache: false,
  };
}

export const __testing = {
  TokenBucket,
  defaultPdfUrl,
};
