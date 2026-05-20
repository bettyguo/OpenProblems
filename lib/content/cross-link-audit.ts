import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

import {
  extractWikilinkReferences,
  isValidWikilinkTarget,
  type ValidWikilinkTargets,
  type WikilinkReference,
} from "@/lib/markdown/extensions/wikilinks-validator";

/**
 * Cross-link audit (Unit 2.11 / §13 Phase 2 acceptance).
 *
 * Reads `content/` directly from disk and checks reference + reciprocity
 * invariants between schemas. Pairs with `pnpm validate-content` (shape) —
 * this script is the references layer.
 *
 * See `docs/thinking/2.11-cross-link-audit.md` for severity rationale.
 */

export type Severity = "error" | "warning";

export type AuditCheck =
  | "paper-problem-fk"
  | "paper-author-fk"
  | "paper-institution-fk"
  | "author-institution-fk"
  | "related-problems-fk"
  | "related-problems-symmetry"
  | "entries-contributions-agreement"
  /**
   * Phase 66 Unit 66.2 — closes ADR-0018 APPEND-D-L item 5 (404 handling
   * for unresolved wikilinks; the LAST remaining D-L deferral) at 28-phase
   * carryover (Phase 38 → 66). Validates every `[[...]]` reference in
   * curator-authored markdown surfaces against the appropriate slug-set
   * per the Phase-63 `CROSS_ENTITY_BUILD_HREF` routing. ERROR severity
   * mirrors the `paper-problem-fk` precedent — dangling references fail
   * CI.
   */
  | "wikilink-target-fk";

export interface AuditFinding {
  check: AuditCheck;
  severity: Severity;
  file: string;
  message: string;
}

export interface AuditReport {
  filesRead: number;
  errors: AuditFinding[];
  warnings: AuditFinding[];
  summary: {
    papers: number;
    authors: number;
    institutions: number;
    problems: number;
    danglingPaperProblemRefs: number;
    danglingPaperAuthorRefs: number;
    danglingPaperInstitutionRefs: number;
    asymmetricRelatedProblems: number;
    /**
     * Phase 66 Unit 66.2 — total count of unresolved wikilink references
     * across all curator-authored markdown surfaces. Zero on healthy
     * content; non-zero on any `[[nonexistent-slug]]` or cross-entity miss.
     */
    danglingWikilinkRefs: number;
  };
}

interface PaperData {
  file: string;
  id: string;
  authors: string[];
  institutions: string[];
  contributions: { problem_slug: string }[];
}

interface AuthorData {
  file: string;
  slug: string;
  affiliations: { institution: string }[];
}

interface InstitutionData {
  file: string;
  slug: string;
}

