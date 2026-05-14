import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { ZodTypeAny } from "zod";
import { TaxonomySchema, type Taxonomy } from "@/lib/schemas/taxonomy";
import { OpenProblemSchema } from "@/lib/schemas/problem";
import { RatingActionSchema } from "@/lib/schemas/rating-action";
import { LeaderboardEntrySchema } from "@/lib/schemas/entry";
import { PaperSchema } from "@/lib/schemas/paper";
import { AuthorSchema } from "@/lib/schemas/author";
import { InstitutionSchema } from "@/lib/schemas/institution";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationError {
  file: string;
  schema: string;
  issues: ValidationIssue[];
}

export interface ValidationResult {
  filesChecked: number;
  errors: ValidationError[];
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

async function parseFile(file: string): Promise<unknown> {
  const raw = await readFile(file, "utf8");
  if (file.endsWith(".json")) return JSON.parse(raw);
  return parseYaml(raw);
}

function pushIssues(
  errors: ValidationError[],
  file: string,
  schema: string,
  zodIssues: readonly {
    readonly path: readonly PropertyKey[];
    readonly message: string;
  }[],
): void {
  errors.push({
    file,
    schema,
    issues: zodIssues.map((i) => ({
      path: i.path.map(String).join("."),
      message: i.message,
    })),
  });
}

async function validateAgainst(
  file: string,
  schemaName: string,
  schema: ZodTypeAny,
  errors: ValidationError[],
): Promise<unknown | undefined> {
  try {
    const data = await parseFile(file);
    const result = schema.safeParse(data);
    if (!result.success) {
      pushIssues(errors, file, schemaName, result.error.issues);
      return undefined;
    }
    return result.data;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    errors.push({
      file,
      schema: schemaName,
      issues: [{ path: "", message: `parse error: ${message}` }],
    });
    return undefined;
  }
}

function checkProblemTaxonomyFk(
  file: string,
  problem: { domain: string; subdomain: string },
  taxonomy: Taxonomy,
  errors: ValidationError[],
): void {
  const domain = taxonomy.domains.find((d) => d.id === problem.domain);
  if (!domain) {
    errors.push({
      file,
      schema: "OpenProblem/taxonomy-fk",
      issues: [
        {
          path: "domain",
          message: `domain "${problem.domain}" is not in content/taxonomy.yaml`,
        },
      ],
    });
    return;
  }
  if (!domain.subdomains.some((s) => s.id === problem.subdomain)) {
    errors.push({
      file,
      schema: "OpenProblem/taxonomy-fk",
      issues: [
        {
          path: "subdomain",
          message: `subdomain "${problem.subdomain}" is not under domain "${problem.domain}"`,
        },
      ],
    });
  }
}

export async function validateContent(contentRoot: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  let filesChecked = 0;
  let taxonomy: Taxonomy | undefined;

  // 1. Taxonomy (also used for cross-FK below)
  const taxonomyPath = path.join(contentRoot, "taxonomy.yaml");
  if (await pathExists(taxonomyPath)) {
    const result = await validateAgainst(taxonomyPath, "Taxonomy", TaxonomySchema, errors);
    if (result !== undefined) taxonomy = result as Taxonomy;
    filesChecked++;
  }

  // 2. Problems (problem.yaml + ratings/*.yaml + entries.json per slug)
  const problemsRoot = path.join(contentRoot, "problems");
  for (const slug of await listEntries(problemsRoot)) {
    const problemDir = path.join(problemsRoot, slug);
    if (!(await isDirectory(problemDir))) continue;

    const problemFile = path.join(problemDir, "problem.yaml");
    if (await pathExists(problemFile)) {
      const problem = await validateAgainst(problemFile, "OpenProblem", OpenProblemSchema, errors);
      filesChecked++;
      if (problem !== undefined && taxonomy !== undefined) {
        checkProblemTaxonomyFk(
          problemFile,
          problem as { domain: string; subdomain: string },
          taxonomy,
          errors,
        );
      }
    }

    const ratingsDir = path.join(problemDir, "ratings");
    for (const ratingFile of await listEntries(ratingsDir)) {
      if (!ratingFile.endsWith(".yaml")) continue;
      await validateAgainst(
        path.join(ratingsDir, ratingFile),
        "RatingAction",
        RatingActionSchema,
        errors,
      );
      filesChecked++;
    }

    const entriesFile = path.join(problemDir, "entries.json");
    if (await pathExists(entriesFile)) {
      try {
        const data = await parseFile(entriesFile);
        const arr = Array.isArray(data) ? data : [data];
        for (const [i, entry] of arr.entries()) {
          const result = LeaderboardEntrySchema.safeParse(entry);
          if (!result.success) {
            pushIssues(errors, `${entriesFile}[${i}]`, "LeaderboardEntry", result.error.issues);
          }
        }
        filesChecked++;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        errors.push({
          file: entriesFile,
          schema: "LeaderboardEntry",
          issues: [{ path: "", message: `parse error: ${message}` }],
        });
      }
    }
  }

  // 3. Papers
  const papersRoot = path.join(contentRoot, "papers");
  for (const file of await listEntries(papersRoot)) {
    if (!file.endsWith(".yaml")) continue;
    await validateAgainst(path.join(papersRoot, file), "Paper", PaperSchema, errors);
    filesChecked++;
  }

  // 4. Authors
  const authorsRoot = path.join(contentRoot, "authors");
  for (const file of await listEntries(authorsRoot)) {
    if (!file.endsWith(".yaml")) continue;
    await validateAgainst(path.join(authorsRoot, file), "Author", AuthorSchema, errors);
    filesChecked++;
  }

  // 5. Institutions
  const institutionsRoot = path.join(contentRoot, "institutions");
  for (const file of await listEntries(institutionsRoot)) {
    if (!file.endsWith(".yaml")) continue;
    await validateAgainst(
      path.join(institutionsRoot, file),
      "Institution",
      InstitutionSchema,
      errors,
    );
    filesChecked++;
  }

  return { filesChecked, errors };
}
