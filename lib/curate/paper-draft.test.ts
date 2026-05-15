import { describe, expect, it } from "vitest";
import {
  buildDraftFilenames,
  buildSystemPrompt,
  buildUnifiedDiff,
  buildUserPrompt,
  parseLLMResponse,
} from "@/lib/curate/paper-draft";
import type { ArxivMetadata } from "@/lib/curate/arxiv-client";

const FAKE_METADATA: ArxivMetadata = {
  arxivId: "2310.06770",
  version: "v3",
  title: "SWE-bench: Can LMs Resolve Real-World GitHub Issues?",
  abstract: "We introduce SWE-bench, a benchmark of 2,294 real-world software-engineering tasks.",
  authors: ["Carlos E. Jimenez", "John Yang"],
  primaryCategory: "cs.SE",
  categories: ["cs.SE", "cs.AI"],
  publishedDate: "2023-10-10",
  updatedDate: "2024-11-11",
  abstractUrl: "http://arxiv.org/abs/2310.06770v3",
  pdfUrl: "http://arxiv.org/pdf/2310.06770v3",
};

const FAKE_SLUGS = {
  problems: ["hallucination-reduction", "long-horizon-agent-reliability"],
  authors: ["shunyu-yao", "karthik-narasimhan", "carlos-jimenez"],
  institutions: ["princeton-university", "anthropic"],
};

describe("buildSystemPrompt", () => {
  it("includes the schema description + all 3 slug lists", () => {
    const p = buildSystemPrompt(FAKE_SLUGS);
    expect(p).toContain("Schema (lib/schemas/paper.ts)");
    expect(p).toContain("Known problem slugs (2):");
    expect(p).toContain("hallucination-reduction");
    expect(p).toContain("long-horizon-agent-reliability");
    expect(p).toContain("Known author slugs (3):");
    expect(p).toContain("shunyu-yao");
    expect(p).toContain("Known institution slugs (2):");
    expect(p).toContain("princeton-university");
  });

  it("truncates the author slug list at 30 with an overflow note", () => {
    const manyAuthors = Array.from(
      { length: 50 },
      (_, i) => `author-${i.toString().padStart(3, "0")}`,
    );
    const p = buildSystemPrompt({ ...FAKE_SLUGS, authors: manyAuthors });
    expect(p).toContain("Known author slugs (50):");
    expect(p).toContain("author-000");
    expect(p).toContain("author-029");
    expect(p).not.toContain("author-030");
    expect(p).toContain("... and 20 more");
  });

  it("cites §15.6 primary-source rule + §7 paper-object framing", () => {
    const p = buildSystemPrompt(FAKE_SLUGS);
    expect(p).toContain("§15.6");
    expect(p).toContain("§7");
  });

  it("instructs the model to mark non-existent slugs with a NEW SLUG comment", () => {
    const p = buildSystemPrompt(FAKE_SLUGS);
    expect(p).toContain("NEW SLUG");
    expect(p).toContain("curator must create content/authors/<slug>.yaml");
  });
});

describe("buildUserPrompt", () => {
  it("renders arxiv metadata + abstract verbatim", () => {
    const p = buildUserPrompt(FAKE_METADATA);
    expect(p).toContain("arxiv_id: 2310.06770");
    expect(p).toContain("title: SWE-bench:");
    expect(p).toContain("primary_category: cs.SE");
    expect(p).toContain("Carlos E. Jimenez; John Yang");
    expect(p).toContain("We introduce SWE-bench");
  });
});

describe("parseLLMResponse", () => {
  it("passes through a bare YAML body unchanged (with trailing newline)", () => {
    const body = 'id: "2310.06770"\ntitle: SWE-bench';
    expect(parseLLMResponse(body)).toBe(body + "\n");
  });

  it("strips ```yaml ... ``` fences if the model adds them", () => {
    const fenced = '```yaml\nid: "2310.06770"\ntitle: SWE-bench\n```';
    expect(parseLLMResponse(fenced)).toBe('id: "2310.06770"\ntitle: SWE-bench\n');
  });

  it("strips ``` ... ``` (unlabeled) fences too", () => {
    const fenced = "```\nfoo: bar\n```";
    expect(parseLLMResponse(fenced)).toBe("foo: bar\n");
  });

  it("trims surrounding whitespace", () => {
    expect(parseLLMResponse("\n\n  foo: bar  \n\n")).toBe("foo: bar\n");
  });
});

describe("buildUnifiedDiff", () => {
  it("produces a git-apply-compatible new-file patch", () => {
    const d = buildUnifiedDiff(
      "content/papers/2310.06770.yaml",
      'id: "2310.06770"\ntitle: SWE-bench\n',
    );
    expect(d).toContain(
      "diff --git a/content/papers/2310.06770.yaml b/content/papers/2310.06770.yaml",
    );
    expect(d).toContain("new file mode 100644");
    expect(d).toContain("--- /dev/null");
    expect(d).toContain("+++ b/content/papers/2310.06770.yaml");
    expect(d).toContain("@@ -0,0 +1,2 @@");
    expect(d).toContain('+id: "2310.06770"');
    expect(d).toContain("+title: SWE-bench");
  });

  it("counts hunk lines correctly when the body has no trailing newline", () => {
    const d = buildUnifiedDiff("x.yaml", "foo\nbar\nbaz");
    expect(d).toContain("@@ -0,0 +1,3 @@");
  });

  it("emits one + per body line", () => {
    const d = buildUnifiedDiff("x.yaml", "a\nb\nc\n");
    const plusLines = d.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
    expect(plusLines.length).toBe(3);
  });
});

describe("buildDraftFilenames", () => {
  it("produces filesystem-safe diff + meta names", () => {
    const { diffName, metaName } = buildDraftFilenames({
      unit: "5.3",
      arxivId: "2310.06770",
      isoTimestamp: "2026-05-15T17:30:00.123Z",
    });
    expect(diffName).toBe("5.3-2026-05-15T17-30-00-2310.06770.diff");
    expect(metaName).toBe("5.3-2026-05-15T17-30-00-2310.06770.diff.meta.json");
  });

  it("scrubs unsafe characters from the arxiv id (paranoia)", () => {
    const { diffName } = buildDraftFilenames({
      unit: "5.3",
      arxivId: "weird/id with spaces",
      isoTimestamp: "2026-05-15T17:30:00.000Z",
    });
    expect(diffName).not.toContain("/");
    expect(diffName).not.toContain(" ");
  });
});
