#!/usr/bin/env tsx
import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fetchArxivMetadata } from "@/lib/curate/arxiv-client";
import { callAnthropic } from "@/lib/curate/anthropic";
import {
  buildDraftFilenames,
  buildSystemPrompt,
  buildUnifiedDiff,
  buildUserPrompt,
  parseLLMResponse,
} from "@/lib/curate/paper-draft";

/**
 * Unit 5.3 — `ingest-arxiv` CLI.
 *
 *   pnpm ingest-arxiv <arxiv-id> [--model X] [--dry-run] [--verbose]
 *                                [--no-cache] [--out drafts/]
 *
 * Drafts a paper YAML from an arXiv ID. Writes a unified diff + audit sidecar
 * to drafts/ (gitignored). NEVER modifies content/papers/ directly.
 */

const UNIT = "5.3";
const SCRIPT_NAME = "ingest-arxiv";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_OUT = "drafts";
const TARGET_PAPERS_DIR = "content/papers";

interface CliArgs {
  arxivId: string;
  model: string;
  dryRun: boolean;
  verbose: boolean;
  noCache: boolean;
  out: string;
}

function parseArgs(argv: string[]): CliArgs | { help: true } {
  let arxivId: string | null = null;
  let model = DEFAULT_MODEL;
  let dryRun = false;
  let verbose = false;
  let noCache = false;
  let out = DEFAULT_OUT;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { help: true };
    if (a === "--model") {
      const next = argv[++i];
      if (!next) throw new Error("--model requires an argument");
      model = next;
      continue;
    }
    if (a === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (a === "--verbose") {
      verbose = true;
      continue;
    }
    if (a === "--no-cache") {
      noCache = true;
      continue;
    }
    if (a === "--out") {
      const next = argv[++i];
      if (!next) throw new Error("--out requires an argument");
      out = next;
      continue;
    }
    if (a !== undefined && !a.startsWith("-")) {
      if (arxivId !== null) {
        throw new Error(`Unexpected positional argument: ${a}`);
      }
      arxivId = a;
      continue;
    }
    throw new Error(`Unknown argument: ${a}`);
  }

  if (!arxivId) throw new Error("Missing required positional argument: <arxiv-id>");
  return { arxivId, model, dryRun, verbose, noCache, out };
}

function usage(): string {
  return `Usage: pnpm ingest-arxiv <arxiv-id> [options]

Drafts a paper YAML from an arXiv ID. Output goes to drafts/<unit>-<ts>-<id>.diff
plus a .meta.json audit sidecar. content/papers/ is NEVER written directly —
apply the diff yourself once you've reviewed it (git apply drafts/<file>.diff).

Positional:
  <arxiv-id>             e.g. 2310.06770 (version suffix optional)

Options:
  --model <id>           Anthropic model (default: ${DEFAULT_MODEL})
  --dry-run              Don't call the API; emit placeholder draft + prompt
  --verbose              Print the prompt + estimated cost before the call
  --no-cache             Bypass the .arxiv-cache/ on metadata fetch
  --out <dir>            Override the drafts directory (default: ${DEFAULT_OUT})
  --help                 Show this help

Per ADR-0008: ANTHROPIC_API_KEY is required (non-dry-run). When set,
LLM_OPENPROBLEMS_DAILY_BUDGET_USD enforces a daily spend cap.
`;
}

async function loadSlugList(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const slugs: string[] = [];
    for (const e of entries) {
      if (e.isDirectory()) {
        slugs.push(e.name);
        continue;
      }
      if (e.isFile() && e.name.endsWith(".yaml")) {
        slugs.push(e.name.replace(/\.yaml$/, ""));
      }
    }
    return slugs.sort();
  } catch {
    return [];
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main(argv: string[]): Promise<number> {
  let parsed: CliArgs | { help: true };
  try {
    parsed = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n\n${usage()}`);
    return 2;
  }
  if ("help" in parsed) {
    process.stdout.write(usage());
    return 0;
  }

  const { arxivId, model, dryRun, verbose, noCache, out } = parsed;

  const targetPath = `${TARGET_PAPERS_DIR}/${arxivId}.yaml`;
  if (await pathExists(targetPath)) {
    process.stderr.write(
      `error: ${targetPath} already exists. This paper is already ingested; edit by hand.\n`,
    );
    return 1;
  }

  process.stdout.write(`Fetching arXiv metadata for ${arxivId}…\n`);
  const metadata = await fetchArxivMetadata(arxivId, { ...(noCache ? { noCache: true } : {}) });
  process.stdout.write(
    `  → "${metadata.title}" (${metadata.primaryCategory}, ${metadata.publishedDate})\n`,
  );

  process.stdout.write("Loading known author / institution / problem slugs…\n");
  const [problems, authors, institutions] = await Promise.all([
    loadSlugList("content/problems"),
    loadSlugList("content/authors"),
    loadSlugList("content/institutions"),
  ]);
  process.stdout.write(
    `  → ${problems.length} problems, ${authors.length} authors, ${institutions.length} institutions\n`,
  );

  const systemCached = buildSystemPrompt({ problems, authors, institutions });
  const userPrompt = buildUserPrompt(metadata);

  if (verbose) {
    process.stdout.write("\n--- SYSTEM PROMPT (cached) ---\n");
    process.stdout.write(systemCached);
    process.stdout.write("\n--- USER PROMPT ---\n");
    process.stdout.write(userPrompt);
    process.stdout.write("\n--- END PROMPTS ---\n\n");
  }

  if (dryRun) {
    process.stdout.write("[--dry-run] Skipping Anthropic API call.\n");
  } else {
    process.stdout.write(`Calling Anthropic ${model}…\n`);
  }

  const { text, meta } = await callAnthropic(SCRIPT_NAME, {
    model,
    systemCached,
    userPrompt,
    dryRun,
  });

  const body = dryRun
    ? `# [DRY RUN — no LLM call] Draft YAML would go here for ${arxivId}.\n` +
      `# Re-run without --dry-run to populate, then \`git apply drafts/<file>.diff\`.\n`
    : parseLLMResponse(text);

  const isoTimestamp = meta.iso_timestamp;
  const { diffName, metaName } = buildDraftFilenames({ unit: UNIT, arxivId, isoTimestamp });
  const diffPath = path.join(out, diffName);
  const metaPath = path.join(out, metaName);

  await mkdir(out, { recursive: true });
  const diff = buildUnifiedDiff(targetPath, body);
  await writeFile(diffPath, diff, "utf-8");
  await writeFile(
    metaPath,
    JSON.stringify({ unit: UNIT, script: SCRIPT_NAME, arxiv_id: arxivId, ...meta }, null, 2) + "\n",
    "utf-8",
  );

  process.stdout.write(`\nWrote draft: ${diffPath}\n`);
  process.stdout.write(`Wrote audit: ${metaPath}\n`);
  if (!dryRun) {
    process.stdout.write(
      `Cost: ~$${meta.cost_usd_estimate.toFixed(4)} (in: ${meta.input_tokens}, out: ${meta.output_tokens}` +
        (meta.cache_creation_input_tokens > 0
          ? `, cache_create: ${meta.cache_creation_input_tokens}`
          : "") +
        (meta.cache_read_input_tokens > 0 ? `, cache_read: ${meta.cache_read_input_tokens}` : "") +
        ")\n",
    );
  }
  process.stdout.write(`\nNext: review the diff and \`git apply ${diffPath}\` when ready.\n`);

  return 0;
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`fatal: ${(err as Error).message}\n`);
    process.exit(1);
  });
