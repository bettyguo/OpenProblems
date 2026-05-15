import type { ArxivMetadata } from "@/lib/curate/arxiv-client";

/**
 * Paper-YAML drafting helpers for Unit 5.3's `ingest-arxiv` CLI.
 *
 * Pure functions, vitest-testable. The CLI orchestrates these alongside the
 * `lib/curate/anthropic.ts` wrapper and `fetchArxivMetadata`.
 *
 * Flow:
 *   1. buildSystemPrompt(slugs)  →  cacheable system block (ADR-0008 D-D).
 *   2. buildUserPrompt(metadata) →  per-paper user block.
 *   3. parseLLMResponse(text)    →  strip optional ```yaml fences; return body.
 *   4. buildUnifiedDiff(path, body) → unified-diff string for drafts/.
 */

export interface KnownSlugs {
  problems: string[];
  authors: string[];
  institutions: string[];
}

export function buildSystemPrompt(slugs: KnownSlugs): string {
  return `You are a meticulous research librarian drafting a paper-entry YAML for the
LLM OpenProblems encyclopedia. Output **YAML only**, no commentary, no fences.

Schema (lib/schemas/paper.ts):
  id: string                       # canonical arXiv ID, e.g. "2310.06770"
  title: string
  authors: string[]                # kebab-case slugs, MUST match content/authors/<slug>.yaml
  institutions: string[]           # kebab-case slugs, MUST match content/institutions/<slug>.yaml
  venue: string | undefined        # conference / journal where published; omit if preprint-only
  year: number                     # ≥ 1900; not in future
  arxiv_id: string                 # repeat of id when ingested from arXiv
  doi: string | undefined
  github: string | undefined       # if the paper's code is public
  tldr: string                     # 1–400 chars, factual, declarative — see precedent below
  contributions: Array<{
    problem_slug: string             # MUST match content/problems/<slug>/ (one in the list below)
    benchmark_id: string | undefined # an id from the parent problem's problem.yaml benchmarks[]
    metric: string | undefined
    score: number | undefined
    rank_at_publication: number | undefined
    evidence: string                 # primary-source URL per §15.6 (typically the arXiv abstract)
  }>

Editorial rules (excerpts from MASTER_PROMPT.md):
  §7  Paper objects represent published or preprint work. The TLDR is a single
      paragraph that captures the headline contribution + how it relates to the
      problem (NOT a verbatim abstract).
  §15.6 No fabrication. If you cannot determine a field from the provided
      metadata, OMIT it. Do not invent a venue, do not estimate a year,
      do not guess at institutions.

Slug resolution rules:
  - Author slugs MUST be kebab-case. If a proposed author slug is NOT in the
    known-authors list below, prefix the line with this comment:
      # NEW SLUG — curator must create content/authors/<slug>.yaml
    Same for institution slugs against the known-institutions list.
  - Problem slugs MUST be in the known-problems list. If no problem fits, OMIT
    the contribution; the curator will file a [New problem] issue.

Known problem slugs (${slugs.problems.length}):
${slugs.problems.map((s) => `  - ${s}`).join("\n")}

Known author slugs (${slugs.authors.length}):
${slugs.authors
  .slice(0, 30)
  .map((s) => `  - ${s}`)
  .join("\n")}${slugs.authors.length > 30 ? `\n  ... and ${slugs.authors.length - 30} more` : ""}

Known institution slugs (${slugs.institutions.length}):
${slugs.institutions.map((s) => `  - ${s}`).join("\n")}

Output format: emit the YAML directly, no fenced code block, no preamble, no
trailing commentary. The YAML is consumed by a unified diff against an empty
file at content/papers/<arxiv-id>.yaml.`;
}

export function buildUserPrompt(metadata: ArxivMetadata): string {
  return `Draft a paper YAML for the following arXiv entry. Use the schema and editorial
rules from the system prompt.

arxiv_id: ${metadata.arxivId}
title: ${metadata.title}
published: ${metadata.publishedDate}
updated: ${metadata.updatedDate}
primary_category: ${metadata.primaryCategory}
categories: ${metadata.categories.join(", ")}
authors: ${metadata.authors.join("; ")}
abstract_url: ${metadata.abstractUrl}
pdf_url: ${metadata.pdfUrl}

Abstract:
${metadata.abstract}
`;
}

export function parseLLMResponse(text: string): string {
  // Strip ```yaml ... ``` or ``` ... ``` fences if the model emitted them despite
  // the prompt's "no fences" instruction.
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:yaml)?\s*\n([\s\S]*?)\n```\s*$/);
  if (fenceMatch) return (fenceMatch[1] ?? "").trim() + "\n";
  return trimmed + "\n";
}

/**
 * Build a unified diff that adds the body as a new file at `targetPath`.
 *
 * Format mirrors `git diff --no-index /dev/null <target>` output for new-file
 * additions. `git apply <diff>` materialises the new file.
 *
 * The index hash field uses the standard `0000000` → blob convention for
 * additions; `git apply` does not verify the hash for new-file patches.
 */
export function buildUnifiedDiff(targetPath: string, body: string): string {
  const normalized = body.endsWith("\n") ? body : body + "\n";
  const lines = normalized.split("\n");
  // Drop the trailing empty element introduced by the final newline.
  const significant = lines.slice(0, lines.length - 1);
  const header =
    `diff --git a/${targetPath} b/${targetPath}\n` +
    `new file mode 100644\n` +
    `index 0000000..0000001\n` +
    `--- /dev/null\n` +
    `+++ b/${targetPath}\n` +
    `@@ -0,0 +1,${significant.length} @@\n`;
  const body_ = significant.map((l) => `+${l}`).join("\n") + "\n";
  return header + body_;
}

export interface BuildDraftFilenamesArgs {
  unit: string;
  arxivId: string;
  isoTimestamp: string;
}

export function buildDraftFilenames({ unit, arxivId, isoTimestamp }: BuildDraftFilenamesArgs): {
  diffName: string;
  metaName: string;
} {
  // Filesystem-safe timestamp: strip colons + millis.
  const ts = isoTimestamp.replace(/[:.]/g, "-").slice(0, 19);
  const safeId = arxivId.replace(/[^a-zA-Z0-9.-]/g, "_");
  return {
    diffName: `${unit}-${ts}-${safeId}.diff`,
    metaName: `${unit}-${ts}-${safeId}.diff.meta.json`,
  };
}
