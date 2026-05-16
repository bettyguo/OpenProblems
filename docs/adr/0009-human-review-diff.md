# ADR-0009 — Human-review diff format for LLM-assisted drafts

- **Status:** accepted
- **Date authored:** 2026-05-15
- **Date accepted:** 2026-05-15
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

`MASTER_PROMPT.md` §13 Phase-5 deliverable wording is explicit:

> "LLM-assisted extraction of candidate leaderboard entries from a paper PDF (must produce a **human-review diff; no auto-merge**)."

The same constraint applies by parallel construction to the arXiv-ingest path (Unit 5.3) — `content/papers/<id>.yaml` is editorial-canonical content, and LLM-drafted output must pass through a human curator before landing.

Units 5.3 (`scripts/ingest-arxiv.ts`) and 5.5 (`scripts/extract-leaderboard.ts`) have now both shipped, each writing diffs + audit sidecars to `drafts/`. The realized format is stable. This ADR pins it.

Two cases ship in one format:

1. **New-file diff** — Unit 5.3 drafts `content/papers/<id>.yaml` when it doesn't exist. Diff is against `/dev/null`.
2. **Modify-existing diff** — Unit 5.5 appends to `content/problems/<slug>/entries.json` when it already has entries. Diff is a standard unified patch.

## Decision Drivers

- **§13 "no auto-merge"** is non-negotiable. The format must mechanically prevent LLM scripts from writing to `content/` directly.
- **Git compatibility.** Curators have `git apply` + `git diff` muscle memory; introducing a bespoke patch format is friction.
- **Auditability (ADR-0008 D-E).** Every paid-API call needs a reproducible trail.
- **Two ship-paths in one contract.** Avoiding format drift between 5.3 and 5.5.
- **Lifecycle hygiene.** Drafts are ephemeral; they don't ship in `git`.

## Considered Options

1. **Unified diff in gitignored `drafts/` + JSON audit sidecar** (chosen).
2. **Direct apply to `content/`** (no diff).
3. **Auto-PR**: each LLM call creates a feature branch + commit + pull request.
4. **Custom JSON-patch format** instead of unified diff.
5. **Inline annotations in `content/`** marking LLM-proposed lines for curator approval.
6. **One diff per row** (e.g., `extract-leaderboard` fans out to N diffs per run).

## Decision Outcome

**Chosen: Option 1 — unified diff in `drafts/` + JSON audit sidecar.**

The contract pins six concrete artifacts:

### D-A. File-naming convention

```
drafts/<unit>-<isoTimestamp>-<slug>.diff
drafts/<unit>-<isoTimestamp>-<slug>.diff.meta.json
```

- `<unit>` ∈ `{"5.3", "5.5", future "5.x"}` — the LLM-script unit number.
- `<isoTimestamp>` is the script's UTC ISO time with `:` and `.` replaced by `-` for filesystem safety (e.g. `2026-05-15T17-30-00`).
- `<slug>` is the canonical identifier:
  - Unit 5.3: `<arxivId>` (e.g. `2310.06770`).
  - Unit 5.5: `<arxivId>-<problemSlug>` (e.g. `2310.06770-long-horizon-agent-reliability`).
  - Future scripts pick a self-describing slug.

Realized in [`lib/curate/paper-draft.ts::buildDraftFilenames`](../../lib/curate/paper-draft.ts).

### D-B. Diff format = unified, `git apply`-compatible

**New-file case** (target file does not exist on disk):

```
diff --git a/<target> b/<target>
new file mode 100644
index 0000000..0000001
--- /dev/null
+++ b/<target>
@@ -0,0 +1,N @@
+line 1
+line 2
...
```

Realized in [`lib/curate/paper-draft.ts::buildUnifiedDiff`](../../lib/curate/paper-draft.ts). The index hash field uses the `0000000..0000001` convention for additions; `git apply` does not verify the hash for new-file patches.

