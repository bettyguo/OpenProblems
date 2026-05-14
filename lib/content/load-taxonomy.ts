import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { TaxonomySchema, type Taxonomy } from "@/lib/schemas/taxonomy";

const DEFAULT_PATH = path.resolve(process.cwd(), "content/taxonomy.yaml");

/**
 * Read, parse, and validate the canonical taxonomy YAML.
 * Throws if the file is missing, the YAML is malformed, or the parsed
 * value fails TaxonomySchema. Used by tests, the validate-content
 * script (Unit 0.7), and Next routes that render the taxonomy.
 */
export async function loadTaxonomy(filePath: string = DEFAULT_PATH): Promise<Taxonomy> {
  const raw = await readFile(filePath, "utf8");
  const parsed: unknown = parse(raw);
  return TaxonomySchema.parse(parsed);
}
