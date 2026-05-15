# PAPER-INGEST runbook (single session)

> Operational counterpart to [docs/CURATION_PROMPT.md](./CURATION_PROMPT.md). The CURATION_PROMPT defines the prompt and the parallel-safety contract; this runbook is the step-by-step for spawning **one** PAPER-INGEST session by hand in a second Claude Code window. For batch orchestration (10+ parallel slots), use the PowerShell loop in [`CURATION_PROMPT.md#how-to-orchestrate-10-in-parallel`](./CURATION_PROMPT.md).

A PAPER-INGEST session is paper-bounded: one run = one arXiv ID (or one DOI). It authors `content/papers/<ID>.yaml`, writes its log and inbox files, commits on its own branch, and stops. It does **not** emit rating actions, edit shared singletons (`CHANGELOG.md`, `OPEN_QUESTIONS.md`), or touch source under `app/`, `components/`, `lib/`, `scripts/`, or any config file. That is what makes it safe to run alongside whatever a main-session Claude is doing on trunk Phase 2 units.

---

## 1. Open a second Claude Code window

```pwsh
cd c:\opensource\OpenProblems
claude   # or whatever launches Claude Code on this machine
```

The working directory must be the repo root — the prompt assumes it.

## 2. Pick the five parameters

| Placeholder  | What to put                                                                                      | Example                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `<MODE>`     | `PAPER-INGEST`                                                                                   | `PAPER-INGEST`                                                                                                                     |
| `<KEY>`      | the arXiv ID (or `doi-…` if no arXiv)                                                            | `2510.12345`                                                                                                                       |
| `<CURATOR>`  | your curator handle                                                                              | `jikun`                                                                                                                            |
| `<RUN-ID>`   | UTC minute + 6 hex chars (Windows-safe: no colons)                                               | `2026-05-15T03-17-a3f9c1`                                                                                                          |
| `<EVIDENCE>` | a free-form evidence string in one of the four shapes from `CURATION_PROMPT.md#evidence-formats` | `arxiv:2510.12345 — Yang et al., "Inverse scaling …", NeurIPS 2025 — claim: longer CoT hurts factuality on knowledge-intensive QA` |

Generate the RUN-ID in PowerShell:

```pwsh
$runId = "$((Get-Date -AsUTC).ToString('yyyy-MM-ddTHH-mm'))-$(([guid]::NewGuid().ToString('N')).Substring(0,6))"
$runId   # echoes e.g. 2026-05-15T03-17-a3f9c1
```

## 3. Build the prompt with substitutions and paste it

```pwsh
$prompt = (Get-Content docs/CURATION_PROMPT.md -Raw) `
  -replace '<MODE>',     'PAPER-INGEST' `
  -replace '<KEY>',      '2510.12345' `
  -replace '<CURATOR>',  'jikun' `
  -replace '<RUN-ID>',   $runId `
  -replace '<RUN_ID>',   $runId `
  -replace '<EVIDENCE>', 'arxiv:2510.12345 — Yang et al., "Inverse scaling …", NeurIPS 2025 — claim: longer CoT hurts factuality on knowledge-intensive QA'

Set-Clipboard $prompt
```

In the second Claude window, paste. The session will follow the steps verbatim:

1. `git checkout -b curate/PAPER-INGEST-<KEY>-<RUN-ID>`.
2. Read MASTER_PROMPT §3.1 / §8 / §15.6 / §16, `lib/schemas/paper.ts`, and glob `content/papers/<ARXIV-ID-PREFIX>*` to confirm the paper isn't already indexed.
3. Author `content/papers/<KEY>.yaml` against `PaperSchema`:
   - `id`, `title`, `authors: []` (slugs may not exist yet — empty is valid), `institutions: []`, `venue`, `year`.
   - `tldr` ≤ 400 chars, no fabricated numbers; sentinel `"[TLDR pending human review]"` is the honest fallback.
   - `contributions[]` linking to existing problem slugs with a verifiable `evidence:` URL per claim.
4. Write `content/papers/.curation-log/<RUN-ID>.md` (evidence considered, action emitted, inbox files, caveats).
5. PAPER-INGEST emits **no** rating action. If the paper's claims would move a rating on some slug, surface it in `docs/open-questions-inbox/<RUN-ID>.md` so a later UPDATE run on that slug picks it up. The isolation contract requires this: rating moves are slug-bounded; paper-ingest runs are paper-bounded.
6. Write `docs/changelog-inbox/<RUN-ID>.md` (a paper landed → merge-worthy):
   ```yaml
   ---
   run_id: 2026-05-15T03-17-a3f9c1
   phase: 2
   ---
   - content(2510.12345): Yang et al. ingested — inverse-scaling claim on knowledge-intensive QA.
   ```