**Modify-existing case** (target file has prior content):

Standard unified diff produced by `diff@9::createPatch(target, before, after, "", "")`. Realized in [`lib/curate/entry-draft.ts::buildEntriesDiff`](../../lib/curate/entry-draft.ts).

Both diffs apply via `git apply drafts/<file>.diff` without bespoke tooling.

### D-C. Audit sidecar `.meta.json`

Per ADR-0008 D-E. Base shape:

```json
{
  "unit": "5.3",
  "script": "ingest-arxiv",
  "arxiv_id": "2310.06770",
  "model": "claude-sonnet-4-6",
  "input_tokens": 3500,
  "output_tokens": 380,
  "cache_creation_input_tokens": 3000,
  "cache_read_input_tokens": 0,
  "cost_usd_estimate": 0.0072,
  "prompt_sha256": "...",
  "completion_sha256": "...",
  "anthropic_request_id": "msg_abc...",
  "iso_timestamp": "2026-05-15T17:30:00.123Z",
  "dry_run": false
}
```

Script-specific additive fields:

- **Unit 5.5** adds `problem_slug`, `existing_entries`, `proposed_entries`, `merged_entries`.
- Future scripts add their own additive keys without altering the base shape.

`anthropic_request_id` is `null` when `dry_run: true`. `prompt_sha256` / `completion_sha256` are SHA-256 hex digests of the rendered prompt + completion text (stable across runs with identical input — enables exact reproduction).

### D-D. No-auto-merge contract

