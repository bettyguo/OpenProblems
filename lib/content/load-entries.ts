import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { LeaderboardEntrySchema, type LeaderboardEntry } from "@/lib/schemas/entry";

/**
 * Loader for per-problem leaderboard entries (Unit 2.9 + 2.10 scaffold).
 *
 * Reads `content/problems/<slug>/entries.json` if it exists, validates each
 * entry against LeaderboardEntrySchema, and returns the array. Returns []
 * when the file is missing — current Phase-2 norm.
 *
 * Distinct from the Velite-based loaders in this directory because
 * entries.json doesn't have a Velite collection yet (Phase-3 work).
 * validate-content + cross-link-audit already use the same fs path.
 */

const CONTENT_ROOT = path.resolve(process.cwd(), "content");

export async function loadEntriesForProblem(slug: string): Promise<LeaderboardEntry[]> {
  const file = path.join(CONTENT_ROOT, "problems", slug, "entries.json");
  try {
    await stat(file);
  } catch {
    return [];
  }
  const raw = await readFile(file, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  const valid: LeaderboardEntry[] = [];
  for (const candidate of arr) {
    const result = LeaderboardEntrySchema.safeParse(candidate);
    if (result.success) valid.push(result.data);
  }
  return valid;
}
