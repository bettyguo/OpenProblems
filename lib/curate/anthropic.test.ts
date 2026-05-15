import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  __testing,
  BudgetExceededError,
  callAnthropic,
  estimateCost,
} from "@/lib/curate/anthropic";

const { MODEL_PRICES } = __testing;

describe("estimateCost", () => {
  it("returns 0 for an unknown model (no crash)", () => {
    expect(estimateCost("unknown-model", 1000, 500)).toBe(0);
  });

  it("computes per-token cost for Sonnet 4.6", () => {
    // 1000 input @ $3/MT = $0.003; 500 output @ $15/MT = $0.0075; total $0.0105.
    expect(estimateCost("claude-sonnet-4-6", 1000, 500)).toBeCloseTo(0.0105, 6);
  });

  it("computes per-token cost for Opus 4.7 (5× Sonnet)", () => {
    // 1000 input @ $15/MT = $0.015; 500 output @ $75/MT = $0.0375; total $0.0525.
    expect(estimateCost("claude-opus-4-7", 1000, 500)).toBeCloseTo(0.0525, 6);
  });

  it("bills cache-write tokens at the write rate, not the input rate", () => {
    // 1000 total input where 800 are cache_creation: 200 @ $3/MT + 800 @ $3.75/MT
    //   = $0.0006 + $0.003 = $0.0036. (vs $0.003 if all were normal input.)
    expect(estimateCost("claude-sonnet-4-6", 1000, 0, 800, 0)).toBeCloseTo(0.0036, 6);
  });

  it("bills cache-read tokens at the read rate (10× cheaper than input for Sonnet)", () => {
    // 1000 total input where 800 are cache_read: 200 @ $3/MT + 800 @ $0.30/MT
    //   = $0.0006 + $0.00024 = $0.00084.
    expect(estimateCost("claude-sonnet-4-6", 1000, 0, 0, 800)).toBeCloseTo(0.00084, 6);
  });

  it("has prices for all 3 Phase-5 models", () => {
    expect(MODEL_PRICES["claude-sonnet-4-6"]).toBeDefined();
    expect(MODEL_PRICES["claude-opus-4-7"]).toBeDefined();
    expect(MODEL_PRICES["claude-haiku-4-5-20251001"]).toBeDefined();
  });
});

describe("callAnthropic --dry-run", () => {
  it("returns a placeholder without invoking the SDK or requiring API key", async () => {
    // Clear the env to prove dry-run doesn't read it.
    const saved = process.env["ANTHROPIC_API_KEY"];
    delete process.env["ANTHROPIC_API_KEY"];
    try {
      const result = await callAnthropic("test-script", {
        model: "claude-sonnet-4-6",
        systemCached: "system",
        userPrompt: "user",
        dryRun: true,
      });
      expect(result.text).toBe("[DRY RUN — no API call made]");
      expect(result.meta.dry_run).toBe(true);
      expect(result.meta.cost_usd_estimate).toBe(0);
      expect(result.meta.input_tokens).toBe(0);
      expect(result.meta.anthropic_request_id).toBeNull();
      expect(result.meta.prompt_sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(result.meta.completion_sha256).toMatch(/^[0-9a-f]{64}$/);
    } finally {
      if (saved !== undefined) process.env["ANTHROPIC_API_KEY"] = saved;
    }
  });

  it("includes a stable prompt_sha256 across calls with identical prompts", async () => {
    const r1 = await callAnthropic("test-script", {
      model: "claude-sonnet-4-6",
      systemCached: "system",
      userPrompt: "user",
      dryRun: true,
    });
    const r2 = await callAnthropic("test-script", {
      model: "claude-sonnet-4-6",
      systemCached: "system",
      userPrompt: "user",
      dryRun: true,
    });
    expect(r1.meta.prompt_sha256).toBe(r2.meta.prompt_sha256);
  });
});

describe("callAnthropic budget enforcement", () => {
  let tmpDir: string;
  let spendLogPath: string;
  let savedKey: string | undefined;
  let savedBudget: string | undefined;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "anthropic-budget-test-"));
    spendLogPath = path.join(tmpDir, "spend.log");
    savedKey = process.env["ANTHROPIC_API_KEY"];
    savedBudget = process.env["LLM_OPENPROBLEMS_DAILY_BUDGET_USD"];
    process.env["ANTHROPIC_API_KEY"] = "test-key";
  });

  afterEach(async () => {
    if (savedKey === undefined) delete process.env["ANTHROPIC_API_KEY"];
    else process.env["ANTHROPIC_API_KEY"] = savedKey;
    if (savedBudget === undefined) delete process.env["LLM_OPENPROBLEMS_DAILY_BUDGET_USD"];
    else process.env["LLM_OPENPROBLEMS_DAILY_BUDGET_USD"] = savedBudget;
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("throws BudgetExceededError when today's spend exceeds the cap", async () => {
    process.env["LLM_OPENPROBLEMS_DAILY_BUDGET_USD"] = "1.00";
    const today = new Date("2026-05-15T12:00:00Z");
    const todayIso = today.toISOString().slice(0, 10);
    await writeFile(
      spendLogPath,
      JSON.stringify({ iso_date: todayIso, cost_usd: 1.5 }) + "\n",
      "utf-8",
    );
    await expect(
      callAnthropic("test", {
        model: "claude-sonnet-4-6",
        systemCached: "x",
        userPrompt: "y",
        spendLogPath,
        now: () => today,
      }),
    ).rejects.toBeInstanceOf(BudgetExceededError);
  });
});