7. `pnpm validate-content` — must be green. If it errors and the fix would step outside the allow-list, the session aborts and writes an open-questions-inbox note instead of crossing the line.
8. Commit on the branch:
   ```
   content(<KEY>): 2026-05-15 PAPER-INGEST — <one-line summary>
   ```
   with `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`. Pre-commit hooks (lint-staged + ADR-0005 immutability check + vitest) must pass — never `--no-verify`.
9. **Stop.** Print branch name + short commit hash + one-sentence outcome. No push, no merge.

## 4. Allow-list (files the session may touch)

Only:

- `content/papers/<KEY>.yaml`
- `content/papers/.curation-log/<RUN-ID>.md`
- `docs/open-questions-inbox/<RUN-ID>.md` (if it surfaces an ambiguity)
- `docs/changelog-inbox/<RUN-ID>.md` (always — a paper landed)

It must **not** touch `OPEN_QUESTIONS.md`, `CHANGELOG.md`, `README.md`, `MASTER_PROMPT.md`, `app/**`, `components/**`, `lib/**` (except read-only schema imports), `scripts/**`, `velite.config.ts`, `package.json`, `pnpm-lock.yaml`, `content/taxonomy.yaml`, `content/methodology/**`, `content/LICENSE.md`, or any slug's directory other than the per-run inbox / log paths above.

## 5. Merge pass (you, separately, not the parallel session)

When you've accumulated a few branches:

```pwsh
git branch --list 'curate/*'

# for each branch worth keeping:
git checkout main
git merge --no-ff curate/PAPER-INGEST-<KEY>-<RUN-ID>
# (or git cherry-pick the specific commits you want)
```

Then, in ONE serial commit, fold the inbox files into the singletons and delete them:

- `docs/changelog-inbox/*.md` → append the one-line bullets under the right Phase heading in `CHANGELOG.md`, then `git rm docs/changelog-inbox/*.md`.
- `docs/open-questions-inbox/*.md` → append as new Q-numbers at the bottom of `OPEN_QUESTIONS.md`, then `git rm docs/open-questions-inbox/*.md`.
- `git commit -m "chore(curation): merge <N> parallel runs from <YYYY-MM-DD>"`.

This is the only pass that touches shared files; it is intentionally serial so a single human (or single Claude) controls the global ordering.

## 6. Common things that go wrong

- **Forgetting `git checkout -b`.** The run is supposed to land on its own branch so other sessions don't see its writes until you merge. If you skip it the run commits to `main` and races with whoever else is there.
- **Trying to summarize numbers you don't have.** §15.6 forbids invented scores. The honest sentinel is `"[TLDR pending human review]"`. The validate-content step will pass either way; the merge pass should reject TLDRs with fabricated numbers.
- **Touching a forbidden path.** Pre-commit hooks don't enforce the allow-list — it's enforced via the prompt. If a session writes outside the allow-list, abort and drop the branch.
- **`<KEY>` already indexed.** Step 2's glob (`content/papers/<ARXIV-ID-PREFIX>*`) catches this; if a file exists, the run aborts and writes an open-questions-inbox note instead of double-authoring.
- **Pasting without substituting placeholders.** The literal `<MODE>` / `<KEY>` / `<EVIDENCE>` strings will confuse the model. Verify your `$prompt` variable was actually substituted before pasting (`$prompt -match '<MODE>'` should return `$false`).

## 7. Dry run (recommended before the first real ingest)

Use a non-existent paper key and `passive` evidence to prove the contract works end-to-end without authoring anything real:

```pwsh
$runId = "$((Get-Date -AsUTC).ToString('yyyy-MM-ddTHH-mm'))-$(([guid]::NewGuid().ToString('N')).Substring(0,6))"
$prompt = (Get-Content docs/CURATION_PROMPT.md -Raw) `
  -replace '<MODE>',     'PAPER-INGEST' `
  -replace '<KEY>',      'doi-test-9999.99999' `
  -replace '<CURATOR>',  'jikun' `
  -replace '<RUN-ID>',   $runId `
  -replace '<RUN_ID>',   $runId `
  -replace '<EVIDENCE>', 'passive'
Set-Clipboard $prompt
```

The session will glob, find no existing file, decline to fabricate one, write `docs/open-questions-inbox/<RUN-ID>.md` describing the blocker, and stop. You'll see the inbox file land on a `curate/PAPER-INGEST-doi-test-9999.99999-<RUN-ID>` branch — proves the branch + inbox + commit path works without dirtying the real paper index.

## 8. See also

- [docs/CURATION_PROMPT.md](./CURATION_PROMPT.md) — the full prompt, the parallel-safety contract, evidence formats, and the PowerShell loop for orchestrating 10+ slots.
- [docs/adr/0005-rating-action-immutability.md](./adr/0005-rating-action-immutability.md) — why rating actions are append-only (PAPER-INGEST never touches them; UPDATE/WATCH always emit new files).
- [MASTER_PROMPT.md](../MASTER_PROMPT.md) §15.6 — the "never invent numbers" rule that all four MODEs inherit.
