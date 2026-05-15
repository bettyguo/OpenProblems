# Parallel curation prompt — `content/problems/<slug>/` updates

> A single self-contained prompt that 10+ Claude Code sessions can run **simultaneously** to keep ratings, watchlists, and paper-index entries current as the daily arXiv / ICLR / ICML / NeurIPS / ACL firehose lands. Each run is bounded to one slug (or one arXiv ID), branches independently, and writes nothing the next run could collide on. A serial **merge pass** rolls the branches into `main` and aggregates inbox files into the global singletons (`OPEN_QUESTIONS.md`, `CHANGELOG.md`).

---

## Parallel-safety contract (read this before orchestrating)

**Isolation invariant.** A run is parameterized by `MODE` + a single bounded key (`SLUG` or `ARXIV-ID`) and may only write inside that key's namespace plus a per-run inbox file. The orchestrator must hand each parallel slot a distinct key.

| Path                                                                                      | Mode that may write                    | Conflict-free because                                           |
| ----------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| `content/problems/<SLUG>/ratings/<DATE>-<REASON>-<RUN-ID>.yaml`                           | UPDATE, WATCH, NEW-PROBLEM             | filename embeds RUN-ID → globally unique                        |
| `content/problems/<SLUG>/.curation-log/<RUN-ID>.md`                                       | all                                    | RUN-ID-suffixed                                                 |
| `content/problems/<NEW-SLUG>/{problem.yaml, background.mdx, definition.mdx, history.mdx}` | NEW-PROBLEM only                       | orchestrator guarantees `<NEW-SLUG>` is unused                  |
| `content/papers/<ID>.yaml`                                                                | PAPER-INGEST, UPDATE (incidental)      | arXiv ID / DOI is globally unique across slugs                  |
| `content/papers/.curation-log/<RUN-ID>.md`                                                | PAPER-INGEST                           | RUN-ID-suffixed                                                 |
| `docs/open-questions-inbox/<RUN-ID>.md`                                                   | all (when a new ambiguity is surfaced) | RUN-ID-suffixed; merger appends to `OPEN_QUESTIONS.md` serially |
| `docs/changelog-inbox/<RUN-ID>.md`                                                        | all (when a merge-worthy change lands) | RUN-ID-suffixed; merger appends to `CHANGELOG.md` serially      |

**No run may touch:** `OPEN_QUESTIONS.md`, `CHANGELOG.md`, `README.md`, `MASTER_PROMPT.md`, `content/taxonomy.yaml`, `content/methodology/**`, `content/LICENSE.md`, any other slug's directory, `lib/**` (except read-only schema imports), `app/**`, `components/**`, `scripts/**`, `velite.config.ts`, `package.json`, `pnpm-lock.yaml`, or any `*.config.*` file. ADR-0005 immutability is enforced by a pre-commit hook (`scripts/check-rating-action-immutability.mjs`) — existing rating-action YAML cannot be `M`/`D`/`R`-staged.

**Branch per run.** Each invocation creates `curate/<MODE>-<KEY>-<RUN-ID>` (UTC minute + 6 hex chars). No run pushes. No run merges. The orchestrator merges branches in a separate serial pass.

**RUN-ID format.** `<YYYY-MM-DDTHH-MM>-<RAND6>` — e.g. `2026-05-14T18-22-a3f9c1`. UTC, hyphens (no colons — Windows-safe). The orchestrator may pass `RUN_ID` in or let the run generate it; same effect.

**`pnpm validate-content` is the only allowed read-against-tree command.** Builds, lints, type-checks, and tests are forbidden because they write to `.next/` and `node_modules/.cache/` and would race.

---

## The prompt (paste-and-run, one slot per parallel session)

The orchestrator substitutes the five `<…>` placeholders before pasting. Everything else is fixed. Paste the entire fenced block — the working directory is `c:\opensource\OpenProblems`.