- Phase-5 CLIs **NEVER** write to `content/`. They write to `drafts/` only.
- The curator runs `git apply drafts/<file>.diff` to materialize after review.
- The curator MAY edit the diff before applying (handle stale slugs, fix `tldr` length, normalize whitespace, etc.).
- A future ADR could authorize auto-apply for a constrained subset (e.g., metadata-only refreshes that don't touch editorial fields), but ADR-0009 is the working contract for **all** LLM-drafted output through Phase 5.

### D-E. `drafts/` lifecycle

- Gitignored top-level directory. Already in `.gitignore` (Unit 5.2's update).
- **No retention policy** enforced by tooling — curators delete locally when finished.
- Drafts can be safely deleted without applying; no on-disk state outside the script's CLI run depends on them.
- **Cross-curator coordination**: a draft in one curator's working tree is not visible to other curators (gitignored); they re-run the relevant script themselves. The audit sidecars enable parallel-run cost accounting against `LLM_OPENPROBLEMS_DAILY_BUDGET_USD` per-machine — there's no shared budget across curators today (Phase 6+ enhancement if multi-curator coordination becomes a real concern).

### D-F. Verified-flag discipline (curator-side flips)

- Leaderboard-entry diffs from Unit 5.5 always have `verified: false` on every new row.
- The curator flips to `true` after independent verification against the paper's primary source URL.
- Realized in [`lib/curate/entry-draft.ts::mergeEntries`](../../lib/curate/entry-draft.ts): the merge layer enforces `verified: false` even if the LLM erroneously included `verified: true` in its JSON output. The system prompt also instructs the LLM to omit the field; defense-in-depth.
- A future paper-detail or contributions-detail script (5.x or Phase 6+) could allow LLM-proposed `verified: true` ONLY when the prompt + tool-use shape encodes a verification check against the cited source — out of scope for ADR-0009.

### Consequences

- **Positive.** Standard tooling (`git apply`, `git diff`, the curator's existing review muscle memory). No bespoke UI.
- **Positive.** Audit trail in `<diff>.meta.json` enables spot-audit + cost reconciliation + exact reproduction (via the prompt SHA).
- **Positive.** `verified: false` discipline matches Q43 / Unit 4.9 framing — submitters never self-attest.
- **Positive.** Two diff cases (new-file via 5.3 helpers; modify-existing via 5.5 helpers) share one curator workflow.
- **Positive.** Reversible — a future ADR could authorize auto-apply for low-risk subsets without invalidating ADR-0009's framing.
- **Negative.** Curators run an extra `git apply` step vs. direct edits. Mitigated by `/contributing` workflow doc (Unit 4.5 — future v1.x bump to add the LLM-assisted path).
- **Negative.** Stale `drafts/` accumulate without cleanup. Mitigated: gitignored, ephemeral, no shared state.
- **Negative.** The sidecar `.meta.json` is curator-side and unsigned — not trusted for anti-spoofing. ADR-0009 explicitly documents this: the actual verification path is `git apply` + manual review, not the sidecar fields.

## Pros and Cons of the Options

### Option 1 — Unified diff in `drafts/` + JSON sidecar (chosen)

- Good — drops into standard git workflow; no new tooling.
- Good — audit sidecar enables reproduction + cost reconciliation.
- Good — two cases (new-file + modify-existing) share the same delivery format.
- Bad — extra `git apply` step vs. direct edit.
- Bad — `drafts/` clutters local working trees over time.

### Option 2 — Direct apply to `content/`

- Good — fewer steps for curators.
- Bad — **violates §13 "no auto-merge"** directly.
- Bad — no review checkpoint; LLM errors would land before curator sees them.

### Option 3 — Auto-PR (branch + commit + pull request per call)

- Good — review fits into existing GitHub UI.
- Bad — every dry-iteration creates a PR; noise dominates.
- Bad — implicit "auto-merge" framing (the LLM is committing; the curator merges) — fights the §13 framing.
- Bad — requires a GitHub token at curator-local machines; auth-trigger-flipping per ADR-0004 / Unit 4.12 framing.

### Option 4 — Custom JSON-patch format

- Good — could encode richer semantics (per-field provenance, confidence levels).
- Bad — bespoke tooling required to apply.
- Bad — diverges from the curator's existing `git apply` muscle memory.

### Option 5 — Inline annotations in `content/`

- Good — single source of truth (no parallel `drafts/` directory).
- Bad — pollutes the canonical YAML / JSON with annotation syntax.
- Bad — breaks `pnpm validate-content` (annotations would need to be schema-recognized first).
- Bad — implicit "applied" state — fights the §13 framing.

### Option 6 — One diff per entry (fan-out)

- Good — partial application possible.
- Bad — atomicity is per-paper-run; a partial entries-set is harder to reason about than "this paper proposed these N entries".
- Bad — multiplies the number of `.meta.json` audit files; reconciliation harder.

## Links

- MASTER_PROMPT.md §13 (Phase-5 deliverables, "no auto-merge"), §15.6 (primary-source rule).
- [OPEN_QUESTIONS Q43](../../OPEN_QUESTIONS.md#q43-pdf-text-extraction-cache) (decided-as-lean) — related Phase-5 caching framing.
- Related ADRs: [ADR-0005](./0005-rating-action-immutability.md) (immutability informs the no-auto-merge framing), [ADR-0008](./0008-llm-provider-anthropic.md) (provider + cost-governance pact; D-E audit-sidecar spec).
- Phase-5 prep: [docs/thinking/5.0-phase-5-prep.md](../thinking/5.0-phase-5-prep.md) — D-6, D-7.
- Implementations:
  - [`lib/curate/paper-draft.ts`](../../lib/curate/paper-draft.ts) — `buildUnifiedDiff` (new-file case) + `buildDraftFilenames`.
  - [`lib/curate/entry-draft.ts`](../../lib/curate/entry-draft.ts) — `buildEntriesDiff` (both cases) + `mergeEntries` (verified-false enforcement).
  - [`scripts/ingest-arxiv.ts`](../../scripts/ingest-arxiv.ts) — Unit 5.3 CLI consuming the new-file path.
  - [`scripts/extract-leaderboard.ts`](../../scripts/extract-leaderboard.ts) — Unit 5.5 CLI consuming both paths.