interface ProblemData {
  file: string;
  slug: string;
  related: string[];
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(p: string): Promise<boolean> {
  try {
    return (await stat(p)).isDirectory();
  } catch {
    return false;
  }
}

async function listEntries(dir: string): Promise<string[]> {
  if (!(await pathExists(dir))) return [];
  return readdir(dir);
}

async function readYaml(file: string): Promise<unknown> {
  const raw = await readFile(file, "utf8");
  return parseYaml(raw);
}

async function readJson(file: string): Promise<unknown> {
  const raw = await readFile(file, "utf8");
  return JSON.parse(raw);
}

function relTo(root: string, file: string): string {
  return path.relative(root, file).replaceAll("\\", "/");
}

export async function runCrossLinkAudit(contentRoot: string): Promise<AuditReport> {
  const repoRoot = path.dirname(contentRoot);
  const findings: AuditFinding[] = [];
  let filesRead = 0;

  // --- 1. Load all entities from disk -------------------------------------

  const papers: PaperData[] = [];
  for (const name of await listEntries(path.join(contentRoot, "papers"))) {
    if (!name.endsWith(".yaml")) continue;
    const file = path.join(contentRoot, "papers", name);
    filesRead++;
    const raw = (await readYaml(file)) as {
      id?: string;
      authors?: unknown;
      institutions?: unknown;
      contributions?: unknown;
    };
    papers.push({
      file: relTo(repoRoot, file),
      id: String(raw.id ?? name.replace(/\.yaml$/, "")),
      authors: Array.isArray(raw.authors) ? (raw.authors as string[]) : [],
      institutions: Array.isArray(raw.institutions) ? (raw.institutions as string[]) : [],
      contributions: Array.isArray(raw.contributions)
        ? (raw.contributions as { problem_slug: string }[])
        : [],
    });
  }

  const authors: AuthorData[] = [];
  for (const name of await listEntries(path.join(contentRoot, "authors"))) {
    if (!name.endsWith(".yaml")) continue;
    const file = path.join(contentRoot, "authors", name);
    filesRead++;
    const raw = (await readYaml(file)) as { slug?: string; affiliations?: unknown };
    authors.push({
      file: relTo(repoRoot, file),
      slug: String(raw.slug ?? name.replace(/\.yaml$/, "")),
      affiliations: Array.isArray(raw.affiliations)
        ? (raw.affiliations as { institution: string }[])
        : [],
    });
  }

  const institutions: InstitutionData[] = [];
  for (const name of await listEntries(path.join(contentRoot, "institutions"))) {
    if (!name.endsWith(".yaml")) continue;
    const file = path.join(contentRoot, "institutions", name);
    filesRead++;
    const raw = (await readYaml(file)) as { slug?: string };
    institutions.push({
      file: relTo(repoRoot, file),
      slug: String(raw.slug ?? name.replace(/\.yaml$/, "")),
    });
  }

  const problems: ProblemData[] = [];
  for (const dir of await listEntries(path.join(contentRoot, "problems"))) {
    const probDir = path.join(contentRoot, "problems", dir);
    if (!(await isDirectory(probDir))) continue;
    const probFile = path.join(probDir, "problem.yaml");
    if (!(await pathExists(probFile))) continue;
    filesRead++;
    const raw = (await readYaml(probFile)) as {
      slug?: string;
      related_problems?: unknown;
    };
    problems.push({
      file: relTo(repoRoot, probFile),
      slug: String(raw.slug ?? dir),
      related: Array.isArray(raw.related_problems) ? (raw.related_problems as string[]) : [],
    });
  }

  // --- 2. Build lookup sets ----------------------------------------------

  const problemSlugs = new Set(problems.map((p) => p.slug));
  const authorSlugs = new Set(authors.map((a) => a.slug));
  const institutionSlugs = new Set(institutions.map((i) => i.slug));

  // --- 3. Run checks ------------------------------------------------------

  let danglingPaperProblemRefs = 0;
  let danglingPaperAuthorRefs = 0;
  let danglingPaperInstitutionRefs = 0;

  for (const p of papers) {
    for (const [i, c] of p.contributions.entries()) {
      if (!problemSlugs.has(c.problem_slug)) {
        danglingPaperProblemRefs++;
        findings.push({
          check: "paper-problem-fk",
          severity: "error",
          file: p.file,
          message: `contributions[${i}].problem_slug "${c.problem_slug}" — no such problem in content/problems/`,
        });
      }
    }
    for (const [i, slug] of p.authors.entries()) {
      if (!authorSlugs.has(slug)) {
        danglingPaperAuthorRefs++;
        findings.push({
          check: "paper-author-fk",
          severity: "warning",
          file: p.file,
          message: `authors[${i}] "${slug}" — no such author in content/authors/`,
        });
      }
    }
    for (const [i, slug] of p.institutions.entries()) {
      if (!institutionSlugs.has(slug)) {
        danglingPaperInstitutionRefs++;
        findings.push({
          check: "paper-institution-fk",
          severity: "warning",
          file: p.file,
          message: `institutions[${i}] "${slug}" — no such institution in content/institutions/`,
        });
      }
    }
  }

  for (const a of authors) {
    for (const [i, aff] of a.affiliations.entries()) {
      if (!institutionSlugs.has(aff.institution)) {
        findings.push({
          check: "author-institution-fk",
          severity: "error",
          file: a.file,
          message: `affiliations[${i}].institution "${aff.institution}" — no such institution in content/institutions/`,
        });
      }
    }
  }

  let asymmetricRelatedProblems = 0;
  const relatedSet = new Map<string, Set<string>>();
  for (const p of problems) relatedSet.set(p.slug, new Set(p.related));

  for (const p of problems) {
    for (const [i, target] of p.related.entries()) {
      if (!problemSlugs.has(target)) {
        findings.push({
          check: "related-problems-fk",
          severity: "error",
          file: p.file,
          message: `related_problems[${i}] "${target}" — no such problem in content/problems/`,
        });
        continue;
      }
      const reverse = relatedSet.get(target);
      if (!reverse || !reverse.has(p.slug)) {
        asymmetricRelatedProblems++;
        findings.push({
          check: "related-problems-symmetry",
          severity: "warning",
          file: p.file,
          message: `related_problems[${i}] "${target}" — asymmetric; "${target}" does not list "${p.slug}" back`,
        });
      }
    }
  }

  // wikilink-target-fk check (Phase 66 Unit 66.2 — closes APPEND-D-L item 5
  // at 28-phase carryover). Walks every rating-action YAML in
  // `content/problems/*/ratings/*.yaml` and extracts wikilinks from each
  // `dimensions.<dim>.rationale` string (the only content-side
  // actionRationale surface today; bio + reviewNotes + rationale surfaces
  // live in the DB per ADR-0018 D-G inheritance contract, not content
  // YAMLs). Cross-entity routing mirrors Phase-63 `CROSS_ENTITY_BUILD_HREF`
  // exactly — the validator catches the cases the plugin would 404 on at
  // render time.
  const validWikilinkTargets: ValidWikilinkTargets = {
    problemSlugs,
    paperIds: new Set(papers.map((p) => p.id)),
    authorSlugs,
    institutionSlugs,
  };
  let danglingWikilinkRefs = 0;

  for (const p of problems) {
    const ratingsDir = path.join(contentRoot, "problems", p.slug, "ratings");
    if (!(await isDirectory(ratingsDir))) continue;
    for (const ratingFile of await listEntries(ratingsDir)) {
      if (!ratingFile.endsWith(".yaml")) continue;
      const fullPath = path.join(ratingsDir, ratingFile);
      filesRead++;
      const raw = (await readYaml(fullPath)) as { dimensions?: unknown };
      if (!raw.dimensions || typeof raw.dimensions !== "object") continue;
      for (const [dimName, dimValue] of Object.entries(raw.dimensions)) {
        if (!dimValue || typeof dimValue !== "object") continue;
        const rationale = (dimValue as { rationale?: unknown }).rationale;
        if (typeof rationale !== "string") continue;
        const refs: WikilinkReference[] = extractWikilinkReferences(rationale, "actionRationale");
        for (const ref of refs) {
          if (isValidWikilinkTarget(ref, validWikilinkTargets)) continue;
          danglingWikilinkRefs++;
          findings.push({
            check: "wikilink-target-fk",
            severity: "error",
            file: relTo(repoRoot, fullPath),
            message: `dimensions.${dimName}.rationale ${ref.matchText} — no such ${ref.entityType ?? "problem"} target "${ref.slug}"`,
          });
        }
      }
    }
  }

  // entries.json check — no-op until Unit 2.10 lands the content
  for (const p of problems) {
    const entriesPath = path.join(contentRoot, "problems", p.slug, "entries.json");
    if (!(await pathExists(entriesPath))) continue;
    filesRead++;
    const entries = (await readJson(entriesPath)) as { paper_id: string }[] | { paper_id: string };
    const arr = Array.isArray(entries) ? entries : [entries];
    const slugContributions = new Set<string>();
    for (const paper of papers) {
      for (const c of paper.contributions) {
        if (c.problem_slug === p.slug) slugContributions.add(paper.id);
      }
    }
    for (const [i, entry] of arr.entries()) {
      if (!slugContributions.has(entry.paper_id)) {
        findings.push({
          check: "entries-contributions-agreement",
          severity: "warning",
          file: relTo(repoRoot, entriesPath),
          message: `entries[${i}].paper_id "${entry.paper_id}" — no matching contribution from this paper to problem "${p.slug}"`,
        });
      }
    }
  }

  // --- 4. Partition + summarize ------------------------------------------

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");

  return {
    filesRead,
    errors,
    warnings,
    summary: {
      papers: papers.length,
      authors: authors.length,
      institutions: institutions.length,
      problems: problems.length,
      danglingPaperProblemRefs,
      danglingPaperAuthorRefs,
      danglingPaperInstitutionRefs,
      asymmetricRelatedProblems,
      danglingWikilinkRefs,
    },
  };
}
