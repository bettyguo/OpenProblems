import { appendFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Thin wrapper over `@anthropic-ai/sdk` for Phase-5 curator scripts (ADR-0008).
 *
 * - Reads `ANTHROPIC_API_KEY` from env; throws when unset (D-C, no fallback).
 * - Supports `dryRun: true` returning a placeholder without an API call.
 * - Applies `cache_control: { type: "ephemeral" }` to the `systemCached` block.
 * - When `LLM_OPENPROBLEMS_DAILY_BUDGET_USD` is set, reads `.llm-spend.log` (JSONL)
 *   and aborts if the next call would exceed the day's budget (D-C).
 * - Returns `{ text, meta }` where `meta` carries the audit fields scripts write
 *   to the `<draft>.meta.json` sidecar (D-E).
 */

const SPEND_LOG_PATH = ".llm-spend.log";

// Published per-million-token pricing (USD) for the models Phase-5 uses.
// Source: anthropic.com/pricing (snapshot at Phase-5 launch; revise when prices change).
interface ModelPrice {
  inputPerMTok: number;
  outputPerMTok: number;
  cacheWritePerMTok: number;
  cacheReadPerMTok: number;
}
const MODEL_PRICES: Record<string, ModelPrice> = {
  "claude-sonnet-4-6": {
    inputPerMTok: 3.0,
    outputPerMTok: 15.0,
    cacheWritePerMTok: 3.75,
    cacheReadPerMTok: 0.3,
  },
  "claude-opus-4-7": {
    inputPerMTok: 15.0,
    outputPerMTok: 75.0,
    cacheWritePerMTok: 18.75,
    cacheReadPerMTok: 1.5,
  },
  "claude-haiku-4-5-20251001": {
    inputPerMTok: 1.0,
    outputPerMTok: 5.0,
    cacheWritePerMTok: 1.25,
    cacheReadPerMTok: 0.1,
  },
};

export interface CallAnthropicOptions {
  model: string;
  systemCached: string;
  userPrompt: string;
  maxTokens?: number;
  dryRun?: boolean;
  /** Override the SDK client (for tests). */
  clientFactory?: () => Pick<Anthropic, "messages">;
  /** Override the spend-log path (for tests). */
  spendLogPath?: string;
  /** Override Date.now / new Date() (for tests). */
  now?: () => Date;
}

export interface UsageMeta {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cost_usd_estimate: number;
  prompt_sha256: string;
  completion_sha256: string;
  anthropic_request_id: string | null;
  iso_timestamp: string;
  dry_run: boolean;
}

export interface CallAnthropicResult {
  text: string;
  meta: UsageMeta;
}

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens = 0,
  cacheReadTokens = 0,
): number {
  const price = MODEL_PRICES[model];
  if (!price) return 0;
  // Cache-read tokens are billed at the cache-read rate, not the input rate.
  // Cache-creation tokens are billed at the cache-write rate.
  // Remaining input tokens (= total input minus cache-related) at the normal input rate.
  const normalInput = Math.max(0, inputTokens - cacheCreationTokens - cacheReadTokens);
  const usd =
    (normalInput * price.inputPerMTok +
      cacheCreationTokens * price.cacheWritePerMTok +
      cacheReadTokens * price.cacheReadPerMTok +
      outputTokens * price.outputPerMTok) /
    1_000_000;
  return Math.round(usd * 1_000_000) / 1_000_000;
}

async function readBudgetSpend(spendLogPath: string, todayIso: string): Promise<number> {
  try {
    const text = await readFile(spendLogPath, "utf-8");
    let sum = 0;
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line) as { iso_date?: string; cost_usd?: number };
        if (parsed.iso_date === todayIso && typeof parsed.cost_usd === "number") {
          sum += parsed.cost_usd;
        }
      } catch {
        // ignore malformed lines
      }
    }
    return sum;
  } catch {
    return 0;
  }
}

async function appendSpend(
  spendLogPath: string,
  todayIso: string,
  script: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
): Promise<void> {
  const line =
    JSON.stringify({
      iso_date: todayIso,
      script,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
    }) + "\n";
  await appendFile(spendLogPath, line, "utf-8");
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function callAnthropic(
  scriptName: string,
  options: CallAnthropicOptions,
): Promise<CallAnthropicResult> {
  const now = options.now ?? (() => new Date());
  const isoTimestamp = now().toISOString();
  const todayIso = isoTimestamp.slice(0, 10);
  const spendLogPath = options.spendLogPath ?? SPEND_LOG_PATH;
  const maxTokens = options.maxTokens ?? 4096;

  const promptHash = sha256(`${options.systemCached}\n---\n${options.userPrompt}`);

  if (options.dryRun) {
    const placeholder = "[DRY RUN — no API call made]";
    return {
      text: placeholder,
      meta: {
        model: options.model,
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        cost_usd_estimate: 0,
        prompt_sha256: promptHash,
        completion_sha256: sha256(placeholder),
        anthropic_request_id: null,
        iso_timestamp: isoTimestamp,
        dry_run: true,
      },
    };
  }

  // Real call: require the API key.
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Phase-5 scripts require it (ADR-0008 D-C). Aborting.",
    );
  }

  // Budget check (D-C). Budget env in dollars.
  const budgetEnv = process.env["LLM_OPENPROBLEMS_DAILY_BUDGET_USD"];
  if (budgetEnv) {
    const budget = Number(budgetEnv);
    if (Number.isFinite(budget) && budget > 0) {
      const todaySpend = await readBudgetSpend(spendLogPath, todayIso);
      if (todaySpend >= budget) {
        throw new BudgetExceededError(
          `Daily budget $${budget.toFixed(2)} already exceeded ($${todaySpend.toFixed(4)} spent today). Aborting.`,
        );
      }
    }
  }

  const client = options.clientFactory ? options.clientFactory() : new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: options.model,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: options.systemCached,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: options.userPrompt }],
  });

  const text = response.content.map((b) => (b.type === "text" ? b.text : "")).join("");

  const usage = response.usage;
  const cacheCreation = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cost = estimateCost(
    options.model,
    usage.input_tokens,
    usage.output_tokens,
    cacheCreation,
    cacheRead,
  );

  await appendSpend(
    spendLogPath,
    todayIso,
    scriptName,
    options.model,
    usage.input_tokens,
    usage.output_tokens,
    cost,
  );

  return {
    text,
    meta: {
      model: options.model,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_creation_input_tokens: cacheCreation,
      cache_read_input_tokens: cacheRead,
      cost_usd_estimate: cost,
      prompt_sha256: promptHash,
      completion_sha256: sha256(text),
      anthropic_request_id: response.id ?? null,
      iso_timestamp: isoTimestamp,
      dry_run: false,
    },
  };
}

export const __testing = {
  MODEL_PRICES,
  readBudgetSpend,
  appendSpend,
};
