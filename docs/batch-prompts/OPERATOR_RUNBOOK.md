# Operator runbook — running the 250-problem campaign end-to-end

You, the human operator, follow this document literally — every command, every check. No prior context required beyond knowing where `c:\opensource\OpenProblems` lives.

**Total campaign wall-clock: ~3–5 hours** across one calendar day, broken into:

| Phase                     | What you do                                          | Duration  |
| ------------------------- | ---------------------------------------------------- | --------- |
| 0. Preflight              | One-time setup: clean tree, deps, worktrees, RUN_IDs | 15–30 min |
| 1. Main burst             | Open 20 sessions, paste prompts, wait                | 2–3 hours |
| 2. Identify continuations | List checkpoints with `remaining > 0`                | 5 min     |
| 3. Continuation burst     | Open ~4 continuation sessions                        | 30–60 min |
| 4. Merge pass             | One session aggregates 20 branches into `main`       | 60–90 min |
| 5. Push + cleanup         | `git push`, remove worktrees                         | 10 min    |

**Final state:** `main` has exactly **260 problems** (10 seed + 250 campaign), all schema-validated, every entry with ≥ 3 verified primary sources, refreshed rating actions on the 10 seed problems, plus paper YAMLs incidentally authored along the way.

---

## TL;DR for repeat runs (skip on first read)

```pwsh
# Once per campaign
cd c:\opensource\OpenProblems
$env:RUN_ID_PREFIX = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH-mm")
node scripts/generate-batch-prompts.mjs
# Burst 1: open 20 Claude Code windows, paste docs/batch-prompts/slot-NN-*.md prompts
# Burst 2: open ~4 continuation sessions from checkpoints (Phase 2)
# Merge: open 1 session in main repo, paste the merge prompt from Phase 4 §"Merge prompt"
git push origin main
```

If anything is unclear, read the full runbook below.