```
You are a content curator for LLM OpenProblems at c:\opensource\OpenProblems. The project's constitution is MASTER_PROMPT.md; the methodology is content/methodology/v1.mdx (v1.0.0). You must obey §15.6 — never invent leaderboard numbers, paper titles, or rating scores. When in doubt, write TODO(curate) and surface a finding to docs/open-questions-inbox/<RUN-ID>.md. Do not edit OPEN_QUESTIONS.md, CHANGELOG.md, or any file outside the allow-list below — other Claude Code sessions are running in parallel and will conflict.

== RUN PARAMETERS ==

MODE: <MODE>                      # one of: UPDATE | WATCH | NEW-PROBLEM | PAPER-INGEST
KEY: <KEY>                        # SLUG for UPDATE/WATCH/NEW-PROBLEM, ARXIV-ID for PAPER-INGEST
CURATOR: <CURATOR>                # default `jikun`
RUN_ID: <RUN-ID>                  # YYYY-MM-DDTHH-MM-RAND6 (UTC)
EVIDENCE: <EVIDENCE>              # see "Evidence formats" block at the end

== ALLOW-LIST ==

Read + write (CREATE-ONLY for files that don't yet exist; NEVER edit-in-place except for problem.yaml in NEW-PROBLEM mode on its own first commit):

  content/problems/<SLUG>/ratings/<YYYY-MM-DD>-<REASON>-<RUN-ID>.yaml   # MODE in {UPDATE, WATCH, NEW-PROBLEM}
  content/problems/<SLUG>/.curation-log/<RUN-ID>.md                     # all modes that touch a SLUG
  content/papers/<ID>.yaml                                              # PAPER-INGEST primary; UPDATE incidental
  content/papers/.curation-log/<RUN-ID>.md                              # PAPER-INGEST only
  docs/open-questions-inbox/<RUN-ID>.md                                 # any mode, if new ambiguity is surfaced
  docs/changelog-inbox/<RUN-ID>.md                                      # any mode that emits a merge-worthy change

NEW-PROBLEM additionally writes (once, on first commit, then never again from this prompt):

  content/problems/<NEW-SLUG>/problem.yaml
  content/problems/<NEW-SLUG>/background.mdx
  content/problems/<NEW-SLUG>/definition.mdx
  content/problems/<NEW-SLUG>/history.mdx

Read-only references:

  MASTER_PROMPT.md (anchor sections: §3.1, §8, §15.6, §16)
  content/methodology/v1.mdx
  content/taxonomy.yaml
  content/problems/<SLUG>/{problem.yaml, background.mdx, definition.mdx, history.mdx, ratings/*.yaml}
  content/papers/*.yaml                                                 # to check whether a paper is already indexed
  lib/schemas/{problem.ts, rating-action.ts, paper.ts, benchmark.ts, _primitives.ts}
  docs/adr/0003-zod-as-source-of-truth.md
  docs/adr/0005-rating-action-immutability.md

Forbidden (any read or write, in any mode):

  OPEN_QUESTIONS.md, CHANGELOG.md, README.md, SESSION_HANDOFF.md
  content/taxonomy.yaml on the write side
  any other slug's content/problems/<OTHER-SLUG>/...
  app/**, components/**, lib/** (except the schema files listed above), scripts/**
  package.json, pnpm-lock.yaml, pnpm-workspace.yaml, velite.config.ts, vitest.config.ts, eslint.config.mjs, postcss.config.mjs, .prettierrc.mjs, tsconfig.json, next.config.ts

If any step would force you to write outside the allow-list, abort, write a docs/open-questions-inbox/<RUN-ID>.md noting the blocker, and commit only the inbox file.

== STEPS ==

1. BRANCH. `git checkout -b curate/<MODE>-<KEY>-<RUN_ID>`. Never push.

2. ORIENT (read-only). Read briefly, in order:
   a. MASTER_PROMPT.md §3.1 (five rating dimensions), §8 (methodology), §15.6 (no-invent rule), §16 entry for <SLUG> if listed.
   b. lib/schemas/rating-action.ts (UPDATE/WATCH/NEW-PROBLEM) and/or lib/schemas/paper.ts (PAPER-INGEST/UPDATE).
   c. For MODE in {UPDATE, WATCH}: content/problems/<SLUG>/problem.yaml + every existing rating in content/problems/<SLUG>/ratings/ (newest filename = latest). Skim background.mdx.
   d. For MODE = NEW-PROBLEM: content/taxonomy.yaml (verify domain/subdomain), §16 entry if listed, and one existing problem (e.g. content/problems/hallucination-reduction/) as a shape reference.
   e. For MODE = PAPER-INGEST: glob content/papers/<ARXIV-ID-PREFIX>* to confirm the paper isn't already indexed.

3. MODE DISPATCH.

   ── MODE = UPDATE ───────────────────────────────────────────────────
   3U.a. For each of the five dimensions (Difficulty S–E, Saturation 0–100, Urgency 0–5★, Value 0–5★, Industry Call 0–5★), ask: does <EVIDENCE> move it MATERIALLY?
         "Material" = at least one letter-grade (Difficulty), ≥10 points (Saturation), ≥1 star (Urgency/Value/Industry Call) AND the evidence is credible (top-tier venue, frontier-lab roadmap, ≥2 independent replications, or a regulator/standards body).
         Bias toward staying put — each emitted action is a public, citable record.
   3U.b. If any dimension's confidence drops below 0.5, set `watchlist: true` on the new action.
   3U.c. If nothing moves, skip the new rating-action YAML. Still write the curation log and (if applicable) inbox files.
   3U.d. If something moves, draft a new rating-action YAML at
            content/problems/<SLUG>/ratings/<YYYY-MM-DD>-<REASON>-<RUN-ID>.yaml
         Shape (full snapshot per ADR-0005; all five dimensions present even if unchanged):
            problem_slug: <SLUG>
            date: <YYYY-MM-DD>                       # today UTC
            methodology_version: "1.0.0"
            curator: <CURATOR>
            prior_action: "<filename-of-latest-existing-rating>"   # relative to ratings/, basename only
            dimensions:
              difficulty:
                grade: <S|A|B|C|D|E>
                confidence: <0.0-1.0>
                rationale: |
                  1–3 sentences. State explicitly whether this dim moved
                  from prior_action and the evidence-based reason. Cite
                  arXiv IDs / venue / lab inline; no fabricated numbers.
              saturation:
                value: <0-100>                       # integer; if N/A, keep prior value and note rationale
                confidence: <0.0-1.0>
                rationale: |
                  ...
              urgency:    { stars: <0-5>, confidence: <0.0-1.0>, rationale: "…" }
              value:      { stars: <0-5>, confidence: <0.0-1.0>, rationale: "…" }
              industry_call: { stars: <0-5>, confidence: <0.0-1.0>, rationale: "…" }
            signals_considered:
              - "arxiv:2510.12345 — Foo et al., NeurIPS 2025"
              - "https://example.com/lab-roadmap-2026"
            watchlist: <true|false>

   ── MODE = WATCH ───────────────────────────────────────────────────
   Same as UPDATE but the only allowed change is `watchlist: true|false` plus confidence updates. No grade / value / stars may move. The new rating-action file is still a full snapshot (ADR-0005). Use REASON = `watchlist-on` or `watchlist-off`.

   ── MODE = NEW-PROBLEM ─────────────────────────────────────────────
   3N.a. Verify the orchestrator's <NEW-SLUG> is not already in content/problems/.
   3N.b. Verify the supplied domain + subdomain exist in content/taxonomy.yaml. If not, abort and write to docs/open-questions-inbox/<RUN-ID>.md.
   3N.c. Author the four files (one commit) using the hallucination-reduction folder as the shape reference:
            problem.yaml         — OpenProblemSchema; benchmarks may have `metric_direction` only, omit numeric `value` / `upper_bound` (§15.6). `editorial.last_curated` = today.
            background.mdx       — 10–15 lines of editorial prose, frontmatter {title, summary}. No code blocks unless the problem is formal.
            definition.mdx       — formal or working definition; KaTeX OK ($…$ / $$…$$). frontmatter {title, summary}.
            history.mdx          — chronology in 2–3 short paragraphs; cite waves of work generically unless §16 names a specific anchor.
   3N.d. Then emit an initial rating action at
            content/problems/<NEW-SLUG>/ratings/<YYYY-MM-DD>-initial-<RUN-ID>.yaml
         Confidences 0.5–0.7 on a first pass; watchlist defaults to `false` unless §8.4 criteria apply.

   ── MODE = PAPER-INGEST ────────────────────────────────────────────
   3P.a. Author content/papers/<ARXIV-ID>.yaml against PaperSchema (lib/schemas/paper.ts):
            id: <ARXIV-ID>                  # e.g. "2510.12345" or "doi-10.xxxx" if no arXiv
            title: "<verbatim from arXiv listing>"
            authors: []                     # author slugs may not exist yet; empty array is valid
            institutions: []                # same
            venue: "<NeurIPS 2025 | ICLR 2026 | ACL 2025 | arXiv>"   # optional
            year: <YYYY>
            arxiv_id: "<ARXIV-ID>"          # if applicable
            doi: "<DOI>"                    # if applicable
            github: "<repo URL>"            # if cited in the paper
            tldr: "<≤400 chars, human-honest, no fabricated numbers; if you cannot summarize honestly write '[TLDR pending human review]'>"
            contributions:
              - problem_slug: <RELATED-SLUG>          # must be an existing slug
                benchmark_id: "<id from problem.yaml.benchmarks[]>" # optional
                score: <number>                                     # ONLY if explicitly stated in the paper
                metric: "<metric name>"                             # optional
                rank_at_publication: <int>                          # optional
                evidence: "<URL to arXiv abstract page or paper section>"
   3P.b. PAPER-INGEST does NOT emit a rating action. If the paper's claims would move a rating, surface that in docs/open-questions-inbox/<RUN-ID>.md so a later UPDATE run on the affected slug picks it up. Reason: rating moves are slug-bounded, paper-ingest runs are paper-bounded; mixing them would break the isolation contract.

4. NEVER INVENT NUMBERS (§15.6). If you don't have a credible source for a benchmark score, leave the rating's saturation `value` unchanged from prior_action and add `TODO(curate): <what's missing>` in the rationale. Same rule for paper TLDRs — `[TLDR pending human review]` is the honest sentinel.

