import { describe, it, expect } from "vitest";
import path from "node:path";
import { validateContent } from "@/lib/content/validate";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const FIXTURES = path.join(REPO_ROOT, "test", "fixtures");

describe("validateContent", () => {
  it("returns zero errors for a valid fixture", async () => {
    const result = await validateContent(path.join(FIXTURES, "content-valid"));
    expect(result.errors).toEqual([]);
    expect(result.filesChecked).toBeGreaterThan(0);
  });

  it("reports an error for an invalid fixture (duplicate domain id)", async () => {
    const result = await validateContent(
      path.join(FIXTURES, "content-invalid"),
    );
    expect(result.errors.length).toBeGreaterThan(0);
    const taxonomyError = result.errors.find((e) =>
      e.file.endsWith("taxonomy.yaml"),
    );
    expect(taxonomyError).toBeDefined();
    expect(taxonomyError?.schema).toBe("Taxonomy");
  });

  it("returns zero errors for the real content/ in the repo", async () => {
    const result = await validateContent(path.join(REPO_ROOT, "content"));
    expect(result.errors).toEqual([]);
  });

  it("tolerates missing optional subdirs (problems, papers, ...)", async () => {
    const result = await validateContent(path.join(FIXTURES, "content-valid"));
    expect(result.filesChecked).toBe(1);
  });
});