> **Running on 2 PCs to parallelize?** Read [Appendix A — Multi-PC operation](#appendix-a--multi-pc-operation-split-across-2-machines) before Phase 0. The Phase 0 → 5 flow stays the same; Appendix A adds 3 short sync points across the PCs (publish baseline → push curate branches → merge on one PC) and recommends a 10/10 slot split.

---

## Phase 0 — Preflight (15–30 min, do once)

### 0.1. Confirm repo state is clean and on `main`

```pwsh
cd c:\opensource\OpenProblems
git switch main
git status --short
git log --oneline -3
```

**Expected output:**

- `git status --short` prints nothing (clean tree).
- `git log` shows recent `docs(curation):` commits at the top.

**If you see** modified files in `git status`: stash or commit them before starting. Mid-campaign uncommitted changes will be picked up by sessions and break the parallel-safety contract.

### 0.2. Confirm dependencies are installed

```pwsh
pnpm install
pnpm validate-content
```

**Expected output:**

- `pnpm install`: "Done in Xs" (fast if `node_modules/` is up to date).
- `pnpm validate-content`: "✓ N content file(s) validated against schemas." (where N ≈ 60).

**If validate-content fails:** stop. Fix the underlying content error before launching sessions. A pre-existing validation failure will make every session's Step 7 also fail.

### 0.3. Confirm Claude Code web tools are enabled

Open one Claude Code window in `c:\opensource\OpenProblems`. Send a test message:

> "Run a WebSearch for 'arxiv hallucination 2025' and tell me the first result title."

If the response includes a real search result with a URL: web tools work, you are ready.
If it errors with "WebSearch not available": fix in Claude Code settings before continuing. Without web tools, every session will fail at Step 3 (deep research).

Close that test session.

### 0.4. Refresh RUN_IDs to today's UTC timestamp

The committed slot files use a stable prefix (`2026-05-20T17-00-…`) for diffability. Before a real campaign, bake in today's timestamp so branch names are calendar-accurate:

```pwsh
$env:RUN_ID_PREFIX = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH-mm")
node scripts/generate-batch-prompts.mjs
```

**Expected output:** `Wrote 20 slot files + README.md to c:\opensource\OpenProblems\docs\batch-prompts`.

This rewrites all 20 slot files in place. You can leave them uncommitted — they are operator artifacts, not project history.

### 0.5. Create 20 git worktrees (one per slot)

This is **mandatory** for 20 concurrent sessions. Worktrees give each session its own working tree, index, and `node_modules/` so they don't fight on `.git/index` locks or the vitest cache.

**Critical:** use `--detach`. A single branch (here, `main`) can only be checked out by one worktree at a time, and your primary worktree at `c:\opensource\OpenProblems` already owns `main`. The 20 slot worktrees start in detached-HEAD state at `main`'s commit; each session's Step 1.2 (`git checkout -b curate/...`) then creates a new branch from that commit and the worktree leaves detached state automatically.

```pwsh
$base = "c:\opensource\OpenProblems-worktrees"
New-Item -ItemType Directory -Force -Path $base | Out-Null

Get-ChildItem c:\opensource\OpenProblems\docs\batch-prompts -Filter 'slot-*.md' | ForEach-Object {
  $slotDir = Join-Path $base $_.BaseName    # e.g. slot-01-dl-lm-frontier
  if (-not (Test-Path $slotDir)) {
    git -C c:\opensource\OpenProblems worktree add --detach $slotDir main
  }
}

git -C c:\opensource\OpenProblems worktree list
```

**Expected output of `worktree list`:** 21 lines — your main worktree on `[main]`, plus 20 slot worktrees marked `(detached HEAD)` at the same commit hash as main. After each session's Step 1.2 runs, that slot's line will switch to `[curate/<MODE>-<LABEL>-<RUN_ID>]`.

**If you see `fatal: 'main' is already used by worktree at ...`:** you forgot `--detach`. Remove any empty slot directories under `c:\opensource\OpenProblems-worktrees\` (no Git state created on failure, just empty dirs) and re-run with the corrected command.

**If you see `fatal: '<path>' is a missing but already registered worktree`:** a prior worktree directory was removed via `Remove-Item` / `rm -rf` without telling git, so git still has stale metadata pointing at the vanished path. Clean shutdown is always `git worktree remove <path>`, never raw `Remove-Item`. To recover: run `git worktree prune --verbose` to garbage-collect the dead registrations, then re-run the worktree-add loop above. **`git worktree prune` does NOT delete branches** — any `curate/*` refs from the prior session runs remain reachable and can be inspected via `git log curate/<name>` or deleted with `git branch -D curate/<name>` once you have decided their fate.

### 0.6. Install dependencies in each worktree

Each worktree needs its own `node_modules/` for the pre-commit `pnpm test` to work. pnpm's content-addressable store makes this fast (~30–60 sec per worktree, mostly cache-hit):

```pwsh
Get-ChildItem c:\opensource\OpenProblems-worktrees -Directory | ForEach-Object {
  Write-Host "Installing in $($_.Name) ..."
  pnpm install --dir $_.FullName
}
```

This serializes by default. To parallelize (faster, but log output interleaves):

```pwsh
Get-ChildItem c:\opensource\OpenProblems-worktrees -Directory | ForEach-Object -ThrottleLimit 4 -Parallel {
  pnpm install --dir $_.FullName
}
```

**Expected:** ~10–15 minutes total wall-clock for all 20 worktrees.

### 0.7. Verify one worktree end-to-end

Before launching all 20, sanity-check one:

```pwsh
cd c:\opensource\OpenProblems-worktrees\slot-12-applied-social-mix
git status --short        # clean
git log --oneline -1      # same commit as main
pnpm validate-content     # green
```

Pick slot 12 deliberately: it's the smallest (target=8). If something goes wrong, the blast radius is small.

If all three pass, you are ready to launch.

---

## Phase 1 — Main burst (open 20 sessions, ~2–3 hours)

You will open 20 Claude Code windows, paste a prompt into each, then let them work unattended. **Do not interrupt sessions** unless you see a clear failure pattern (Phase 1.5 below).

### 1.1. (Optional but recommended) Dry-run with one slot first

Strongly recommended on your first campaign. Pick slot 12 (smallest target):

1. Open VS Code at `c:\opensource\OpenProblems-worktrees\slot-12-applied-social-mix`.
2. Launch Claude Code in that window.
3. Open `c:\opensource\OpenProblems\docs\batch-prompts\slot-12-applied-social-mix.md` (from the main repo path — slot files are the same in every worktree, just read them from main).
4. Find the `===PROMPT-START===` and `===PROMPT-END===` markers. Select everything between them.
5. Copy. Paste into the Claude Code session as your first message. Send.
6. Watch the first 10 minutes:
   - It runs `git status --short && git log --oneline -8`.
   - It runs `git checkout -b curate/BATCH-NEW-applied-social-mix-…`.
   - It reads MASTER_PROMPT.md, schemas, taxonomy, the hallucination-reduction reference.
   - It starts brainstorming candidates and runs the first WebSearch.

If those four checkpoints happen smoothly, the campaign infrastructure works. Let the session finish (it targets 8 problems, ~30–45 min).

If anything errors (web tools off, schema not found, etc.), fix and retry slot 12 before launching the other 19.

### 1.2. Launch the remaining 19 sessions

You now know the system works. Launch the other 19 sessions in a staggered pattern — about **10 seconds between launches** — to smooth the initial `pnpm test` warm-up across worktrees:

For **each** of slots 01–11, 13–20 (you already ran 12):

1. Open a new VS Code window at `c:\opensource\OpenProblems-worktrees\slot-NN-<label>\`.
2. Launch Claude Code in that window.
3. Open the matching slot file (e.g., `docs\batch-prompts\slot-05-rl-frontier.md`) from the main repo path.
4. Copy everything between `===PROMPT-START===` and `===PROMPT-END===`.
5. Paste into the session. Send.
6. Wait ~10 seconds before launching the next slot.

**You can run all 20 sessions on a single laptop**, but at peak (~10 sessions simultaneously doing web research) you may want to close unrelated CPU/memory hogs. Each session is light (one Claude Code tab, periodic web calls, periodic git commits).

### 1.3. Monitor progress

Sessions run autonomously. You do not need to babysit. Useful check-in cadence: every 30 minutes, glance at each Claude Code window for ~5 seconds.

**Healthy session signals:**

- New tool calls appearing in the message stream.
- Periodic `git commit` output mentioning `content(<slug>):` subject lines.
- Web tools firing (WebSearch / WebFetch tool blocks).
- No long pauses (>5 min) without activity.

**At any time, see how many problems any worktree has authored so far:**

```pwsh
# Run from c:\opensource\OpenProblems (the main worktree)
git -C c:\opensource\OpenProblems-worktrees\slot-01-dl-lm-frontier log --oneline curate/* 2>$null | Measure-Object | Select-Object Count
```

Or aggregate across all 20 worktrees:

```pwsh
Get-ChildItem c:\opensource\OpenProblems-worktrees -Directory | ForEach-Object {
  $count = (git -C $_.FullName log --oneline 'main..HEAD' 2>$null | Measure-Object).Count
  "{0,-35} {1,4} commits ahead of main" -f $_.Name, $count
}
```

**Expected progression** (sample healthy session, 60 minutes in):

- Slot 01 (target 22): ~10–12 commits (1 claim + 9–11 slug commits).
- Slot 12 (target 8): ~9 commits (1 claim + 8 slug commits + 1 housekeeping) — already done.
- Slot 17 (target 9): ~5–6 commits (mid-flight).

### 1.4. Detect "this session is done"

When a session completes, it prints a final report block like:

```
Branch: curate/BATCH-MIXED-dl-lm-frontier-2026-05-20T17-00-a1c87f  (HEAD: f3a92c1)
New problems: 15  (slug-1, slug-2, ..., slug-15)
Updated slugs: 4  (hallucination-reduction, long-horizon-agent-reliability, long-context-rag, compute-optimal-test-time-reasoning)
Verified sources: 47 across 19 commits
Inbox files: open-questions-inbox/2026-05-20T17-00-a1c87f.md (3), changelog-inbox/2026-05-20T17-00-a1c87f.md, new-problem-claims/2026-05-20T17-00-a1c87f.md
Checkpoint: docs/resume-checkpoints/2026-05-20T17-00-a1c87f.md (remaining: 7) — paste its continuation prompt into a fresh session to resume
```

…and then the Claude Code session shows "session complete" / "agent finished". **That's done.** Close the window (or leave it open as audit trail).

### 1.5. Detect "this session is stuck" — and recover

A session is **stuck** if any of these are true for >5 minutes:

- No new output and no tool calls.
- The session is at the "thinking" indicator but never finishes.
- The session is in an obvious retry loop (same WebFetch returning the same error 5+ times).

**Recovery procedure for a stuck session:**

1. Interrupt the session (Ctrl+C in Claude Code, or the UI's stop button).
2. Switch to the worktree's terminal:
   ```pwsh
   cd c:\opensource\OpenProblems-worktrees\slot-NN-<label>
   git status --short
   git log --oneline -5
   ```
3. **If the working tree is dirty** (a half-authored slug): `git restore --staged . ; git checkout -- .` to drop the partial work. The committed slugs are safe.
4. Open a new Claude Code session in the same worktree.
5. Paste this recovery prompt (adjust paths):

   ```
   You are recovering an interrupted batch-curation session for the 250-problem campaign.

   1. git status --short — confirm clean (or report any leftover and stop).
   2. git log --oneline 'main..HEAD' — count how many slugs were already committed.
   3. git branch --show-current — note the existing curate/... branch name.
   4. Identify the parent prompt: c:\opensource\OpenProblems\docs\batch-prompts\slot-NN-<label>.md
      Read it for TARGET_NEW_COUNT, TERRITORY, MODE, etc.
   5. Treat (committed-slugs / TARGET_NEW_COUNT) as your progress so far. Resume from there.
   6. Continue authoring under the same constraints (docs/BATCH_GENERATION_PROMPT.md steps 3–7), staying on the existing branch (do NOT git checkout -b).
   7. Use RUN_ID suffix "-recover" appended to the parent RUN_ID for any new inbox / checkpoint files.
   8. If TARGET_NEW_COUNT is unreached when you stop, write a Step-6.5 resume checkpoint.
   ```

6. Let the recovery session run.

### 1.6. When all 20 sessions report done

A session is done when it prints the final `Branch: …` block (Phase 1.4). **Do not proceed to Phase 2 until all 20 have reached this state.**

Time to wait: usually 2–3 hours, dominated by the high-density slots (01, 07, 11, 20). The low-target slots (12 at 8, 18 at 8, 17 at 9) finish in ~30–45 min.

---

## Phase 2 — Identify which slots need continuation (5 min)

After all 20 main-burst sessions finish, find the resume checkpoints. Most slots completed in one chunk; 4 slots wrote a checkpoint deferring the remainder.

### 2.1. List all checkpoints

```pwsh
$worktrees = Get-ChildItem c:\opensource\OpenProblems-worktrees -Directory
foreach ($wt in $worktrees) {
  $checkpointDir = Join-Path $wt.FullName "docs\resume-checkpoints"
  if (Test-Path $checkpointDir) {
    Get-ChildItem $checkpointDir -Filter '*.md' | ForEach-Object {
      $content = Get-Content $_.FullName -Raw
      $remaining = if ($content -match 'remaining:\s*(\d+)') { $Matches[1] } else { '?' }
      $authored  = if ($content -match 'authored_this_session:\s*(\d+)') { $Matches[1] } else { '?' }
      $target    = if ($content -match 'target_total:\s*(\d+)') { $Matches[1] } else { '?' }
      "{0,-35}  authored {1,3}/{2,-3}  remaining {3,3}  ->  {4}" -f $wt.Name, $authored, $target, $remaining, $_.FullName
    }
  }
}
```

**Expected output (typical):**

```
slot-01-dl-lm-frontier             authored  15/22   remaining   7  ->  c:\...\slot-01-...\docs\resume-checkpoints\2026-05-20T17-00-a1c87f.md
slot-07-safety-alignment           authored  15/18   remaining   3  ->  c:\...\slot-07-...\docs\resume-checkpoints\2026-05-20T17-00-071a4d.md
slot-11-applied-perception         authored  15/16   remaining   1  ->  c:\...\slot-11-...\docs\resume-checkpoints\2026-05-20T17-00-4b5e81.md
slot-20-theory                     authored  15/16   remaining   1  ->  c:\...\slot-20-...\docs\resume-checkpoints\2026-05-20T17-00-d4e71a.md
```

The 16 other slots produced no checkpoint (they finished in one chunk). Those 4 above need a continuation session.

### 2.2. If a slot you expected to finish in one chunk DID write a checkpoint

This means a smaller slot deferred work — usually because Step 3 (deep research) failed to verify enough sources for some candidates, so the session decided to ship fewer than its target. Read the checkpoint's `## Deferred candidates` section to see why.

Decision tree:

- The deferred candidates have a clear research path (e.g., "need to verify the EMNLP 2025 paper"): continue normally with a continuation session.
- The deferred candidates are weak (e.g., "could not find 3 verified sources"): drop them. Edit the checkpoint to set `remaining: 0` and accept the lower count for that slot. The campaign target of 250 is an aspiration; quality > volume per `MASTER_PROMPT.md` §15.6.

---

## Phase 3 — Continuation burst (~30–60 min)

For each checkpoint with `remaining > 0`, you launch a continuation session in the **same worktree** as the parent session. The branch is already checked out there from Phase 1.

### 3.1. For each remaining checkpoint, do:

Using slot 01 as the example (`remaining: 7`):

1. Open a new VS Code window at `c:\opensource\OpenProblems-worktrees\slot-01-dl-lm-frontier\`.
2. Launch Claude Code in that window.
3. Open the checkpoint file: `c:\opensource\OpenProblems-worktrees\slot-01-dl-lm-frontier\docs\resume-checkpoints\<RUN_ID>.md`.
4. Find the `## CONTINUATION PROMPT — paste the fenced block below into a fresh Claude Code session` section.
5. Inside it, find the inner fenced block. **Copy everything inside that inner fence.**
6. Paste into the new Claude Code session. Send.

The continuation prompt instructs the session to:

- `git checkout` the existing parent branch (no `-b`).
- Read the same checkpoint file as its working brief.
- Use RUN_ID suffix `-c2` for any new inbox/log files.
- Apply Steps 2.4 → 3 → 4 → 6 → 7 (skipping Step 5, which already ran in chunk 1).
- Cap at 15 new slugs even for chunk 2 (chunk discipline applies to every session).

### 3.2. Run all needed continuations in parallel

Repeat 3.1 for each remaining checkpoint. With ~4 continuation sessions launched in parallel, expect ~30–60 min total wall-clock.

### 3.3. Verify every slot reached `remaining: 0`

After all continuation sessions finish, re-run the Phase 2.1 listing:

```pwsh
# Rerun the same script as Phase 2.1
```

**Goal:** no checkpoint has `remaining > 0`. If one does (e.g., slot 01 still has `remaining: 2` after chunk 2), either run a chunk-3 continuation OR decide to ship at the current count and edit the checkpoint to mark `remaining: 0`.

---

## Phase 4 — Serial merge pass (60–90 min)

Now you aggregate the 20 branches into `main`. **This runs in the MAIN worktree**, not a slot worktree, because only the main worktree is allowed to write the global singletons (`OPEN_QUESTIONS.md`, `CHANGELOG.md`, `README.md`).

### 4.1. Switch to the main worktree, confirm state

```pwsh
cd c:\opensource\OpenProblems
git switch main
git status --short
git branch --list 'curate/*'
```

**Expected:**

- `git status --short`: empty.
- `git branch --list`: 20 lines like `curate/BATCH-MIXED-dl-lm-frontier-2026-05-20T17-00-a1c87f`.

### 4.2. Aggregate the slug-claim manifests

```pwsh
# List every claimed slug from every chunk of every slot
$claims = @()
Get-ChildItem c:\opensource\OpenProblems-worktrees -Directory | ForEach-Object {
  $claimDir = Join-Path $_.FullName "docs\new-problem-claims"
  if (Test-Path $claimDir) {
    Get-ChildItem $claimDir -Filter '*.md' | ForEach-Object {
      Get-Content $_.FullName | Select-String '^- ' | ForEach-Object {
        $line = $_.Line
        if ($line -match '^-\s+(\S+)') {
          $script:claims += [PSCustomObject]@{ Slot=$_.Filename; Slug=$Matches[1] }
        }
      }
    }
  }
}
$claims.Slug | Group-Object | Where-Object { $_.Count -gt 1 } | Format-Table Name, Count
```

**Expected:** empty output (no slugs claimed twice). If any slug appears in two RUN_IDs, you have a collision to resolve at merge time — note it and continue.

### 4.3. Open one Claude Code session in `c:\opensource\OpenProblems` and run the merge

Paste this prompt:

```
You are running the SERIAL MERGE PASS for the 250-problem batch campaign at c:\opensource\OpenProblems. This is the only session allowed to write the global singletons (OPEN_QUESTIONS.md, CHANGELOG.md). 20 curate/* branches exist; they need to be merged into main.

Follow docs/BATCH_GENERATION_PROMPT.md §"Serial merge pass (single session, runs after the final chunk of the campaign)" step by step:

1. SLUG-COLLISION PASS. Aggregate every claim manifest from every worktree at c:\opensource\OpenProblems-worktrees\*\docs\new-problem-claims\*.md. Detect duplicate slugs. Report any duplicates to me and pause for instructions before continuing. Do NOT rename slugs without my approval.

2. RESUME-CHECKPOINT PASS. Aggregate every checkpoint at c:\opensource\OpenProblems-worktrees\*\docs\resume-checkpoints\*.md. Confirm every "remaining" is 0. If any non-zero, report it and pause.

3. BRANCH REVIEW. For each of the 20 curate/* branches, read its .curation-log files. Build a short table reporting:
   - Branch name
   - Total commits (new slugs + housekeeping)
   - Sample slug from the branch
   - Curation-log "Evidence considered" health (≥ 3 verified sources per slug, or any TODO(curate) sentinels remaining)
   Pause and present the table to me. I will mark which branches to KEEP and which to DROP.

4. CHERRY-PICK MERGE. For each KEEP branch in the order I specify: `git merge --no-ff <branch>`. Resolve any incidental content/papers/*.yaml collisions by picking the more-complete YAML. Commit each merge cleanly.

5. AGGREGATE SINGLETONS.
   - Lift docs/open-questions-inbox/*.md Q-blocks into OPEN_QUESTIONS.md under new sequential Q-numbers.
   - Lift docs/changelog-inbox/*.md bullets into CHANGELOG.md under the current phase heading.
   - Archive docs/new-problem-claims/*.md and docs/resume-checkpoints/*.md to .archived/<TODAY>/ subdirectories. Do NOT git rm them outright.

6. CROSS-LINK AUDIT. Run `pnpm tsx scripts/cross-link-audit.ts` if it exists. Report asymmetric related_problems links. Do NOT symmetrise — that is a follow-up unit, not part of this merge.

7. FINAL VALIDATION. Run `pnpm validate-content && pnpm build`. Both MUST pass. If validate-content fails, report which content file and pause. If build fails, report the error and pause.

8. FINAL COMMIT. `chore(curation): merge 20 slots = ~250 new problems from campaign <YYYY-MM-DD>` summarising slot-by-slot counts.

Constraints:
- Pause before every git merge for my approval on each branch.
- Pause before destructive operations (branch deletes, file rms).
- Do not push.
- This is the only session that may write OPEN_QUESTIONS.md, CHANGELOG.md, README.md.

Print a final summary table when done: slot name, new problems landed, updates emitted, source-verification stats. Then exit.
```

The session will walk through the merge pass step-by-step, pausing for your approval at every meaningful decision point. Approve or redirect at each pause.

### 4.4. Common merge-pass decisions you will make

**Branch with a thin curation log** (e.g., slot reports < 3 verified sources on several slugs): drop the branch. Re-author later if you want those slugs.

**Two branches claiming the same slug (rare with disjoint territories):** keep the earlier-committed one. Have the merge session rename the second to `<slug>-v2` or drop it and surface a follow-up note in CHANGELOG.

**Asymmetric `related_problems`:** acknowledge in CHANGELOG and defer to a follow-up symmetrisation unit. Not a blocker for the merge.

**`pnpm build` fails on one of the new problems' MDX:** identify the file, ask the merge session to fix only that one file inside the merge commit (or revert that one slug's commit). Do not let a single broken MDX block the whole merge.

### 4.5. After the merge session reports done

```pwsh
cd c:\opensource\OpenProblems
git log --oneline -10
git status --short
ls content/problems | Measure-Object | Select-Object Count
```

**Expected:**

- `git log` shows the merge commit + the merged commits.
- `git status` is clean.
- Problem count is ~260 (10 seed + 250 campaign, minus any branches you dropped).

---

## Phase 5 — Push + cleanup (10 min)

### 5.1. Final tree-wide validation (read-only)

```pwsh
pnpm validate-content
pnpm typecheck
pnpm build
```

All three must be green before you push. The merge session ran this in step 7, but re-run as a final independent check.

### 5.2. Push to origin

```pwsh
git push origin main
```

If you have an upstream remote configured, this publishes the campaign. **Push only `main`, not the curate/\* branches** — those are local-only scratch branches.

### 5.3. Clean up the 20 worktrees

```pwsh
Get-ChildItem c:\opensource\OpenProblems-worktrees -Directory | ForEach-Object {
  git -C c:\opensource\OpenProblems worktree remove $_.FullName
}
Remove-Item c:\opensource\OpenProblems-worktrees -Force -Recurse
```

**Optional:** delete the merged `curate/*` branches:

```pwsh
git -C c:\opensource\OpenProblems branch --list 'curate/*' | ForEach-Object {
  $b = $_.Trim()
  git -C c:\opensource\OpenProblems branch -D $b
}
```

The branches are still referenced by your merge commits' history, so this is safe.

### 5.4. Update auto-memory (if you use it)

If you use Claude Code's auto-memory feature, record the campaign result so future sessions know the project is now at ~260 problems and the methodology has been stress-tested. (This is just a note in your `MEMORY.md`; no script needed.)

---

## Troubleshooting reference

### "Working tree not clean" at session start (Step 1.1)

The session aborted on its first `git status` check because the worktree has uncommitted files.

**Cause:** A prior session in this worktree didn't clean up, OR the worktree was created from a dirty main.

**Fix:**

```pwsh
cd c:\opensource\OpenProblems-worktrees\slot-NN-<label>
git status --short
git restore --staged .
git checkout -- .
git clean -fd        # WARNING: deletes untracked files
```

Then relaunch the session.

### Pre-commit vitest fails

The hook ran `pnpm test` and got a failing test. The commit was rejected.

**Cause:** Either the session's new content broke a content-validation test, or some other test regressed.

**Fix:**

1. Read the vitest output carefully. The failing test name tells you which schema validation broke.
2. If it's a content schema (e.g., `problem.test.ts` failing on a new YAML): inspect the YAML in the worktree, fix the field that's wrong, re-stage, re-commit.
3. If it's a non-content test (e.g., a UI component test): something unrelated broke at the same time. Investigate in the main repo, not in a worktree.

**Never** use `git commit --no-verify` — it bypasses ADR-0005 immutability + lint-staged + tests, all of which are load-bearing.

### ADR-0005 immutability violation

The pre-commit hook printed:

> ✗ ADR-0005: rating-action files are immutable.

**Cause:** The session tried to modify or delete an existing rating-action YAML. This should never happen if the prompt is followed correctly.

**Fix:**

1. `git status` to see which file is offending.
2. `git restore --staged <file> ; git checkout -- <file>` to undo the modification.
3. Have the session author a NEW rating-action file (with `prior_action:` field pointing to the existing one) instead of editing the old one.

### Slug collision detected at merge time

Two branches both authored `content/problems/<slug>/`. Git merge will fail with a conflict.

**Fix:**

1. Decide which branch's version is better (read each curation log).
2. Keep the better branch as-is.
3. In the loser branch, rename the slug: `git mv content/problems/<slug>/ content/problems/<slug>-v2/`, edit `problem.yaml` to set `slug: <slug>-v2`, then merge.
4. Add a note to CHANGELOG.md explaining the rename.

### A session ran out of context mid-author

Symptom: the session prints a "context too long" error or starts generating gibberish toward the end.

**Cause:** A slot with > 15 in `TARGET_NEW_COUNT` ignored the Step 2.5 chunk discipline (regression). Or a session was asked to do too much in one chunk.

**Fix:**

1. Interrupt the session.
2. Check the worktree's `git log`: how many slugs did it commit before degrading?
3. Hard-reset the branch to the last clean commit: `git reset --hard <last-good-sha>`.
4. Open a new continuation session with the recovery prompt from Phase 1.5.

### Network timeout on WebFetch / WebSearch

Sessions retry transient failures automatically. If a session keeps retrying for > 10 min:

1. Interrupt it.
2. Verify you have internet (`curl https://arxiv.org` should succeed).
3. Restart the session with the recovery prompt. The previously-verified sources are still on disk (in the curation log); the session re-reads them.

### A whole worktree's branch is unusable

Sometimes a session goes off the rails (rare but possible). The branch is committed garbage.

**Fix:**

1. Don't merge it.
2. Note the slot label + RUN_ID + reason in CHANGELOG.md under a "Campaign anomalies" section.
3. Re-launch that slot in a fresh worktree (new RUN_ID): regenerate prompts with a new prefix (Phase 0.4), open a fresh session against the new slot file, ignore the old branch.

---

## What success looks like

After Phase 5:

- `git log` on main shows ~20 merge commits + the merge-pass final commit.
- `ls content/problems | Measure-Object` shows ~260 entries.
- `pnpm validate-content` is green.
- `pnpm build` is green.
- `CHANGELOG.md` has a "Campaign 2026-05-20: +250 problems" entry.
- `OPEN_QUESTIONS.md` has ~10–40 new Q-numbers from sessions' inbox files (real ambiguities surfaced during research).
- `docs/new-problem-claims/.archived/2026-05-20/` and `docs/resume-checkpoints/.archived/2026-05-20/` preserve the campaign's audit trail.
- The worktrees directory is removed.

You are now operating at the methodology paper's North-Star count: a tightly-curated 250-problem reference, every entry with ≥ 3 verified primary sources, ready for community PRs.

---

## When to do the next campaign

The 250 count is **the** target, not "phase 1 of N". Future maintenance is:

- **Quarterly UPDATE pass** (every ~3 months). Use `docs/CURATION_PROMPT.md` in UPDATE mode per slug. Don't add new problems; refresh ratings.
- **Annual taxonomy review.** If a new subdomain emerges, write an ADR amending `MASTER_PROMPT.md` §4. Only then add new problems in that subdomain.
- **Never** scale past ~300 without explicitly re-evaluating the methodology paper. Scale destroys trust.

---

## Appendix A — Multi-PC operation (split across 2 machines)

If the operator has access to two machines and wants to halve wall-clock, split the 20 slots 10/10 and run them in parallel on PC-A and PC-B. The Phase 0 → 5 flow stays the same; three sync points coordinate the two PCs through a shared remote.

### A.0. TL;DR — 8 step-by-step operator commands

```pwsh
# ─── Sync point 1: publish shared baseline ─────────────────────────────────

# STEP 1. On PC-A (the primary):
cd c:\opensource\OpenProblems
git status --short                # must be clean
git push origin main

# STEP 2. On PC-B (clone if first time, otherwise pull):
cd c:\opensource\OpenProblems
git switch main
git pull --ff-only origin main
pnpm install                       # only if deps changed

# STEP 3. On PC-A ONLY — refresh RUN_IDs, commit, push:
$env:RUN_ID_PREFIX = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH-mm")
node scripts/generate-batch-prompts.mjs
git add docs/batch-prompts/
git commit -m "chore(curation): refresh RUN_ID prefix for campaign $(Get-Date -Format yyyy-MM-dd)"
git push origin main

# STEP 4. On PC-B — pull the refreshed slot files:
git pull --ff-only origin main

# ─── Each PC's preflight (Phase 0.5 + 0.6 + 0.7, but for 10 slots) ─────────

# STEP 5a. On PC-A — create worktrees for slots 01-10:
$base = "c:\opensource\OpenProblems-worktrees"
New-Item -ItemType Directory -Force -Path $base | Out-Null
Get-ChildItem c:\opensource\OpenProblems\docs\batch-prompts -Filter 'slot-*.md' |
  Where-Object { $_.BaseName -match '^slot-(0[1-9]|10)-' } |
  ForEach-Object {
    $slotDir = Join-Path $base $_.BaseName
    if (-not (Test-Path $slotDir)) {
      git -C c:\opensource\OpenProblems worktree add --detach $slotDir main
    }
  }
git -C c:\opensource\OpenProblems worktree list           # expect 11 lines

# STEP 5b. On PC-B — create worktrees for slots 11-20:
$base = "c:\opensource\OpenProblems-worktrees"
New-Item -ItemType Directory -Force -Path $base | Out-Null
Get-ChildItem c:\opensource\OpenProblems\docs\batch-prompts -Filter 'slot-*.md' |
  Where-Object { $_.BaseName -match '^slot-(1[1-9]|20)-' } |
  ForEach-Object {
    $slotDir = Join-Path $base $_.BaseName
    if (-not (Test-Path $slotDir)) {
      git -C c:\opensource\OpenProblems worktree add --detach $slotDir main
    }
  }
git -C c:\opensource\OpenProblems worktree list           # expect 11 lines

# STEP 6. On both PCs — run Phase 0.6 (`pnpm install` per worktree) on the 10 worktrees.
#         Then run Phase 1 (10 sessions), Phase 2 (list checkpoints), Phase 3 (~2 continuation sessions).
#         These run INDEPENDENTLY on each PC — no coordination needed during this time.

# ─── Sync point 2: each PC pushes its 10 curate branches ───────────────────

# STEP 7. On EACH PC, after its Phase 3 finishes:
git branch --list 'curate/*' | ForEach-Object {
  $b = $_.Trim().TrimStart('* ')
  git push origin $b
}
git ls-remote --heads origin 'curate/*' | Measure-Object  # expect 20 (after both PCs push)

# ─── Sync point 3: merge on ONE PC (e.g. PC-A) ─────────────────────────────

# STEP 8. On the merger PC (PC-A):
git switch main
git pull --ff-only origin main
git fetch origin 'refs/heads/curate/*:refs/heads/curate/*'
git branch --list 'curate/*' | Measure-Object             # expect 20
# Open ONE Claude Code session in c:\opensource\OpenProblems and paste the Phase 4
# merge prompt (§4.3), with the added note from §A.6 about using `git show <branch>:<path>`
# for inbox files on branches imported from the other PC.

# After the merge session commits:
git push origin main
git branch --list 'curate/*' | ForEach-Object {
  $b = $_.Trim().TrimStart('* ')
  git push origin --delete $b           # clean up campaign branches from origin
  git branch -D $b                       # clean up locally on the merger PC
}

# STEP 9 (cleanup, on each PC): see §A.7 for the worktree-remove loop.
```

If anything is unclear, read sections A.1 → A.8 below.

### A.1. Recommended split (sequential, 10/10)

| PC       | Slots | Sum of new problems | Chunked slots (need continuation burst) |
| -------- | ----- | ------------------- | --------------------------------------- |
| **PC-A** | 01–10 | 136                 | 2 (slot 01 = 22, slot 07 = 18)          |
| **PC-B** | 11–20 | 114                 | 2 (slot 11 = 16, slot 20 = 16)          |

Asymmetry: ~22 problems / ~9%. PC-A finishes ~20–30 min later than PC-B. Each PC has the same workflow shape (one main burst of 10 sessions + one continuation burst of ~2 sessions). The split is balanced enough that load-balancing across slots is not worth the bookkeeping cost.

If PC-B is materially slower (older hardware, weaker network), swap slot 07 (PC-A, 18 problems) for slot 03 (PC-B, 13 problems): new totals 131 / 119, smaller gap.

### A.2. Sync point 1 — Publish a shared baseline (~5 min)

Before any session opens on either PC, both must hold the same commit on `main`.

**On PC-A** (currently 7+ commits ahead of `origin/main`):

```pwsh
cd c:\opensource\OpenProblems
git status --short             # must be clean
git push origin main
```

**On PC-B:**

```pwsh
# First-time setup:
cd c:\opensource
git clone <repo-url> OpenProblems
cd OpenProblems
pnpm install

# Or, if PC-B already has a clone:
cd c:\opensource\OpenProblems
git switch main
git pull --ff-only origin main
pnpm install   # only if dependencies changed since last pull
```

Verify both PCs are on the same commit:

```pwsh
git rev-parse HEAD     # same SHA on both PCs
git status --short     # empty on both
```

### A.3. Phase 0 preflight, per-PC variant

Both PCs run Phase 0.1–0.7 as documented, with **two** changes:

- **0.4 (RUN_ID refresh):** Run on **one PC only** (say PC-A), commit the regenerated slot files locally, push to origin, pull on PC-B. This ensures both PCs use the same RUN_ID suffixes — and therefore the same branch names. If both PCs regenerate independently with different prefixes, RUN_IDs diverge and branch names collide at merge time. Run once, share via git.

  ```pwsh
  # On PC-A only:
  $env:RUN_ID_PREFIX = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH-mm")
  node scripts/generate-batch-prompts.mjs
  git add docs/batch-prompts/
  git commit -m "chore(curation): refresh RUN_ID prefix for campaign $(Get-Date -Format yyyy-MM-dd)"
  git push origin main

  # On PC-B:
  git pull --ff-only origin main
  ```

- **0.5 (worktree creation):** Each PC creates worktrees for **only its 10 assigned slots**:

  ```pwsh
  # On PC-A (slots 01-10):
  $base = "c:\opensource\OpenProblems-worktrees"
  New-Item -ItemType Directory -Force -Path $base | Out-Null
  Get-ChildItem c:\opensource\OpenProblems\docs\batch-prompts -Filter 'slot-*.md' |
    Where-Object { $_.BaseName -match '^slot-(0[1-9]|10)-' } |
    ForEach-Object {
      $slotDir = Join-Path $base $_.BaseName
      if (-not (Test-Path $slotDir)) {
        git -C c:\opensource\OpenProblems worktree add --detach $slotDir main
      }
    }

  # On PC-B (slots 11-20):
  $base = "c:\opensource\OpenProblems-worktrees"
  New-Item -ItemType Directory -Force -Path $base | Out-Null
  Get-ChildItem c:\opensource\OpenProblems\docs\batch-prompts -Filter 'slot-*.md' |
    Where-Object { $_.BaseName -match '^slot-(1[1-9]|20)-' } |
    ForEach-Object {
      $slotDir = Join-Path $base $_.BaseName
      if (-not (Test-Path $slotDir)) {
        git -C c:\opensource\OpenProblems worktree add --detach $slotDir main
      }
    }
  ```

  Each PC ends up with 11 worktrees in `git worktree list` (1 main + 10 slots). The `pnpm install` loop in 0.6 stays as-is, just runs on ~10 worktrees instead of 20.

### A.4. Phase 1–3 — Independent work (each PC, ~3 hours)

Each PC runs **Phase 1** (main burst) and **Phase 3** (continuation burst) independently, in its own slot range. **Do not coordinate between PCs during this time** — sessions only touch files inside their own slot worktree, so the two PCs cannot affect each other.

Phase 2 (identifying continuations) runs separately on each PC: each PC lists its own `docs/resume-checkpoints/*.md` files and launches continuation sessions only for the chunked slots it owns.

### A.5. Sync point 2 — Push curate branches to origin (~5 min, on each PC)

After **each PC's** Phase 3 finishes (every territory's `remaining: 0`):

```pwsh
# Run on each PC after its sessions are done:
cd c:\opensource\OpenProblems
git branch --list 'curate/*' | ForEach-Object {
  $b = $_.Trim().TrimStart('* ')
  git push origin $b
}
```

Each curate branch was created locally and has never been pushed, so this is a fast-forward push every time. No `--force` ever required.

Verify on origin:

```pwsh
git ls-remote --heads origin 'curate/*'
```

PC-A's push uploads 10 branches; PC-B's push uploads the other 10. After both push, origin holds all 20.

### A.6. Sync point 3 — Merge pass on ONE PC (~60–90 min)

Choose the merger PC (typically PC-A since it's likely the primary). On that PC:

```pwsh
cd c:\opensource\OpenProblems
git switch main
git pull --ff-only origin main
git fetch origin 'refs/heads/curate/*:refs/heads/curate/*'
git branch --list 'curate/*' | Measure-Object | Select-Object Count
```

**Expected:** the count is 20. If less, one of the other PC's push didn't land; re-run that PC's Sync-point-2 loop.

Now run the **Phase 4 merge prompt** as documented in §4.3, with one adjustment to the prompt's step 5 (singleton aggregation): the inbox files for branches that came from the other PC are **only on the branch refs, not in any worktree**. The merger session reads them via `git show <branch-ref>:<path>` rather than scanning the worktree filesystem. Add this to the merge prompt:

> **Important for multi-PC merge:** branches imported via `git fetch origin 'refs/heads/curate/*:refs/heads/curate/*'` do not have worktrees on this machine. Read their inbox files via `git show <branch>:<path>` rather than expecting them on disk. The PowerShell aggregation snippet in Phase 4.2 of the runbook will not find them under `c:\opensource\OpenProblems-worktrees\` — use `git show` instead.

The rest of the merge pass works identically: branch review, `git merge --no-ff` each kept branch, singleton aggregation, cross-link audit, final validation, final commit. Approve at each pause.

### A.7. Phase 5 — Push + cleanup (multi-PC variant)

After the merge session commits, push `main` and delete the campaign branches from origin:

```pwsh
# On the merger PC:
cd c:\opensource\OpenProblems
git push origin main

# Delete the 20 curate branches from origin (cleanup):
git branch --list 'curate/*' | ForEach-Object {
  $b = $_.Trim().TrimStart('* ')
  git push origin --delete $b
}

# Delete them locally on the merger PC:
git branch --list 'curate/*' | ForEach-Object {
  $b = $_.Trim().TrimStart('* ')
  git branch -D $b
}

# Remove the merger PC's 10 worktrees (Phase 5.3 of the main runbook):
Get-ChildItem c:\opensource\OpenProblems-worktrees -Directory | ForEach-Object {
  git worktree remove $_.FullName
}
Remove-Item c:\opensource\OpenProblems-worktrees -Force -Recurse
```

**On the other PC** (PC-B if PC-A was the merger):

```pwsh
cd c:\opensource\OpenProblems
git switch main
git pull --ff-only origin main          # picks up the merged main + the deletions of curate/*

# The local curate/* branches on PC-B are now orphaned (their refs were deleted from origin).
# Delete them locally:
git branch --list 'curate/*' | ForEach-Object {
  $b = $_.Trim().TrimStart('* ')
  git branch -D $b
}

# Remove PC-B's 10 worktrees:
Get-ChildItem c:\opensource\OpenProblems-worktrees -Directory | ForEach-Object {
  git worktree remove $_.FullName
}
Remove-Item c:\opensource\OpenProblems-worktrees -Force -Recurse
```

Both PCs now hold the merged `main` with ~260 problems and no campaign branches.

### A.8. Failure-mode quick reference for multi-PC operation

| Symptom                                                                          | Cause                                                                               | Fix                                                                                                                                                                             |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git push origin <curate-branch>` returns "non-fast-forward"                     | The same branch name exists on origin from a prior aborted run                      | `git fetch origin <branch>` to inspect; if old, `git push origin --delete <branch>`, then re-push from the current PC                                                           |
| Merger PC's `git fetch` count is 10 instead of 20                                | The other PC didn't push, or there's a network glitch                               | Confirm the other PC ran its Sync-point-2 loop; check `git ls-remote --heads origin 'curate/*'` from the merger PC                                                              |
| Both PCs generated different RUN_IDs (different branch names per slot)           | The Phase 0.4 regeneration was run on both PCs instead of once                      | Pick one PC's set of branches as authoritative; on the other PC, `git branch -D` its `curate/*` and re-run sessions using the slot files from the authoritative PC (`git pull`) |
| Merger session reports "branch curate/X-c2 deletes content authored on curate/X" | A continuation session on the other PC reused a parent slug, race-conflict at merge | Drop the chunk-2 branch; keep the parent. Re-author the deferred slugs in a follow-up run if needed                                                                             |

The multi-PC workflow does NOT change the methodology, the per-slot quality bar, or the merge-pass approval pauses — it only adds three short coordination commands at the boundaries.