5. CURATION LOG (always). Write content/problems/<SLUG>/.curation-log/<RUN-ID>.md (or content/papers/.curation-log/<RUN-ID>.md for PAPER-INGEST). Sections:

       # Curation run — <MODE> — <KEY> — <YYYY-MM-DD HH:MM UTC>
       run_id: <RUN-ID>
       curator: <CURATOR>
       ## Evidence considered
       - bullet per piece of evidence, with source link / arXiv ID
       ## Action emitted
       - "ratings/<filename>" | "papers/<filename>" | "no change"
       ## Dimensions reviewed (UPDATE / WATCH only)
       | Dim | Prior | New | Confidence | Note |
       ## Inbox files written
       - docs/open-questions-inbox/<RUN-ID>.md  (if any)
       - docs/changelog-inbox/<RUN-ID>.md       (if any)
       ## Caveats / missing data / TODO(curate) items
       - ...

6. INBOX FILES (only when applicable).

   docs/open-questions-inbox/<RUN-ID>.md — when this run surfaces an ambiguity that needs a human decision. Shape (the merger will copy this verbatim under a new Q-number in OPEN_QUESTIONS.md):
       ---
       run_id: <RUN-ID>
       key: <KEY>
       mode: <MODE>
       suggested_title: "<one-line title>"
       blocks: "<one-line scope, e.g. 'Phase 2 paper-author cross-link audit' or 'nothing critical'>"
       ---
       <2–6 paragraphs. State the ambiguity, what was tried, what's at stake. End with a "Lean: …" line proposing a default.>

   docs/changelog-inbox/<RUN-ID>.md — when this run lands a merge-worthy change (any new rating action, any new problem, any new paper). Shape (the merger lifts the line verbatim into CHANGELOG.md under the right Phase heading):
       ---
       run_id: <RUN-ID>
       phase: <PHASE-NUMBER>            # whichever phase the project is currently in
       ---
       - content(<KEY>): <one-line summary, past tense, ≤ 100 chars>

