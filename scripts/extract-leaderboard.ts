#!/usr/bin/env tsx
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { extractPdfText } from "@/lib/curate/pdf-text";
import { callAnthropic } from "@/lib/curate/anthropic";
import { buildDraftFilenames } from "@/lib/curate/paper-draft";
import {
  buildEntriesDiff,
  buildSystemPrompt,
  buildUserPrompt,
  mergeEntries,
  parseEntryArrayResponse,
  renderEntriesJson,
  type BenchmarkRef,
  type LeaderboardEntry,
} from "@/lib/curate/entry-draft";

/**
 * Unit 5.5 — `extract-leaderboard` CLI.
 *
 *   pnpm extract-leaderboard <arxiv-id> --problem <slug>
 *                                       [--model X] [--dry-run] [--verbose]
 *                                       [--no-cache] [--out drafts/]
 *
 * Extracts leaderboard entries from a paper's PDF. Writes a unified diff +
 * audit sidecar to drafts/ (gitignored). NEVER modifies content/problems/
 * directly. The diff is a "create" when entries.json doesn't exist yet, a
 * "modify-existing" (append) when it does.
 */

const UNIT = "5.5";
const SCRIPT_NAME = "extract-leaderboard";
const DEFAULT_MODEL = "claude-opus-4-7";
const DEFAULT_OUT = "drafts";

interface CliArgs {
  arxivId: string;
  problemSlug: string;
  model: string;
  dryRun: boolean;
  verbose: boolean;
  noCache: boolean;
  out: string;
}

function parseArgs(argv: string[]): CliArgs | { help: true } {
  let arxivId: string | null = null;
  let problemSlug: string | null = null;
  let model = DEFAULT_MODEL;
  let dryRun = false;
  let verbose = false;
  let noCache = false;
  let out = DEFAULT_OUT;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") return { help: true };
    if (a === "--problem") {
      const next = argv[++i];
      if (!next) throw new Error("--problem requires an argument");
      problemSlug = next;
      continue;
    }
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
  if (!problemSlug) throw new Error("Missing required flag: --problem <slug>");
  return { arxivId, problemSlug, model, dryRun, verbose, noCache, out };
}

