import { describe, expect, it } from "vitest";
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

const FAKE_BENCHMARKS: BenchmarkRef[] = [
  { id: "halueval", name: "HaluEval", metric: "accuracy", metric_direction: "higher-is-better" },
  { id: "simpleqa", name: "SimpleQA", metric: "f-score", metric_direction: "higher-is-better" },
];

describe("buildSystemPrompt", () => {
  it("includes schema, benchmark ids, primary-source rule, and JSON-array spec", () => {
    const p = buildSystemPrompt(FAKE_BENCHMARKS, "2411.04368");
    expect(p).toContain("Schema per entry");
    expect(p).toContain("§9");
    expect(p).toContain("§15.6");
    expect(p).toContain(`id: "halueval"`);
    expect(p).toContain(`id: "simpleqa"`);
    expect(p).toContain("Paper being extracted: 2411.04368");
    expect(p).toContain("JSON array");
  });

  it("instructs OMIT for unstated scores (no fabrication)", () => {
    const p = buildSystemPrompt(FAKE_BENCHMARKS, "x");
    expect(p).toMatch(/OMIT the row/i);
  });

  it("forbids proposing a benchmark_id outside the declared list", () => {
    const p = buildSystemPrompt(FAKE_BENCHMARKS, "x");
    expect(p).toMatch(/Do NOT propose a benchmark_id outside/);
  });
});

describe("buildUserPrompt", () => {
  it("embeds the PDF text verbatim between markers", () => {
    const p = buildUserPrompt("Sample paper body.");
    expect(p).toContain("--- PAPER TEXT ---");
    expect(p).toContain("Sample paper body.");
    expect(p).toContain("--- END PAPER TEXT ---");
  });
});

describe("parseEntryArrayResponse", () => {
  it("parses a bare JSON array", () => {
    const text = '[{"benchmark_id":"halueval","score":85.2,"date":"2025-02-27"}]';
    const entries = parseEntryArrayResponse(text);
    expect(entries.length).toBe(1);
    expect(entries[0]!.benchmark_id).toBe("halueval");
    expect(entries[0]!.score).toBe(85.2);
    expect(entries[0]!.date).toBe("2025-02-27");
  });

  it("strips ```json ... ``` fences", () => {
    const text = '```json\n[{"benchmark_id":"halueval","score":85.2,"date":"2025-02-27"}]\n```';
    const entries = parseEntryArrayResponse(text);
    expect(entries.length).toBe(1);
  });

  it("parses an empty array", () => {
    expect(parseEntryArrayResponse("[]")).toEqual([]);
  });

  it("preserves optional protocol_notes when present", () => {
    const text =
      '[{"benchmark_id":"halueval","score":85.2,"date":"2025-02-27","protocol_notes":"GPT-4 zero-shot."}]';
    const entries = parseEntryArrayResponse(text);
    expect(entries[0]!.protocol_notes).toBe("GPT-4 zero-shot.");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseEntryArrayResponse("not json")).toThrow(/not valid JSON/);
  });

  it("throws when response is not an array", () => {
    expect(() => parseEntryArrayResponse('{"foo": "bar"}')).toThrow(/not a JSON array/);
  });

  it("throws when a row is missing benchmark_id", () => {
    expect(() => parseEntryArrayResponse('[{"score":1,"date":"2025-01-01"}]')).toThrow(
      /missing\/invalid benchmark_id/,
    );
  });

  it("throws when a row has a malformed date", () => {
    expect(() =>
      parseEntryArrayResponse('[{"benchmark_id":"x","score":1,"date":"2025/01/01"}]'),
    ).toThrow(/missing\/invalid date/);
  });

  it("throws when score is non-numeric", () => {
    expect(() =>
      parseEntryArrayResponse('[{"benchmark_id":"x","score":"hi","date":"2025-01-01"}]'),
    ).toThrow(/missing\/invalid score/);
  });
});

describe("mergeEntries", () => {
  it("appends new entries with verified: false + paper_id injected", () => {
    const existing: LeaderboardEntry[] = [
      {
        paper_id: "older",
        benchmark_id: "halueval",
        score: 70,
        date: "2024-01-01",
        verified: true,
      },
    ];
    const proposed = [
      { benchmark_id: "halueval", score: 85.2, date: "2025-02-27" },
      { benchmark_id: "simpleqa", score: 62.5, date: "2025-02-27" },
    ];
    const merged = mergeEntries(existing, proposed, "2411.04368");
    expect(merged.length).toBe(3);
    expect(merged[0]).toEqual(existing[0]);
    expect(merged[1]).toEqual({
      paper_id: "2411.04368",
      benchmark_id: "halueval",
      score: 85.2,
      date: "2025-02-27",
      verified: false,
    });
    expect(merged[2]!.verified).toBe(false);
  });

  it("never propagates verified: true from a proposed row (curator-side flip)", () => {
    // Even if the LLM erroneously included verified: true, the merge layer drops it.
    const merged = mergeEntries([], [{ benchmark_id: "x", score: 1, date: "2026-01-01" }], "p");
    expect(merged[0]!.verified).toBe(false);
  });

  it("preserves protocol_notes when present", () => {
    const merged = mergeEntries(
      [],
      [{ benchmark_id: "x", score: 1, date: "2026-01-01", protocol_notes: "GPT-4." }],
      "p",
    );
    expect(merged[0]!.protocol_notes).toBe("GPT-4.");
  });
});

describe("renderEntriesJson", () => {
  it("formats with 2-space indent + trailing newline", () => {
    const json = renderEntriesJson([
      { paper_id: "p", benchmark_id: "b", score: 1, date: "2026-01-01", verified: false },
    ]);
    expect(json.endsWith("\n")).toBe(true);
    expect(json).toContain('  "paper_id": "p"');
  });
});

describe("buildEntriesDiff", () => {
  it("produces a new-file diff when existingBody is null (create case)", () => {
    const d = buildEntriesDiff("content/problems/x/entries.json", null, "[]\n");
    expect(d).toContain("--- /dev/null");
    expect(d).toContain("+++ b/content/problems/x/entries.json");
    expect(d).toContain("new file mode 100644");
  });

  it("produces a unified diff when existingBody is non-null (modify case)", () => {
    const existing = '[\n  { "a": 1 }\n]\n';
    const merged = '[\n  { "a": 1 },\n  { "a": 2 }\n]\n';
    const d = buildEntriesDiff("content/problems/x/entries.json", existing, merged);
    expect(d).toContain("--- content/problems/x/entries.json");
    expect(d).toContain("+++ content/problems/x/entries.json");
    // The new line should appear with a `+` prefix.
    expect(d).toContain('+  { "a": 2 }');
  });
});