7. VALIDATE. Run `pnpm validate-content`. If it errors, fix only files inside the allow-list. If you cannot fix without crossing it, abort and write to docs/open-questions-inbox/<RUN-ID>.md describing the blocker.

8. COMMIT. Stage ONLY the allow-list paths you wrote. Subject line:
     `content(<KEY>): <YYYY-MM-DD> <MODE> — <one-line summary>`
   For no-change UPDATE runs: `content(<SLUG>): <YYYY-MM-DD> curation pass — no change`
   Body: bullet list of evidence considered + dimensions moved + confidence summary + inbox files written.
   Trailer: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
   Pre-commit hooks (lint-staged, ADR-0005 immutability check, vitest) MUST pass. Never use --no-verify; if a hook blocks, fix the underlying issue or abort with an inbox note.

9. STOP. Do not push. Do not merge. Print the branch name + short commit hash + one-sentence outcome, then exit.

== OUTPUT FORMAT (the only text you produce to the user) ==

Two short paragraphs:

  Branch: curate/<MODE>-<KEY>-<RUN_ID>  (commit <SHORT-HASH>)

  <One sentence stating what was emitted (e.g. "Emitted ratings/2026-05-14-halueval-sota-bump-<RUN-ID>.yaml: saturation 35 → 48 on HaluEval frontier-lab eval.") OR "No material change — kept 2026-MM-DD baseline.">
  <One optional sentence on confidence, watchlist, or inbox files written.>

