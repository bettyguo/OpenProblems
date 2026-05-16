import { createPatch } from "diff";
import { buildUnifiedDiff } from "@/lib/curate/paper-draft";

/**
 * Leaderboard-entry drafting helpers for Unit 5.5's `extract-leaderboard` CLI.
 *
 * Pure functions, vitest-testable. The CLI orchestrates these alongside
 * `lib/curate/pdf-text.ts` (PDF input) and `lib/curate/anthropic.ts` (LLM call).
 *
 * Flow:
 *   1. buildSystemPrompt(benchmarks, paperId) → cached system block.
 *   2. buildUserPrompt(pdfText)               → per-paper user block.
 *   3. parseEntryArrayResponse(text)          → strip JSON fence, parse, validate.
 *   4. mergeEntries(existing, proposed, paperId) → append with verified: false.
 *   5. buildEntriesDiff(target, existing, merged) → new-file or modify-existing diff.
 */

export interface BenchmarkRef {
  id: string;
  name: string;
  metric: string;
  metric_direction: "higher-is-better" | "lower-is-better";
}

export interface ProposedEntry {
  benchmark_id: string;
  score: number;
  date: string;
  protocol_notes?: string;
}

export interface LeaderboardEntry {
  paper_id: string;
  benchmark_id: string;
  score: number;
  date: string;
  verified: boolean;
  protocol_notes?: string;
}

export function buildSystemPrompt(benchmarks: BenchmarkRef[], paperId: string): string {
  return `You are a meticulous research librarian extracting leaderboard entries from
an academic paper PDF for the LLM OpenProblems encyclopedia. Output a **JSON
array** of entries, no commentary, no fenced code block, no preamble.

Schema per entry (lib/schemas/entry.ts):
  {
    "benchmark_id": string,    // MUST match one of the declared benchmarks below
    "score": number,
    "date": "YYYY-MM-DD",      // when the result was reported / made public
    "protocol_notes": string   // optional: model name, source URL, eval setup
  }

The curator-side fields (\`paper_id\` and \`verified\`) are filled in by the
script after your response. Do NOT include them in your output.

Editorial rules (excerpts from MASTER_PROMPT.md):
  §9   Leaderboard entries are per-(paper, benchmark) numerical claims. The
       entry's score is verbatim from the paper; the curator verifies it
       against the source URL on review.
  §15.6 No fabrication. If a score is not explicitly stated for a declared
       benchmark, OMIT the row. Do not invent dates, do not estimate scores,
       do not interpolate from charts.

Declared benchmarks on this problem (use these EXACT \`benchmark_id\` values):
${benchmarks
  .map((b) => `  - id: "${b.id}", name: "${b.name}", metric: "${b.metric}" (${b.metric_direction})`)
  .join("\n")}

Paper being extracted: ${paperId}

Output format: a single JSON array. Examples of valid output:

  []
  [{"benchmark_id":"swe-bench-verified","score":21.7,"date":"2024-08-06","protocol_notes":"Model: gpt-4o-2024-08-06. Source: openai/simple-evals README."}]
  [{"benchmark_id":"halueval","score":85.2,"date":"2025-02-27"},{"benchmark_id":"truthfulqa-2026","score":62.5,"date":"2025-02-27"}]

If the paper reports no scores on the declared benchmarks, output \`[]\` (empty
array). Do NOT propose a benchmark_id outside the declared list above.`;
}

export function buildUserPrompt(pdfText: string): string {
  return `Extract leaderboard entries from the following paper. Use only declared
benchmarks from the system prompt. Output a JSON array only.

--- PAPER TEXT ---
${pdfText}
--- END PAPER TEXT ---`;
}

export function parseEntryArrayResponse(text: string): ProposedEntry[] {
  const trimmed = text.trim();
  // Strip ```json ... ``` or ``` ... ``` fences if the model added them.
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/);
  const json = fenceMatch ? (fenceMatch[1] ?? "").trim() : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`LLM response is not valid JSON: ${(err as Error).message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`LLM response is not a JSON array (got ${typeof parsed})`);
  }

  const result: ProposedEntry[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const row = parsed[i];
    if (typeof row !== "object" || row === null) {
      throw new Error(`row ${i}: not an object`);
    }
    const r = row as Record<string, unknown>;
    if (typeof r["benchmark_id"] !== "string" || (r["benchmark_id"] as string).length === 0) {
      throw new Error(`row ${i}: missing/invalid benchmark_id`);
    }
    if (typeof r["score"] !== "number" || !Number.isFinite(r["score"] as number)) {
      throw new Error(`row ${i}: missing/invalid score`);
    }
    if (typeof r["date"] !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r["date"] as string)) {
      throw new Error(`row ${i}: missing/invalid date (expected YYYY-MM-DD)`);
    }
    const entry: ProposedEntry = {
      benchmark_id: r["benchmark_id"] as string,
      score: r["score"] as number,
      date: r["date"] as string,
    };
    if (typeof r["protocol_notes"] === "string" && (r["protocol_notes"] as string).length > 0) {
      entry.protocol_notes = r["protocol_notes"] as string;
    }
    result.push(entry);
  }
  return result;
}

export function mergeEntries(
  existing: LeaderboardEntry[],
  proposed: ProposedEntry[],
  paperId: string,
): LeaderboardEntry[] {
  const filledIn: LeaderboardEntry[] = proposed.map((p) => {
    const entry: LeaderboardEntry = {
      paper_id: paperId,
      benchmark_id: p.benchmark_id,
      score: p.score,
      date: p.date,
      verified: false,
    };
    if (p.protocol_notes !== undefined) entry.protocol_notes = p.protocol_notes;
    return entry;
  });
  return [...existing, ...filledIn];
}

export function buildEntriesDiff(
  targetPath: string,
  existingBody: string | null,
  mergedBody: string,
): string {
  if (existingBody === null) {
    return buildUnifiedDiff(targetPath, mergedBody);
  }
  return createPatch(targetPath, existingBody, mergedBody, "", "");
}

export function renderEntriesJson(entries: LeaderboardEntry[]): string {
  return JSON.stringify(entries, null, 2) + "\n";
}
