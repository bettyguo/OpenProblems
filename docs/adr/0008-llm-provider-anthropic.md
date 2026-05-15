# ADR-0008 — LLM provider selection (Anthropic Claude) + cost-governance pact

- **Status:** accepted
- **Date authored:** 2026-05-15
- **Date accepted:** 2026-05-15
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

`MASTER_PROMPT.md` §12 lists Phase 5 as the **Intelligence layer (LLM-assisted curation)**. §13 names three deliverables that require an LLM:

> - arXiv ingestion helper (a CLI in `scripts/`) producing **draft** paper YAML for curator review.
> - LLM-assisted extraction of candidate leaderboard entries from a paper PDF (must produce a human-review diff; no auto-merge).
> - Email\RSS digest: per-domain weekly summary.

Phase 5 is the **first paid-API surface** in the project. Before any script lands, this ADR pins:

1. **Which LLM provider?** Anthropic Claude, OpenAI GPT-class, Google Gemini, a local model via Ollama, a multi-provider abstraction, or no-LLM.
2. **What's the cost-governance posture?** Defaults, env vars, dry-run flags, daily-cap mechanism, auditability requirements.

[OPEN_QUESTIONS Q41](../../OPEN_QUESTIONS.md#q41-llm-model-choice-per-phase-5-script) (decided-as-lean in Unit 5.0) and [Q42](../../OPEN_QUESTIONS.md#q42-cost-cap-default-policy) (open) frame the choices. This ADR converts the lean into a firm decision (closing Q41) and documents Q42's trade-off explicitly.

## Decision Drivers

- **§15.6 — primary-source rule.** LLM-assisted curation must remain auditable; the provider must support structured-output modes that the curator can verify against the source.
- **§3 — brand alignment.** LLM OpenProblems indexes Claude-class models. Using Anthropic to draft entries about its own + competitors' work is a conflict-adjacent choice that must be disclosed.
- **Cost discipline.** First paid-API surface in the project; defensible-from-day-zero cost governance.
- **Operator familiarity.** The `claude-api` skill in the project's command palette presupposes Anthropic SDK usage.
- **Prompt caching.** Multi-paper ingest runs reuse the same MASTER_PROMPT.md context block; Anthropic's `cache_control: { type: "ephemeral" }` cuts cost by ~50%.
- **Reversibility.** `lib/curate/` modules will abstract provider calls behind a thin wrapper; switching providers later should be one-file edits, not a refactor.

## Considered Options

1. **Anthropic Claude** (`@anthropic-ai/sdk`) — chosen.
2. **OpenAI GPT-4-class** (`gpt-4o` / `o1` / `o3`, via `openai` SDK).
3. **Google Gemini** (`@google/generative-ai`).
4. **Local model via Ollama** (Llama 3.x / Mistral / Qwen).
5. **Multi-provider abstraction** (Vercel AI SDK or LangChain).
6. **No LLM** — Phase 5 ships only the arXiv metadata fetcher + RSS digest; curators draft everything manually.

## Decision Outcome

**Chosen: Option 1 — Anthropic Claude (`@anthropic-ai/sdk`).**

The decision pins six concrete contracts:

### D-A. Provider

`@anthropic-ai/sdk` is the only LLM dependency in `package.json`. Other LLM providers' SDKs are **forbidden** from landing in `dependencies` or `devDependencies` until a follow-on ADR explicitly authorises multi-provider work.

### D-B. Model defaults per script

| Script                  | Default model       | Rationale                                                                                                |
|-------------------------|---------------------|----------------------------------------------------------------------------------------------------------|
| `ingest-arxiv`          | **Sonnet 4.6**      | Fast + cheap + good enough for `(metadata + abstract) → YAML draft` transformation.                       |
| `extract-leaderboard`   | **Opus 4.7**        | Multi-table PDF parsing benefits from frontier capability; cost premium justified by review-effort savings. |
| `build-digest`          | **Sonnet 4.6**      | Text summarisation; not capability-bound.                                                                 |

Every script accepts a `--model` CLI flag that overrides the default. Per the `claude-api` skill convention, the project tracks "latest and most capable" Claude models; a follow-on commit updates these defaults when a new flagship lands.

### D-C. Cost-governance pact

1. **`ANTHROPIC_API_KEY` from env.** No fallback, no committed key, no UI prompt. Scripts fail loudly when unset.
2. **`--dry-run`** flag on every script — prints the rendered prompt + estimated token count to stdout without making the API call. Default workflow: dry-run, eyeball the prompt, then real run.
3. **`--verbose`** flag prints estimated cost in USD before each call (Anthropic's published price × the request token count, rounded to the nearest cent).
4. **`LLM_OPENPROBLEMS_DAILY_BUDGET_USD`** env var, optional. When set:
    - Each script appends a JSONL line to `.llm-spend.log` (gitignored) per call: `{ "iso_date": "...", "script": "...", "model": "...", "input_tokens": N, "output_tokens": N, "cost_usd": N }`.
    - Before each call, the script sums today's `cost_usd` from the log and aborts if the next call would exceed the budget.
5. **No default daily-cap** (Q42 trade-off). Setting a default cap would cause fresh installs to fail-on-first-run; not setting one means curators discover cost surprises only after the bill. The `--verbose` cost-line + dry-run discipline is the primary safeguard. Re-evaluated after the first 100 ingest runs reveal the actual per-call distribution.

### D-D. Prompt caching

The MASTER_PROMPT.md context block (or any other shared system-prompt block) is wrapped in `cache_control: { type: "ephemeral" }` when a script makes ≥ 2 API calls in a session. The 5-minute TTL is acceptable for curator-run sessions (typically < 5 min).

`lib/curate/anthropic.ts` (a thin wrapper landing in Unit 5.2 or 5.3) handles the cache-block injection — scripts don't manage it directly.

### D-E. Auditability

Every script writes a sidecar metadata file alongside its draft diff:

```
drafts/<unit>-<timestamp>-<slug>.diff
drafts/<unit>-<timestamp>-<slug>.diff.meta.json
```

The metadata file contains:

```json
{
  "model": "claude-sonnet-4-6",
  "input_tokens": 1234,
  "output_tokens": 567,
  "cost_usd_estimate": 0.0234,
  "prompt_sha256": "...",
  "completion_sha256": "...",
  "anthropic_request_id": "...",
  "iso_timestamp": "2026-05-15T16:38:00Z"
}
```

Makes spot-audit + reproduction tractable. The `prompt_sha256` field allows a curator to re-run the exact same prompt months later (assuming the model snapshot is still available).

### D-F. Conflict-of-interest disclosure

LLM OpenProblems indexes papers from Anthropic, OpenAI, Google DeepMind, Meta FAIR, and other labs. Using Anthropic Claude to draft entries about its own + competitors' work is conflict-adjacent. A future content-side unit (likely a `content/contributing/v1.x` bump or a `/methodology` § appendix) surfaces this disclosure verbatim:

> "This encyclopedia uses Anthropic Claude to draft curator suggestions, including for papers from Anthropic itself. Curators are expected to apply equal scrutiny regardless of authorship."

Not in scope for ADR-0008. Tracked as a Phase-5 / Phase-6 content follow-on.

### Consequences

- **Positive.** Single vendor → predictable SDK ergonomics, structured-output via tool-use, prompt caching, well-typed TS bindings, mature SDK, the in-project `claude-api` skill assists development.
- **Positive.** Cost-governance pact is defensible from day zero; `--dry-run` + `--verbose` + audit-log triple-defense.
- **Positive.** Reversible — `lib/curate/` abstracts the provider call into a thin wrapper; a future ADR could swap providers via one-file edits.
- **Positive.** Closes Q41 (model defaults) by reducing the lean to a firm per-script table.
- **Negative.** Single-vendor risk — Anthropic API outages take Phase-5 scripts offline. Mitigation: `--dry-run` enables prompt iteration during outages; `.arxiv-cache/` + `.pdf-cache/` (Units 5.2 / 5.4) let metadata + PDF work proceed.
- **Negative.** Cost. Per-paper ingest ~$0.005 (Sonnet 4.6); per-PDF leaderboard extraction ~$0.50–$0.75 (Opus 4.7 on a 50k-token PDF). 100-paper batches: $5–$75. Manageable but real; `--verbose` keeps the line visible.
- **Negative.** Conflict-of-interest framing (D-F) needs explicit disclosure before any write-path UI lands.

## Pros and Cons of the Options

### Option 1 — Anthropic Claude (chosen)

- Good — `claude-api` skill in project palette presupposes this; operator familiarity.
- Good — prompt caching with `cache_control` cuts cost on multi-call runs.
- Good — well-typed TS bindings; structured-output via `tool_use`.
- Good — mature SDK with stable release cadence.
- Bad — single-vendor risk; outages are total Phase-5 outages.
- Bad — conflict-adjacency (Anthropic drafting about Anthropic) needs explicit disclosure.

### Option 2 — OpenAI GPT-4-class

- Good — broad ecosystem; lots of tutorials, schemas, examples.
- Good — `o1`/`o3` reasoning models are well-suited to multi-table PDF parsing.
- Bad — no in-project skill familiarity; the `claude-api` skill would need to be replaced or augmented.
- Bad — prompt caching is less mature than Anthropic's (different surface).
- Bad — same single-vendor risk + conflict-adjacency as Anthropic, applied differently.

### Option 3 — Google Gemini

- Good — large context window (long PDFs fit comfortably).
- Bad — TS SDK less mature than Anthropic's or OpenAI's.
- Bad — same single-vendor + conflict-adjacency profile.

### Option 4 — Local model via Ollama

- Good — no per-call cost; no vendor lock-in; no API outages.
- Good — full audit trail (model weights on disk).
- Bad — local Llama-3.1 / Mistral / Qwen accuracy on academic-paper drafting is not at the level of frontier models; quality cost of curator review time would dominate the $-cost savings.
- Bad — every curator machine needs ≥ 32 GB RAM and ≥ 20 GB disk for the model.
- Bad — no prompt caching mechanism.

### Option 5 — Multi-provider abstraction (Vercel AI SDK / LangChain)

- Good — provider-agnostic; switching costs amortise.
- Good — single API surface across multiple LLM scripts.
- Bad — abstraction overhead in `lib/curate/` (~150-300 lines of indirection for ~5 call-sites).
- Bad — provider-specific features (Anthropic's `cache_control`, tool-use shape) leak through the abstraction or aren't exposed.
- Bad — Vercel AI SDK is itself a moving target; pinning to a specific version is awkward.

### Option 6 — No LLM (manual curation only)

- Good — zero API cost; no vendor lock-in; no conflict-adjacency.
- Good — preserves the human-curator-only auditability of Phase 0-4.
- Bad — drops two of three §13 Phase-5 deliverables; doesn't deliver the "Intelligence layer" the phase is named for.
- Bad — `entries.json` content backlog (8 problems still without curator-authored entries) doesn't get the leverage Phase 5 was designed to provide.

## Links

- MASTER_PROMPT.md §3 (brand), §11 catalog items 4-8 (viz catalog the LLM extraction populates), §12 (Phase 5 + DB-migration trigger), §13 (Phase 5 deliverables verbatim), §15.6 (primary-source rule), §5.5 (perf budget).
- [OPEN_QUESTIONS Q41](../../OPEN_QUESTIONS.md#q41-llm-model-choice-per-phase-5-script) — closed by this ADR (model defaults per script).
- [OPEN_QUESTIONS Q42](../../OPEN_QUESTIONS.md#q42-cost-cap-default-policy) — remains open; this ADR documents the deliberate "no default cap" trade-off as the working position.
- Related ADRs: [ADR-0001](./0001-nextjs-app-router.md) (the framework the future API endpoints live in), [ADR-0002](./0002-velite-for-mdx.md) (the content pipeline LLM-drafted YAML enters via PR), [ADR-0007](./0007-domainmap-rendering.md) (most recent ADR; structural precedent).
- Phase-5 prep: [docs/thinking/5.0-phase-5-prep.md](../thinking/5.0-phase-5-prep.md) — D-1 section.
- Implementation: arrives in Units 5.2 (`lib/curate/arxiv-client.ts` + `lib/curate/anthropic.ts`), 5.3 (`scripts/ingest-arxiv.ts`), 5.5 (`scripts/extract-leaderboard.ts`).
