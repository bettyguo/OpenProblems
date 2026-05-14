import { describe, it, expect } from "vitest";
import { BenchmarkSchema } from "@/lib/schemas/benchmark";

describe("BenchmarkSchema", () => {
  it("accepts a minimal valid benchmark", () => {
    expect(
      BenchmarkSchema.safeParse({
        id: "swe-bench-verified",
        name: "SWE-bench Verified",
        dataset: "SWE-bench",
        metric: "pass@1",
        metric_direction: "higher-is-better",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid metric_direction enum", () => {
    expect(
      BenchmarkSchema.safeParse({
        id: "x",
        name: "X",
        dataset: "X",
        metric: "X",
        metric_direction: "increasing",
      }).success,
    ).toBe(false);
  });

  it("accepts optional upper_bound and protocol_url", () => {
    expect(
      BenchmarkSchema.safeParse({
        id: "halueval",
        name: "HaluEval",
        dataset: "HaluEval",
        metric: "accuracy",
        metric_direction: "higher-is-better",
        upper_bound: 100,
        protocol_url: "https://example.com/protocol",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-URL protocol_url", () => {
    expect(
      BenchmarkSchema.safeParse({
        id: "x",
        name: "X",
        dataset: "X",
        metric: "X",
        metric_direction: "higher-is-better",
        protocol_url: "not a url",
      }).success,
    ).toBe(false);
  });
});