The curation log + inbox files carry long-form detail for the human merger.

== EVIDENCE FORMATS the orchestrator may pass in <EVIDENCE> ==

The string is free-form, but four shapes are first-class:

A. ARXIV-CITATION (single paper):
     arxiv:<ID> — <Authors>, "<Title>", <Venue> <Year> — claim: <one-line>
   Run interprets as concrete evidence for steps 3U / 3P.

B. VENUE-SWEEP (firehose):
     venue-sweep:<VENUE> <YYYY> — <N> papers tagged <TAGS> — list: <bullet list of arxiv:IDs + titles>
   Where <VENUE> ∈ {arXiv, ICLR, ICML, NeurIPS, ACL, EMNLP, COLM, …}. The orchestrator pre-filters; the run treats each line as a separate signal in 3U.

C. HF-MCP-QUERY (delegate retrieval):
     hf-mcp:paper_search query="<q>" days=<N> tags=[<…>] top=<K>
   The run calls mcp__claude_ai_Hugging_Face__paper_search with those arguments, filters to papers intersecting <SLUG>'s benchmarks/tags, and treats the top <K> as evidence. If the MCP tool is unavailable, log "MCP unavailable — passive review only" and proceed with prior signals.

D. PASSIVE (no new input):
     passive
   Run re-reads the latest rating and decides whether it still holds. Most passive runs end in "no change". Use for weekly hygiene sweeps.

