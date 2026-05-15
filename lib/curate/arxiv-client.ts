import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

/**
 * arXiv API client for Phase-5 curator scripts.
 *
 * - Atom feed at `https://export.arxiv.org/api/query?id_list=<id>` (public, no auth).
 * - Rate limit per arXiv guidance: ≤ 3 req/s burst, sustained 1 req/s (Unit 5.0 D-3).
 * - Filesystem cache at `.arxiv-cache/<id>.json` (gitignored).
 *
 * Used by Unit 5.3's `scripts/ingest-arxiv.ts` CLI.
 */

const ARXIV_API_BASE = "https://export.arxiv.org/api/query";
const DEFAULT_CACHE_DIR = ".arxiv-cache";
const DEFAULT_USER_AGENT = "llm-openproblems/0.0 (https://github.com/bettyguo/OpenProblems)";

const RATE_LIMIT_CAPACITY = 3;
const RATE_LIMIT_REFILL_MS = 1000;

export interface ArxivMetadata {
  arxivId: string;
  version: string;
  title: string;
  abstract: string;
  authors: string[];
  primaryCategory: string;
  categories: string[];
  publishedDate: string;
  updatedDate: string;
  abstractUrl: string;
  pdfUrl: string;
}

export interface FetchArxivOptions {
  noCache?: boolean;
  cacheDir?: string;
  fetchImpl?: typeof fetch;
  userAgent?: string;
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

function stripVersion(idWithMaybeVersion: string): { id: string; version: string } {
  const m = idWithMaybeVersion.match(/^(.+?)(v\d+)?$/);
  if (!m) return { id: idWithMaybeVersion, version: "" };
  return { id: m[1] ?? idWithMaybeVersion, version: m[2] ?? "" };
}

function toIsoDate(s: unknown): string {
  if (typeof s !== "string") return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? "";
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function parseAtomEntry(xml: string): ArxivMetadata {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  });
  const parsed = parser.parse(xml) as {
    feed?: {
      entry?: unknown;
    };
  };
  const entry = parsed.feed?.entry as
    | {
        id?: string;
        title?: string;
        summary?: string;
        published?: string;
        updated?: string;
        author?: { name?: string } | { name?: string }[];
        category?: { "@_term"?: string } | { "@_term"?: string }[];
        link?: { "@_href"?: string; "@_type"?: string; "@_rel"?: string }[];
        "arxiv:primary_category"?: { "@_term"?: string };
      }
    | undefined;
  if (!entry || typeof entry !== "object") {
    throw new Error("arXiv response: no <entry> element");
  }

  const rawId = typeof entry.id === "string" ? entry.id : "";
  const idMatch = rawId.match(/abs\/([^/]+?)(?:v(\d+))?$/);
  if (!idMatch) {
    throw new Error(`arXiv response: could not parse <id>: ${rawId}`);
  }
  const arxivId = idMatch[1] ?? "";
  const version = idMatch[2] ? `v${idMatch[2]}` : "";

  const title = typeof entry.title === "string" ? entry.title.replace(/\s+/g, " ").trim() : "";
  const abstract =
    typeof entry.summary === "string" ? entry.summary.replace(/\s+/g, " ").trim() : "";
  if (!title || !abstract) {
    throw new Error("arXiv response: missing title or summary");
  }

  const authors = asArray(entry.author)
    .map((a) => (a && typeof a === "object" && typeof a.name === "string" ? a.name : ""))
    .filter((n): n is string => n.length > 0);

  const categories = asArray(entry.category)
    .map((c) => (c && typeof c === "object" ? c["@_term"] : undefined))
    .filter((t): t is string => typeof t === "string" && t.length > 0);

  const primaryCategory = entry["arxiv:primary_category"]?.["@_term"] ?? categories[0] ?? "";

  const links = asArray(entry.link);
  const abstractLink = links.find((l) => l["@_rel"] === "alternate" && l["@_type"] === "text/html");
  const pdfLink = links.find((l) => l["@_type"] === "application/pdf");
  const abstractUrl = abstractLink?.["@_href"] ?? `https://arxiv.org/abs/${arxivId}${version}`;
  const pdfUrl = pdfLink?.["@_href"] ?? `https://arxiv.org/pdf/${arxivId}${version}`;

  return {
    arxivId,
    version,
    title,
    abstract,
    authors,
    primaryCategory,
    categories,
    publishedDate: toIsoDate(entry.published),
    updatedDate: toIsoDate(entry.updated),
    abstractUrl,
    pdfUrl,
  };
}

async function readCache(cacheDir: string, arxivId: string): Promise<ArxivMetadata | null> {
  try {
    const buf = await readFile(path.join(cacheDir, `${arxivId}.json`), "utf-8");
    return JSON.parse(buf) as ArxivMetadata;
  } catch {
    return null;
  }
}

async function writeCache(
  cacheDir: string,
  arxivId: string,
  metadata: ArxivMetadata,
): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(
    path.join(cacheDir, `${arxivId}.json`),
    JSON.stringify(metadata, null, 2),
    "utf-8",
  );
}

export async function fetchArxivMetadata(
  arxivId: string,
  options: FetchArxivOptions = {},
): Promise<ArxivMetadata> {
  const { id: canonicalId } = stripVersion(arxivId);
  const cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
  const fetchImpl = options.fetchImpl ?? fetch;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;

  if (!options.noCache) {
    const cached = await readCache(cacheDir, canonicalId);
    if (cached) return cached;
  }

  await sharedBucket.take();

  const url = `${ARXIV_API_BASE}?id_list=${encodeURIComponent(canonicalId)}`;
  const response = await fetchImpl(url, {
    headers: { "User-Agent": userAgent },
  });
  if (!response.ok) {
    throw new Error(`arXiv API ${response.status} for ${canonicalId}`);
  }
  const xml = await response.text();
  const metadata = parseAtomEntry(xml);
  await writeCache(cacheDir, canonicalId, metadata);
  return metadata;
}

export const __testing = {
  TokenBucket,
  parseAtomEntry,
  stripVersion,
};
