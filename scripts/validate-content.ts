#!/usr/bin/env tsx
/**
 * CI gate: validate every YAML / JSON file under content/ against its
 * Zod schema. Exits 0 on success, 1 on any validation error.
 *
 * Invoked by `pnpm validate-content`. Wired into GitHub Actions in Unit 0.11.
 *
 * The actual logic lives in lib/content/validate.ts so it can be unit-tested
 * from Vitest. This script is a thin reporter wrapper.
 */
import path from "node:path";
import process from "node:process";
import { validateContent } from "@/lib/content/validate";

const contentRoot = path.resolve(process.cwd(), "content");

const result = await validateContent(contentRoot);

if (result.errors.length === 0) {
  // eslint-disable-next-line no-console
  console.log(
    `✓ ${result.filesChecked} content file(s) validated against schemas.`,
  );
  process.exit(0);
}

// eslint-disable-next-line no-console
console.error(
  `✗ ${result.errors.length} validation error(s) across ${result.filesChecked} file(s):\n`,
);
for (const err of result.errors) {
  // eslint-disable-next-line no-console
  console.error(`  ${err.file}`);
  // eslint-disable-next-line no-console
  console.error(`    schema: ${err.schema}`);
  for (const issue of err.issues) {
    const at = issue.path ? `[${issue.path}] ` : "";
    // eslint-disable-next-line no-console
    console.error(`    - ${at}${issue.message}`);
  }
}
process.exit(1);