If <EVIDENCE> is none of the above, treat the literal string as free-form context and proceed conservatively.
```

---

## How to orchestrate 10 in parallel

The orchestrator (a shell loop, a CI job, a separate Claude Agent SDK harness, a scheduled GitHub Action) loops, one slot per slug or arXiv ID:

```pwsh
# PowerShell — 10 concurrent slots, UPDATE mode, distinct slugs
$slots = @(
  @{ MODE = "UPDATE"; KEY = "hallucination-reduction";        EVIDENCE = "hf-mcp:paper_search query='hallucination factuality' days=7 top=8" },
  @{ MODE = "UPDATE"; KEY = "long-horizon-agents";            EVIDENCE = "venue-sweep:NeurIPS 2025 — 12 papers tagged ['agents','tool-use'] — list: …" },
  @{ MODE = "UPDATE"; KEY = "scalable-oversight";             EVIDENCE = "passive" },
  @{ MODE = "UPDATE"; KEY = "mech-interp";                    EVIDENCE = "arxiv:2511.04432 — …" },
  @{ MODE = "UPDATE"; KEY = "test-time-compute";              EVIDENCE = "venue-sweep:ICLR 2026 — 6 papers tagged ['reasoning','compute-scaling'] — list: …" },
  @{ MODE = "UPDATE"; KEY = "multi-agent-coordination";       EVIDENCE = "hf-mcp:paper_search query='multi-agent coordination' days=14 top=6" },
  @{ MODE = "UPDATE"; KEY = "genomic-foundation-models";      EVIDENCE = "passive" },
  @{ MODE = "UPDATE"; KEY = "operator-learning";              EVIDENCE = "hf-mcp:paper_search query='neural operator PDE' days=21 top=5" },
  @{ MODE = "UPDATE"; KEY = "eval-gaming";                    EVIDENCE = "venue-sweep:ACL 2025 — 4 papers tagged ['benchmark-integrity'] — list: …" },
  @{ MODE = "UPDATE"; KEY = "long-context-rag";               EVIDENCE = "hf-mcp:paper_search query='long context retrieval 1M tokens' days=7 top=8" }
)
$ts = (Get-Date -AsUTC).ToString("yyyy-MM-ddTHH-mm")
foreach ($slot in $slots) {
  $runId = "$ts-$(([guid]::NewGuid().ToString('N')).Substring(0,6))"
  $prompt = Get-Content docs/CURATION_PROMPT.md -Raw `
    -replace '<MODE>',     $slot.MODE `
    -replace '<KEY>',      $slot.KEY `
    -replace '<CURATOR>',  'jikun' `
    -replace '<RUN-ID>',   $runId `
    -replace '<RUN_ID>',   $runId `
    -replace '<EVIDENCE>', $slot.EVIDENCE
  # spawn-claude-code is your orchestrator entry point (Agent SDK / claude CLI / etc.)
  Start-Job -ScriptBlock { param($p) spawn-claude-code --cwd c:\opensource\OpenProblems --prompt $p } -ArgumentList $prompt
}
Get-Job | Wait-Job | Receive-Job
```

Each slot:

- Touches only its own slug folder + its RUN-ID-suffixed inbox files.
- Branches independently — branch names cannot collide because RUN-ID embeds UTC-minute + 6 hex.
- Commits on its own branch and stops.

### The serial merge pass (single session, not parallel)

After all 10 parallel jobs finish, run one merge session that owns the global singletons:

1. `git branch --list 'curate/*'` — review the curation logs at `content/problems/<slug>/.curation-log/*.md` and `content/papers/.curation-log/*.md`.
2. For each branch worth keeping: `git merge --no-ff curate/<MODE>-<KEY>-<RUN-ID>` (or cherry-pick the commits you want). Drop the branch if the run added no value.
3. Aggregate inbox files into the singletons in one commit:
   - `docs/open-questions-inbox/*.md` → append as new Q-numbers at the bottom of `OPEN_QUESTIONS.md`. Then `git rm docs/open-questions-inbox/*.md`.
   - `docs/changelog-inbox/*.md` → append the one-line bullets under the right Phase heading in `CHANGELOG.md`. Then `git rm docs/changelog-inbox/*.md`.
4. Commit: `chore(curation): merge <N> parallel runs from <YYYY-MM-DD>`.

This is the only pass that touches shared files. It is intentionally serial.

### High-frequency cadence

The intended schedule, when daily paper volume is high:

- **Hourly:** PAPER-INGEST runs against the previous hour's arXiv `cs.LG / cs.CL / cs.AI / stat.ML` updates, sharded one run per ArXiv ID.
- **Daily (UTC 02:00):** UPDATE runs against the previous 24h, sharded one run per active SLUG, evidence built from the matching paper-ingest commits + HF MCP queries.
- **Weekly (UTC Sunday 02:00):** Passive UPDATE sweep — every SLUG gets a `passive` evidence pass to catch stale ratings.
- **Conference weeks (ICLR / ICML / NeurIPS / ACL / EMNLP / COLM):** A venue-sweep batch the day the camera-ready PDFs drop, sharded one run per SLUG that intersects the venue's tags.

The merge pass runs at the end of every batch. With the contract above, doubling the parallel-slot count (10 → 20 → 50) requires no schema change — only more orchestrator slots.

---

## What this prompt does NOT do

- **It does not rewrite editorial prose.** `background.mdx`, `definition.mdx`, `history.mdx` are human-curator territory. NEW-PROBLEM authors the first version once; later prose updates go through a separate human-review PR.
- **It does not touch the taxonomy.** Domain / subdomain changes are an ADR-class decision (MASTER_PROMPT §15.6). Surface to the OPEN-QUESTIONS inbox if a new domain or subdomain seems needed.
- **It does not invent benchmark numbers.** Every numeric score must trace to a URL in the rating-action's `signals_considered` or the paper YAML's `contributions[].evidence`. `TODO(curate)` is always the honest fallback.
- **It does not enforce bidirectional `related_problems`.** Cross-link audit is a Phase 2 concern (see OPEN_QUESTIONS Q33 / Q34). One-direction links are acceptable; the merger may pick them up later.
- **It does not push or open PRs.** Push and PR are operator concerns. Branches accumulate locally (or on a sandbox remote) and the operator decides what to upstream.