function usage(): string {
  return `Usage: pnpm extract-leaderboard <arxiv-id> --problem <slug> [options]

Extracts leaderboard entries from a paper's PDF. Output goes to
drafts/<unit>-<ts>-<id>-<slug>.diff plus a .meta.json audit sidecar.
content/problems/ is NEVER written directly — apply the diff yourself
once you've reviewed it (git apply drafts/<file>.diff).

Positional:
  <arxiv-id>             Paper to extract from. MUST already be ingested
                         (content/papers/<id>.yaml exists; run pnpm
                         ingest-arxiv first if not).

Required:
  --problem <slug>       Existing problem to attach entries to. Determines
                         which benchmarks the LLM may use and which
                         entries.json the diff targets.

Options:
  --model <id>           Anthropic model (default: ${DEFAULT_MODEL})
  --dry-run              Don't call the API; emit placeholder diff
  --verbose              Print prompt + estimated cost before the call
  --no-cache             Bypass the .pdf-cache/ on PDF fetch
  --out <dir>            Override the drafts directory (default: ${DEFAULT_OUT})
  --help                 Show this help

Per ADR-0008: ANTHROPIC_API_KEY is required (non-dry-run). When set,
LLM_OPENPROBLEMS_DAILY_BUDGET_USD enforces a daily spend cap.
`;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

interface ProblemYamlShape {
  benchmarks?: Array<{
    id: string;
    name?: string;
    metric?: string;
    metric_direction?: "higher-is-better" | "lower-is-better";
  }>;
}

async function loadProblemBenchmarks(problemSlug: string): Promise<BenchmarkRef[]> {
  const problemYamlPath = `content/problems/${problemSlug}/problem.yaml`;
  if (!(await pathExists(problemYamlPath))) {
    throw new Error(`Problem not found: ${problemYamlPath}`);
  }
  const text = await readFile(problemYamlPath, "utf-8");
  const parsed = parseYaml(text) as ProblemYamlShape;
  const benchmarks = parsed.benchmarks ?? [];
  return benchmarks.map((b) => ({
    id: b.id,
    name: b.name ?? b.id,
    metric: b.metric ?? "unspecified",
    metric_direction: b.metric_direction ?? "higher-is-better",
  }));
}

async function readExistingEntries(
  entriesPath: string,
): Promise<{ body: string | null; entries: LeaderboardEntry[] }> {
  if (!(await pathExists(entriesPath))) {
    return { body: null, entries: [] };
  }
  const body = await readFile(entriesPath, "utf-8");
  const parsed = JSON.parse(body) as LeaderboardEntry[];
  return { body, entries: parsed };
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

  const { arxivId, problemSlug, model, dryRun, verbose, noCache, out } = parsed;

  // Verify paper has been ingested.
  const paperYamlPath = `content/papers/${arxivId}.yaml`;
  if (!(await pathExists(paperYamlPath))) {
    process.stderr.write(
      `error: ${paperYamlPath} not found. Ingest the paper first: pnpm ingest-arxiv ${arxivId}\n`,
    );
    return 1;
  }

  process.stdout.write(`Loading problem benchmarks for ${problemSlug}…\n`);
  const benchmarks = await loadProblemBenchmarks(problemSlug);
  process.stdout.write(`  → ${benchmarks.length} declared benchmark(s)\n`);

  const entriesPath = `content/problems/${problemSlug}/entries.json`;
  const { body: existingBody, entries: existing } = await readExistingEntries(entriesPath);
  process.stdout.write(
    `  → ${existing.length} existing entry(ies) in ${existingBody === null ? "(new file)" : entriesPath}\n`,
  );

  process.stdout.write(`Extracting PDF text for ${arxivId}…\n`);
  const pdf = await extractPdfText(arxivId, { ...(noCache ? { noCache: true } : {}) });
  process.stdout.write(
    `  → ${pdf.numPages} page(s), ${pdf.text.length} chars (${pdf.fetchedFromCache ? "cached" : "fresh"})\n`,
  );

  const systemCached = buildSystemPrompt(benchmarks, arxivId);
  const userPrompt = buildUserPrompt(pdf.text);

  if (verbose) {
    process.stdout.write("\n--- SYSTEM PROMPT (cached) ---\n");
    process.stdout.write(systemCached);
    process.stdout.write("\n--- USER PROMPT (truncated to first 500 chars) ---\n");
    process.stdout.write(userPrompt.slice(0, 500));
    if (userPrompt.length > 500)
      process.stdout.write(`\n... [${userPrompt.length - 500} more chars] ...`);
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

  let proposed: ReturnType<typeof parseEntryArrayResponse>;
  if (dryRun) {
    proposed = [];
  } else {
    proposed = parseEntryArrayResponse(text);
  }

  const merged = mergeEntries(existing, proposed, arxivId);
  const mergedBody = renderEntriesJson(merged);

  const isoTimestamp = meta.iso_timestamp;
  const { diffName, metaName } = buildDraftFilenames({
    unit: UNIT,
    arxivId: `${arxivId}-${problemSlug}`,
    isoTimestamp,
  });
  const diffPath = path.join(out, diffName);
  const metaPath = path.join(out, metaName);

  await mkdir(out, { recursive: true });
  const diff = buildEntriesDiff(entriesPath, existingBody, mergedBody);
  await writeFile(diffPath, diff, "utf-8");
  await writeFile(
    metaPath,
    JSON.stringify(
      {
        unit: UNIT,
        script: SCRIPT_NAME,
        arxiv_id: arxivId,
        problem_slug: problemSlug,
        existing_entries: existing.length,
        proposed_entries: proposed.length,
        merged_entries: merged.length,
        ...meta,
      },
      null,
      2,
    ) + "\n",
    "utf-8",
  );

  process.stdout.write(`\nWrote draft: ${diffPath}\n`);
  process.stdout.write(`Wrote audit: ${metaPath}\n`);
  if (!dryRun) {
    process.stdout.write(`Proposed ${proposed.length} new entry(ies).\n`);
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
